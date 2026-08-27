import { GoogleGenAI } from "@google/genai";

import {
  mappingResultSchema,
  type MappingResult,
} from "../schemas/mapping.schema.js";

import type {
  ExtractedAnswer,
} from "../types/answer.js";

/**
 * Gemini model used for semantic matching.
 */
const MODEL_NAME =
  "gemini-3.6-flash";

/**
 * Maximum retries for temporary Gemini errors.
 */
const MAX_RETRIES = 3;

/**
 * Semantic confidence threshold.
 *
 * We intentionally use a conservative threshold.
 *
 * If Gemini is less than 0.70 confident,
 * we prefer "unmatched" rather than risking
 * an incorrect answer mapping.
 */
const SEMANTIC_THRESHOLD = 0.70;

/**
 * Gemini client.
 */
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Pause before retrying Gemini.
 */
function sleep(
  ms: number
): Promise<void> {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

/**
 * Minimal shape required from the
 * question extraction pipeline.
 */
interface Question {
  number: string;
  text: string;
  page: number;
  type: "main" | "subpart";
}

/**
 * Main mapping function.
 */
export async function mapQuestionsToAnswers(
  questions: Question[],
  answers: ExtractedAnswer[]
): Promise<MappingResult> {
  /**
   * Normalize question numbers first.
   */
  const normalizedQuestions =
    questions.map(
      (question) => ({
        ...question,

        number:
          normalizeQuestionNumber(
            question.number
          ),
      })
    );

  /**
   * Normalize answer labels.
   */
  const normalizedAnswers =
    answers.map(
      (answer, index) => ({
        ...answer,

        index,

        questionNumber:
          normalizeQuestionNumber(
            answer.questionNumber
          ),
      })
    );

  /**
   * Keep track of answers already assigned.
   *
   * This prevents one answer from being mapped
   * to multiple questions.
   */
  const usedAnswerIndexes =
    new Set<number>();

  /**
   * Final question mappings.
   */
  const mappings:
    MappingResult["mappings"] =
      [];

  /**
   * Answers that still need investigation.
   */
  const candidateUnlabeledAnswers:
    typeof normalizedAnswers =
      [];

  /**
   * Answers whose labels don't exist
   * in the question paper.
   */
  const unmatchedAnswers:
    MappingResult["unmatchedAnswers"] =
      [];

  /**
   * ------------------------------------------------
   * STEP 1
   * Explicit question-number matching
   * ------------------------------------------------
   */
  for (
    const question of normalizedQuestions
  ) {
    /**
     * Find answers with exactly the same
     * normalized question number.
     */
    const candidates =
      normalizedAnswers.filter(
        (answer) =>
          answer.questionNumber ===
            question.number &&
          !usedAnswerIndexes.has(
            answer.index
          )
      );

    /**
     * No explicit answer found.
     */
    if (candidates.length === 0) {
      mappings.push({
        questionNumber:
          question.number,

        questionText:
          question.text,

        status: "unanswered",

        matchType: null,

        confidence: 0,

        answerIndex: null,
      });

      continue;
    }

    /**
     * Use the first unused explicit match.
     */
    const answer =
      candidates[0];

    /**
     * An empty answerText means the student
     * wrote the label but didn't provide
     * an actual answer.
     */
    if (
      answer.answerText.trim()
        .length === 0
    ) {
      mappings.push({
        questionNumber:
          question.number,

        questionText:
          question.text,

        status: "unanswered",

        matchType: null,

        confidence: 1,

        answerIndex:
          answer.index,
      });

      usedAnswerIndexes.add(
        answer.index
      );

      continue;
    }

    /**
     * Exact question-number match.
     *
     * This is the strongest possible mapping.
     */
    mappings.push({
      questionNumber:
        question.number,

      questionText:
        question.text,

      status: "answered",

      matchType: "explicit",

      confidence: 1,

      answerIndex:
        answer.index,
    });

    usedAnswerIndexes.add(
      answer.index
    );
  }

  /**
   * ------------------------------------------------
   * STEP 2
   * Identify answers that still need matching.
   * ------------------------------------------------
   */
  for (
    const answer of normalizedAnswers
  ) {
    /**
     * Already successfully consumed.
     */
    if (
      usedAnswerIndexes.has(
        answer.index
      )
    ) {
      continue;
    }

    /**
     * Empty answer text isn't a useful
     * semantic candidate.
     */
    if (
      answer.answerText.trim()
        .length === 0
    ) {
      unmatchedAnswers.push({
        answerIndex:
          answer.index,

        questionNumber:
          answer.questionNumber,

        answerText:
          answer.answerText,

        reason:
          "Answer contains no readable answer text.",
      });

      continue;
    }

    /**
     * If the answer has a label but that
     * label doesn't exist in the question paper,
     * don't blindly semantic-match it.
     *
     * This protects us from incorrectly mapping
     * a clearly labelled answer to another question.
     */
    if (
      answer.questionNumber.length > 0
    ) {
      unmatchedAnswers.push({
        answerIndex:
          answer.index,

        questionNumber:
          answer.questionNumber,

        answerText:
          answer.answerText,

        reason:
          "Question label was detected, but no matching question exists in the question paper.",
      });

      continue;
    }

    /**
     * No label → semantic matching candidate.
     */
    candidateUnlabeledAnswers.push(
      answer
    );
  }

  /**
   * ------------------------------------------------
   * STEP 3
   * Semantic matching for unlabeled answers.
   * ------------------------------------------------
   */
  if (
    candidateUnlabeledAnswers.length > 0
  ) {
    await applySemanticMatches({
      questions:
        normalizedQuestions,

      mappings,

      answers:
        candidateUnlabeledAnswers,

      usedAnswerIndexes,

      unmatchedAnswers,
    });
  }

  /**
   * ------------------------------------------------
   * STEP 4
   * Build final summary.
   * ------------------------------------------------
   */
  const answeredQuestions =
    mappings.filter(
      (mapping) =>
        mapping.status ===
        "answered"
    ).length;

  const unansweredQuestions =
    mappings.length -
    answeredQuestions;

  const result: MappingResult = {
    mappings,

    unmatchedAnswers,

    summary: {
      totalQuestions:
        questions.length,

      answeredQuestions,

      unansweredQuestions,

      totalAnswers:
        answers.length,

      unmatchedAnswers:
        unmatchedAnswers.length,
    },
  };

  /**
   * Final safety validation.
   */
  const validation =
    mappingResultSchema.safeParse(
      result
    );

  if (!validation.success) {
    console.error(
      "Mapping validation failed:",
      validation.error.flatten()
    );

    throw new Error(
      "Mapping engine produced an invalid result."
    );
  }

  return validation.data;
}

/**
 * Semantic matching for answers without
 * recognizable question labels.
 */
async function applySemanticMatches({
  questions,
  mappings,
  answers,
  usedAnswerIndexes,
  unmatchedAnswers,
}: {
  questions: Question[];

  mappings:
    MappingResult["mappings"];

  answers: Array<
    ExtractedAnswer & {
      index: number;
    }
  >;

  usedAnswerIndexes: Set<number>;

  unmatchedAnswers:
    MappingResult["unmatchedAnswers"];
}) {
  /**
   * Only questions that are currently unanswered
   * are candidates for semantic matching.
   */
  const availableQuestions =
    questions.filter(
      (question) => {
        const mapping =
          mappings.find(
            (item) =>
              item.questionNumber ===
              question.number
          );

        return (
          mapping?.status ===
          "unanswered"
        );
      }
    );

  /**
   * Nothing left to match.
   */
  if (
    availableQuestions.length === 0
  ) {
    for (
      const answer of answers
    ) {
      unmatchedAnswers.push({
        answerIndex:
          answer.index,

        questionNumber:
          answer.questionNumber,

        answerText:
          answer.answerText,

        reason:
          "No unanswered question was available for semantic matching.",
      });
    }

    return;
  }

  /**
   * Create a compact representation for Gemini.
   */
  const questionData =
    availableQuestions.map(
      (question) => ({
        number:
          question.number,

        text:
          question.text,
      })
    );

  /**
   * Ask Gemini to compare each unlabeled answer
   * against the unanswered questions.
   */
  const prompt = `
You are an expert examination answer-matching system.

We have a set of examination questions and student
answers that DO NOT contain recognizable question labels.

Your job is to determine whether each answer semantically
belongs to one of the available questions.

IMPORTANT:

1. Match based on meaning, concepts, terminology,
   and what the answer is actually answering.

2. Do NOT match based merely on superficial
   word overlap.

3. Every answer can match at most ONE question.

4. Every question can receive at most ONE answer
   through semantic matching.

5. If there is not enough evidence for a reliable match,
   return questionNumber as null.

6. Confidence must be between 0 and 1.

7. Use a confidence below 0.70 when the match
   is uncertain.

8. Do not force a match.

QUESTIONS:

${JSON.stringify(
  questionData,
  null,
  2
)}

UNLABELED ANSWERS:

${JSON.stringify(
  answers.map(
    (answer) => ({
      answerIndex:
        answer.index,

      answerText:
        answer.answerText,
    })
  ),
  null,
  2
)}

Return ONLY JSON using this structure:

{
  "matches": [
    {
      "answerIndex": 0,
      "questionNumber": "3",
      "confidence": 0.92
    }
  ]
}

If no reliable match exists:

{
  "answerIndex": 0,
  "questionNumber": null,
  "confidence": 0.32
}
`;

  /**
   * Gemini response.
   */
  let response:
    Awaited<
      ReturnType<
        typeof ai.models.generateContent
      >
    > | undefined;

  /**
   * Gemini structured output schema.
   */
  const semanticSchema = {
    type: "object",

    properties: {
      matches: {
        type: "array",

        items: {
          type: "object",

          properties: {
            answerIndex: {
              type: "integer",
            },

            questionNumber: {
              type: ["string", "null"],
            },

            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
          },

          required: [
            "answerIndex",
            "questionNumber",
            "confidence",
          ],
        },
      },
    },

    required: ["matches"],
  };

  /**
   * Retry Gemini semantic matching.
   */
  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      response =
        await ai.models.generateContent({
          model: MODEL_NAME,

          contents: [
            {
              text: prompt,
            },
          ],

          config: {
            responseMimeType:
              "application/json",

            responseSchema:
              semanticSchema,
          },
        });

      break;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `Semantic matching attempt ${attempt} failed:`,
        message
      );

      if (
        attempt === MAX_RETRIES
      ) {
        throw error;
      }

      await sleep(
        2000 *
          2 ** (attempt - 1)
      );
    }
  }

  if (!response) {
    throw new Error(
      "Gemini returned no semantic matching response."
    );
  }

  const rawText =
    response.text;

  if (!rawText) {
    throw new Error(
      "Gemini returned an empty semantic matching response."
    );
  }

  let parsed: any;

  try {
    parsed =
      JSON.parse(rawText);
  } catch {
    throw new Error(
      "Gemini returned invalid semantic matching JSON."
    );
  }

  /**
   * Keep track of questions already
   * semantically assigned.
   */
  const usedQuestions =
    new Set<string>();

  for (
    const match of parsed.matches ?? []
  ) {
    /**
     * Invalid answer index.
     */
    if (
      !Number.isInteger(
        match.answerIndex
      )
    ) {
      continue;
    }

    /**
     * Find the actual extracted answer.
     */
    const answer =
      answers.find(
        (item) =>
          item.index ===
          match.answerIndex
      );

    if (!answer) {
      continue;
    }

    /**
     * No semantic match.
     */
    if (
      !match.questionNumber
    ) {
      unmatchedAnswers.push({
        answerIndex:
          answer.index,

        questionNumber:
          answer.questionNumber,

        answerText:
          answer.answerText,

        reason:
          "No sufficiently confident semantic question match was found.",
      });

      continue;
    }

    /**
     * Normalize Gemini's question number.
     */
    const questionNumber =
      normalizeQuestionNumber(
        match.questionNumber
      );

    /**
     * Make sure Gemini didn't invent a
     * question number.
     */
    const question =
      questions.find(
        (item) =>
          item.number ===
          questionNumber
      );

    if (!question) {
      unmatchedAnswers.push({
        answerIndex:
          answer.index,

        questionNumber:
          answer.questionNumber,

        answerText:
          answer.answerText,

        reason:
          "Semantic matcher returned a question number that does not exist.",
      });

      continue;
    }

    /**
     * Prevent duplicate semantic matches.
     */
    if (
      usedQuestions.has(
        questionNumber
      )
    ) {
      unmatchedAnswers.push({
        answerIndex:
          answer.index,

        questionNumber:
          answer.questionNumber,

        answerText:
          answer.answerText,

        reason:
          "Another answer already matched this question.",
      });

      continue;
    }

    /**
     * Confidence threshold.
     */
    const confidence =
      Number(
        match.confidence
      );

    if (
      !Number.isFinite(
        confidence
      ) ||
      confidence <
        SEMANTIC_THRESHOLD
    ) {
      unmatchedAnswers.push({
        answerIndex:
          answer.index,

        questionNumber:
          answer.questionNumber,

        answerText:
          answer.answerText,

        reason:
          `Semantic confidence ${confidence.toFixed(
            2
          )} is below the ${SEMANTIC_THRESHOLD} threshold.`,
      });

      continue;
    }

    /**
     * Successful semantic match.
     */
    const mapping =
      mappings.find(
        (item) =>
          item.questionNumber ===
          questionNumber
      );

    if (!mapping) {
      continue;
    }

    mapping.status =
      "answered";

    mapping.matchType =
      "semantic";

    mapping.confidence =
      confidence;

    mapping.answerIndex =
      answer.index;

    usedAnswerIndexes.add(
      answer.index
    );

    usedQuestions.add(
      questionNumber
    );
  }
}

/**
 * Normalize question labels so that:
 *
 * "11 (a)"
 * "11(a)"
 *
 * become identical.
 */
function normalizeQuestionNumber(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(
      /^(\d+)\(([a-zA-Z])\)$/,
      "$1($2)"
    );
}
import {
  GoogleGenAI,
} from "@google/genai";

import {
  gradingResultSchema,
} from "../schemas/grading.schema.js";

/**
 * Gemini model used for assessment grading.
 */
const MODEL_NAME =
  "gemini-3.6-flash";

/**
 * Maximum number of attempts for
 * temporary Gemini failures.
 */
const MAX_RETRIES = 3;

/**
 * Gemini client.
 *
 * The API key remains on the server.
 */
const ai =
  new GoogleGenAI({
    apiKey:
      process.env.GEMINI_API_KEY,
  });


/**
 * Wait before retrying a request.
 */
function sleep(
  ms: number
): Promise<void> {
  return new Promise(
    (resolve) => {
      setTimeout(
        resolve,
        ms
      );
    }
  );
}


/**
 * Structured JSON schema sent to Gemini.
 */
const gradingJsonSchema = {
  type: "object",

  properties: {
    questionResults: {
      type: "array",

      items: {
        type: "object",

        properties: {
          questionNumber: {
            type: "string",
          },

          score: {
            type: "number",
          },

          maxScore: {
            type: "number",
          },

          status: {
            type: "string",

            enum: [
              "correct",
              "partially_correct",
              "incorrect",
              "unanswered",
            ],
          },

          feedback: {
            type: "string",
          },

          confidence: {
            type: "number",
          },
        },

        required: [
          "questionNumber",
          "score",
          "maxScore",
          "status",
          "feedback",
          "confidence",
        ],
      },
    },

    totalScore: {
      type: "number",
    },

    maxScore: {
      type: "number",
    },

    percentage: {
      type: "number",
    },

    answeredQuestions: {
      type: "integer",
    },

    unansweredQuestions: {
      type: "integer",
    },

    correctQuestions: {
      type: "integer",
    },

    partiallyCorrectQuestions: {
      type: "integer",
    },

    incorrectQuestions: {
      type: "integer",
    },

    overallFeedback: {
      type: "string",
    },
  },

  required: [
    "questionResults",
    "totalScore",
    "maxScore",
    "percentage",
    "answeredQuestions",
    "unansweredQuestions",
    "correctQuestions",
    "partiallyCorrectQuestions",
    "incorrectQuestions",
    "overallFeedback",
  ],
};


/**
 * Grade the complete assessment.
 */
export async function gradeAssessment(
  input: {
    questions: unknown[];

    answers: unknown[];

    mappings: unknown[];
  }
) {
  /**
   * Make sure the Gemini API key exists.
   */
  if (
    !process.env.GEMINI_API_KEY
  ) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }


  /**
   * Prompt used for AI evaluation.
   */
  const prompt = `
You are an expert examination evaluator.

Evaluate the student's answers against
the extracted question paper.

IMPORTANT RULES:

1. Evaluate EVERY question.

2. Preserve the original question number exactly.

3. A question with no mapped answer must be
   marked as "unanswered".

4. Use a maximum of 10 marks per question.

5. Score answers fairly based on:
   - correctness
   - relevance
   - completeness
   - important concepts
   - factual accuracy

6. Use ONLY these statuses:

   correct
   partially_correct
   incorrect
   unanswered

7. Confidence must be between 0 and 1.

8. Give concise but useful feedback.

9. Do not invent content that is not present
   in the student's answer.

10. For unanswered questions:
    - score must be 0
    - status must be "unanswered"
    - confidence should reflect that there
      was no answer to evaluate.

11. Return EVERY question in questionResults.

12. Calculate:
    - totalScore
    - maxScore
    - percentage
    - answeredQuestions
    - unansweredQuestions
    - correctQuestions
    - partiallyCorrectQuestions
    - incorrectQuestions

13. Return ONLY structured JSON.

QUESTION PAPER:
${JSON.stringify(
  input.questions,
  null,
  2
)}

STUDENT ANSWERS:
${JSON.stringify(
  input.answers,
  null,
  2
)}

ANSWER MAPPINGS:
${JSON.stringify(
  input.mappings,
  null,
  2
)}
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
   * Retry temporary Gemini failures.
   */
  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `Gemini grading attempt ${attempt}/${MAX_RETRIES}`
      );

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
              gradingJsonSchema,
          },
        });

      /**
       * Successful request.
       */
      break;

    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `Gemini grading attempt ${attempt} failed:`,
        errorMessage
      );

      /**
       * Do not retry after the
       * final attempt.
       */
      if (
        attempt === MAX_RETRIES
      ) {
        throw error;
      }

      /**
       * Exponential backoff:
       *
       * 2 seconds
       * 4 seconds
       */
      const delay =
        2000 *
        2 ** (attempt - 1);

      console.log(
        `Retrying Gemini grading in ${
          delay / 1000
        } seconds...`
      );

      await sleep(delay);
    }
  }


  /**
   * Safety check.
   */
  if (!response) {
    throw new Error(
      "Gemini did not return a grading response."
    );
  }


  /**
   * Read Gemini response.
   */
  const rawText =
    response.text;


  if (
    !rawText ||
    rawText.trim().length === 0
  ) {
    throw new Error(
      "Gemini returned an empty grading response."
    );
  }


  /**
   * Parse JSON.
   */
  let parsed: unknown;

  try {
    parsed =
      JSON.parse(rawText);

  } catch {
    throw new Error(
      "Gemini returned invalid JSON during grading."
    );
  }


  /**
   * Validate Gemini output with Zod.
   */
  const validation =
    gradingResultSchema.safeParse(
      parsed
    );


  if (!validation.success) {
    console.error(
      "Grading validation error:",
      validation.error.flatten()
    );

    throw new Error(
      "Gemini returned invalid grading data."
    );
  }


  /**
   * Return validated grading data.
   */
  return validation.data;
}
import { GoogleGenAI } from "@google/genai";

import {
  answerExtractionSchema,
} from "../schemas/answer.schema.js";

import type {
  AnswerExtractionResult,
} from "../schemas/answer.schema.js";

import type {
  RenderedPage,
} from "./pdf.service.js";

/**
 * Gemini model used for handwritten answer extraction.
 */
const MODEL_NAME = "gemini-3.6-flash";

/**
 * Retry count for temporary Gemini failures.
 */
const MAX_RETRIES = 3;

/**
 * Gemini client.
 *
 * API key remains server-side.
 */
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Wait helper used for exponential backoff.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * JSON schema sent to Gemini.
 */
const answerJsonSchema = {
  type: "object",

  properties: {
    answers: {
      type: "array",

      items: {
        type: "object",

        properties: {
          questionNumber: {
            type: "string",

            description:
              "Question label written on the answer sheet. Examples: 1, 2, 11(a), 11(b). Use an empty string if no recognizable label is present.",
          },

          answerText: {
            type: "string",

            description:
              "Transcription of the student's handwritten answer. Preserve wording as closely as possible.",
          },

          regions: {
            type: "array",

            items: {
              type: "object",

              properties: {
                page: {
                  type: "integer",

                  description:
                    "1-based page number containing this answer region.",
                },

                box: {
                  type: "object",

                  properties: {
                    ymin: {
                      type: "number",
                    },

                    xmin: {
                      type: "number",
                    },

                    ymax: {
                      type: "number",
                    },

                    xmax: {
                      type: "number",
                    },
                  },

                  required: [
                    "ymin",
                    "xmin",
                    "ymax",
                    "xmax",
                  ],
                },
              },

              required: [
                "page",
                "box",
              ],
            },
          },
        },

        required: [
          "questionNumber",
          "answerText",
          "regions",
        ],
      },
    },
  },

  required: ["answers"],
};

/**
 * Extract handwritten answers from answer-sheet pages.
 *
 * Each page is sent to Gemini separately.
 *
 * This is deliberate:
 *
 * Page 1 → Gemini
 * Page 2 → Gemini
 * Page 3 → Gemini
 *
 * It gives us page-specific coordinates and makes
 * bounding-box mapping much more reliable.
 */
export async function extractAnswersFromPages(
  pages: RenderedPage[]
): Promise<AnswerExtractionResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const allAnswers: AnswerExtractionResult["answers"] =
    [];

  /**
   * Process every page individually.
   */
  for (const page of pages) {
    console.log(
      `Extracting handwritten answers from page ${page.page}`
    );

    const pageAnswers =
      await extractAnswersFromSinglePage(page);

    /**
     * Add this page's answers to the global result.
     */
    allAnswers.push(...pageAnswers.answers);
  }

  /**
   * Merge answer regions when the same question
   * appears across multiple pages.
   *
   * Example:
   *
   * Q3:
   * page 2 → region A
   * page 3 → region B
   *
   * becomes:
   *
   * Q3:
   * regions: [A, B]
   */
  return mergeAnswerRegions({
    answers: allAnswers,
  });
}

/**
 * Extract answers from one page.
 */
async function extractAnswersFromSinglePage(
  page: RenderedPage
): Promise<AnswerExtractionResult> {
  /**
   * Convert the page image to base64.
   */
  const base64Data =
    page.buffer.toString("base64");

  /**
   * Prompt specifically designed for handwritten
   * examination answer sheets.
   */
  const prompt = `
    You are an expert handwritten examination-answer parser.

    Analyze this ONE page of a student's handwritten answer sheet.

    Your task is to detect EVERY ANSWER that appears on this page.

    IMPORTANT RULES:

    1. Detect the question label written by the student.

    Examples:

    1
    2
    3
    11(a)
    11(b)

    2. If a question label is clearly visible,
    return it.

    3. If the answer has NO recognizable question label,
    return:

    "questionNumber": ""

    Do NOT invent a question number.

    4. Preserve the question label exactly as written,
    while normalizing harmless spacing.

    Examples:

    11 (a) → 11(a)
    11 (b) → 11(b)

    5. Do NOT assume answers are in question order.

    6. If handwriting is unclear, make the best transcription
    possible without inventing words.

    7. If an answer is completely unreadable, return an
    empty answerText rather than hallucinating.

    8. Detect the physical region containing the answer.

    9. The bounding box MUST cover the student's handwritten
    answer content.

    10. Do NOT include unrelated:
        - margins
        - page numbers
        - printed instructions
        - headers
        - footers

    11. The question label itself may be included in the
        bounding box if it is physically attached to the answer.

    12. Bounding box coordinates MUST be normalized to
        0-1000.

    13. Bounding box format:

        ymin
        xmin
        ymax
        xmax

    14. ymin < ymax.

    15. xmin < xmax.

    16. If an answer occupies multiple separate regions
        on this SAME page, return multiple regions.

    17. Only return answers actually visible on this page.

    18. Do NOT create answers for questions that are not
        present.

    19. Preserve the student's wording as closely as possible.

    20. If the answer continues on another page, only return
        the region visible on THIS page.

    21. Do NOT solve or grade the answer.

    Return ONLY structured JSON.
    `;

  /**
   * Gemini response.
   */
  let response:
    Awaited<
      ReturnType<typeof ai.models.generateContent>
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
        `Answer extraction page ${page.page}: attempt ${attempt}/${MAX_RETRIES}`
      );

      response =
        await ai.models.generateContent({
          model: MODEL_NAME,

          contents: [
            /**
             * Instructions.
             */
            {
              text: prompt,
            },

            /**
             * Current answer-sheet page.
             */
            {
              inlineData: {
                mimeType: page.mimeType,

                data: base64Data,
              },
            },
          ],

          config: {
            /**
             * Force JSON.
             */
            responseMimeType:
              "application/json",

            /**
             * Force our expected structure.
             */
            responseSchema:
              answerJsonSchema,
          },
        });

      break;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `Answer extraction failed on page ${page.page}:`,
        message
      );

      if (attempt === MAX_RETRIES) {
        throw error;
      }

      const delay =
        2000 * 2 ** (attempt - 1);

      console.log(
        `Retrying page ${page.page} in ${
          delay / 1000
        } seconds...`
      );

      await sleep(delay);
    }
  }

  if (!response) {
    throw new Error(
      `Gemini returned no response for page ${page.page}.`
    );
  }

  /**
   * Get structured JSON text.
   */
  const rawText = response.text;

  if (!rawText) {
    throw new Error(
      `Gemini returned an empty response for page ${page.page}.`
    );
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Gemini returned invalid JSON for page ${page.page}.`
    );
  }

  /**
   * Validate Gemini output with Zod.
   */
  const validationResult =
    answerExtractionSchema.safeParse(
      parsedJson
    );

  if (!validationResult.success) {
    console.error(
      `Answer schema validation failed for page ${page.page}:`,
      validationResult.error.flatten()
    );

    throw new Error(
      `Invalid answer extraction response for page ${page.page}.`
    );
  }

  /**
   * Gemini gives us normalized coordinates.
   *
   * Add the actual page number to every region.
   */
  const answers =
    validationResult.data.answers.map(
      (answer) => ({
        ...answer,

        regions: answer.regions.map(
          (region) => ({
            ...region,

            /**
             * Gemini is explicitly told to use the
             * current page, but we enforce it here.
             */
            page: page.page,
          })
        ),
      })
    );

  return {
    answers,
  };
}

/**
 * Merge multiple physical regions belonging to
 * the same question.
 */
function mergeAnswerRegions(
  result: AnswerExtractionResult
): AnswerExtractionResult {
  const answerMap =
    new Map<
      string,
      AnswerExtractionResult["answers"][number]
    >();

  for (const answer of result.answers) {
    const key =
      normalizeQuestionNumber(
        answer.questionNumber
      );

    const existing =
      answerMap.get(key);

    if (!existing) {
      answerMap.set(key, {
        ...answer,

        questionNumber:
          normalizeQuestionNumber(
            answer.questionNumber
          ),

        regions: [...answer.regions],
      });

      continue;
    }

    /**
     * If the same question appears on another page,
     * append its region.
     */
    existing.regions.push(
      ...answer.regions
    );

    /**
     * Combine answer text from multiple pages.
     *
     * We preserve the order in which pages were processed.
     */
    if (
      answer.answerText.trim().length > 0
    ) {
      if (
        existing.answerText.trim().length > 0
      ) {
        existing.answerText =
          `${existing.answerText}\n${answer.answerText}`;
      } else {
        existing.answerText =
          answer.answerText;
      }
    }
  }

  return {
    answers: Array.from(
      answerMap.values()
    ),
  };
}

/**
 * Normalize harmless variations in question labels.
 *
 * Examples:
 *
 * "11 (a)" → "11(a)"
 * "11(a)"  → "11(a)"
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
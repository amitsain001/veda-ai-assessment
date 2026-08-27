import { GoogleGenAI } from "@google/genai";
import { questionExtractionSchema } from "../schemas/question.schema.js";

/**
 * Gemini model used for question extraction.
 *
 * Gemini 3.6 Flash supports:
 * - PDF input
 * - Image input
 * - Structured JSON output
 *
 * It is currently a stable GA model.
 */
const MODEL_NAME = "gemini-3.5-flash";

/**
 * Maximum number of attempts when Gemini temporarily
 * fails because of service availability/capacity.
 */
const MAX_RETRIES = 3;

/**
 * Create the Gemini client.
 *
 * IMPORTANT:
 * The API key is read from the backend .env file.
 * It is NEVER exposed to the React frontend.
 */
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Pause execution for a specified amount of time.
 *
 * This is used for exponential backoff between
 * Gemini retry attempts.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * JSON schema sent to Gemini.
 *
 * This tells Gemini exactly what structure we expect.
 */
const questionJsonSchema = {
  type: "object",

  properties: {
    questions: {
      type: "array",

      items: {
        type: "object",

        properties: {
          number: {
            type: "string",

            description:
              "Original printed question number. Examples: 1, 2, 11(a), 11(b), 12.",
          },

          text: {
            type: "string",

            description:
              "Complete text of the question.",
          },

          page: {
            type: "integer",

            description:
              "1-based page number where the question begins.",
          },

          type: {
            type: "string",

            enum: ["main", "subpart"],

            description:
              "main for normal questions and subpart for labelled parts such as 11(a).",
          },
        },

        required: [
          "number",
          "text",
          "page",
          "type",
        ],
      },
    },
  },

  required: ["questions"],
};

/**
 * Extract questions from a question-paper file.
 *
 * The uploaded file can be:
 *
 * PDF
 * PNG
 * JPG/JPEG
 * WEBP
 *
 * Gemini receives the original file directly.
 *
 * We are NOT converting PDFs to images here because
 * Gemini natively supports PDF document input.
 */
export async function extractQuestionsFromFile(
  buffer: Buffer,
  mimeType: string
) {
  /**
   * Make sure the API key exists before making
   * any request to Gemini.
   */
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  /**
   * Convert the uploaded file buffer to base64.
   *
   * Gemini's inlineData input accepts base64 media.
   */
  const base64Data = buffer.toString("base64");

  /**
   * Prompt responsible for the actual question extraction.
   */
  const prompt = `
You are an expert examination-paper parser.

Your task is to extract EVERY question from the provided
question paper.

IMPORTANT RULES:

1. Preserve the ORIGINAL printed question numbering exactly.

2. Preserve the ORIGINAL printed order.

3. Treat labelled sub-parts as separate questions.

   Example:

   11 (a)
   11 (b)

   MUST become:

   11(a)
   11(b)

4. Do NOT combine 11(a) and 11(b).

5. Do NOT create new numbering.

6. Do NOT skip a visible question.

7. If a question continues onto another page,
   keep it as ONE question.

8. Include the COMPLETE question text.

9. Ignore:
   - page headers
   - page footers
   - college names
   - page numbers
   - decorative text

   unless they are actually part of a question.

10. Questions may contain:
    - diagrams
    - tables
    - equations
    - multiple lines
    - internal choices
    - labelled sub-parts

11. For questions containing labelled parts such as:

    3(a)
    3(b)
    3(c)

    return THREE separate question objects.

12. The "page" field must contain the
    1-based page number where the question begins.

13. Return questions in EXACT printed order.

14. Do NOT include answers.

15. Do NOT solve the questions.

16. Do NOT summarize questions.

17. Preserve mathematical notation and important
    punctuation as accurately as possible.

18. If a question has an internal choice such as:

    OR

    preserve the choice as part of the question text.

19. Do not mistake question-paper instructions
    for questions.

20. Every visible numbered question must be represented.

Return ONLY the requested structured JSON.
`;

  /**
   * Gemini response.
   *
   * It starts as undefined because we may need
   * multiple attempts before receiving a response.
   */
  let response:
    Awaited<
      ReturnType<typeof ai.models.generateContent>
    > | undefined;

  /**
   * Retry Gemini requests when temporary failures occur.
   *
   * Example:
   *
   * Attempt 1 → 503
   *       ↓
   * Wait 2 seconds
   *       ↓
   * Attempt 2 → 503
   *       ↓
   * Wait 4 seconds
   *       ↓
   * Attempt 3 → success
   */
  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `Gemini extraction attempt ${attempt}/${MAX_RETRIES}`
      );

      /**
       * Send the document to Gemini.
       */
      response =
        await ai.models.generateContent({
          model: MODEL_NAME,

          contents: [
            /**
             * Extraction instructions.
             */
            {
              text: prompt,
            },

            /**
             * Actual uploaded question paper.
             */
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],

          config: {
            /**
             * Force JSON output.
             */
            responseMimeType:
              "application/json",

            /**
             * Force Gemini to follow our
             * question extraction structure.
             */
            responseSchema:
              questionJsonSchema,
          },
        });

      /**
       * Gemini succeeded.
       *
       * Stop retrying.
       */
      break;
    } catch (error) {
      /**
       * Convert the error into a readable string
       * for logging.
       */
      const errorMessage =
        error instanceof Error
          ? error.message
          : String(error);

      console.error(
        `Gemini attempt ${attempt} failed:`,
        errorMessage
      );

      /**
       * If this was our final attempt,
       * propagate the original error.
       */
      if (attempt === MAX_RETRIES) {
        throw error;
      }

      /**
       * Exponential backoff:
       *
       * Attempt 1 → 2 seconds
       * Attempt 2 → 4 seconds
       */
      const delay =
        2000 * 2 ** (attempt - 1);

      console.log(
        `Retrying Gemini in ${
          delay / 1000
        } seconds...`
      );

      await sleep(delay);
    }
  }

  /**
   * This should theoretically never happen because
   * the final failed attempt throws an error.
   *
   * This guard keeps TypeScript happy and protects
   * against unexpected control flow.
   */
  if (!response) {
    throw new Error(
      "Gemini did not return a response."
    );
  }

  /**
   * Gemini's structured response is returned as text.
   */
  const rawText = response.text;

  /**
   * Make sure Gemini actually returned something.
   */
  if (!rawText) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  /**
   * Convert Gemini's JSON string into a JavaScript
   * object.
   */
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    /**
     * Never allow invalid AI JSON to continue
     * through our application.
     */
    throw new Error(
      "Gemini returned invalid JSON during question extraction."
    );
  }

  /**
   * IMPORTANT:
   *
   * Gemini output is still considered untrusted.
   *
   * Zod performs the second validation layer.
   */
  const validationResult =
    questionExtractionSchema.safeParse(
      parsedJson
    );

  /**
   * If Zod rejects the response, stop processing.
   */
  if (!validationResult.success) {
    console.error(
      "Question extraction validation error:",
      validationResult.error.flatten()
    );

    throw new Error(
      "Gemini returned data that did not match the expected question schema."
    );
  }

  /**
   * At this point:
   *
   * Gemini ✓
   * JSON parsing ✓
   * Zod validation ✓
   *
   * The data is safe for the next stage.
   */
  return validationResult.data;
}
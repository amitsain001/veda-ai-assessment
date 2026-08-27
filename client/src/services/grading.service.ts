import type {
  GradingResult,
} from "@/types/grading";

import type {
  AssessmentData,
} from "@/types/assessment";

/**
 * Backend endpoint responsible for
 * AI-based assessment grading.
 *
 * During local development the Express
 * server is running on port 5000.
 */
const GRADING_ENDPOINT =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/grading`;


/**
 * Generate AI grading for an assessment.
 *
 * IMPORTANT:
 *
 * Gemini is never called directly from
 * the React application.
 *
 * React → Express → Gemini
 */
export async function gradeAssessment(
  assessment: Pick<
    AssessmentData,
    "questions" | "answers" | "mapping"
  >
): Promise<GradingResult> {

  /**
   * Send the extracted assessment data
   * to the Express backend.
   */
  const response =
    await fetch(
      GRADING_ENDPOINT,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          /**
           * Extracted questions.
           */
          questions:
            assessment.questions,

          /**
           * Extracted handwritten answers.
           */
          answers:
            assessment.answers,

          /**
           * Question → answer mappings.
           */
          mappings:
            assessment.mapping
              .mappings,
        }),
      }
    );


  /**
   * Read the response body.
   *
   * We keep this defensive because the
   * server may return a non-JSON error.
   */
  let data: unknown;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "The grading server returned an invalid response."
    );
  }


  /**
   * Handle HTTP errors.
   */
  if (!response.ok) {

    /**
     * Extract the backend error message
     * when available.
     */
    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (
        data as {
          error?: unknown;
        }
      ).error === "string"
    ) {
      throw new Error(
        (
          data as {
            error: string;
          }
        ).error
      );
    }

    throw new Error(
      "Failed to generate assessment grading."
    );
  }


  /**
   * IMPORTANT:
   *
   * Our backend currently returns the
   * GradingResult directly:
   *
   * {
   *   questionResults: [...],
   *   totalScore: ...,
   *   maxScore: ...,
   *   percentage: ...,
   *   ...
   * }
   *
   * It does NOT return:
   *
   * {
   *   success: true,
   *   grading: {...}
   * }
   */


  /**
   * Return the validated grading result
   * to the AssessmentContext.
   */
  return data as GradingResult;
}
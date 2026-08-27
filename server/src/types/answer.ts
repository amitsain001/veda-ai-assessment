/**
 * Gemini returns bounding boxes normalized to 0-1000.
 *
 * Format:
 *
 * [ymin, xmin, ymax, xmax]
 *
 * We keep this format in our backend because it is
 * exactly what Gemini provides.
 */
export interface NormalizedBoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

/**
 * Represents one physical region of a handwritten answer.
 *
 * A single answer can have multiple regions when it
 * continues onto another page.
 */
export interface AnswerRegion {
  /**
   * 1-based page number.
   */
  page: number;

  /**
   * Bounding box normalized to 0-1000.
   */
  box: NormalizedBoundingBox;
}

/**
 * Represents one student's answer.
 */
export interface ExtractedAnswer {
  /**
   * Question label detected on the answer sheet.
   *
   * Examples:
   *
   * "1"
   * "3"
   * "11(a)"
   * "11(b)"
   */
  questionNumber: string;

  /**
   * Transcribed handwritten answer.
   */
  answerText: string;

  /**
   * One or more physical regions containing
   * this answer.
   *
   * Multiple regions allow answers to span pages.
   */
  regions: AnswerRegion[];
}

/**
 * Complete answer extraction result.
 */
export interface AnswerExtractionResult {
  answers: ExtractedAnswer[];
}
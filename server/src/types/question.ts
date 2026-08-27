/**
 * Represents a single extracted question.
 *
 * The same structure will later be used by
 * the answer-mapping system.
 */
export interface ExtractedQuestion {
  /**
   * Original printed question number.
   *
   * Examples:
   * "1"
   * "11(a)"
   * "11(b)"
   * "12"
   */
  number: string;

  /**
   * Complete question text.
   */
  text: string;

  /**
   * 1-based page number where the question appears.
   */
  page: number;

  /**
   * Whether this is a main question or
   * a labelled sub-question.
   */
  type: "main" | "subpart";
}

export interface QuestionExtractionResult {
  /**
   * Questions must be returned in the same
   * printed order as the question paper.
   */
  questions: ExtractedQuestion[];
}
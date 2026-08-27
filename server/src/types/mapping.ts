/**
 * How an answer was matched to a question.
 *
 * explicit:
 *   Question number directly matched.
 *
 * semantic:
 *   No usable question number was available,
 *   so the answer was matched using its meaning.
 */
export type MatchType =
  | "explicit"
  | "semantic";

/**
 * Status of a question after mapping.
 */
export type QuestionMappingStatus =
  | "answered"
  | "unanswered";

/**
 * Status of an answer after mapping.
 */
export type AnswerMappingStatus =
  | "matched"
  | "unmatched";

/**
 * Final mapping between one question and
 * one student's answer.
 */
export interface QuestionAnswerMapping {
  /**
   * Original question number.
   *
   * Examples:
   *
   * 1
   * 11(a)
   * 11(b)
   */
  questionNumber: string;

  /**
   * Original question text.
   */
  questionText: string;

  /**
   * Whether the question has a usable answer.
   */
  status: QuestionMappingStatus;

  /**
   * How the answer was matched.
   *
   * null when the question is unanswered.
   */
  matchType: MatchType | null;

  /**
   * Confidence from 0 to 1.
   *
   * Explicit exact-number matches get 1.
   */
  confidence: number;

  /**
   * Index of the matched answer in the original
   * extracted answer array.
   *
   * null when unanswered.
   */
  answerIndex: number | null;
}

/**
 * Information about an answer that couldn't
 * be matched to any question.
 */
export interface UnmatchedAnswer {
  /**
   * Index in the original answer array.
   */
  answerIndex: number;

  /**
   * Label detected on the answer, if any.
   */
  questionNumber: string;

  /**
   * Extracted answer text.
   */
  answerText: string;

  /**
   * Why it wasn't matched.
   */
  reason: string;
}

/**
 * Complete mapping result.
 */
export interface MappingResult {
  /**
   * Mapping for every extracted question.
   */
  mappings: QuestionAnswerMapping[];

  /**
   * Answers that don't correspond to
   * any question.
   */
  unmatchedAnswers: UnmatchedAnswer[];

  /**
   * Useful summary for the frontend.
   */
  summary: {
    totalQuestions: number;
    answeredQuestions: number;
    unansweredQuestions: number;
    totalAnswers: number;
    unmatchedAnswers: number;
  };
}
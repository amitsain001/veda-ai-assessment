/**
 * Result for one evaluated question.
 */
export interface QuestionGradingResult {
  /**
   * Original question number.
   *
   * Examples:
   * 1
   * 2(a)
   * 2(b)
   */
  questionNumber: string;

  /**
   * Marks awarded.
   */
  score: number;

  /**
   * Maximum marks for this question.
   */
  maxScore: number;

  /**
   * Whether the answer is considered correct.
   */
  status:
    | "correct"
    | "partially_correct"
    | "incorrect"
    | "unanswered";

  /**
   * Short explanation of the evaluation.
   */
  feedback: string;

  /**
   * AI confidence in the evaluation.
   *
   * Value between 0 and 1.
   */
  confidence: number;
}

/**
 * Complete assessment grading result.
 */
export interface GradingResult {
  /**
   * Individual question evaluations.
   */
  questionResults: QuestionGradingResult[];

  /**
   * Total marks obtained.
   */
  totalScore: number;

  /**
   * Maximum possible marks.
   */
  maxScore: number;

  /**
   * Percentage score.
   */
  percentage: number;

  /**
   * Number of answered questions.
   */
  answeredQuestions: number;

  /**
   * Number of unanswered questions.
   */
  unansweredQuestions: number;

  /**
   * Number of questions evaluated as correct.
   */
  correctQuestions: number;

  /**
   * Number of partially correct answers.
   */
  partiallyCorrectQuestions: number;

  /**
   * Number of incorrect answers.
   */
  incorrectQuestions: number;

  /**
   * Overall AI-generated feedback.
   */
  overallFeedback: string;
}
import { z } from "zod";

/**
 * ---------------------------------------------------------
 * GRADING REQUEST
 * ---------------------------------------------------------
 */

export const gradingRequestSchema = z.object({
  questions: z.array(z.unknown()),

  answers: z.array(z.unknown()),

  mappings: z.array(z.unknown()),
});


/**
 * ---------------------------------------------------------
 * QUESTION GRADING RESULT
 * ---------------------------------------------------------
 */

const questionGradingSchema = z.object({
  questionNumber: z.string(),

  score: z.number().min(0),

  maxScore: z.number().min(0),

  status: z.enum([
    "correct",
    "partially_correct",
    "incorrect",
    "unanswered",
  ]),

  feedback: z.string(),

  confidence: z
    .number()
    .min(0)
    .max(1),
});


/**
 * ---------------------------------------------------------
 * COMPLETE GRADING RESULT
 * ---------------------------------------------------------
 */

export const gradingResultSchema = z.object({
  questionResults: z.array(
    questionGradingSchema
  ),

  totalScore: z.number().min(0),

  maxScore: z.number().min(0),

  percentage: z
    .number()
    .min(0)
    .max(100),

  answeredQuestions: z
    .number()
    .int()
    .min(0),

  unansweredQuestions: z
    .number()
    .int()
    .min(0),

  correctQuestions: z
    .number()
    .int()
    .min(0),

  partiallyCorrectQuestions: z
    .number()
    .int()
    .min(0),

  incorrectQuestions: z
    .number()
    .int()
    .min(0),

  overallFeedback: z.string(),
});


/**
 * ---------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------
 */

export type GradingRequest =
  z.infer<
    typeof gradingRequestSchema
  >;

export type QuestionGradingResult =
  z.infer<
    typeof questionGradingSchema
  >;

export type GradingResult =
  z.infer<
    typeof gradingResultSchema
  >;
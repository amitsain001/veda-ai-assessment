import { z } from "zod";

/**
 * How the answer was matched.
 */
const matchTypeSchema = z.enum([
  "explicit",
  "semantic",
]);

/**
 * Status of a question.
 */
const questionStatusSchema = z.enum([
  "answered",
  "unanswered",
]);

/**
 * Status of an unmatched answer.
 */
const answerStatusSchema = z.enum([
  "matched",
  "unmatched",
]);

/**
 * Mapping between question and answer.
 */
const questionAnswerMappingSchema =
  z.object({
    questionNumber: z.string(),

    questionText: z.string(),

    status: questionStatusSchema,

    matchType: matchTypeSchema.nullable(),

    /**
     * Confidence must always be between 0 and 1.
     */
    confidence: z
      .number()
      .min(0)
      .max(1),

    /**
     * null means no answer was mapped.
     */
    answerIndex: z
      .number()
      .int()
      .nonnegative()
      .nullable(),
  });

/**
 * Answer that couldn't be mapped.
 */
const unmatchedAnswerSchema =
  z.object({
    answerIndex: z
      .number()
      .int()
      .nonnegative(),

    questionNumber: z.string(),

    answerText: z.string(),

    reason: z.string(),
  });

/**
 * Final mapping schema.
 */
export const mappingResultSchema =
  z.object({
    mappings:
      z.array(
        questionAnswerMappingSchema
      ),

    unmatchedAnswers:
      z.array(
        unmatchedAnswerSchema
      ),

    summary: z.object({
      totalQuestions: z
        .number()
        .int()
        .nonnegative(),

      answeredQuestions: z
        .number()
        .int()
        .nonnegative(),

      unansweredQuestions: z
        .number()
        .int()
        .nonnegative(),

      totalAnswers: z
        .number()
        .int()
        .nonnegative(),

      unmatchedAnswers: z
        .number()
        .int()
        .nonnegative(),
    }),
  });

export type MappingResult =
  z.infer<
    typeof mappingResultSchema
  >;
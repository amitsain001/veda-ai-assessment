import { z } from "zod";

/**
 * Zod schema for one extracted question.
 *
 * This validates the response coming from Gemini
 * before the data enters our application.
 */
export const extractedQuestionSchema = z.object({
  number: z.string().min(1),

  text: z.string().min(1),

  page: z.number().int().positive(),

  type: z.enum(["main", "subpart"]),
});

/**
 * Complete Gemini response schema.
 */
export const questionExtractionSchema = z.object({
  questions: z.array(extractedQuestionSchema),
});

/**
 * TypeScript type automatically generated from Zod.
 *
 * This means we don't have to manually maintain
 * a second type definition for the validated data.
 */
export type QuestionExtractionResult = z.infer<
  typeof questionExtractionSchema
>;
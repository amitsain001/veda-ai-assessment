import { z } from "zod";

/**
 * Bounding box returned by Gemini.
 *
 * Coordinates are normalized between 0 and 1000.
 */
const normalizedBoundingBoxSchema = z.object({
    ymin: z.number().min(0).max(1000),
    xmin: z.number().min(0).max(1000),
    ymax: z.number().min(0).max(1000),
    xmax: z.number().min(0).max(1000),
});

/**
 * Physical region of an answer.
 */
const answerRegionSchema = z.object({
  /**
   * 1-based page number.
   */
  page: z.number().int().positive(),

  /**
   * Gemini bounding box.
   */
  box: normalizedBoundingBoxSchema,
});

/**
 * One extracted handwritten answer.
 */
const extractedAnswerSchema = z.object({
    /**
     * Question label detected from the answer sheet.
     *
     * Empty string means the student did not write
     * a recognizable question number.
     *
     * Phase 5 can then attempt semantic matching.
     */
    questionNumber: z.string(),

    /**
     * Transcribed handwritten answer.
     *
     * Empty string is allowed because handwriting
     * can sometimes be unreadable.
     */
    answerText: z.string(),

    /**
     * One or more regions.
     *
     * Multiple regions support answers that span pages.
     */
    regions: z
        .array(answerRegionSchema)
        .min(1),
});

/**
 * Complete Gemini response.
 */
export const answerExtractionSchema = z.object({
  answers: z.array(extractedAnswerSchema),
});

/**
 * TypeScript type generated automatically from Zod.
 */
export type AnswerExtractionResult = z.infer<
  typeof answerExtractionSchema
>;
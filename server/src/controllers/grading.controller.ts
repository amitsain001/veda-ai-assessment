import type { Request, Response } from "express";

import {
  gradingRequestSchema,
} from "../schemas/grading.schema.js";

import {
  gradeAssessment,
} from "../services/grading.service.js";

/**
 * Grade a complete assessment.
 *
 * POST /api/grading
 */
export async function gradeAssessmentController(
  req: Request,
  res: Response
) {
  try {
    const parsed =
      gradingRequestSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid grading request.",
        details: parsed.error.flatten(),
      });
    }

    const result =
      await gradeAssessment(
        parsed.data
      );

    return res.status(200).json(
      result
    );

  } catch (error) {
    console.error(
      "Assessment grading failed:",
      error
    );

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to grade assessment.",
    });
  }
}
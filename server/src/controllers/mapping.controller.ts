import type {
  Request,
  Response,
} from "express";

import {
  mapQuestionsToAnswers,
} from "../services/mapping.service.js";

/**
 * Map extracted questions to extracted answers.
 *
 * This endpoint receives the already extracted
 * question and answer data.
 *
 * Endpoint:
 *
 * POST /api/mapping
 */
export async function createMapping(
  req: Request,
  res: Response
) {
  try {
    /**
     * Extract request body.
     */
    const {
      questions,
      answers,
    } = req.body;

    /**
     * Basic request validation.
     *
     * Detailed validation happens inside the
     * mapping service's final Zod validation.
     */
    if (
      !Array.isArray(
        questions
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "questions must be an array.",
      });
    }

    if (
      !Array.isArray(
        answers
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "answers must be an array.",
      });
    }

    /**
     * Run mapping engine.
     */
    const result =
      await mapQuestionsToAnswers(
        questions,
        answers
      );

    /**
     * Return mapping result.
     */
    return res.status(200).json({
      success: true,

      ...result,
    });
  } catch (error) {
    console.error(
      "Mapping failed:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Mapping failed.",
    });
  }
}
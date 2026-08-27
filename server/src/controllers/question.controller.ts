import type { Request, Response } from "express";

import { extractQuestionsFromFile } from "../services/gemini.service.js";

/**
 * Extract questions from the uploaded question paper.
 *
 * Endpoint:
 *
 * POST /api/questions/extract
 */
export async function extractQuestions(
  req: Request,
  res: Response
) {
  try {
    /**
     * Multer places the uploaded file
     * inside req.file.
     */
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Question paper is required.",
      });
    }

    console.log(
      `Processing question paper: ${req.file.originalname}`
    );

    console.log(
      `File type: ${req.file.mimetype}`
    );

    console.log(
      `File size: ${req.file.size} bytes`
    );

    /**
     * Send the file to Gemini.
     */
    const result = await extractQuestionsFromFile(
      req.file.buffer,
      req.file.mimetype
    );

    /**
     * Return the validated extraction result.
     */
    return res.status(200).json({
      success: true,

      fileName: req.file.originalname,

      questionCount: result.questions.length,

      questions: result.questions,
    });
  } catch (error) {
    console.error(
      "Question extraction failed:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Question extraction failed.",
    });
  }
}
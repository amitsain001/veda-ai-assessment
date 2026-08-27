import type {
  Request,
  Response,
} from "express";

import {
  prepareAnswerPages,
} from "../services/answer-page.service.js";

import {
  extractAnswersFromPages,
} from "../services/answer-extraction.service.js";

/**
 * Extract handwritten answers from the uploaded
 * student answer sheet.
 *
 * Endpoint:
 *
 * POST /api/answers/extract
 */
export async function extractAnswers(
  req: Request,
  res: Response
) {
  try {
    /**
     * Make sure a file was uploaded.
     */
    if (!req.file) {
      return res.status(400).json({
        success: false,

        message:
          "Student answer sheet is required.",
      });
    }

    console.log(
      `Processing answer sheet: ${req.file.originalname}`
    );

    console.log(
      `File type: ${req.file.mimetype}`
    );

    console.log(
      `File size: ${req.file.size} bytes`
    );

    /**
     * Convert the answer sheet into page images.
     *
     * PDF:
     * PDF → PNG pages
     *
     * Image:
     * Image → single page
     */
    const pages =
      await prepareAnswerPages(
        req.file.buffer,
        req.file.mimetype
      );

    console.log(
      `Prepared ${pages.length} page(s) for Gemini.`
    );

    /**
     * Run handwritten answer extraction.
     */
    const result =
      await extractAnswersFromPages(
        pages
      );

    /**
     * Return structured result.
     */
    return res.status(200).json({
      success: true,

      fileName:
        req.file.originalname,

      pageCount:
        pages.length,

      answerCount:
        result.answers.length,

      answers:
        result.answers,
    });
  } catch (error) {
    console.error(
      "Answer extraction failed:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Answer extraction failed.",
    });
  }
}
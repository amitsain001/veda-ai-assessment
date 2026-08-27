import { Router } from "express";

import {
  extractAnswers,
} from "../controllers/answer.controller.js";

import {
  questionPaperUpload,
} from "../middleware/upload.middleware.js";

/**
 * Express router for answer-sheet operations.
 */
const router = Router();

/**
 * POST /api/answers/extract
 *
 * Multipart field:
 *
 * answerSheet
 */
router.post(
  "/extract",

  /**
   * Reuse our existing memory upload middleware.
   *
   * The middleware validates:
   * - PDF
   * - PNG
   * - JPG/JPEG
   * - WEBP
   */
  questionPaperUpload.single(
    "answerSheet"
  ),

  /**
   * Run handwritten answer extraction.
   */
  extractAnswers
);

export default router;
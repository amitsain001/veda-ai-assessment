import { Router } from "express";

import { extractQuestions } from "../controllers/question.controller.js";

import {
  questionPaperUpload,
} from "../middleware/upload.middleware.js";

const router = Router();

/**
 * POST /api/questions/extract
 *
 * Expected multipart/form-data field:
 *
 * questionPaper
 */
router.post(
  "/extract",

  /**
   * Multer reads the uploaded file from
   * the multipart/form-data request.
   */
  questionPaperUpload.single("questionPaper"),

  /**
   * Controller performs the AI extraction.
   */
  extractQuestions
);

export default router;
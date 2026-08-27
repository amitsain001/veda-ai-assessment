import { Router } from "express";

import {
  gradeAssessmentController,
} from "../controllers/grading.controller.js";

/**
 * Router for assessment grading.
 */
const router = Router();

/**
 * POST /api/grading
 *
 * Generates AI grading for the
 * complete assessment.
 */
router.post(
  "/",
  gradeAssessmentController
);

export default router;
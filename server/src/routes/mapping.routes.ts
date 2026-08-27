import { Router } from "express";

import {
  createMapping,
} from "../controllers/mapping.controller.js";

/**
 * Router for question-answer mapping.
 */
const router = Router();

/**
 * POST /api/mapping
 *
 * Receives:
 *
 * {
 *   questions: [...],
 *   answers: [...]
 * }
 */
router.post(
  "/",
  createMapping
);

export default router;
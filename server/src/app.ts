import "dotenv/config";

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import questionRoutes from "./routes/question.routes.js";
import answerRoutes from "./routes/answer.routes.js";
import mappingRoutes from "./routes/mapping.routes.js";
import gradingRoutes from "./routes/grading.routes.js";

const app = express();

/**
 * ==========================================
 * CORS CONFIGURATION
 * ==========================================
 *
 * Local development:
 *   http://localhost:5173
 *
 * Production:
 *   Set FRONTEND_URL in the backend environment.
 *
 * Example:
 *
 * FRONTEND_URL=https://your-frontend-domain.com
 */
const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (
        error: Error | null,
        allowed?: boolean
      ) => void
    ) => {
      // Allow requests without an Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      // Allow configured frontend origins.
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.warn(
        `CORS request blocked from origin: ${origin}`
      );

      callback(
        new Error("Not allowed by CORS.")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);
/**
 * ==========================================
 * REQUEST BODY CONFIGURATION
 * ==========================================
 */
app.use(
  express.json({
    limit: "5mb",
  })
);

/**
 * ==========================================
 * API ROUTES
 * ==========================================
 */

/**
 * Backend health check.
 *
 * GET /api/health
 */
app.use(
  "/api/health",
  healthRoutes
);

/**
 * Question extraction API.
 *
 * POST /api/questions/extract
 */
app.use(
  "/api/questions",
  questionRoutes
);

/**
 * Student answer-sheet extraction API.
 */
app.use(
  "/api/answers",
  answerRoutes
);

/**
 * Question-answer mapping API.
 */
app.use(
  "/api/mapping",
  mappingRoutes
);

/**
 * Assessment grading API.
 *
 * POST /api/grading
 */
app.use(
  "/api/grading",
  gradingRoutes
);

/**
 * ==========================================
 * 404 HANDLER
 * ==========================================
 *
 * Handles unknown API endpoints.
 */
app.use(
  (
    req: Request,
    res: Response
  ) => {
    return res.status(404).json({
      error: "API endpoint not found.",
      path: req.originalUrl,
    });
  }
);

/**
 * ==========================================
 * GLOBAL ERROR HANDLER
 * ==========================================
 *
 * Express error middleware must have
 * four parameters.
 */
app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(
      "Backend error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Internal server error.";

    return res.status(500).json({
      error: message,
    });
  }
);

export default app;
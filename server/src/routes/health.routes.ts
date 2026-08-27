import { Router } from "express";

const router = Router();

/*
  GET /api/health

  This endpoint allows the frontend or developer
  to verify that the Express backend is alive.
*/
router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "VedaAI backend is running",
  });
});

export default router;
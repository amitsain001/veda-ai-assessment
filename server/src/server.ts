import "dotenv/config";

import app from "./app.js";

/**
 * Port used by the Express server.
 *
 * Deployment platforms usually provide PORT
 * through an environment variable.
 *
 * Local development falls back to 5000.
 */
const PORT = Number(
  process.env.PORT || 5000
);

/**
 * Start the Express HTTP server.
 */
app.listen(PORT, () => {
  console.log(`
==========================================
   VedaAI Backend
==========================================

Server started successfully.

Port:
${PORT}

Health endpoint:
/api/health

==========================================
  `);
});
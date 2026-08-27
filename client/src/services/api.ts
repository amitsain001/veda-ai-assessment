/**
 * Express backend URL.
 *
 * Later we will move this into a Vite environment
 * variable for production deployment.
 */
const API_BASE_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5000"
}/api`;

/**
 * Check whether the backend is alive.
 */
export async function checkBackendHealth() {
  const response = await fetch(
    `${API_BASE_URL}/health`
  );

  if (!response.ok) {
    throw new Error(
      "Backend health check failed."
    );
  }

  return response.json();
}

/**
 * Extract questions from the uploaded question paper.
 */
export async function extractQuestions(
  file: File
) {
  /**
   * FormData is required because we are
   * uploading an actual file.
   */
  const formData = new FormData();

  /**
   * IMPORTANT:
   *
   * "questionPaper" must exactly match:
   *
   * questionPaperUpload.single("questionPaper")
   *
   * on the Express backend.
   */
  formData.append("questionPaper", file);

  /**
   * Send the multipart request.
   *
   * Do NOT manually set Content-Type here.
   *
   * The browser automatically creates the correct
   * multipart boundary.
   */
  const response = await fetch(
    `${API_BASE_URL}/questions/extract`,
    {
      method: "POST",
      body: formData,
    }
  );

  /**
   * Parse the backend response.
   */
  const data = await response.json();

  /**
   * Convert backend errors into frontend errors.
   */
  if (!response.ok) {
    throw new Error(
      data.message ||
        "Question extraction failed."
    );
  }

  return data;
}
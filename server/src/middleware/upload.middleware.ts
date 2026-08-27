import multer from "multer";

/**
 * Store uploaded files in memory.
 *
 * We don't need permanent storage yet because
 * this assignment does not require a database.
 *
 * Later, the buffer can be:
 *
 * Buffer → Gemini
 */
const storage = multer.memoryStorage();

/**
 * File upload configuration.
 */
export const questionPaperUpload = multer({
  storage,

  limits: {
    /**
     * Match the frontend's 20 MB limit.
     */
    fileSize: 20 * 1024 * 1024,
  },

  /**
   * Validate the uploaded MIME type.
   */
  fileFilter: (_req, file, callback) => {
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error(
          "Unsupported file type. Only PDF, PNG, JPG, JPEG and WEBP are allowed."
        )
      );
    }

    callback(null, true);
  },
});
/**
 * =========================================================
 * FILE VALIDATION
 * Phase 8 — Polish
 * =========================================================
 */

/**
 * Maximum file size allowed by the frontend.
 *
 * 20 MB is enough for most question papers
 * and scanned answer sheets.
 */
export const MAX_FILE_SIZE =
  20 * 1024 * 1024;

/**
 * File MIME types accepted by the application.
 */
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/**
 * Human-readable file extensions.
 */
export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

/**
 * Get a normalized file extension.
 */
function getFileExtension(
  file: File
): string {
  const fileName =
    file.name.toLowerCase();

  const lastDot =
    fileName.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return fileName.slice(lastDot);
}

/**
 * Check whether the file extension
 * is supported.
 */
function hasAllowedExtension(
  file: File
): boolean {
  const extension =
    getFileExtension(file);

  return ALLOWED_EXTENSIONS.includes(
    extension as
      (typeof ALLOWED_EXTENSIONS)[number]
  );
}

/**
 * Check whether the MIME type
 * is supported.
 */
function hasAllowedMimeType(
  file: File
): boolean {
  return ALLOWED_FILE_TYPES.includes(
    file.type as
      (typeof ALLOWED_FILE_TYPES)[number]
  );
}

/**
 * Validate a selected file.
 *
 * Validation checks:
 *
 * 1. File exists
 * 2. File is not empty
 * 3. File type / extension is supported
 * 4. File size is within the 20 MB limit
 */
export function validateFile(
  file: File
): string | null {
  /**
   * Defensive check.
   */
  if (!file) {
    return "Please select a file.";
  }

  /**
   * Empty files are not useful for
   * question or answer extraction.
   */
  if (file.size === 0) {
    return "The selected file is empty. Please choose another file.";
  }

  /**
   * Some browsers may provide an empty
   * MIME type for locally selected files.
   *
   * Therefore we accept the file when
   * either its MIME type OR extension
   * identifies a supported format.
   */
  const validMimeType =
    hasAllowedMimeType(file);

  const validExtension =
    hasAllowedExtension(file);

  if (
    !validMimeType &&
    !validExtension
  ) {
    return (
      "Unsupported file type. " +
      "Please upload a PDF, JPG, JPEG, PNG, or WEBP file."
    );
  }

  /**
   * Enforce maximum file size.
   */
  if (
    file.size > MAX_FILE_SIZE
  ) {
    return (
      "File is too large. " +
      "Maximum allowed size is 20 MB."
    );
  }

  /**
   * File passed validation.
   */
  return null;
}

/**
 * Determine whether a file is a PDF.
 *
 * MIME type is preferred, but the
 * extension is used as a fallback.
 */
export function isPdfFile(
  file: File
): boolean {
  if (
    file.type ===
    "application/pdf"
  ) {
    return true;
  }

  return (
    getFileExtension(file) ===
    ".pdf"
  );
}

/**
 * Determine whether a file is an image.
 *
 * Supports:
 *
 * JPG
 * JPEG
 * PNG
 * WEBP
 */
export function isImageFile(
  file: File
): boolean {
  if (
    file.type.startsWith(
      "image/"
    )
  ) {
    return true;
  }

  const extension =
    getFileExtension(file);

  return (
    extension === ".jpg" ||
    extension === ".jpeg" ||
    extension === ".png" ||
    extension === ".webp"
  );
}

/**
 * Convert bytes into a human-readable
 * file size.
 */
export function formatFileSize(
  bytes: number
): string {
  if (
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}
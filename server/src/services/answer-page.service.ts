import {
  renderPdfPages,
  type RenderedPage,
} from "./pdf.service.js";

/**
 * Supported image MIME types.
 *
 * We explicitly list the formats that our application
 * accepts for handwritten answer sheets.
 */
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

/**
 * Type guard that converts a generic string MIME type
 * into the exact MIME type union expected by TypeScript.
 */
function isSupportedImageType(
  mimeType: string
): mimeType is
  | "image/png"
  | "image/jpeg"
  | "image/webp" {
  return IMAGE_TYPES.has(mimeType);
}

/**
 * Convert an uploaded answer sheet into a common
 * page representation.
 *
 * PDF:
 *
 * PDF
 * ↓
 * PNG page 1
 * PNG page 2
 * PNG page 3
 *
 * Image:
 *
 * JPG/PNG/WEBP
 * ↓
 * Single page
 */
export async function prepareAnswerPages(
  buffer: Buffer,
  mimeType: string
): Promise<RenderedPage[]> {
  /**
   * Handle PDF answer sheets.
   *
   * Every PDF page is converted to PNG.
   */
  if (mimeType === "application/pdf") {
    return renderPdfPages(buffer);
  }

  /**
   * Handle direct image uploads.
   */
  if (isSupportedImageType(mimeType)) {
    return [
      {
        /**
         * A standalone uploaded image represents
         * page 1 of the answer sheet.
         */
        page: 1,

        /**
         * Keep the original image buffer.
         */
        buffer,

        /**
         * TypeScript now knows this is exactly:
         *
         * image/png | image/jpeg | image/webp
         */
        mimeType,
      },
    ];
  }

  /**
   * Reject anything that isn't supported.
   */
  throw new Error(
    "Unsupported answer sheet format. Only PDF, PNG, JPG/JPEG and WEBP are supported."
  );
}
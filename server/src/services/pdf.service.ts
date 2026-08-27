import { pdf } from "pdf-to-img";

/**
 * Represents one rendered PDF page.
 */

export interface RenderedPage {
  /**
   * 1-based page number.
   */
  page: number;

  /**
   * Rendered page image.
   */
  buffer: Buffer;

  /**
   * MIME type of the image sent to Gemini.
   *
   * PDF pages are converted to PNG.
   * Direct image uploads may remain PNG/JPEG/WEBP.
   */
  mimeType:
    | "image/png"
    | "image/jpeg"
    | "image/webp";
}

/**
 * Convert a PDF buffer into page images.
 *
 * We intentionally keep everything in memory.
 *
 * No database or permanent file storage is required
 * for this assignment.
 */
export async function renderPdfPages(
  pdfBuffer: Buffer
): Promise<RenderedPage[]> {
  /**
   * pdf-to-img accepts a data URL, which allows us
   * to avoid writing the uploaded PDF to disk.
   */
  const pdfDataUrl =
    `data:application/pdf;base64,${pdfBuffer.toString(
      "base64"
    )}`;

  /**
   * Open the PDF.
   *
   * Scale 2 gives Gemini a reasonably high-resolution
   * page image while keeping request sizes manageable.
   */
  const document = await pdf(pdfDataUrl, {
    scale: 2,
  });

  const pages: RenderedPage[] = [];

  try {
    let pageNumber = 1;

    /**
     * pdf-to-img exposes pages as an async iterator.
     */
    for await (const pageBuffer of document) {
      pages.push({
        page: pageNumber,

        /**
         * Ensure the returned value is a Node Buffer.
         */
        buffer: Buffer.from(pageBuffer),

        mimeType: "image/png",
      });

      pageNumber++;
    }
  } finally {
    /**
     * Release PDF resources.
     */
    document.destroy();
  }

  if (pages.length === 0) {
    throw new Error(
      "The PDF did not contain any renderable pages."
    );
  }

  return pages;
}
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Document,
  pdfjs,
} from "react-pdf";

import type {
  AnswerRegion,
} from "@/types/assessment";

import PdfPage from "./PdfPage";

/**
 * PDF.js worker.
 *
 * The worker version must match the installed
 * pdfjs-dist version.
 */
pdfjs.GlobalWorkerOptions.workerSrc =
  "/pdf.worker.min.mjs";

interface PdfViewerProps {
  file: File;
  regions: AnswerRegion[];
  selectedPage: number;
}

/**
 * Supported image formats.
 */
function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  const name =
    file.name.toLowerCase();

  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}

/**
 * Safely read a numeric property from
 * an answer region.
 *
 * This keeps this component compatible
 * with slightly different region schemas.
 */
function getNumber(
  value: unknown
): number | null {
  return typeof value === "number"
    ? value
    : null;
}

/**
 * Extract bounding-box information from
 * a region without assuming a specific
 * TypeScript schema.
 *
 * Supported forms:
 *
 * {
 *   x,
 *   y,
 *   width,
 *   height
 * }
 *
 * or
 *
 * {
 *   bbox: [x, y, width, height]
 * }
 *
 * or
 *
 * {
 *   bbox: {
 *     x,
 *     y,
 *     width,
 *     height
 *   }
 * }
 */
function getRegionBox(
  region: AnswerRegion
) {
  const raw =
    region as unknown as Record<
      string,
      unknown
    >;

  const directX =
    getNumber(raw.x);

  const directY =
    getNumber(raw.y);

  const directWidth =
    getNumber(raw.width);

  const directHeight =
    getNumber(raw.height);

  if (
    directX !== null &&
    directY !== null &&
    directWidth !== null &&
    directHeight !== null
  ) {
    return {
      x: directX,
      y: directY,
      width: directWidth,
      height: directHeight,
    };
  }

  const bbox =
    raw.bbox;

  if (Array.isArray(bbox)) {
    const [
      x,
      y,
      width,
      height,
    ] = bbox;

    if (
      typeof x === "number" &&
      typeof y === "number" &&
      typeof width === "number" &&
      typeof height === "number"
    ) {
      return {
        x,
        y,
        width,
        height,
      };
    }
  }

  if (
    bbox &&
    typeof bbox === "object"
  ) {
    const box =
      bbox as Record<
        string,
        unknown
      >;

    const x =
      getNumber(box.x);

    const y =
      getNumber(box.y);

    const width =
      getNumber(box.width);

    const height =
      getNumber(box.height);

    if (
      x !== null &&
      y !== null &&
      width !== null &&
      height !== null
    ) {
      return {
        x,
        y,
        width,
        height,
      };
    }
  }

  return null;
}

export default function PdfViewer({
  file,
  regions,
  selectedPage,
}: PdfViewerProps) {
  /**
   * Number of pages.
   *
   * PDFs can have multiple pages.
   * Images are treated as one page.
   */
  const [
    numPages,
    setNumPages,
  ] = useState(0);

  /**
   * Object URL for either:
   *
   * PDF
   * JPG
   * JPEG
   * PNG
   * WEBP
   */
  const [
    fileUrl,
    setFileUrl,
  ] = useState<string | null>(
    null
  );

  /**
   * Width of the center viewer.
   */
  const [
    containerWidth,
    setContainerWidth,
  ] = useState(0);

  /**
   * Reference to viewer container.
   */
  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /**
   * References to individual pages.
   */
  const pageRefs =
    useRef<
      Record<
        number,
        HTMLDivElement | null
      >
    >({});

  /**
   * Determine whether the current
   * file is an image.
   */
  const imageFile =
    isImageFile(file);

  /**
   * Create object URL whenever
   * the uploaded file changes.
   */
  useEffect(() => {
    const url =
      URL.createObjectURL(file);

    setFileUrl(url);

    /**
     * Images only have one page.
     *
     * PDF page count will be updated
     * by react-pdf.
     */
    if (imageFile) {
      setNumPages(1);
    } else {
      setNumPages(0);
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [
    file,
    imageFile,
  ]);

  /**
   * Observe viewer width.
   *
   * This makes both PDF and image
   * rendering responsive.
   */
  useEffect(() => {
    const element =
      containerRef.current;

    if (!element) {
      return;
    }

    const observer =
      new ResizeObserver(
        (entries) => {
          const width =
            entries[0]
              ?.contentRect.width ?? 0;

          setContainerWidth(
            width
          );
        }
      );

    observer.observe(
      element
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  /**
   * PDF page width.
   */
  const pageWidth =
    Math.max(
      280,
      containerWidth - 48
    );

  /**
   * Navigate to selected page.
   */
  useEffect(() => {
    const element =
      pageRefs.current[
        selectedPage
      ];

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [
    selectedPage,
    numPages,
  ]);

  /**
   * Group answer regions by page.
   */
  const regionsByPage =
    new Map<
      number,
      AnswerRegion[]
    >();

  for (
    const region of regions
  ) {
    const existing =
      regionsByPage.get(
        region.page
      ) ?? [];

    existing.push(
      region
    );

    regionsByPage.set(
      region.page,
      existing
    );
  }

  /**
   * ------------------------------------------------
   * IMAGE VIEWER
   * ------------------------------------------------
   *
   * JPG / JPEG / PNG / WEBP
   */
  if (imageFile) {
    return (
      <div
        ref={containerRef}
        className="
          h-full
          min-w-0
          min-h-0
          overflow-y-auto
          overflow-x-hidden
          bg-slate-100
          p-6
        "
      >
        {!fileUrl && (
          <div className="flex min-h-64 items-center justify-center">
            <p className="text-sm text-slate-500">
              Preparing answer sheet...
            </p>
          </div>
        )}

        {fileUrl && (
          <div
            ref={(element) => {
              pageRefs.current[1] =
                element;
            }}
            className="
              flex
              w-full
              justify-center
              pb-8
            "
          >
            <div
              className="
                relative
                inline-block
                max-w-full
                overflow-hidden
                bg-white
                shadow-sm
              "
            >
              <img
                src={fileUrl}
                alt="Answer sheet"
                className="
                  block
                  h-auto
                  max-w-full
                  object-contain
                "
                style={{
                  width:
                    containerWidth > 48
                      ? Math.min(
                          containerWidth - 48,
                          1200
                        )
                      : undefined,
                }}
                onError={(error) => {
                  console.error(
                    "Image loading error:",
                    error
                  );
                }}
              />

              {/**
               * Answer-region highlighting.
               *
               * The overlay is intentionally
               * defensive because different
               * extraction versions may use
               * different bounding-box shapes.
               */}
              {(
                regionsByPage.get(
                  1
                ) ?? []
              ).map(
                (
                  region,
                  index
                ) => {
                  const box =
                    getRegionBox(
                      region
                    );

                  if (!box) {
                    return null;
                  }

                  /**
                   * If coordinates are between
                   * 0 and 1, treat them as
                   * normalized coordinates.
                   *
                   * Otherwise use pixel-like
                   * coordinates.
                   */
                  const normalized =
                    box.x >= 0 &&
                    box.x <= 1 &&
                    box.y >= 0 &&
                    box.y <= 1 &&
                    box.width >= 0 &&
                    box.width <= 1 &&
                    box.height >= 0 &&
                    box.height <= 1;

                  return (
                    <div
                      key={
                        `region-${index}`
                      }
                      className="
                        pointer-events-none
                        absolute
                        rounded-sm
                        border-2
                        border-blue-500
                        bg-blue-500/10
                      "
                      style={
                        normalized
                          ? {
                              left:
                                `${box.x * 100}%`,
                              top:
                                `${box.y * 100}%`,
                              width:
                                `${box.width * 100}%`,
                              height:
                                `${box.height * 100}%`,
                            }
                          : {
                              left:
                                box.x,
                              top:
                                box.y,
                              width:
                                box.width,
                              height:
                                box.height,
                            }
                      }
                    />
                  );
                }
              )}
            </div>
          </div>
        )}

        {!fileUrl && (
          <div className="flex min-h-64 items-center justify-center">
            <p className="text-sm text-slate-500">
              Loading answer sheet...
            </p>
          </div>
        )}
      </div>
    );
  }

  /**
   * ------------------------------------------------
   * PDF VIEWER
   * ------------------------------------------------
   */
  return (
    <div
      ref={containerRef}
      className="
        h-full
        min-w-0
        min-h-0
        overflow-y-auto
        overflow-x-hidden
        bg-slate-100
        p-6
      "
    >
      {!fileUrl && (
        <div className="flex min-h-64 items-center justify-center">
          <p className="text-sm text-slate-500">
            Preparing answer sheet...
          </p>
        </div>
      )}

      {fileUrl && (
        <Document
          file={fileUrl}

          onLoadSuccess={({
            numPages,
          }) => {
            console.log(
              "Answer sheet loaded successfully:",
              numPages
            );

            setNumPages(
              numPages
            );
          }}

          onLoadError={(error) => {
            console.error(
              "PDF loading error:",
              error
            );
          }}

          loading={
            <div className="flex min-h-64 items-center justify-center">
              <p className="text-sm text-slate-500">
                Loading answer sheet...
              </p>
            </div>
          }

          error={
            <div className="flex min-h-64 flex-col items-center justify-center gap-2">
              <p className="font-medium text-red-500">
                Failed to load answer sheet.
              </p>

              <p className="text-xs text-slate-500">
                Check the browser console.
              </p>
            </div>
          }
        >
          {Array.from(
            {
              length: numPages,
            },
            (_, index) => {
              const pageNumber =
                index + 1;

              return (
                <PdfPage
                  key={
                    pageNumber
                  }

                  pageNumber={
                    pageNumber
                  }

                  width={
                    pageWidth
                  }

                  regions={
                    regionsByPage.get(
                      pageNumber
                    ) ?? []
                  }

                  pageRef={(
                    element
                  ) => {
                    pageRefs.current[
                      pageNumber
                    ] =
                      element;
                  }}
                />
              );
            }
          )}
        </Document>
      )}
    </div>
  );
}
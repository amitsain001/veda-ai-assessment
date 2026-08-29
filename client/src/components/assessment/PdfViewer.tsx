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
 */
pdfjs.GlobalWorkerOptions.workerSrc =
  "/pdf.worker.min.mjs";

/**
 * Props accepted by the viewer.
 */
interface PdfViewerProps {
  file: File;
  regions: AnswerRegion[];
  selectedPage: number;
}

/**
 * Check whether the uploaded file is an image.
 */
function isImageFile(
  file: File
): boolean {
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
 * Safely convert a value to a number.
 */
function getNumber(
  value: unknown
): number | null {
  return typeof value === "number"
    ? value
    : null;
}

/**
 * Extract bounding box information.
 */
function getRegionBox(
  region: AnswerRegion
) {
  const raw =
    region as unknown as Record<
      string,
      unknown
    >;

  /**
   * Direct format:
   *
   * {
   *   x,
   *   y,
   *   width,
   *   height
   * }
   */
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

  /**
   * Array format:
   *
   * [x, y, width, height]
   */
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

  /**
   * Object format:
   *
   * {
   *   x,
   *   y,
   *   width,
   *   height
   * }
   */
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

/**
 * Keep zoom between 50% and 200%.
 */
function clampZoom(
  value: number
) {
  return Math.min(
    2,
    Math.max(0.5, value)
  );
}

/**
 * Main PDF / Image viewer.
 */
export default function PdfViewer({
  file,
  regions,
  selectedPage,
}: PdfViewerProps) {
  /**
   * Number of PDF pages.
   */
  const [
    numPages,
    setNumPages,
  ] = useState(0);

  /**
   * Uploaded file object URL.
   */
  const [
    fileUrl,
    setFileUrl,
  ] = useState<string | null>(
    null
  );

  /**
   * Available viewer width.
   */
  const [
    containerWidth,
    setContainerWidth,
  ] = useState(0);

  /**
   * Zoom level.
   *
   * 1 = 100%
   * 1.25 = 125%
   * 1.5 = 150%
   * 1.75 = 175%
   * 2 = 200%
   */
  const [
    zoom,
    setZoom,
  ] = useState(1);

  /**
   * Scrollable viewer container.
   */
  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  /**
   * Individual page references.
   */
  const pageRefs =
    useRef<
      Record<
        number,
        HTMLDivElement | null
      >
    >({});

  /**
   * Determine image/PDF type.
   */
  const imageFile =
    isImageFile(file);

  /**
   * Create file URL whenever
   * the uploaded file changes.
   */
  useEffect(() => {
    const url =
      URL.createObjectURL(file);

    setFileUrl(url);

    /**
     * Reset zoom whenever
     * a new document is loaded.
     */
    setZoom(1);

    /**
     * Images only contain one page.
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
   * Observe the available
   * width of the viewer.
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

          setContainerWidth(width);
        }
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  /**
   * At 100%, the page fits inside
   * the available viewer width.
   *
   * Padding is removed from the
   * calculation so the page does not
   * accidentally overflow at 100%.
   */
  const availableWidth =
    Math.max(
      280,
      containerWidth - 48
    );

  /**
   * Actual document width after zoom.
   */
  const pageWidth =
    availableWidth * zoom;

  /**
   * Increase zoom by 25%.
   */
  const zoomIn = () => {
    setZoom((current) =>
      clampZoom(
        Math.round(
          (current + 0.25) * 100
        ) / 100
      )
    );
  };

  /**
   * Decrease zoom by 25%.
   */
  const zoomOut = () => {
    setZoom((current) =>
      clampZoom(
        Math.round(
          (current - 0.25) * 100
        ) / 100
      )
    );
  };

  /**
   * Reset to 100%.
   */
  const resetZoom = () => {
    setZoom(1);
  };

  /**
   * When a question is selected,
   * move the corresponding page
   * into view.
   *
   * `inline: "nearest"` is important.
   *
   * It prevents the browser from
   * unnecessarily moving the document
   * horizontally when selecting a page.
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
      inline: "nearest",
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

    existing.push(region);

    regionsByPage.set(
      region.page,
      existing
    );
  }

  /**
   * ========================================================
   * TOOLBAR
   * ========================================================
   */
  const viewerToolbar = (
    <div
      className="
        sticky
        top-0
        z-50
        flex
        h-14
        shrink-0
        items-center
        justify-between
        border-b
        border-slate-700
        bg-slate-900
        px-4
        shadow-md
      "
    >
      {/* Left side */}
      <div
        className="
          min-w-0
          text-sm
          font-semibold
          text-white
        "
      >
        Answer Sheet
      </div>

      {/* Zoom controls */}
      <div
        className="
          flex
          shrink-0
          items-center
          gap-1
          rounded-lg
          bg-slate-800
          p-1
        "
      >
        {/* Minus */}
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= 0.5}
          aria-label="Zoom out"
          title="Zoom out"
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-md
            text-lg
            font-medium
            text-white
            transition
            hover:bg-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          −
        </button>

        {/* Percentage */}
        <button
          type="button"
          onClick={resetZoom}
          aria-label="Reset zoom"
          title="Reset zoom to 100%"
          className="
            min-w-16
            rounded-md
            px-2
            py-1.5
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-slate-700
          "
        >
          {Math.round(
            zoom * 100
          )}
          %
        </button>

        {/* Plus */}
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= 2}
          aria-label="Zoom in"
          title="Zoom in"
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-md
            text-lg
            font-medium
            text-white
            transition
            hover:bg-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          +
        </button>
      </div>
    </div>
  );

  /**
   * ========================================================
   * IMAGE VIEWER
   * ========================================================
   */
  if (imageFile) {
    return (
      <div
        ref={containerRef}
        className="
          flex
          h-full
          min-h-0
          min-w-0
          flex-col
          overflow-hidden
          bg-slate-100/80
        "
      >
        {viewerToolbar}

        {/* 
          IMPORTANT:
          This is the actual scroll container.

          The inner wrapper uses max-content
          so zoomed content can be scrolled
          from BOTH left and right.
        */}
        <div
          className="
            min-h-0
            min-w-0
            flex-1
            overflow-auto
          "
        >
          <div
            className="
              box-border
              flex
              min-h-full
              w-max
              min-w-full
              justify-start
              p-4
              sm:p-6
            "
          >
            {!fileUrl && (
              <div
                className="
                  flex
                  min-h-64
                  w-full
                  items-center
                  justify-center
                "
              >
                <div
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-5
                    py-4
                    text-center
                    shadow-sm
                  "
                >
                  <p
                    className="
                      text-sm
                      font-medium
                      text-slate-700
                    "
                  >
                    Preparing answer sheet...
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-400
                    "
                  >
                    Loading your document
                  </p>
                </div>
              </div>
            )}

            {fileUrl && (
              <div
                ref={(element) => {
                  pageRefs.current[1] =
                    element;
                }}
                className="
                  relative
                  shrink-0
                  pb-10
                "
                style={{
                  width: pageWidth,
                  marginLeft:
                    pageWidth <
                    availableWidth
                      ? "auto"
                      : 0,
                  marginRight:
                    pageWidth <
                    availableWidth
                      ? "auto"
                      : 0,
                }}
              >
                <div
                  className="
                    relative
                    w-full
                    overflow-hidden
                    rounded-sm
                    bg-white
                    shadow-[0_8px_30px_rgba(15,23,42,0.10)]
                    ring-1
                    ring-slate-200
                  "
                >
                  <img
                    src={fileUrl}
                    alt="Answer sheet"
                    className="
                      block
                      h-auto
                      w-full
                      object-contain
                    "
                  />

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
                          key={`region-${index}`}
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
          </div>
        </div>
      </div>
    );
  }

  /**
   * ========================================================
   * PDF VIEWER
   * ========================================================
   */
  return (
    <div
      ref={containerRef}
      className="
        flex
        h-full
        min-h-0
        min-w-0
        flex-col
        overflow-hidden
        bg-slate-100/80
      "
    >
      {viewerToolbar}

      {/* 
        ACTUAL SCROLL CONTAINER

        This is the key fix.

        `overflow-auto` allows:
        - horizontal scrolling
        - vertical scrolling
      */}
      <div
        className="
          min-h-0
          min-w-0
          flex-1
          overflow-auto
        "
      >
        {/* 
          This wrapper is intentionally `w-max`.

          When the PDF becomes larger than
          the viewport, the wrapper grows with
          the PDF instead of clipping it.

          `min-w-full` keeps 100% zoom centered.
        */}
        <div
          className="
            box-border
            flex
            min-h-full
            w-max
            min-w-full
            flex-col
            items-start
            p-4
            sm:p-6
          "
        >
          {!fileUrl && (
            <div
              className="
                flex
                min-h-64
                w-full
                items-center
                justify-center
              "
            >
              <p
                className="
                  text-sm
                  text-slate-500
                "
              >
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
                <div
                  className="
                    flex
                    min-h-64
                    w-full
                    items-center
                    justify-center
                  "
                >
                  <p
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Loading answer sheet...
                  </p>
                </div>
              }
              error={
                <div
                  className="
                    flex
                    min-h-64
                    w-full
                    items-center
                    justify-center
                    px-6
                  "
                >
                  <div
                    className="
                      rounded-xl
                      border
                      border-red-200
                      bg-white
                      px-6
                      py-5
                      text-center
                      shadow-sm
                    "
                  >
                    <p
                      className="
                        font-semibold
                        text-red-600
                      "
                    >
                      Failed to load answer sheet.
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-500
                      "
                    >
                      Check the browser console.
                    </p>
                  </div>
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

                  /**
                   * At 100%:
                   * center the page.
                   *
                   * When zoomed:
                   * keep the page starting
                   * from the left so the
                   * entire page remains
                   * horizontally reachable.
                   */
                  const isZoomed =
                    pageWidth >
                    availableWidth;

                  return (
                    <div
                      key={`page-shell-${pageNumber}`}
                      ref={(element) => {
                        pageRefs.current[
                          pageNumber
                        ] = element;
                      }}
                      className="
                        mb-5
                        shrink-0
                        last:mb-0
                      "
                      style={{
                        width:
                          pageWidth,

                        /**
                         * Center only when
                         * the page fits.
                         */
                        marginLeft:
                          isZoomed
                            ? 0
                            : "auto",

                        marginRight:
                          isZoomed
                            ? 0
                            : "auto",
                      }}
                    >
                      <PdfPage
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
                          ] = element;
                        }}
                      />
                    </div>
                  );
                }
              )}
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
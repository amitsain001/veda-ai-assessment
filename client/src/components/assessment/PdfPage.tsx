import {
  useMemo,
} from "react";

import {
  Page,
} from "react-pdf";

import type {
  AnswerRegion,
} from "@/types/assessment";

import AnswerHighlight from "./AnswerHighlight";

/**
 * Props for one PDF page.
 */
interface PdfPageProps {
  /**
   * 1-based page number.
   */
  pageNumber: number;

  /**
   * Width at which PDF.js should render the page.
   */
  width: number;

  /**
   * Regions belonging to the currently
   * selected answer on this page.
   */
  regions: AnswerRegion[];

  /**
   * DOM ref used for automatic navigation.
   */
  pageRef?: (
    element: HTMLDivElement | null
  ) => void;
}

/**
 * Render one PDF page with optional
 * answer highlights.
 */
export default function PdfPage({
  pageNumber,
  width,
  regions,
  pageRef,
}: PdfPageProps) {
  /**
   * The page container acts as the coordinate
   * system for our absolute highlight overlays.
   */
  const highlightRegions =
    useMemo(
      () =>
        regions.filter(
          (region) =>
            region.page ===
            pageNumber
        ),
      [
        regions,
        pageNumber,
      ]
    );

  return (
    <div
      ref={pageRef}
      data-page={pageNumber}
      className="
        relative
        mx-auto
        mb-6
        w-fit
        bg-white
        shadow-lg
      "
    >
      {/* 
        PDF.js renders the actual PDF page.
      */}
      <Page
        pageNumber={pageNumber}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />

      {/*
        Overlay answer regions above the PDF page.
      */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
        "
      >
        {highlightRegions.map(
          (
            region,
            index
          ) => (
            <AnswerHighlight
              key={`${pageNumber}-${index}`}
              box={region.box}
              pageWidth={
                width
              }
              pageHeight={0}
            />
          )
        )}
      </div>
    </div>
  );
}
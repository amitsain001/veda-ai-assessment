import type {
  AnswerBox,
} from "@/types/assessment";

/**
 * Props required to render one answer highlight.
 */
interface AnswerHighlightProps {
  /**
   * Gemini normalized coordinates.
   */
  box: AnswerBox;

  /**
   * Actual rendered PDF page width.
   */
  pageWidth: number;

  /**
   * Actual rendered PDF page height.
   */
  pageHeight: number;
}

/**
 * Render a highlight over the exact answer region.
 */
export default function AnswerHighlight({
  box,
  pageWidth,
  pageHeight,
}: AnswerHighlightProps) {
  /**
   * Gemini returns coordinates from 0–1000.
   *
   * Convert them into percentages.
   *
   * Example:
   *
   * xmin = 100
   *
   * 100 / 1000 = 10%
   */
  const left =
    `${box.xmin / 10}%`;

  const top =
    `${box.ymin / 10}%`;

  const width =
    `${(box.xmax - box.xmin) / 10}%`;

  const height =
    `${(box.ymax - box.ymin) / 10}%`;

  return (
    <div
      className="
        pointer-events-none
        absolute
        rounded-md
        border-2
        border-blue-500
        bg-blue-400/20
        shadow-[0_0_0_2px_rgba(59,130,246,0.15)]
      "
      style={{
        left,
        top,
        width,
        height,

        /**
         * These values are intentionally referenced
         * so the component knows the actual page size.
         *
         * The positioning itself uses percentages,
         * making the highlight responsive.
         */
        minWidth:
          pageWidth > 0
            ? undefined
            : 0,

        minHeight:
          pageHeight > 0
            ? undefined
            : 0,
      }}
    />
  );
}
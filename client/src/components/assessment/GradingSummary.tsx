import {
  CheckCircle2,
  CircleAlert,
  MinusCircle,
  Sparkles,
  XCircle,
} from "lucide-react";

import type {
  GradingResult,
} from "@/types/grading";

interface GradingSummaryProps {
  grading: GradingResult | null;
}

/**
 * Complete AI grading summary.
 *
 * Displays:
 * - Overall score
 * - Percentage
 * - Answered / unanswered
 * - Correct / partially correct / incorrect
 * - AI confidence
 * - Overall feedback
 */
export default function GradingSummary({
  grading,
}: GradingSummaryProps) {
  /**
   * Grading has not been generated yet.
   */
  if (!grading) {
    return (
      <section
        className="
          w-full
          min-w-0
          rounded-xl
          border
          bg-white
          p-4
          shadow-sm
          sm:p-5
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <Sparkles
            className="
              h-5
              w-5
              shrink-0
              text-slate-700
            "
          />

          <h2
            className="
              text-base
              font-semibold
              text-slate-900
            "
          >
            AI Assessment Grading
          </h2>
        </div>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-muted-foreground
          "
        >
          Generate AI grading to see the
          assessment statistics, scores,
          confidence and feedback.
        </p>
      </section>
    );
  }

  /**
   * Calculate average AI confidence.
   */
  const confidenceValues =
    grading.questionResults
      .map(
        (result) =>
          result.confidence
      )
      .filter(
        (value) =>
          typeof value === "number" &&
          Number.isFinite(value)
      );

  const averageConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        confidenceValues.length
      : 0;

  const confidencePercentage =
    Math.round(
      Math.max(
        0,
        Math.min(
          1,
          averageConfidence
        )
      ) * 100
    );

  /**
   * Keep percentage inside
   * the valid 0–100 range.
   */
  const percentage = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        grading.percentage
      )
    )
  );

  /**
   * Calculate score percentage
   * separately for the progress bar.
   */
  const scorePercentage =
    grading.maxScore > 0
      ? Math.round(
          Math.max(
            0,
            Math.min(
              100,
              (grading.totalScore /
                grading.maxScore) *
                100
            )
          )
        )
      : 0;

  return (
    <section
      className="
        w-full
        min-w-0
        rounded-xl
        border
        bg-white
        p-4
        shadow-sm
        sm:p-5
      "
    >
      {/* =================================================
          HEADER
          ================================================= */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-2
        "
      >
        <Sparkles
          className="
            h-5
            w-5
            shrink-0
            text-slate-700
          "
        />

        <div className="min-w-0">
          <h2
            className="
              text-base
              font-semibold
              text-slate-900
            "
          >
            AI Assessment Grading
          </h2>

          <p
            className="
              mt-0.5
              text-xs
              text-muted-foreground
            "
          >
            Overall assessment performance
          </p>
        </div>
      </div>

      {/* =================================================
          OVERALL SCORE
          ================================================= */}

      <div
        className="
          mt-5
          rounded-xl
          bg-slate-50
          p-4
          text-center
          sm:p-5
        "
      >
        <p
          className="
            text-xs
            font-medium
            uppercase
            tracking-wide
            text-muted-foreground
          "
        >
          Overall Score
        </p>

        <div
          className="
            mt-1
            flex
            items-baseline
            justify-center
            gap-1
          "
        >
          <span
            className="
              text-4xl
              font-bold
              tracking-tight
              text-slate-900
              sm:text-5xl
            "
          >
            {grading.totalScore}
          </span>

          <span
            className="
              text-sm
              text-muted-foreground
              sm:text-base
            "
          >
            / {grading.maxScore}
          </span>
        </div>

        <p
          className="
            mt-1
            text-sm
            font-medium
            text-slate-600
          "
        >
          {percentage}%
        </p>

        {/* Score progress */}
        <div
          className="
            mx-auto
            mt-4
            h-2
            w-full
            max-w-sm
            overflow-hidden
            rounded-full
            bg-slate-200
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-slate-900
              transition-all
              duration-500
            "
            style={{
              width:
                `${scorePercentage}%`,
            }}
          />
        </div>
      </div>

      {/* =================================================
          STATISTICS
          ================================================= */}

      <div
        className="
          mt-5
          grid
          grid-cols-2
          gap-2.5
          sm:grid-cols-2
          sm:gap-3
          lg:grid-cols-4
        "
      >
        {/* Answered */}
        <StatCard
          icon={
            <CheckCircle2
              className="h-4 w-4"
            />
          }
          label="Answered"
          value={
            grading.answeredQuestions
          }
        />

        {/* Unanswered */}
        <StatCard
          icon={
            <CircleAlert
              className="h-4 w-4"
            />
          }
          label="Unanswered"
          value={
            grading.unansweredQuestions
          }
        />

        {/* Correct */}
        <StatCard
          icon={
            <CheckCircle2
              className="h-4 w-4"
            />
          }
          label="Correct"
          value={
            grading.correctQuestions
          }
        />

        {/* Incorrect */}
        <StatCard
          icon={
            <XCircle
              className="h-4 w-4"
            />
          }
          label="Incorrect"
          value={
            grading.incorrectQuestions
          }
        />
      </div>

      {/* =================================================
          PARTIALLY CORRECT
          ================================================= */}

      <div
        className="
          mt-3
          flex
          items-center
          justify-between
          gap-3
          rounded-lg
          border
          px-4
          py-3
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
          "
        >
          <MinusCircle
            className="
              h-4
              w-4
              shrink-0
              text-slate-500
            "
          />

          <span
            className="
              truncate
              text-sm
              text-slate-700
            "
          >
            Partially Correct
          </span>
        </div>

        <span
          className="
            shrink-0
            font-semibold
            text-slate-900
          "
        >
          {
            grading.partiallyCorrectQuestions
          }
        </span>
      </div>

      {/* =================================================
          AI CONFIDENCE
          ================================================= */}

      <div
        className="
          mt-5
          rounded-xl
          border
          bg-slate-50
          p-4
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div className="min-w-0">
            <span
              className="
                text-sm
                font-medium
                text-slate-700
              "
            >
              AI Confidence
            </span>

            <p
              className="
                mt-0.5
                text-xs
                text-muted-foreground
              "
            >
              Average confidence across
              evaluated questions
            </p>
          </div>

          <span
            className="
              shrink-0
              text-sm
              font-semibold
              text-slate-900
            "
          >
            {confidencePercentage}%
          </span>
        </div>

        <div
          className="
            mt-3
            h-2
            w-full
            overflow-hidden
            rounded-full
            bg-slate-200
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-slate-900
              transition-all
              duration-500
            "
            style={{
              width:
                `${confidencePercentage}%`,
            }}
          />
        </div>
      </div>

      {/* =================================================
          OVERALL FEEDBACK
          ================================================= */}

      {grading.overallFeedback && (
        <div
          className="
            mt-5
            min-w-0
            rounded-xl
            border
            bg-slate-50
            p-4
            sm:p-5
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <Sparkles
              className="
                h-4
                w-4
                shrink-0
                text-slate-700
              "
            />

            <h3
              className="
                text-sm
                font-semibold
                text-slate-900
              "
            >
              Overall AI Feedback
            </h3>
          </div>

          <div
            className="
              mt-3
              max-h-87.5
              overflow-y-auto
              overflow-x-hidden
            "
          >
            <p
              className="
                whitespace-pre-wrap
                wrap-break-word
                text-sm
                leading-6
                text-slate-700
              "
            >
              {grading.overallFeedback}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Small reusable statistics card.
 */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-lg
        border
        p-3
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-2
        "
      >
        <span
          className="
            shrink-0
            text-slate-500
          "
        >
          {icon}
        </span>

        <span
          className="
            truncate
            text-xs
            text-muted-foreground
          "
        >
          {label}
        </span>
      </div>

      <p
        className="
          mt-2
          text-xl
          font-semibold
          text-slate-900
        "
      >
        {value}
      </p>
    </div>
  );
}
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

export default function GradingSummary({
  grading,
}: GradingSummaryProps) {
  /**
   * No grading generated yet.
   */
  if (!grading) {
    return (
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-950">
              AI Assessment Grading
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Generate AI grading to see scores,
              confidence and detailed feedback.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /**
   * Average confidence.
   */
  const confidenceValues =
    grading.questionResults
      .map(
        (result) => result.confidence
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
        ) / confidenceValues.length
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
   * Overall percentage.
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
   * Score percentage.
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
    <section className="w-full min-w-0 space-y-4">
      {/* =====================================================
          AI GRADING HEADER
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-950">
                AI Grading
              </h2>

              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700 ring-1 ring-green-100">
                Complete
              </span>
            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Overall assessment performance
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          SCORE CARD
      ===================================================== */}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-orange-50" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Question Score
              </p>

              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-[-0.04em] text-slate-950">
                  {grading.totalScore}
                </span>

                <span className="text-sm font-medium text-slate-400">
                  / {grading.maxScore}
                </span>
              </div>

              <p className="mt-1 text-xs font-medium text-slate-500">
                {percentage}% overall performance
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-orange-500 transition-all duration-500"
              style={{
                width: `${scorePercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          QUICK STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={
            <CheckCircle2 className="h-4 w-4" />
          }
          label="Answered"
          value={grading.answeredQuestions}
          iconClass="bg-green-50 text-green-600"
        />

        <StatCard
          icon={
            <CircleAlert className="h-4 w-4" />
          }
          label="Unanswered"
          value={grading.unansweredQuestions}
          iconClass="bg-orange-50 text-orange-500"
        />

        <StatCard
          icon={
            <CheckCircle2 className="h-4 w-4" />
          }
          label="Correct"
          value={grading.correctQuestions}
          iconClass="bg-green-50 text-green-600"
        />

        <StatCard
          icon={
            <XCircle className="h-4 w-4" />
          }
          label="Incorrect"
          value={grading.incorrectQuestions}
          iconClass="bg-red-50 text-red-500"
        />
      </div>

      {/* =====================================================
          PARTIALLY CORRECT
      ===================================================== */}

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <MinusCircle className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700">
              Partially Correct
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Needs some improvement
            </p>
          </div>
        </div>

        <span className="text-lg font-bold text-slate-950">
          {grading.partiallyCorrectQuestions}
        </span>
      </div>

      {/* =====================================================
          AI CONFIDENCE
      ===================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
              <Sparkles className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">
                AI Confidence
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Average confidence across answers
              </p>
            </div>
          </div>

          <span className="text-lg font-bold text-slate-950">
            {confidencePercentage}%
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{
              width: `${confidencePercentage}%`,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between text-[9px] font-medium text-slate-400">
          <span>Low confidence</span>
          <span>High confidence</span>
        </div>
      </div>

      {/* =====================================================
          OVERALL FEEDBACK
      ===================================================== */}

      {grading.overallFeedback && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
              <Sparkles className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Overall AI Feedback
              </h3>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Summary of assessment performance
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="whitespace-pre-wrap wrap-break-word text-xs leading-6 text-slate-600">
              {grading.overallFeedback}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * =========================================================
 * STAT CARD
 * =========================================================
 */

function StatCard({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconClass: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          {icon}
        </span>

        <span className="text-xl font-bold text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-3 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}
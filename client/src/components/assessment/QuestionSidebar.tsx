import {
  CheckCircle2,
  CircleAlert,
  FileText,
} from "lucide-react";

import type {
  QuestionAnswerMapping,
} from "@/types/assessment";

interface QuestionSidebarProps {
  mappings: QuestionAnswerMapping[];

  selectedQuestion: string;

  onSelectQuestion: (
    questionNumber: string
  ) => void;
}

export default function QuestionSidebar({
  mappings,
  selectedQuestion,
  onSelectQuestion,
}: QuestionSidebarProps) {
  const answeredCount =
    mappings.filter(
      (item) =>
        item.status === "answered"
    ).length;

  const unansweredCount =
    mappings.length - answeredCount;

  const progress =
    mappings.length > 0
      ? Math.round(
          (answeredCount /
            mappings.length) *
            100
        )
      : 0;

  return (
    <aside className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-white">
      {/* =========================================
          HEADER
      ========================================== */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-950">
                Questions
              </h2>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                {mappings.length}
              </span>
            </div>

            <p className="mt-1 text-[10px] leading-4 text-slate-400">
              Select a question to review
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-bold text-orange-500">
              {progress}%
            </p>

            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              complete
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        {/* Statistics */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-2 py-1.5 text-[9px] font-semibold text-green-700">
            <CheckCircle2 className="h-3 w-3" />

            <span>
              {answeredCount} answered
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-2 py-1.5 text-[9px] font-semibold text-orange-600">
            <CircleAlert className="h-3 w-3" />

            <span>
              {unansweredCount} pending
            </span>
          </div>
        </div>
      </div>

      {/* =========================================
          QUESTION LIST
      ========================================== */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2.5 sm:p-3">
        {mappings.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="h-5 w-5" />
            </div>

            <p className="mt-3 text-xs font-bold text-slate-800">
              No questions found
            </p>

            <p className="mt-1 max-w-[210px] text-[10px] leading-5 text-slate-400">
              No extracted questions are
              available for this assessment.
            </p>
          </div>
        ) : (
          mappings.map((mapping) => {
            const isSelected =
              mapping.questionNumber ===
              selectedQuestion;

            const isAnswered =
              mapping.status ===
              "answered";

            return (
              <button
                key={mapping.questionNumber}
                type="button"
                onClick={() =>
                  onSelectQuestion(
                    mapping.questionNumber
                  )
                }
                aria-current={
                  isSelected
                    ? "true"
                    : undefined
                }
                className={`
                  group relative mb-1.5 flex
                  min-h-12 w-full min-w-0
                  items-center gap-2.5
                  overflow-hidden rounded-xl
                  border p-2.5 text-left
                  transition-all duration-150
                  last:mb-0
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-orange-400
                  focus-visible:ring-offset-1
                  active:scale-[0.99]

                  ${
                    isSelected
                      ? "border-orange-200 bg-orange-50/70 shadow-[0_3px_12px_rgba(249,115,22,0.08)]"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                  }
                `}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-orange-500" />
                )}

                {/* Status icon */}
                <div
                  className={`
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-lg transition-colors

                    ${
                      isAnswered
                        ? "bg-green-50 text-green-600"
                        : "bg-orange-50 text-orange-500"
                    }

                    ${
                      isSelected
                        ? isAnswered
                          ? "bg-green-100"
                          : "bg-orange-100"
                        : ""
                    }
                  `}
                >
                  {isAnswered ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <CircleAlert className="h-4 w-4" />
                  )}
                </div>

                {/* Question number */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`
                      truncate text-xs font-bold
                      ${
                        isSelected
                          ? "text-slate-950"
                          : "text-slate-800"
                      }
                    `}
                  >
                    Question{" "}
                    {mapping.questionNumber}
                  </p>

                  <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                    {isAnswered
                      ? "Answer available"
                      : "No answer found"}
                  </p>
                </div>

                {/* Status */}
                <span
                  className={`
                    shrink-0 rounded-full
                    px-2 py-1 text-[8px]
                    font-bold uppercase
                    tracking-wide

                    ${
                      isAnswered
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-600"
                    }
                  `}
                >
                  {isAnswered
                    ? "Done"
                    : "Pending"}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* =========================================
          FOOTER
      ========================================== */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3.5 sm:px-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Assessment progress
          </span>

          <span className="text-[10px] font-bold text-slate-700">
            {answeredCount}/{mappings.length}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{
              width:
                mappings.length > 0
                  ? `${
                      (answeredCount /
                        mappings.length) *
                      100
                    }%`
                  : "0%",
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[8px] font-medium text-slate-400">
          <span>
            {answeredCount} answered
          </span>

          <span>
            {unansweredCount} remaining
          </span>
        </div>
      </div>
    </aside>
  );
}
import {
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

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

/**
 * Left-side question navigation.
 *
 * Phase 8 improvements:
 * - Proper scrolling
 * - Responsive width
 * - Empty state
 * - Better selected state
 * - Answered/unanswered statistics
 * - Better touch targets
 */
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
    mappings.length -
    answeredCount;

  return (
    <aside
      className="
        flex
        h-full
        min-h-0
        min-w-0
        w-full
        flex-col
        overflow-hidden
        bg-white
      "
    >
      {/* =================================================
          HEADER
          ================================================= */}

      <div
        className="
          shrink-0
          border-b
          px-4
          py-3
          sm:px-5
          sm:py-4
        "
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-3
          "
        >
          <div className="min-w-0">
            <h2
              className="
                text-base
                font-semibold
                text-slate-900
                sm:text-lg
              "
            >
              Questions
            </h2>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-muted-foreground
                sm:text-sm
              "
            >
              Select a question to
              view its answer.
            </p>
          </div>

          {/* Question count */}
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {mappings.length}
          </Badge>
        </div>

        {/* Quick statistics */}
        <div
          className="
            mt-3
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          <div
            className="
              flex
              items-center
              gap-1.5
              rounded-md
              bg-green-50
              px-2
              py-1
              text-xs
              text-green-700
            "
          >
            <CheckCircle2
              className="
                h-3.5
                w-3.5
              "
            />

            <span>
              {answeredCount} answered
            </span>
          </div>

          <div
            className="
              flex
              items-center
              gap-1.5
              rounded-md
              bg-orange-50
              px-2
              py-1
              text-xs
              text-orange-700
            "
          >
            <CircleAlert
              className="
                h-3.5
                w-3.5
              "
            />

            <span>
              {unansweredCount} unanswered
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          SCROLLABLE QUESTION LIST
          ================================================= */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          p-2.5
          sm:p-3
        "
      >
        {mappings.length === 0 ? (
          /* ---------------------------------------------
             EMPTY STATE
             --------------------------------------------- */

          <div
            className="
              flex
              min-h-40
              flex-col
              items-center
              justify-center
              px-5
              text-center
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-slate-100
              "
            >
              <FileTextIcon />
            </div>

            <p
              className="
                mt-3
                text-sm
                font-medium
                text-slate-800
              "
            >
              No questions found
            </p>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-slate-500
              "
            >
              No extracted questions are
              available for this assessment.
            </p>
          </div>
        ) : (
          mappings.map(
            (mapping) => {
              const isSelected =
                mapping.questionNumber ===
                selectedQuestion;

              const isAnswered =
                mapping.status ===
                "answered";

              return (
                <button
                  key={
                    mapping.questionNumber
                  }
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
                    mb-2
                    flex
                    min-h-12
                    w-full
                    min-w-0
                    items-center
                    gap-2.5
                    rounded-lg
                    border
                    p-2.5
                    text-left
                    transition-all
                    duration-150
                    last:mb-0

                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-slate-400
                    focus-visible:ring-offset-1

                    active:scale-[0.99]

                    ${
                      isSelected
                        ? `
                          border-blue-500
                          bg-blue-50
                          shadow-sm
                        `
                        : `
                          border-transparent
                          hover:border-slate-200
                          hover:bg-slate-50
                        `
                    }
                  `}
                >
                  {/* Status icon */}
                  {isAnswered ? (
                    <CheckCircle2
                      className="
                        h-5
                        w-5
                        shrink-0
                        text-green-600
                      "
                    />
                  ) : (
                    <CircleAlert
                      className="
                        h-5
                        w-5
                        shrink-0
                        text-orange-500
                      "
                    />
                  )}

                  {/* Question number */}
                  <span
                    className="
                      min-w-0
                      flex-1
                      truncate
                      text-sm
                      font-semibold
                      text-slate-900
                      sm:text-base
                    "
                  >
                    {mapping.questionNumber}
                  </span>

                  {/* Status */}
                  <Badge
                    variant={
                      isAnswered
                        ? "default"
                        : "secondary"
                    }
                    className="
                      shrink-0
                      text-[10px]
                      sm:text-xs
                    "
                  >
                    <span className="hidden sm:inline">
                      {isAnswered
                        ? "Answered"
                        : "Unanswered"}
                    </span>

                    <span className="sm:hidden">
                      {isAnswered
                        ? "Done"
                        : "Pending"}
                    </span>
                  </Badge>
                </button>
              );
            }
          )
        )}
      </div>

      {/* =================================================
          FOOTER SUMMARY
          ================================================= */}

      <div
        className="
          shrink-0
          border-t
          bg-white
          px-4
          py-3
          sm:p-4
        "
      >
        {/* Progress bar */}
        <div
          className="
            mb-2
            h-1.5
            w-full
            overflow-hidden
            rounded-full
            bg-slate-100
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-green-500
              transition-all
              duration-300
            "
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

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            text-xs
          "
        >
          <span
            className="
              text-muted-foreground
            "
          >
            Assessment progress
          </span>

          <span
            className="
              shrink-0
              font-semibold
              text-slate-800
            "
          >
            {answeredCount}/
            {mappings.length}
          </span>
        </div>
      </div>
    </aside>
  );
}

/**
 * Small inline icon for the empty state.
 *
 * Kept local so we don't need another
 * dependency/import just for this icon.
 */
function FileTextIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="
        h-5
        w-5
        text-slate-500
      "
      aria-hidden="true"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}
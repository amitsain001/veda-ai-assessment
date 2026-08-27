import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { useAssessment } from "@/context/AssessmentContext";

import type { AssessmentData } from "@/types/assessment";

type Mapping =
  AssessmentData["mapping"]["mappings"][number];

type Answer =
  AssessmentData["answers"][number];

interface AnswerPanelProps {
  mapping: Mapping;
  answer: Answer | null;
}

/**
 * Convert a 0–1 confidence value
 * into a percentage.
 */
function formatConfidence(
  value: number | null | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${Math.round(
    Math.max(
      0,
      Math.min(1, value)
    ) * 100
  )}%`;
}

/**
 * Convert a grading status into
 * a readable label.
 */
function formatStatus(
  status: string
): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

/**
 * Get styling for grading status.
 */
function getStatusClasses(
  status: string
): string {
  switch (status) {
    case "correct":
      return "border-green-200 bg-green-50 text-green-700";

    case "partially_correct":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";

    case "incorrect":
      return "border-red-200 bg-red-50 text-red-700";

    case "unanswered":
      return "border-orange-200 bg-orange-50 text-orange-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

/**
 * Main extracted-answer panel.
 */
export default function AnswerPanel({
  mapping,
  answer,
}: AnswerPanelProps) {
  const {
    grading,
    isGrading,
    gradingError,
    generateGrading,
  } = useAssessment();

  /**
   * Extracted answer text.
   */
  const answerText =
    answer?.answerText?.trim() ?? "";

  const hasAnswer =
    answerText.length > 0;

  /**
   * Number of answer regions.
   */
  const regionCount =
    answer?.regions?.length ?? 0;

  /**
   * Mapping information.
   */
  const questionNumber =
    mapping.questionNumber;

  const matchType =
    mapping.matchType ?? "unmatched";

  const mappingConfidence =
    formatConfidence(
      mapping.confidence
    );

  /**
   * Find grading for current question.
   */
  const questionGrading =
    grading?.questionResults.find(
      (result) =>
        result.questionNumber ===
        questionNumber
    );

  return (
    <div
      className="
        min-w-0
        space-y-5
        pb-6
      "
    >
      {/* =================================================
          QUESTION HEADER
          ================================================= */}

      <div
        className="
          flex
          min-w-0
          items-start
          justify-between
          gap-3
        "
      >
        <div className="min-w-0">
          <p
            className="
              text-xs
              font-medium
              uppercase
              tracking-wide
              text-muted-foreground
            "
          >
            Question
          </p>

          <h2
            className="
              mt-1
              truncate
              text-xl
              font-semibold
              text-slate-900
            "
          >
            {questionNumber}
          </h2>
        </div>

        {/* Answer status */}
        {hasAnswer ? (
          <div
            className="
              flex
              shrink-0
              items-center
              gap-1.5
              rounded-md
              border
              border-green-200
              bg-green-50
              px-2.5
              py-1.5
              text-xs
              font-medium
              text-green-700
            "
          >
            <CheckCircle2
              className="h-3.5 w-3.5"
            />

            <span>Answered</span>
          </div>
        ) : (
          <div
            className="
              flex
              shrink-0
              items-center
              gap-1.5
              rounded-md
              border
              border-orange-200
              bg-orange-50
              px-2.5
              py-1.5
              text-xs
              font-medium
              text-orange-700
            "
          >
            <CircleAlert
              className="h-3.5 w-3.5"
            />

            <span>Unanswered</span>
          </div>
        )}
      </div>

      {/* =================================================
          MAPPING INFORMATION
          ================================================= */}

      <div
        className="
          flex
          min-w-0
          flex-wrap
          gap-2
        "
      >
        <span
          className="
            max-w-full
            rounded-md
            bg-slate-100
            px-3
            py-1.5
            text-xs
            font-medium
            text-slate-700
          "
        >
          Match:{" "}
          <span className="font-semibold">
            {String(matchType)}
          </span>
        </span>

        <span
          className="
            rounded-md
            bg-slate-100
            px-3
            py-1.5
            text-xs
            font-medium
            text-slate-700
          "
        >
          Confidence:{" "}
          <span className="font-semibold">
            {mappingConfidence}
          </span>
        </span>

        <span
          className="
            rounded-md
            bg-slate-100
            px-3
            py-1.5
            text-xs
            font-medium
            text-slate-700
          "
        >
          {regionCount}{" "}
          {regionCount === 1
            ? "region"
            : "regions"}
        </span>
      </div>

      {/* =================================================
          EXTRACTED ANSWER
          ================================================= */}

      <section className="min-w-0">
        <h3
          className="
            text-sm
            font-semibold
            text-slate-900
          "
        >
          Extracted Answer
        </h3>

        {hasAnswer ? (
          <div
            className="
              mt-3
              max-h-105
              overflow-y-auto
              overflow-x-hidden
              rounded-xl
              border
              bg-slate-50
              p-4
              sm:p-5
            "
          >
            <p
              className="
                whitespace-pre-wrap
                wrap-break-word
                text-sm
                leading-7
                text-slate-700
              "
            >
              {answerText}
            </p>
          </div>
        ) : (
          <div
            className="
              mt-3
              rounded-xl
              border
              bg-slate-50
              p-6
              text-center
              sm:p-8
            "
          >
            <CircleAlert
              className="
                mx-auto
                h-8
                w-8
                text-slate-400
              "
            />

            <p
              className="
                mt-3
                font-medium
                text-slate-700
              "
            >
              No answer detected
            </p>

            <p
              className="
                mt-1
                text-sm
                text-muted-foreground
              "
            >
              This question appears to be
              unanswered.
            </p>
          </div>
        )}
      </section>

      {/* =================================================
          MAPPING CONFIDENCE
          ================================================= */}

      <section
        className="
          rounded-xl
          border
          bg-white
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
          <div
            className="
              flex
              min-w-0
              items-center
              gap-2
            "
          >
            <Target
              className="
                h-4
                w-4
                shrink-0
                text-slate-600
              "
            />

            <div className="min-w-0">
              <p
                className="
                  text-sm
                  font-medium
                  text-slate-900
                "
              >
                Mapping Confidence
              </p>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-muted-foreground
                "
              >
                Confidence in the question-answer
                mapping
              </p>
            </div>
          </div>

          <span
            className="
              shrink-0
              text-sm
              font-semibold
              text-slate-900
            "
          >
            {mappingConfidence}
          </span>
        </div>

        {/* Confidence progress */}
        <div
          className="
            mt-3
            h-2
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
              bg-slate-700
              transition-all
              duration-300
            "
            style={{
              width:
                typeof mapping.confidence ===
                  "number"
                  ? `${Math.max(
                      0,
                      Math.min(
                        1,
                        mapping.confidence
                      )
                    ) * 100}%`
                  : "0%",
            }}
          />
        </div>
      </section>

      {/* =================================================
          AI GRADING
          ================================================= */}

      <section
        className="
          min-w-0
          rounded-xl
          border
          bg-white
          p-4
          sm:p-5
        "
      >
        {/* Grading header */}
        <div
          className="
            flex
            min-w-0
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
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
            <Sparkles
              className="
                h-4
                w-4
                shrink-0
                text-slate-700
              "
            />

            <div className="min-w-0">
              <h3
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                "
              >
                AI Grading
              </h3>

              <p
                className="
                  mt-0.5
                  text-xs
                  leading-5
                  text-muted-foreground
                "
              >
                Evaluate the complete assessment
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            onClick={
              generateGrading
            }
            disabled={isGrading}
          >
            {isGrading ? (
              <>
                <Loader2
                  className="
                    mr-2
                    h-4
                    w-4
                    animate-spin
                  "
                />

                Grading...
              </>
            ) : (
              <>
                <Sparkles
                  className="
                    mr-2
                    h-4
                    w-4
                  "
                />

                {grading
                  ? "Regenerate"
                  : "Grade Assessment"}
              </>
            )}
          </Button>
        </div>

        {/* =================================================
            GRADING ERROR
            ================================================= */}

        {gradingError && (
          <div
            className="
              mt-4
              wrap-break-word
              rounded-lg
              border
              border-red-200
              bg-red-50
              p-3
              text-sm
              leading-6
              text-red-700
            "
          >
            {gradingError}
          </div>
        )}

        {/* =================================================
            QUESTION GRADING RESULT
            ================================================= */}

        {questionGrading && (
          <div
            className="
              mt-5
              min-w-0
              space-y-4
            "
          >
            {/* Score */}
            <div
              className="
                rounded-xl
                bg-slate-50
                p-4
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-muted-foreground
                    "
                  >
                    Question Score
                  </p>

                  <p
                    className="
                      mt-1
                      text-2xl
                      font-bold
                      text-slate-900
                    "
                  >
                    {questionGrading.score}

                    <span
                      className="
                        text-base
                        font-normal
                        text-muted-foreground
                      "
                    >
                      {" "}
                      /{" "}
                      {questionGrading.maxScore}
                    </span>
                  </p>
                </div>

                {/* Status */}
                <span
                  className={`
                    rounded-md
                    border
                    px-3
                    py-1.5
                    text-xs
                    font-medium

                    ${getStatusClasses(
                      questionGrading.status
                    )}
                  `}
                >
                  {formatStatus(
                    questionGrading.status
                  )}
                </span>
              </div>

              {/* Score progress */}
              <div
                className="
                  mt-4
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-white
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-slate-700
                    transition-all
                    duration-500
                  "
                  style={{
                    width:
                      questionGrading.maxScore >
                      0
                        ? `${Math.max(
                            0,
                            Math.min(
                              100,
                              (questionGrading.score /
                                questionGrading.maxScore) *
                                100
                            )
                          )}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            {/* AI confidence */}
            <div
              className="
                rounded-lg
                border
                px-4
                py-3
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
                <span
                  className="
                    text-sm
                    text-slate-600
                  "
                >
                  AI confidence
                </span>

                <span
                  className="
                    shrink-0
                    text-sm
                    font-semibold
                    text-slate-900
                  "
                >
                  {formatConfidence(
                    questionGrading.confidence
                  )}
                </span>
              </div>

              <div
                className="
                  mt-2
                  h-1.5
                  overflow-hidden
                  rounded-full
                  bg-slate-100
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-slate-500
                    transition-all
                  "
                  style={{
                    width:
                      typeof questionGrading.confidence ===
                        "number"
                        ? `${Math.max(
                            0,
                            Math.min(
                              1,
                              questionGrading.confidence
                            )
                          ) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            {/* AI feedback */}
            {questionGrading.feedback && (
              <div className="min-w-0">
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-muted-foreground
                  "
                >
                  AI Feedback
                </p>

                <div
                  className="
                    mt-2
                    max-h-75
                    overflow-y-auto
                    overflow-x-hidden
                    rounded-lg
                    bg-slate-50
                    p-4
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
                    {questionGrading.feedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            NOT GRADED
            ================================================= */}

        {!grading &&
          !gradingError && (
            <div
              className="
                mt-4
                rounded-lg
                bg-slate-50
                p-3
              "
            >
              <p
                className="
                  text-sm
                  leading-6
                  text-muted-foreground
                "
              >
                AI grading is optional. Click
                {" "}
                <span className="font-medium">
                  Grade Assessment
                </span>
                {" "}
                to evaluate the answers.
              </p>
            </div>
          )}
      </section>
    </div>
  );
}
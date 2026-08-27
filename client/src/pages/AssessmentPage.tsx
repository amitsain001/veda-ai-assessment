import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BarChart3,
  FileText,
  List,
  MessageSquare,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  useAssessment,
} from "@/context/AssessmentContext";

import QuestionSidebar from "@/components/assessment/QuestionSidebar";

import AnswerPanel from "@/components/assessment/AnswerPanel";

import PdfViewer from "@/components/assessment/PdfViewer";

import GradingSummary from "@/components/assessment/GradingSummary";

/**
 * Mobile section.
 *
 * questions -> question navigation
 * sheet     -> PDF / image answer sheet
 * answer    -> extracted answer / AI grading
 */
type MobileView =
  | "questions"
  | "sheet"
  | "answer";

/**
 * Main assessment review screen.
 *
 * Phase 6:
 * - Question navigation
 * - PDF / image viewer
 * - Answer highlighting
 *
 * Phase 7:
 * - AI grading
 * - Statistics
 * - Confidence
 * - Feedback
 */
export default function AssessmentPage() {
  const {
    assessment,
    clearAssessment,
    grading,
  } = useAssessment();

  /**
   * Currently selected question.
   */
  const [
    selectedQuestion,
    setSelectedQuestion,
  ] = useState("");

  /**
   * Controls whether the grading summary
   * is displayed in the right panel.
   */
  const [
    showGradingSummary,
    setShowGradingSummary,
  ] = useState(false);

  /**
   * Mobile currently visible section.
   */
  const [
    mobileView,
    setMobileView,
  ] = useState<MobileView>(
    "questions"
  );

  /**
   * -------------------------------------------------------
   * SELECT FIRST QUESTION
   * -------------------------------------------------------
   */
  useEffect(() => {
    if (
      selectedQuestion === "" &&
      assessment &&
      assessment.mapping.mappings.length > 0
    ) {
      setSelectedQuestion(
        assessment.mapping.mappings[0]
          .questionNumber
      );
    }
  }, [
    assessment,
    selectedQuestion,
  ]);

  /**
   * -------------------------------------------------------
   * SELECTED MAPPING
   * -------------------------------------------------------
   */
  const selectedMapping =
    assessment?.mapping.mappings.find(
      (mapping) =>
        mapping.questionNumber ===
        selectedQuestion
    );

  /**
   * -------------------------------------------------------
   * SELECTED ANSWER
   * -------------------------------------------------------
   */
  const selectedAnswer =
    selectedMapping &&
    selectedMapping.answerIndex !== null &&
    assessment
      ? assessment.answers[
          selectedMapping.answerIndex
        ] ?? null
      : null;

  /**
   * -------------------------------------------------------
   * SELECTED ANSWER REGIONS
   * -------------------------------------------------------
   */
  const selectedRegions =
    useMemo(() => {
      if (!selectedAnswer) {
        return [];
      }

      return selectedAnswer.regions;
    }, [
      selectedAnswer,
    ]);

  /**
   * -------------------------------------------------------
   * SELECTED ANSWER PAGE
   * -------------------------------------------------------
   */
  const selectedPage =
    selectedRegions.length > 0
      ? selectedRegions[0].page
      : 1;

  /**
   * -------------------------------------------------------
   * BACK BUTTON
   * -------------------------------------------------------
   */
  const handleBack = () => {
    clearAssessment();
  };

  /**
   * -------------------------------------------------------
   * TOGGLE GRADING SUMMARY
   * -------------------------------------------------------
   */
  const handleToggleGradingSummary =
    () => {
      setShowGradingSummary(
        (current) => !current
      );

      /**
       * On mobile, grading belongs
       * to the Answer section.
       */
      setMobileView("answer");
    };

  /**
   * -------------------------------------------------------
   * QUESTION SELECTION
   * -------------------------------------------------------
   */
  const handleSelectQuestion = (
    questionNumber: string
  ) => {
    /**
     * Selecting another question
     * should show its answer on mobile.
     */
    setShowGradingSummary(false);

    setSelectedQuestion(
      questionNumber
    );

    setMobileView("answer");
  };

  /**
   * -------------------------------------------------------
   * NO ASSESSMENT
   * -------------------------------------------------------
   */
  if (!assessment) {
    return (
      <div
        className="
          flex
          h-screen
          items-center
          justify-center
          bg-slate-50
        "
      >
        <div
          className="
            max-w-md
            px-6
            text-center
          "
        >
          <h1
            className="
              text-xl
              font-semibold
              text-slate-900
            "
          >
            No assessment loaded
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-muted-foreground
            "
          >
            Upload the question paper and
            answer sheet first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        flex
        h-screen
        min-h-0
        flex-col
        overflow-hidden
        bg-slate-50
      "
    >
      {/* =====================================================
          TOP NAVIGATION
          ===================================================== */}

      <header
        className="
          flex
          h-16
          min-h-16
          shrink-0
          items-center
          border-b
          bg-white
          px-2
          sm:px-5
        "
      >
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="shrink-0"
        >
          <ArrowLeft
            className="
              mr-2
              h-4
              w-4
            "
          />

          <span className="hidden sm:inline">
            Back
          </span>
        </Button>

        {/* Assessment information */}
        <div
          className="
            ml-1
            min-w-0
            flex-1
            sm:ml-4
          "
        >
          <h1
            className="
              truncate
              text-sm
              font-semibold
              text-slate-900
              sm:text-base
            "
          >
            Assessment Review
          </h1>

          <p
            className="
              max-w-37.5
              truncate
              text-[10px]
              text-muted-foreground
              sm:max-w-md
              sm:text-xs
            "
          >
            {assessment.answerSheet.name}
          </p>
        </div>

        {/* Header controls */}
        <div
          className="
            ml-1
            flex
            shrink-0
            items-center
            gap-1
            sm:ml-auto
            sm:gap-4
          "
        >
          {/* Desktop answered count */}
          <span
            className="
              hidden
              text-sm
              text-slate-600
              md:block
            "
          >
            {
              assessment.mapping.summary
                .answeredQuestions
            }
            /
            {
              assessment.mapping.summary
                .totalQuestions
            }{" "}
            answered
          </span>

          {/* Mobile answered count */}
          <span
            className="
              text-xs
              font-medium
              text-slate-600
              md:hidden
            "
          >
            {
              assessment.mapping.summary
                .answeredQuestions
            }
            /
            {
              assessment.mapping.summary
                .totalQuestions
            }
          </span>

          {/* Grading */}
          {grading && (
            <Button
              variant={
                showGradingSummary
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={
                handleToggleGradingSummary
              }
              className="
                shrink-0
                px-2
                sm:px-3
              "
            >
              <BarChart3
                className="
                  h-4
                  w-4
                  sm:mr-2
                "
              />

              <span className="hidden sm:inline">
                Grading
              </span>
            </Button>
          )}
        </div>
      </header>

      {/* =====================================================
          MOBILE NAVIGATION

          Only visible below md breakpoint.
          ===================================================== */}

      <nav
        className="
          grid
          shrink-0
          grid-cols-3
          border-b
          bg-white
          md:hidden
        "
      >
        {/* Questions */}
        <button
          type="button"
          onClick={() =>
            setMobileView("questions")
          }
          className={`
            flex
            min-h-12
            items-center
            justify-center
            gap-1.5
            border-r
            px-2
            text-xs
            font-medium
            transition-colors
            ${
              mobileView === "questions"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }
          `}
        >
          <List
            className="h-4 w-4"
          />

          Questions
        </button>

        {/* Sheet */}
        <button
          type="button"
          onClick={() =>
            setMobileView("sheet")
          }
          className={`
            flex
            min-h-12
            items-center
            justify-center
            gap-1.5
            border-r
            px-2
            text-xs
            font-medium
            transition-colors
            ${
              mobileView === "sheet"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }
          `}
        >
          <FileText
            className="h-4 w-4"
          />

          Sheet
        </button>

        {/* Answer */}
        <button
          type="button"
          onClick={() =>
            setMobileView("answer")
          }
          className={`
            flex
            min-h-12
            items-center
            justify-center
            gap-1.5
            px-2
            text-xs
            font-medium
            transition-colors
            ${
              mobileView === "answer"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500"
            }
          `}
        >
          <MessageSquare
            className="h-4 w-4"
          />

          Answer
        </button>
      </nav>

      {/* =====================================================
          MAIN ASSESSMENT AREA
          ===================================================== */}

      <main
        className="
          min-h-0
          flex-1

          overflow-hidden

          md:grid
          md:grid-cols-[minmax(220px,300px)_minmax(0,1fr)_minmax(300px,380px)]
        "
      >
        {/* ===================================================
            LEFT — QUESTION SIDEBAR
            =================================================== */}

        <section
          className={`
            h-full
            min-h-0
            w-full
            overflow-hidden
            bg-white

            ${
              mobileView === "questions"
                ? "block"
                : "hidden"
            }

            md:block
            md:border-r
          `}
        >
          <QuestionSidebar
            mappings={
              assessment.mapping.mappings
            }

            selectedQuestion={
              selectedQuestion
            }

            onSelectQuestion={
              handleSelectQuestion
            }
          />
        </section>

        {/* ===================================================
            CENTER — PDF / IMAGE VIEWER
            =================================================== */}

        <section
          className={`
            h-full
            min-h-0
            w-full
            overflow-hidden

            ${
              mobileView === "sheet"
                ? "block"
                : "hidden"
            }

            md:block
          `}
        >
          <PdfViewer
            file={
              assessment.answerSheet
            }

            regions={
              selectedRegions
            }

            selectedPage={
              selectedPage
            }
          />
        </section>

        {/* ===================================================
            RIGHT — ANSWER / GRADING PANEL
            =================================================== */}

        <section
          className={`
            h-full
            min-h-0
            w-full
            overflow-y-auto
            overflow-x-hidden
            bg-white
            p-4
            sm:p-5

            ${
              mobileView === "answer"
                ? "block"
                : "hidden"
            }

            md:block
            md:border-l
          `}
        >
          {showGradingSummary ? (
            /* -----------------------------------------------
               AI GRADING SUMMARY
               ----------------------------------------------- */

            <GradingSummary
              grading={
                grading
              }
            />
          ) : selectedMapping ? (
            /* -----------------------------------------------
               SELECTED ANSWER
               ----------------------------------------------- */

            <AnswerPanel
              mapping={
                selectedMapping
              }

              answer={
                selectedAnswer
              }
            />
          ) : (
            <div
              className="
                flex
                min-h-75
                w-full
                items-center
                justify-center
                px-5
                text-center
                text-sm
                text-muted-foreground
              "
            >
              Select a question.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
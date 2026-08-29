import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileText,
  List,
  MessageSquare,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAssessment } from "@/context/AssessmentContext";

import QuestionSidebar from "@/components/assessment/QuestionSidebar";
import AnswerPanel from "@/components/assessment/AnswerPanel";
import PdfViewer from "@/components/assessment/PdfViewer";
import GradingSummary from "@/components/assessment/GradingSummary";

type MobileView = "questions" | "sheet" | "answer";

export default function AssessmentPage() {
  const {
    assessment,
    clearAssessment,
    grading,
  } = useAssessment();

  const [
    selectedQuestion,
    setSelectedQuestion,
  ] = useState("");

  const [
    showGradingSummary,
    setShowGradingSummary,
  ] = useState(false);

  const [
    mobileView,
    setMobileView,
  ] = useState<MobileView>("questions");

  useEffect(() => {
    if (
      selectedQuestion === "" &&
      assessment &&
      assessment.mapping.mappings.length > 0
    ) {
      setSelectedQuestion(
        assessment.mapping.mappings[0].questionNumber
      );
    }
  }, [assessment, selectedQuestion]);

  const selectedMapping =
    assessment?.mapping.mappings.find(
      (mapping) =>
        mapping.questionNumber === selectedQuestion
    );

  const selectedAnswer =
    selectedMapping &&
    selectedMapping.answerIndex !== null &&
    assessment
      ? assessment.answers[
          selectedMapping.answerIndex
        ] ?? null
      : null;

  const selectedRegions = useMemo(() => {
    if (!selectedAnswer) {
      return [];
    }

    return selectedAnswer.regions;
  }, [selectedAnswer]);

  const selectedPage =
    selectedRegions.length > 0
      ? selectedRegions[0].page
      : 1;

  const handleBack = () => {
    clearAssessment();
  };

  const handleSelectQuestion = (
    questionNumber: string
  ) => {
    setShowGradingSummary(false);
    setSelectedQuestion(questionNumber);
    setMobileView("answer");
  };

  const handleToggleGradingSummary = () => {
    setShowGradingSummary((current) => !current);
    setMobileView("answer");
  };

  if (!assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <FileText className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
            No assessment loaded
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Upload the question paper and answer
            sheet first.
          </p>
        </div>
      </div>
    );
  }

  const answeredQuestions =
    assessment.mapping.summary.answeredQuestions;

  const totalQuestions =
    assessment.mapping.summary.totalQuestions;

  const unansweredQuestions =
    assessment.mapping.summary.unansweredQuestions;

  const answeredPercentage =
    totalQuestions > 0
      ? Math.round(
          (answeredQuestions /
            totalQuestions) *
            100
        )
      : 0;

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#f7f7f5] text-slate-900">
      {/* =========================================
          TOP HEADER
      ========================================== */}
      <header className="z-30 flex h-17 shrink-0 items-center border-b border-slate-200/90 bg-white/95 px-3 backdrop-blur sm:px-5 lg:px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mr-2 h-9 shrink-0 rounded-xl px-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-950 sm:mr-4 sm:px-3"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">
            Back
          </span>
        </Button>

        <div className="hidden items-center gap-3 border-r border-slate-200 pr-5 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>

          <div className="leading-none">
            <div className="text-sm font-bold tracking-tight text-slate-950">
              VedaAI
            </div>

            <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
              AI Teacher&apos;s Toolkit
            </div>
          </div>
        </div>

        <div className="ml-1 min-w-0 flex-1 sm:ml-5">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-950 sm:text-[15px]">
              Assessment Review
            </h1>

            <span className="hidden items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700 ring-1 ring-green-100 sm:inline-flex">
              <CheckCircle2 className="h-3 w-3" />
              Ready
            </span>
          </div>

          <p className="mt-0.5 max-w-45 truncate text-[10px] text-slate-400 sm:max-w-md sm:text-[11px]">
            {assessment.answerSheet.name}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 md:flex">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />

            <div className="leading-none">
              <p className="text-[11px] font-bold text-slate-800">
                {answeredQuestions}/{totalQuestions}
              </p>

              <p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-slate-400">
                Answered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <span className="text-[11px] font-bold text-slate-600">
              {answeredQuestions}/{totalQuestions}
            </span>
          </div>

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
              className={`h-9 rounded-xl px-2.5 sm:px-3 ${
                showGradingSummary
                  ? "bg-slate-950 text-white hover:bg-slate-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="h-4 w-4 sm:mr-1.5" />

              <span className="hidden sm:inline">
                Grading
              </span>
            </Button>
          )}
        </div>
      </header>

      {/* =========================================
          MOBILE NAV
      ========================================== */}
      <nav className="grid shrink-0 grid-cols-3 border-b border-slate-200 bg-white md:hidden">
        <MobileTab
          icon={<List />}
          label="Questions"
          active={mobileView === "questions"}
          onClick={() =>
            setMobileView("questions")
          }
          badge={totalQuestions}
        />

        <MobileTab
          icon={<FileText />}
          label="Answer Sheet"
          active={mobileView === "sheet"}
          onClick={() =>
            setMobileView("sheet")
          }
        />

        <MobileTab
          icon={<MessageSquare />}
          label="Answer"
          active={mobileView === "answer"}
          onClick={() =>
            setMobileView("answer")
          }
          badge={
            selectedMapping
              ? selectedMapping.questionNumber
              : undefined
          }
        />
      </nav>

      {/* =========================================
          WORKSPACE
      ========================================== */}
      <main className="min-h-0 flex-1 overflow-hidden p-0 md:p-3 lg:p-4">
        <div className="grid h-full min-h-0 overflow-hidden border-slate-200 bg-white md:grid-cols-[280px_minmax(0,1fr)_360px] md:rounded-[22px] md:border md:shadow-[0_10px_35px_rgba(15,23,42,0.06)] lg:grid-cols-[300px_minmax(0,1fr)_390px]">
          {/* LEFT — QUESTIONS */}
          <section
            className={`h-full min-h-0 w-full overflow-hidden bg-white ${
              mobileView === "questions"
                ? "block"
                : "hidden"
            } md:block md:border-r md:border-slate-200`}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="hidden shrink-0 border-b border-slate-100 px-5 py-4 md:block">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-950">
                        Questions
                      </h2>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                        {totalQuestions}
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-400">
                      Review each response
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] font-bold text-orange-500">
                      {answeredPercentage}%
                    </p>

                    <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-400">
                      complete
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-300"
                    style={{
                      width: `${answeredPercentage}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[9px] font-medium text-slate-400">
                  <span>
                    {answeredQuestions} answered
                  </span>

                  <span>
                    {unansweredQuestions} unanswered
                  </span>
                </div>
              </div>

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
            </div>
          </section>

          {/* CENTER — ANSWER SHEET */}
          <section
            className={`h-full min-h-0 w-full overflow-hidden bg-[#f1f3f5] ${
              mobileView === "sheet"
                ? "block"
                : "hidden"
            } md:block`}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="hidden h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:flex">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                    Answer Sheet
                  </span>
                </div>

                <span className="text-[9px] font-medium text-slate-400">
                  Page {selectedPage}
                </span>
              </div>

              <div className="min-h-0 flex-1">
                <PdfViewer
                  file={assessment.answerSheet}
                  regions={selectedRegions}
                  selectedPage={selectedPage}
                />
              </div>
            </div>
          </section>

          {/* RIGHT — ANSWER / GRADING */}
          <section
            className={`h-full min-h-0 w-full overflow-y-auto overflow-x-hidden bg-white ${
              mobileView === "answer"
                ? "block"
                : "hidden"
            } md:block md:border-l md:border-slate-200`}
          >
            {showGradingSummary ? (
              <div className="min-h-full bg-white">
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
                      <BarChart3 className="h-4 w-4" />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-slate-950">
                        AI Grading
                      </h2>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Assessment performance
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <GradingSummary
                    grading={grading}
                  />
                </div>
              </div>
            ) : selectedMapping ? (
              <div className="min-h-full">
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 px-1.5 text-[11px] font-bold text-white">
                          {selectedMapping.questionNumber}
                        </span>

                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-bold text-slate-950">
                            Question{" "}
                            {
                              selectedMapping.questionNumber
                            }
                          </h2>

                          <p className="mt-0.5 truncate text-[9px] text-slate-400">
                            Extracted answer & evaluation
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ring-1 ${
                        selectedMapping.status ===
                        "answered"
                          ? "bg-green-50 text-green-700 ring-green-100"
                          : "bg-orange-50 text-orange-600 ring-orange-100"
                      }`}
                    >
                      {selectedMapping.status ===
                      "answered"
                        ? "Answered"
                        : "Unanswered"}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <AnswerPanel
                    mapping={selectedMapping}
                    answer={selectedAnswer}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-80 items-center justify-center px-8 text-center">
                <div className="max-w-57.5">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-800">
                    Select a question
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-slate-400">
                    Choose a question from the list
                    to view its extracted answer.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function MobileTab({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string | number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-12 items-center justify-center gap-1.5 px-2 text-[10px] font-bold transition ${
        active
          ? "text-slate-950"
          : "text-slate-400 hover:text-slate-600"
      }`}
    >
      <span
        className={`${
          active
            ? "text-orange-500"
            : "text-slate-400"
        }`}
      >
        {icon}
      </span>

      {label}

      {badge !== undefined && label === "Questions" && (
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] text-slate-500">
          {badge}
        </span>
      )}

      {badge !== undefined && label === "Answer" && (
        <span className="max-w-10 truncate rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] text-slate-500">
          {badge}
        </span>
      )}

      {active && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-orange-500" />
      )}
    </button>
  );
}

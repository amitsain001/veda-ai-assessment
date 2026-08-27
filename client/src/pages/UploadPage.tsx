import {
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

import {
  useAssessment,
} from "@/context/AssessmentContext";

import AssessmentPage from "@/pages/AssessmentPage";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import UploadCard from "@/components/UploadCard";

import type {
  UploadedFile,
} from "@/types/upload";

import type {
  ExtractedQuestion,
  ExtractedAnswer,
  MappingResult,
} from "@/types/assessment";

/**
 * Backend API base URL.
 *
 * Change this when deploying the application.
 *
 * Development:
 * http://localhost:5000
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/**
 * Processing stages shown to the teacher.
 */
type ProcessingStage =
  | "idle"
  | "questions"
  | "answers"
  | "mapping"
  | "complete"
  | "error";

export default function UploadPage() {
  /**
   * Question-paper upload state.
   */
  const [
    questionPaper,
    setQuestionPaper,
  ] =
    useState<UploadedFile | null>(
      null
    );

  /**
   * Student answer-sheet upload state.
   */
  const [
    answerSheet,
    setAnswerSheet,
  ] =
    useState<UploadedFile | null>(
      null
    );

  /**
   * Current AI processing stage.
   */
  const [
    processingStage,
    setProcessingStage,
  ] =
    useState<ProcessingStage>(
      "idle"
    );

  /**
   * Human-readable processing message.
   */
  const [
    processingMessage,
    setProcessingMessage,
  ] =
    useState("");

  /**
   * Error shown to the teacher if
   * any backend processing fails.
   */
  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  /**
   * Assessment context.
   *
   * Once setAssessment() is called,
   * the application can move to the
   * main assessment UI.
   */
  const {
    assessment,
    setAssessment,
  } = useAssessment();

  /**
   * Create an UploadedFile object from
   * the browser File object.
   */
  const createUploadedFile = (
    file: File
  ): UploadedFile => {
    return {
      file,

      /**
       * Object URLs allow local previews
       * without uploading the file.
       */
      previewUrl:
        URL.createObjectURL(
          file
        ),

      /**
       * Initial upload/preparation progress.
       */
      progress: 0,

      isValid: true,
    };
  };

  /**
   * Handle question-paper selection.
   */
  const handleQuestionPaperSelect =
    (file: File) => {
      /**
       * Revoke previous preview URL
       * to prevent memory leaks.
       */
      if (questionPaper) {
        URL.revokeObjectURL(
          questionPaper.previewUrl
        );
      }

      setQuestionPaper(
        createUploadedFile(file)
      );

      /**
       * Clear any previous error.
       */
      setErrorMessage(null);
    };

  /**
   * Handle answer-sheet selection.
   */
  const handleAnswerSheetSelect =
    (file: File) => {
      if (answerSheet) {
        URL.revokeObjectURL(
          answerSheet.previewUrl
        );
      }

      setAnswerSheet(
        createUploadedFile(file)
      );

      setErrorMessage(null);
    };

  /**
   * Remove question paper.
   */
  const removeQuestionPaper =
    () => {
      if (questionPaper) {
        URL.revokeObjectURL(
          questionPaper.previewUrl
        );
      }

      setQuestionPaper(null);
    };

  /**
   * Remove answer sheet.
   */
  const removeAnswerSheet =
    () => {
      if (answerSheet) {
        URL.revokeObjectURL(
          answerSheet.previewUrl
        );
      }

      setAnswerSheet(null);
    };

  /**
   * Both files must exist before
   * assessment processing can begin.
   */
  const canStartAssessment =
    useMemo(() => {
      return Boolean(
        questionPaper &&
          answerSheet
      );
    }, [
      questionPaper,
      answerSheet,
    ]);

  /**
   * Convert backend HTTP errors into
   * useful frontend messages.
   */
  const getErrorMessage = (
    error: unknown
  ): string => {
    if (
      error instanceof Error
    ) {
      return error.message;
    }

    return "Something went wrong while processing the assessment.";
  };

  /**
   * Generic helper for POST requests
   * that send multipart/form-data.
   */
  const postFile = async (
    endpoint: string,
    file: File,
    fieldName: string
  ) => {
    /**
     * FormData allows us to send the
     * original PDF/image directly to Express.
     */
    const formData =
      new FormData();

    formData.append(
      fieldName,
      file
    );

    const response =
      await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          method: "POST",

          /**
           * Do NOT manually set Content-Type.
           *
           * The browser automatically creates the
           * multipart boundary for FormData.
           */
          body: formData,
        }
      );

    /**
     * Try to parse the backend response.
     */
    const data =
      await response.json();

    /**
     * Convert HTTP/backend failures
     * into frontend errors.
     */
    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Backend processing failed."
      );
    }

    return data;
  };

  /**
   * Main assessment processing pipeline.
   *
   * Flow:
   *
   * Question Paper
   *       ↓
   * Question Extraction
   *       ↓
   * Answer Sheet
   *       ↓
   * Answer Extraction
   *       ↓
   * Mapping
   *       ↓
   * AssessmentPage
   */
  const handleStartAssessment =
    async () => {
      /**
       * TypeScript now knows that both
       * files exist after this check.
       */
      if (
        !questionPaper ||
        !answerSheet
      ) {
        return;
      }

      /**
       * Prevent duplicate processing clicks.
       */
      if (
        processingStage ===
          "questions" ||
        processingStage ===
          "answers" ||
        processingStage ===
          "mapping"
      ) {
        return;
      }

      try {
        /**
         * Reset previous errors.
         */
        setErrorMessage(null);

        /**
         * ========================================
         * PHASE 3
         * QUESTION EXTRACTION
         * ========================================
         */
        setProcessingStage(
          "questions"
        );

        setProcessingMessage(
          "Extracting questions from the question paper..."
        );

        const questionResponse =
          await postFile(
            "/api/questions/extract",
            questionPaper.file,
            "questionPaper"
          );

        /**
         * Backend question extraction result.
         *
         * We keep the actual extracted array
         * separate for clarity.
         */
        const extractedQuestions =
          questionResponse.questions as ExtractedQuestion[];

        /**
         * ========================================
         * PHASE 4
         * ANSWER EXTRACTION
         * ========================================
         */
        setProcessingStage(
          "answers"
        );

        setProcessingMessage(
          "Reading the student's handwritten answers..."
        );

        const answerResponse =
          await postFile(
            "/api/answers/extract",
            answerSheet.file,
            "answerSheet"
          );

        /**
         * Extracted handwritten answers.
         */
        const extractedAnswers =
          answerResponse.answers as ExtractedAnswer[];

        /**
         * ========================================
         * PHASE 5
         * MAPPING
         * ========================================
         */
        setProcessingStage(
          "mapping"
        );

        setProcessingMessage(
          "Mapping answers to questions..."
        );

        /**
         * Mapping endpoint expects JSON because
         * the files have already been processed.
         */
        const mappingResponse =
          await fetch(
            `${API_BASE_URL}/api/mapping`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                questions:
                  extractedQuestions,

                answers:
                  extractedAnswers,
              }),
            }
          );

        const mappingData =
          await mappingResponse.json();

        if (
          !mappingResponse.ok ||
          !mappingData.success
        ) {
          throw new Error(
            mappingData.message ||
              "Answer mapping failed."
          );
        }

        /**
         * Mapping result generated
         * by Phase 5.
         */
        const mappingResult =
          mappingData as MappingResult & {
            success: boolean;
          };

        /**
         * ========================================
         * SAVE COMPLETE ASSESSMENT
         * ========================================
         *
         * At this point we have:
         *
         * questions
         * answers
         * mappings
         *
         * Store everything in React Context.
         */
        setAssessment({
          questionPaper:
            questionPaper.file,

          answerSheet:
            answerSheet.file,

          questions:
            extractedQuestions,

          answers:
            extractedAnswers,

          mapping:
            mappingResult,
        });

        /**
         * Processing has completed.
         */
        setProcessingStage(
          "complete"
        );

        setProcessingMessage(
          "Assessment processed successfully."
        );
      } catch (error) {
        /**
         * Any failure in extraction or mapping
         * ends up here.
         */
        console.error(
          "Assessment processing failed:",
          error
        );

        setProcessingStage(
          "error"
        );

        setProcessingMessage("");

        setErrorMessage(
          getErrorMessage(error)
        );
      }
    };

  /**
   * ============================================
   * IMPORTANT
   * ============================================
   *
   * Once the assessment is successfully
   * stored in context, show the main assessment UI.
   *
   * This means:
   *
   * UploadPage
   *      ↓
   * AssessmentPage
   */
  if (assessment) {
    return (
      <AssessmentPage />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ========================================
          HEADER
          ======================================== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
                <Sparkles className="h-4 w-4 text-white" />
              </div>

              <span className="text-lg font-bold text-slate-900">
                VedaAI
              </span>
            </div>
          </div>

          <Badge variant="outline">
            Assessment Extraction
          </Badge>
        </div>
      </header>

      {/* ========================================
          MAIN CONTENT
          ======================================== */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Page heading */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-4 bg-slate-900 text-white hover:bg-slate-900">
            AI Assessment Assistant
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Upload your assessment documents
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
            Upload the question paper and
            the student's handwritten answer
            sheet. VedaAI will extract questions,
            identify answers, and map them
            automatically.
          </p>
        </div>

        {/* ======================================
            UPLOAD CARDS
            ====================================== */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <UploadCard
            type="question-paper"
            uploadedFile={
              questionPaper
            }
            onFileSelect={
              handleQuestionPaperSelect
            }
            onRemove={
              removeQuestionPaper
            }
          />

          <UploadCard
            type="answer-sheet"
            uploadedFile={
              answerSheet
            }
            onFileSelect={
              handleAnswerSheetSelect
            }
            onRemove={
              removeAnswerSheet
            }
          />
        </div>

        {/* ======================================
            PROCESSING ERROR
            ====================================== */}
        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-800">
              Processing failed
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>
          </div>
        )}

        {/* ======================================
            PROCESSING PROGRESS
            ====================================== */}
        {processingStage !==
          "idle" &&
          processingStage !==
            "complete" &&
          processingStage !==
            "error" && (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />

                <div>
                  <p className="font-medium text-blue-900">
                    Processing assessment
                  </p>

                  <p className="text-sm text-blue-700">
                    {processingMessage}
                  </p>
                </div>
              </div>

              {/* Stage indicators */}
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <ProcessingStep
                  label="Questions"
                  active={
                    processingStage ===
                    "questions"
                  }
                  completed={
                    processingStage ===
                      "answers" ||
                    processingStage ===
                      "mapping"
                  }
                />

                <ProcessingStep
                  label="Answers"
                  active={
                    processingStage ===
                    "answers"
                  }
                  completed={
                    processingStage ===
                    "mapping"
                  }
                />

                <ProcessingStep
                  label="Mapping"
                  active={
                    processingStage ===
                    "mapping"
                  }
                  completed={false}
                />
              </div>
            </div>
          )}

        {/* ======================================
            BOTTOM ACTION SECTION
            ====================================== */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <CheckCircle2 className="h-5 w-5 text-slate-600" />
            </div>

            <div>
              <p className="font-medium text-slate-900">
                {processingStage ===
                "error"
                  ? "Processing failed"
                  : processingStage ===
                      "complete"
                    ? "Assessment ready"
                    : "Ready to process"}
              </p>

              <p className="text-sm text-slate-500">
                {processingStage ===
                "error"
                  ? "Check the error above and try again."
                  : processingStage ===
                      "complete"
                    ? "Opening the assessment..."
                    : !questionPaper &&
                        !answerSheet
                      ? "Upload both documents to continue."
                      : !questionPaper
                        ? "Upload the question paper to continue."
                        : !answerSheet
                          ? "Upload the answer sheet to continue."
                          : "Both documents are ready."}
              </p>
            </div>
          </div>

          <Button
            size="lg"
            disabled={
              !canStartAssessment ||
              processingStage ===
                "questions" ||
              processingStage ===
                "answers" ||
              processingStage ===
                "mapping"
            }
            onClick={
              handleStartAssessment
            }
            className="w-full sm:w-auto"
          >
            {processingStage ===
                "questions" ||
            processingStage ===
                "answers" ||
            processingStage ===
                "mapping" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                Processing...
              </>
            ) : (
              <>
                Start Assessment

                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

/**
 * Small visual indicator for each
 * processing stage.
 */
function ProcessingStep({
  label,
  active,
  completed,
}: {
  label: string;

  active: boolean;

  completed: boolean;
}) {
  return (
    <div
      className={`
        rounded-lg
        border
        px-4
        py-3
        text-sm
        font-medium
        transition

        ${
          active
            ? "border-blue-300 bg-white text-blue-700"
            : completed
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-blue-100 bg-blue-100/50 text-blue-500"
        }
      `}
    >
      <div className="flex items-center gap-2">
        {completed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : active ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}

        {label}
      </div>
    </div>
  );
}
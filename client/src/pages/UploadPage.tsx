import {
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  FileCheck2,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  Menu,
  Sparkles,
  X,
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
 * =========================================================
 * BACKEND API BASE URL
 * =========================================================
 *
 * Development:
 *   http://localhost:5000
 *
 * Production:
 *   VITE_API_URL is provided by Vercel.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/**
 * =========================================================
 * PROCESSING STAGES
 * =========================================================
 */
type ProcessingStage =
  | "idle"
  | "questions"
  | "answers"
  | "mapping"
  | "complete"
  | "error";

/**
 * =========================================================
 * UPLOAD PAGE
 * =========================================================
 */
export default function UploadPage() {
  /**
   * =======================================================
   * STATE
   * =======================================================
   */

  const [
    questionPaper,
    setQuestionPaper,
  ] = useState<UploadedFile | null>(
    null
  );

  const [
    answerSheet,
    setAnswerSheet,
  ] = useState<UploadedFile | null>(
    null
  );

  const [
    processingStage,
    setProcessingStage,
  ] = useState<ProcessingStage>(
    "idle"
  );

  const [
    processingMessage,
    setProcessingMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null
  );

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  /**
   * =======================================================
   * ASSESSMENT CONTEXT
   * =======================================================
   */

  const {
    assessment,
    setAssessment,
  } = useAssessment();

  /**
   * =======================================================
   * FILE HELPERS
   * =======================================================
   */

  const createUploadedFile = (
    file: File
  ): UploadedFile => {
    return {
      file,
      previewUrl:
        URL.createObjectURL(file),
      progress: 0,
      isValid: true,
    };
  };

  const handleQuestionPaperSelect =
    (file: File) => {
      if (questionPaper) {
        URL.revokeObjectURL(
          questionPaper.previewUrl
        );
      }

      setQuestionPaper(
        createUploadedFile(file)
      );

      setErrorMessage(null);
    };

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

  const removeQuestionPaper = () => {
    if (questionPaper) {
      URL.revokeObjectURL(
        questionPaper.previewUrl
      );
    }

    setQuestionPaper(null);
  };

  const removeAnswerSheet = () => {
    if (answerSheet) {
      URL.revokeObjectURL(
        answerSheet.previewUrl
      );
    }

    setAnswerSheet(null);
  };

  /**
   * Both files are required.
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
   * =======================================================
   * API HELPERS
   * =======================================================
   */

  const getErrorMessage = (
    error: unknown
  ): string => {
    if (error instanceof Error) {
      return error.message;
    }

    return (
      "Something went wrong while processing the assessment."
    );
  };

  /**
   * Send multipart file to backend.
   */
  const postFile = async (
    endpoint: string,
    file: File,
    fieldName: string
  ) => {
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
          body: formData,
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          "Backend processing failed."
      );
    }

    return data;
  };

  /**
   * =======================================================
   * MAIN PROCESSING PIPELINE
   * =======================================================
   */

  const handleStartAssessment =
    async () => {
      if (
        !questionPaper ||
        !answerSheet
      ) {
        return;
      }

      /**
       * Prevent duplicate requests.
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
        setErrorMessage(null);

        /**
         * --------------------------------------
         * QUESTION EXTRACTION
         * --------------------------------------
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

        const extractedQuestions =
          questionResponse.questions as ExtractedQuestion[];

        /**
         * --------------------------------------
         * ANSWER EXTRACTION
         * --------------------------------------
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

        const extractedAnswers =
          answerResponse.answers as ExtractedAnswer[];

        /**
         * --------------------------------------
         * ANSWER MAPPING
         * --------------------------------------
         */

        setProcessingStage(
          "mapping"
        );

        setProcessingMessage(
          "Mapping answers to questions..."
        );

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

        const mappingResult =
          mappingData as MappingResult & {
            success: boolean;
          };

        /**
         * --------------------------------------
         * SAVE ASSESSMENT
         * --------------------------------------
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

        setProcessingStage(
          "complete"
        );

        setProcessingMessage(
          "Assessment processed successfully."
        );
      } catch (error) {
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
   * Once assessment exists,
   * move to actual assessment screen.
   */
  if (assessment) {
    return <AssessmentPage />;
  }

  /**
   * =======================================================
   * PROCESSING STATE
   * =======================================================
   */

  const isProcessing =
    processingStage ===
      "questions" ||
    processingStage ===
      "answers" ||
    processingStage ===
      "mapping";

  /**
   * =======================================================
   * MAIN UI
   * =======================================================
   */

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-slate-900">

      {/* =====================================================
          TOP NAVIGATION
      ====================================================== */}

      <header
        className="
          sticky
          top-0
          z-40
          border-b
          border-slate-200/80
          bg-white/95
          backdrop-blur
        "
      >
        <div
          className="
            mx-auto
            flex
            h-17
            max-w-375
            items-center
            justify-between
            px-4
            sm:px-6
            lg:px-8
          "
        >

          {/* Brand */}

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-slate-950
                shadow-sm
              "
            >
              <Sparkles
                className="
                  h-5
                  w-5
                  text-white
                "
              />
            </div>

            <div>
              <div
                className="
                  text-[17px]
                  font-bold
                  tracking-tight
                  text-slate-950
                "
              >
                VedaAI
              </div>

              <div
                className="
                  hidden
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.16em]
                  text-slate-400
                  sm:block
                "
              >
                AI Teacher's Toolkit
              </div>
            </div>

          </div>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================== */}

          <nav
            className="
              hidden
              items-center
              gap-2
              md:flex
            "
          >
            <NavItem
              icon={<BookOpen />}
              label="Exams"
              active
            />

            <NavItem
              icon={<FileText />}
              label="Assignments"
            />

            <NavItem
              icon={<GraduationCap />}
              label="Classroom"
            />
          </nav>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}

          <div className="flex items-center gap-2">

            <Button
              variant="ghost"
              size="icon"
              className="
                hidden
                rounded-full
                text-slate-500
                hover:bg-slate-100
                sm:flex
              "
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            <div
              className="
                hidden
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-orange-100
                text-sm
                font-semibold
                text-orange-700
                sm:flex
              "
            >
              AS
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

          </div>

        </div>

        {/* =================================================
            MOBILE NAVIGATION
        ================================================== */}

        {mobileMenuOpen && (
          <div
            className="
              border-t
              border-slate-100
              bg-white
              px-4
              py-3
              md:hidden
            "
          >
            <div className="grid gap-1">

              <MobileNavItem
                icon={<BookOpen />}
                label="Exams"
                active
              />

              <MobileNavItem
                icon={<FileText />}
                label="Assignments"
              />

              <MobileNavItem
                icon={<GraduationCap />}
                label="Classroom"
              />

            </div>
          </div>
        )}

      </header>

      {/* =====================================================
          PAGE
      ====================================================== */}

      <main
        className="
          mx-auto
          max-w-300
          px-4
          py-8
          sm:px-6
          sm:py-12
          lg:px-8
        "
      >

        {/* Breadcrumb */}

        <div
          className="
            mb-7
            flex
            items-center
            gap-2
            text-xs
            text-slate-400
          "
        >
          <span>Exams</span>

          <span>/</span>

          <span className="text-slate-600">
            New Assessment
          </span>
        </div>

        {/* =================================================
            HERO
        ================================================== */}

        <section
          className="
            relative
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            px-5
            py-9
            shadow-[0_8px_35px_rgba(15,23,42,0.04)]
            sm:px-10
            sm:py-12
          "
        >

          {/* Decorative circles */}

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-24
              h-64
              w-64
              rounded-full
              bg-orange-100/70
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-32
              -left-20
              h-56
              w-56
              rounded-full
              bg-slate-100
              blur-3xl
            "
          />

          <div
            className="
              relative
              mx-auto
              max-w-3xl
              text-center
            "
          >

            <Badge
              className="
                mb-5
                gap-1.5
                rounded-full
                border
                border-orange-200
                bg-orange-50
                px-3
                py-1.5
                text-orange-700
                hover:bg-orange-50
              "
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Assessment Assistant
            </Badge>

            <h1
              className="
                text-3xl
                font-bold
                tracking-[-0.03em]
                text-slate-950
                sm:text-4xl
                lg:text-[44px]
              "
            >
              Upload your
              <span className="text-orange-500">
                {" "}assessment
              </span>
              {" "}documents
            </h1>

            <p
              className="
                mx-auto
                mt-4
                max-w-2xl
                text-sm
                leading-6
                text-slate-500
                sm:text-[15px]
              "
            >
              Upload the question paper and
              student's handwritten answer sheet.
              VedaAI will extract, map and evaluate
              the assessment automatically.
            </p>

            {/* Feature pills */}

            <div
              className="
                mt-6
                flex
                flex-wrap
                justify-center
                gap-2
              "
            >
              <FeaturePill label="AI Extraction" />
              <FeaturePill label="Answer Mapping" />
              <FeaturePill label="Smart Grading" />
            </div>

          </div>

        </section>

        {/* =================================================
            UPLOAD AREA
        ================================================== */}

        <section className="mt-8">

          <div
            className="
              mb-4
              flex
              items-end
              justify-between
            "
          >
            <div>

              <h2
                className="
                  text-lg
                  font-semibold
                  tracking-tight
                  text-slate-950
                "
              >
                Assessment documents
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                "
              >
                Both documents are required to
                start the assessment.
              </p>

            </div>

            <div
              className="
                hidden
                items-center
                gap-1.5
                text-xs
                text-slate-400
                sm:flex
              "
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              PDF, JPG, PNG, WEBP
            </div>

          </div>

          <div
            className="
              grid
              gap-5
              lg:grid-cols-2
            "
          >

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

        </section>

        {/* =================================================
            PROCESSING ERROR
        ================================================== */}

        {errorMessage && (
          <div
            className="
              mt-6
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-4
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-red-100
              "
            >
              <X
                className="
                  h-4
                  w-4
                  text-red-600
                "
              />
            </div>

            <div>

              <p
                className="
                  text-sm
                  font-semibold
                  text-red-800
                "
              >
                Processing failed
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-red-700
                "
              >
                {errorMessage}
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            PROCESSING PANEL
        ================================================== */}

        {isProcessing && (
          <section
            className="
              mt-6
              overflow-hidden
              rounded-2xl
              border
              border-orange-200
              bg-white
              shadow-[0_8px_30px_rgba(15,23,42,0.05)]
            "
          >

            <div
              className="
                bg-linear-to-r
                from-orange-50
                to-white
                p-5
                sm:p-6
              "
            >

              <div className="flex items-center gap-4">

                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-orange-500
                    text-white
                    shadow-lg
                    shadow-orange-200
                  "
                >
                  <Sparkles
                    className="
                      h-5
                      w-5
                    "
                  />
                </div>

                <div>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    VedaAI is processing
                    your assessment
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    {processingMessage}
                  </p>

                </div>

              </div>

              {/* Stages */}

              <div
                className="
                  mt-6
                  grid
                  gap-3
                  sm:grid-cols-3
                "
              >

                <ProcessingStep
                  number="01"
                  label="Extract questions"
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
                  number="02"
                  label="Read answers"
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
                  number="03"
                  label="Map responses"
                  active={
                    processingStage ===
                    "mapping"
                  }
                  completed={false}
                />

              </div>

            </div>

          </section>
        )}

        {/* =================================================
            START ASSESSMENT
        ================================================== */}

        <section
          className="
            mt-6
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-slate-950
            shadow-[0_12px_40px_rgba(15,23,42,0.10)]
          "
        >

          <div
            className="
              flex
              flex-col
              gap-5
              p-5
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:p-6
            "
          >

            <div className="flex items-center gap-4">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/10
                  text-white
                "
              >
                {isProcessing ? (
                  <Loader2
                    className="
                      h-5
                      w-5
                      animate-spin
                    "
                  />
                ) : (
                  <CheckCircle2
                    className="
                      h-5
                      w-5
                    "
                  />
                )}
              </div>

              <div>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  {isProcessing
                    ? "Processing assessment"
                    : processingStage ===
                        "error"
                      ? "Ready to try again"
                      : "Ready to begin"}
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  {isProcessing
                    ? processingMessage
                    : !questionPaper &&
                        !answerSheet
                      ? "Upload both documents to continue."
                      : !questionPaper
                        ? "Upload the question paper to continue."
                        : !answerSheet
                          ? "Upload the answer sheet to continue."
                          : "Both documents are ready for AI processing."}
                </p>

              </div>

            </div>

            <Button
              size="lg"
              disabled={
                !canStartAssessment ||
                isProcessing
              }
              onClick={
                handleStartAssessment
              }
              className="
                h-11
                w-full
                rounded-xl
                bg-orange-500
                px-6
                font-semibold
                text-white
                shadow-lg
                shadow-orange-950/20
                transition-all
                hover:bg-orange-400
                disabled:bg-slate-700
                disabled:text-slate-400
                sm:w-auto
              "
            >
              {isProcessing ? (
                <>
                  <Loader2
                    className="
                      mr-2
                      h-4
                      w-4
                      animate-spin
                    "
                  />

                  Processing...
                </>
              ) : (
                <>
                  Start Assessment

                  <ArrowRight
                    className="
                      ml-2
                      h-4
                      w-4
                    "
                  />
                </>
              )}
            </Button>

          </div>

        </section>

        {/* =================================================
            TRUST / INFO
        ================================================== */}

        <div
          className="
            mt-6
            flex
            flex-col
            items-center
            justify-center
            gap-3
            text-center
            text-[11px]
            text-slate-400
            sm:flex-row
          "
        >

          <span>
            Maximum file size: 20 MB
          </span>

          <span className="hidden sm:block">
            •
          </span>

          <span>
            Your files are processed securely
          </span>

          <span className="hidden sm:block">
            •
          </span>

          <span>
            Powered by VedaAI
          </span>

        </div>

      </main>

    </div>
  );
}

/**
 * =========================================================
 * NAV ITEM
 * =========================================================
 *
 * Updated for consistent icon/text alignment.
 */
function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`
        inline-flex
        h-10
        items-center
        justify-center
        gap-2
        rounded-lg
        px-3.5
        text-sm
        font-medium
        leading-none
        transition-colors

        ${
          active
            ? `
                bg-slate-100
                text-slate-900
              `
            : `
                text-slate-500
                hover:bg-slate-50
                hover:text-slate-900
              `
        }
      `}
    >
      <span
        className="
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          [&>svg]:h-5
          [&>svg]:w-5
          [&>svg]:shrink-0
        "
      >
        {icon}
      </span>

      <span className="whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

/**
 * =========================================================
 * MOBILE NAV ITEM
 * =========================================================
 */

function MobileNavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`
        flex
        items-center
        gap-3
        rounded-lg
        px-3
        py-2.5
        text-sm
        font-medium

        ${
          active
            ? "bg-slate-100 text-slate-900"
            : "text-slate-500"
        }
      `}
    >
      <span
        className="
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          [&>svg]:h-5
          [&>svg]:w-5
          [&>svg]:shrink-0
        "
      >
        {icon}
      </span>

      <span className="leading-none">
        {label}
      </span>
    </button>
  );
}

/**
 * =========================================================
 * FEATURE PILL
 * =========================================================
 */

function FeaturePill({
  label,
}: {
  label: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-1.5
        rounded-full
        border
        border-slate-200
        bg-white
        px-3
        py-1.5
        text-[11px]
        font-medium
        text-slate-600
        shadow-sm
      "
    >
      <Check
        className="
          h-3
          w-3
          text-orange-500
        "
      />

      {label}
    </div>
  );
}

/**
 * =========================================================
 * PROCESSING STEP
 * =========================================================
 */

function ProcessingStep({
  number,
  label,
  active,
  completed,
}: {
  number: string;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        p-3.5
        transition-all

        ${
          active
            ? `
                border-orange-300
                bg-white
                shadow-sm
              `
            : completed
              ? `
                  border-green-200
                  bg-green-50
                `
              : `
                  border-slate-200
                  bg-slate-50
                `
        }
      `}
    >
      <div className="flex items-center gap-3">

        <div
          className={`
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-[10px]
            font-bold

            ${
              active
                ? "bg-orange-100 text-orange-600"
                : completed
                  ? "bg-green-100 text-green-600"
                  : "bg-slate-200 text-slate-500"
            }
          `}
        >
          {completed ? (
            <Check className="h-4 w-4" />
          ) : active ? (
            <Loader2
              className="
                h-4
                w-4
                animate-spin
              "
            />
          ) : (
            number
          )}
        </div>

        <div>

          <p
            className={`
              text-xs
              font-semibold

              ${
                active
                  ? "text-slate-900"
                  : completed
                    ? "text-green-700"
                    : "text-slate-500"
              }
            `}
          >
            {label}
          </p>

          <p
            className="
              mt-0.5
              text-[10px]
              text-slate-400
            "
          >
            {completed
              ? "Completed"
              : active
                ? "In progress"
                : "Waiting"}
          </p>

        </div>

      </div>
    </div>
  );
}
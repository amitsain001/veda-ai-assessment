import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type {
  GradingResult,
} from "@/types/grading";

import type {
  AssessmentData,
} from "@/types/assessment";

/**
 * Context API keeps the current assessment
 * and its optional AI grading in memory.
 */
interface AssessmentContextValue {
  /**
   * Current processed assessment.
   */
  assessment:
    | AssessmentData
    | null;

  /**
   * Save a processed assessment.
   */
  setAssessment: (
    assessment: AssessmentData
  ) => void;

  /**
   * Clear assessment and grading.
   */
  clearAssessment: () => void;

  /**
   * AI grading result.
   *
   * null means grading has not been
   * generated yet.
   */
  grading:
    | GradingResult
    | null;

  /**
   * True while Gemini is grading.
   */
  isGrading: boolean;

  /**
   * Error generated during grading.
   */
  gradingError:
    | string
    | null;

  /**
   * Generate AI grading for the
   * current assessment.
   */
  generateGrading: () => Promise<void>;
}

/**
 * React context.
 */
const AssessmentContext =
  createContext<
    AssessmentContextValue | undefined
  >(undefined);


/**
 * Assessment provider.
 */
export function AssessmentProvider({
  children,
}: {
  children: ReactNode;
}) {
  /**
   * Current assessment.
   */
  const [
    assessment,
    setAssessmentState,
  ] = useState<
    AssessmentData | null
  >(null);

  /**
   * Current AI grading.
   */
  const [
    grading,
    setGrading,
  ] = useState<
    GradingResult | null
  >(null);

  /**
   * AI grading loading state.
   */
  const [
    isGrading,
    setIsGrading,
  ] = useState(false);

  /**
   * AI grading error.
   */
  const [
    gradingError,
    setGradingError,
  ] = useState<
    string | null
  >(null);


  /**
   * -------------------------------------------------------
   * SET ASSESSMENT
   * -------------------------------------------------------
   *
   * Whenever a new assessment is loaded,
   * remove grading belonging to the old
   * assessment.
   */
  const setAssessment = (
    newAssessment: AssessmentData
  ) => {
    setAssessmentState(
      newAssessment
    );

    // Previous grading no longer belongs
    // to the newly loaded assessment.
    setGrading(null);

    // Clear previous grading errors.
    setGradingError(null);

    // Make sure loading state is reset.
    setIsGrading(false);
  };


  /**
   * -------------------------------------------------------
   * CLEAR ASSESSMENT
   * -------------------------------------------------------
   */
  const clearAssessment = () => {
    // Remove current assessment.
    setAssessmentState(null);

    // Remove grading.
    setGrading(null);

    // Remove grading error.
    setGradingError(null);

    // Stop any grading loading state.
    setIsGrading(false);
  };


  /**
   * -------------------------------------------------------
   * GENERATE GRADING
   * -------------------------------------------------------
   */
  const generateGrading =
    async () => {

      /**
       * We cannot grade when no assessment
       * has been processed.
       */
      if (!assessment) {
        setGradingError(
          "No assessment is loaded."
        );

        return;
      }


      try {
        /**
         * Start loading state.
         */
        setIsGrading(true);

        /**
         * Remove previous error.
         */
        setGradingError(null);


        /**
         * Import the grading API service.
         *
         * Keeping the API call inside a service
         * keeps this context focused on state.
         */
        const {
          gradeAssessment,
        } = await import(
          "@/services/grading.service"
        );


        /**
         * Send questions, answers and mappings
         * to the Express backend.
         *
         * Gemini itself is never called from
         * the browser.
         */
        const result =
          await gradeAssessment({
            questions:
              assessment.questions,

            answers:
              assessment.answers,

            mapping:
              assessment.mapping,
          });


        /**
         * Store the validated grading result.
         */
        setGrading(result);

      } catch (error) {

        /**
         * Log the complete error during development.
         */
        console.error(
          "Assessment grading failed:",
          error
        );


        /**
         * Display a readable error in the UI.
         */
        setGradingError(
          error instanceof Error
            ? error.message
            : "Failed to generate assessment grading."
        );

      } finally {

        /**
         * Always stop the loading indicator.
         */
        setIsGrading(false);
      }
    };


  /**
   * -------------------------------------------------------
   * PROVIDER
   * -------------------------------------------------------
   */
  return (
    <AssessmentContext.Provider
      value={{
        assessment,

        setAssessment,

        clearAssessment,

        grading,

        isGrading,

        gradingError,

        generateGrading,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}


/**
 * Custom hook for accessing assessment state.
 */
export function useAssessment() {
  const context =
    useContext(
      AssessmentContext
    );

  /**
   * Prevent using the hook outside
   * AssessmentProvider.
   */
  if (!context) {
    throw new Error(
      "useAssessment must be used inside AssessmentProvider."
    );
  }

  return context;
}
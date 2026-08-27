/**
 * Represents the two files required by our assessment system.
 */
export type UploadType = "question-paper" | "answer-sheet";

/**
 * Represents a file selected by the teacher.
 */
export interface UploadedFile {
  file: File;

  /**
   * Object URL used to preview the selected file
   * inside the browser.
   */
  previewUrl: string;

  /**
   * Current upload/processing progress.
   */
  progress: number;

  /**
   * Whether the file has passed validation.
   */
  isValid: boolean;

  /**
   * Validation error message, if any.
   */
  error?: string;
}
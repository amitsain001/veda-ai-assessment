import { useRef, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import type {
  UploadType,
  UploadedFile,
} from "@/types/upload";

import {
  formatFileSize,
  isImageFile,
  isPdfFile,
  validateFile,
} from "@/utils/fileValidation";

interface UploadCardProps {
  type: UploadType;
  uploadedFile: UploadedFile | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

function UploadCard({
  type,
  uploadedFile,
  onFileSelect,
  onRemove,
}: UploadCardProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    validationError,
    setValidationError,
  ] = useState("");

  const isQuestionPaper =
    type === "question-paper";

  /**
   * Validate and select a file.
   */
  const processFile = (file: File) => {
    const error = validateFile(file);

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");

    onFileSelect(file);
  };

  /**
   * Native file picker.
   */
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      processFile(file);
    }

    /*
     * Reset the input value so selecting
     * the same file again still triggers
     * onChange.
     */
    event.target.value = "";
  };

  /**
   * Drag over.
   */
  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  /**
   * Drag leave.
   */
  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  /**
   * Drop file.
   */
  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  /**
   * Open file picker.
   */
  const openFilePicker = () => {
    inputRef.current?.click();
  };

  /**
   * Replace current file.
   */
  const handleReplace = () => {
    onRemove();

    setValidationError("");

    /*
     * Allow React to finish removing the
     * previous file before opening picker.
     */
    window.setTimeout(() => {
      inputRef.current?.click();
    }, 0);
  };

  return (
    <Card
      className="
        h-full
        min-w-0
        overflow-hidden
        border-slate-200
        bg-white
        shadow-sm
        transition-shadow
        hover:shadow-md
      "
    >
      <CardContent
        className="
          min-w-0
          p-4
          sm:p-6
        "
      >
        {/* =================================================
            CARD HEADER
            ================================================= */}

        <div className="mb-5">
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-slate-100
              "
            >
              {isQuestionPaper ? (
                <FileText
                  className="
                    h-5
                    w-5
                    text-slate-700
                  "
                />
              ) : (
                <ImageIcon
                  className="
                    h-5
                    w-5
                    text-slate-700
                  "
                />
              )}
            </div>

            <div className="min-w-0">
              <h2
                className="
                  truncate
                  text-base
                  font-semibold
                  text-slate-900
                  sm:text-lg
                "
              >
                {isQuestionPaper
                  ? "Question Paper"
                  : "Student Answer Sheet"}
              </h2>

              <p
                className="
                  mt-0.5
                  text-xs
                  leading-5
                  text-slate-500
                  sm:text-sm
                "
              >
                {isQuestionPaper
                  ? "Upload the printed question paper"
                  : "Upload the student's handwritten answers"}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            EMPTY STATE
            ================================================= */}

        {!uploadedFile ? (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="
                .pdf,
                .png,
                .jpg,
                .jpeg,
                .webp,
                application/pdf,
                image/png,
                image/jpeg,
                image/webp
              "
              onChange={
                handleInputChange
              }
            />

            {/* Drag & Drop */}
            <div
              role="button"
              tabIndex={0}
              onDragOver={
                handleDragOver
              }
              onDragLeave={
                handleDragLeave
              }
              onDrop={handleDrop}
              onClick={
                openFilePicker
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                    "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  openFilePicker();
                }
              }}
              className={`
                group
                flex
                min-h-60
                w-full
                cursor-pointer
                flex-col
                items-center
                justify-center
                rounded-xl
                border-2
                border-dashed
                px-4
                py-8
                text-center
                outline-none
                transition-all
                sm:min-h-65
                sm:px-6

                ${
                  isDragging
                    ? `
                      border-blue-500
                      bg-blue-50
                      shadow-sm
                    `
                    : `
                      border-slate-200
                      bg-slate-50
                      hover:border-slate-300
                      hover:bg-slate-100
                    `
                }

                focus-visible:border-slate-400
                focus-visible:ring-2
                focus-visible:ring-slate-300
                focus-visible:ring-offset-2
              `}
            >
              {/* Upload icon */}
              <div
                className={`
                  mb-4
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  transition-all
                  ${
                    isDragging
                      ? `
                        scale-105
                        bg-blue-100
                        text-blue-600
                      `
                      : `
                        bg-white
                        text-slate-500
                        shadow-sm
                        group-hover:scale-105
                      `
                  }
                `}
              >
                <Upload
                  className="
                    h-6
                    w-6
                  "
                />
              </div>

              <h3
                className="
                  text-sm
                  font-medium
                  text-slate-900
                  sm:text-base
                "
              >
                {isDragging
                  ? "Drop your file here"
                  : "Drag & drop your file here"}
              </h3>

              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  text-slate-500
                  sm:text-sm
                "
              >
                or click to browse from
                your computer
              </p>

              {/* Supported formats */}
              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  justify-center
                  gap-1.5
                "
              >
                <Badge variant="secondary">
                  PDF
                </Badge>

                <Badge variant="secondary">
                  JPG
                </Badge>

                <Badge variant="secondary">
                  PNG
                </Badge>

                <Badge variant="secondary">
                  WEBP
                </Badge>
              </div>

              <p
                className="
                  mt-4
                  text-[11px]
                  text-slate-400
                  sm:text-xs
                "
              >
                Maximum file size:
                {" "}
                20 MB
              </p>
            </div>

            {/* Validation error */}
            {validationError && (
              <div
                className="
                  mt-4
                  flex
                  items-start
                  gap-2
                  rounded-lg
                  border
                  border-red-200
                  bg-red-50
                  p-3
                "
              >
                <AlertCircle
                  className="
                    mt-0.5
                    h-4
                    w-4
                    shrink-0
                    text-red-500
                  "
                />

                <p
                  className="
                    min-w-0
                    text-xs
                    leading-5
                    text-red-600
                    sm:text-sm
                  "
                >
                  {validationError}
                </p>
              </div>
            )}
          </>
        ) : (
          /* =================================================
             FILE SELECTED STATE
             ================================================= */

          <div className="min-w-0 space-y-4">
            {/* File preview */}
            <div
              className="
                w-full
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-slate-50
              "
            >
              {isImageFile(
                uploadedFile.file
              ) ? (
                <div
                  className="
                    flex
                    max-h-75
                    min-h-45
                    items-center
                    justify-center
                    p-3
                    sm:p-4
                  "
                >
                  <img
                    src={
                      uploadedFile.previewUrl
                    }
                    alt={
                      uploadedFile.file.name
                    }
                    className="
                      max-h-67.5
                      max-w-full
                      rounded-lg
                      object-contain
                      shadow-sm
                    "
                  />
                </div>
              ) : (
                <div
                  className="
                    flex
                    min-h-55
                    flex-col
                    items-center
                    justify-center
                    px-4
                    text-center
                    sm:h-65
                  "
                >
                  <div
                    className="
                      flex
                      h-16
                      w-16
                      items-center
                      justify-center
                      rounded-xl
                      bg-red-50
                    "
                  >
                    <FileText
                      className="
                        h-8
                        w-8
                        text-red-500
                      "
                    />
                  </div>

                  <p
                    className="
                      mt-4
                      text-sm
                      font-medium
                      text-slate-800
                    "
                  >
                    PDF document
                  </p>

                  <p
                    className="
                      mt-1
                      max-w-xs
                      text-xs
                      leading-5
                      text-slate-500
                      sm:text-sm
                    "
                  >
                    PDF preview will be
                    available in the document
                    viewer.
                  </p>
                </div>
              )}
            </div>

            {/* File information */}
            <div
              className="
                flex
                min-w-0
                items-start
                justify-between
                gap-3
              "
            >
              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <p
                  title={
                    uploadedFile.file.name
                  }
                  className="
                    truncate
                    text-sm
                    font-medium
                    text-slate-900
                    sm:text-base
                  "
                >
                  {uploadedFile.file.name}
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                    sm:text-sm
                  "
                >
                  {formatFileSize(
                    uploadedFile.file.size
                  )}
                </p>
              </div>

              <Badge
                className="
                  shrink-0
                  bg-green-100
                  text-xs
                  text-green-700
                  hover:bg-green-100
                "
              >
                <CheckCircle2
                  className="
                    mr-1
                    h-3.5
                    w-3.5
                  "
                />

                Valid
              </Badge>
            </div>

            {/* Progress */}
            <div>
              <div
                className="
                  mb-2
                  flex
                  items-center
                  justify-between
                  gap-2
                  text-xs
                "
              >
                <span className="text-slate-500">
                  Preparing file
                </span>

                <span
                  className="
                    shrink-0
                    font-medium
                    text-slate-700
                  "
                >
                  {uploadedFile.progress}%
                </span>
              </div>

              <Progress
                value={
                  uploadedFile.progress
                }
              />
            </div>

            {/* Actions */}
            <div
              className="
                flex
                w-full
                gap-2
              "
            >
              <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1"
                onClick={
                  handleReplace
                }
              >
                <RefreshCw
                  className="
                    mr-2
                    h-4
                    w-4
                    shrink-0
                  "
                />

                <span className="truncate">
                  Replace
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onRemove}
                aria-label="Remove file"
                className="shrink-0"
              >
                <X
                  className="
                    h-4
                    w-4
                  "
                />
              </Button>
            </div>

            {/* File type */}
            <div
              className="
                text-xs
                text-slate-400
              "
            >
              {isPdfFile(
                uploadedFile.file
              )
                ? "PDF document"
                : "Image document"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UploadCard;
import { useRef, useState } from "react";

import {
  AlertCircle,
  Check,
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
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] =
    useState("");

  const isQuestionPaper =
    type === "question-paper";

  const title = isQuestionPaper
    ? "Question Paper"
    : "Student Answer Sheet";

  const description = isQuestionPaper
    ? "Upload the question paper"
    : "Upload the student's handwritten answers";

  const processFile = (file: File) => {
    const error = validateFile(file);

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    onFileSelect(file);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      processFile(file);
    }

    // Allows selecting the same file again.
    event.target.value = "";
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleReplace = () => {
    onRemove();

    requestAnimationFrame(() => {
      inputRef.current?.click();
    });
  };

  return (
    <Card className="group h-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(15,23,42,0.075)]">
      <CardContent className="p-0">
        {/* Card header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 ring-1 ring-orange-100">
              {isQuestionPaper ? (
                <FileText className="h-5 w-5" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-[15px] font-bold tracking-tight text-slate-950">
                  {title}
                </h2>

                {!uploadedFile && (
                  <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:inline-flex">
                    Required
                  </span>
                )}
              </div>

              <p className="mt-0.5 truncate text-xs leading-5 text-slate-500">
                {description}
              </p>
            </div>
          </div>

          <span
            className={`hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${
              uploadedFile
                ? "bg-green-50 text-green-700 ring-1 ring-green-100"
                : "bg-slate-50 text-slate-500 ring-1 ring-slate-100"
            }`}
          >
            {uploadedFile ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Ready
              </>
            ) : (
              "Step"
            )}
          </span>
        </div>

        {/* Empty state */}
        {!uploadedFile ? (
          <div className="p-4 sm:p-5">
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              onChange={handleInputChange}
            />

            <div
              role="button"
              tabIndex={0}
              aria-label={`Upload ${title}`}
              onClick={openFilePicker}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  openFilePicker();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex min-h-65 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[17px] border border-dashed px-6 py-8 text-center transition-all duration-200 ${
                isDragging
                  ? "border-orange-400 bg-orange-50 shadow-inner"
                  : "border-slate-300 bg-[#fbfbfc] hover:border-orange-300 hover:bg-orange-50/35"
              }`}
            >
              {/* Decorative accents */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-100/50 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-10 h-28 w-28 rounded-full bg-slate-100/80 blur-2xl" />

              <div
                className={`relative flex h-14.5 w-14.5 items-center justify-center rounded-2xl border transition-all duration-200 ${
                  isDragging
                    ? "scale-105 border-orange-200 bg-orange-100 text-orange-600"
                    : "border-slate-200 bg-white text-slate-500 shadow-[0_4px_14px_rgba(15,23,42,0.05)] group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-500"
                }`}
              >
                <Upload className="h-6 w-6" />
              </div>

              <h3 className="relative mt-5 text-sm font-bold text-slate-950">
                {isDragging
                  ? "Drop your file here"
                  : "Drag & drop your file here"}
              </h3>

              <p className="relative mt-1.5 text-xs text-slate-500">
                or{" "}
                <span className="font-semibold text-orange-500">
                  browse from your computer
                </span>
              </p>

              <div className="relative mt-5 flex flex-wrap justify-center gap-1.5">
                {["PDF", "JPG", "PNG", "WEBP"].map(
                  (format) => (
                    <Badge
                      key={format}
                      variant="secondary"
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold tracking-wide text-slate-600 shadow-none"
                    >
                      {format}
                    </Badge>
                  )
                )}
              </div>

              <p className="relative mt-4 text-[10px] font-medium text-slate-400">
                Maximum file size: 20 MB
              </p>
            </div>

            {validationError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                <p className="text-xs leading-5 text-red-600">
                  {validationError}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Selected file state */
          <div className="space-y-4 p-4 sm:p-5">
            <div className="relative overflow-hidden rounded-[17px] border border-slate-200 bg-slate-50">
              {/* Ready badge */}
              <div className="absolute right-3 top-3 z-10">
                <Badge className="gap-1 rounded-full border border-green-200 bg-white/95 px-2.5 py-1 text-[9px] font-bold text-green-700 shadow-sm backdrop-blur hover:bg-white">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready
                </Badge>
              </div>

              {isImageFile(uploadedFile.file) ? (
                <div className="flex max-h-68.75 min-h-55 items-center justify-center bg-slate-100/60 p-4">
                  <img
                    src={uploadedFile.previewUrl}
                    alt={uploadedFile.file.name}
                    className="max-h-62.5 max-w-full rounded-xl object-contain shadow-[0_5px_18px_rgba(15,23,42,0.12)]"
                  />
                </div>
              ) : (
                <div className="flex h-66.25 flex-col items-center justify-center bg-linear-to-b from-slate-50 to-white px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
                    <FileText className="h-8 w-8" />
                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-900">
                    PDF document
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    Your document is ready for AI processing.
                  </p>
                </div>
              )}
            </div>

            {/* File details */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">
                  {uploadedFile.file.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatFileSize(uploadedFile.file.size)}
                  {" · "}
                  {isPdfFile(uploadedFile.file)
                    ? "PDF"
                    : "Image"}
                </p>
              </div>

              <div className="hidden shrink-0 items-center gap-1 text-[10px] font-semibold text-green-600 sm:flex">
                <Check className="h-3.5 w-3.5" />
                Valid file
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  File ready
                </span>

                <span className="text-[11px] font-bold text-slate-700">
                  {uploadedFile.progress}%
                </span>
              </div>

              <Progress
                value={uploadedFile.progress}
                className="h-1.5"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-semibold transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                onClick={handleReplace}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Replace file
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl border-slate-200 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                onClick={onRemove}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span>
                {isPdfFile(uploadedFile.file)
                  ? "PDF document"
                  : "Image document"}
              </span>

              <span className="text-green-600">
                Ready for processing
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UploadCard;

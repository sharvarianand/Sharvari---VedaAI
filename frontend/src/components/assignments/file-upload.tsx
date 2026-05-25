"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { UploadedFileMeta } from "@/types/assignment";

interface FileUploadProps {
  value: UploadedFileMeta | null;
  onChange: (next: UploadedFileMeta | null) => void;
  /** Raw file kept in memory for multipart upload (not persisted). */
  onFileSelect?: (file: File | null) => void;
  /** Comma-separated MIME pattern, e.g. "image/png,image/jpeg,application/pdf". */
  accept?: string;
  /** Hard limit in bytes (default 10 MB). */
  maxSize?: number;
  hint?: string;
}

const MB = 1024 * 1024;

/**
 * Drag-and-drop upload zone with a fallback "Browse files" button.
 * Validates size + accept; surfaces a friendly error inline.
 */
export function FileUpload({
  value,
  onChange,
  onFileSelect,
  accept = "image/jpeg,image/png,application/pdf,text/plain",
  maxSize = 10 * MB,
  hint = "JPEG, PNG, PDF, or text — up to 10 MB",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptList = accept.split(",").map((s) => s.trim()).filter(Boolean);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      setError(null);
      const file = files?.[0];
      if (!file) {
        onChange(null);
        onFileSelect?.(null);
        return;
      }
      if (acceptList.length && !acceptList.includes(file.type)) {
        onChange(null);
        onFileSelect?.(null);
        setError(`Unsupported format. Allowed: ${hint}`);
        return;
      }
      if (file.size > maxSize) {
        onChange(null);
        onFileSelect?.(null);
        setError(`File too large. Max ${(maxSize / MB).toFixed(0)} MB.`);
        return;
      }
      onChange({ name: file.name, size: file.size, type: file.type });
      onFileSelect?.(file);
    },
    [acceptList, hint, maxSize, onChange, onFileSelect]
  );

  return (
    <div className="flex flex-col items-stretch">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed",
          "bg-surface px-6 py-10 text-center transition",
          isDragging
            ? "border-brand bg-brand/5"
            : "border-line-strong hover:border-ink-muted"
        )}
      >
        {value ? (
          <div className="flex items-center gap-3 rounded-full bg-surface-muted px-4 py-2">
            <span className="text-[14px] font-medium text-ink">{value.name}</span>
            <span className="text-[12px] text-ink-muted">
              {(value.size / MB).toFixed(2)} MB
            </span>
            <button
              type="button"
              aria-label="Remove file"
              onClick={() => {
                onChange(null);
                onFileSelect?.(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="grid h-6 w-6 place-items-center rounded-full hover:bg-surface"
            >
              <X className="h-3.5 w-3.5 text-ink-muted" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-7 w-7 text-ink-muted" strokeWidth={1.5} />
            <p className="mt-3 text-[15px] font-semibold text-ink">
              Choose a file or drag &amp; drop it here
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">{hint}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 rounded-full bg-surface px-4 py-1.5 text-[13px] font-medium text-ink ring-1 ring-line-strong hover:bg-surface-muted"
            >
              Browse Files
            </button>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </div>

      <p className="mt-2 text-center text-[12px] text-ink-muted">
        Optional — upload study material (PDF, text, or images)
      </p>
      {error && (
        <p className="mt-1 text-center text-[12px] text-danger">{error}</p>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  deleteRegistrationDocument,
  signedDocumentUrl,
  useRegistrationDocuments,
} from "@/hooks/use-registration-documents";
import {
  ALL_DOCUMENT_SLOTS,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MAX_FILES_PER_REGISTRATION,
  DOCUMENT_SLOTS,
  PHOTO_SLOT,
  countPendingDocuments,
  formatBytes,
  slotAcceptAttribute,
  slotAcceptsImagesOnly,
  slotFileLimit,
  validateDocumentFile,
  type PendingDocuments,
  type RegistrationDocument,
  type RegistrationDocumentType,
} from "@/lib/documents";
import { formatDateTime } from "@/lib/registry";
import { errorMessage } from "@/lib/utils";

const acceptedSummary = `PDF, JPG, PNG, HEIC or WEBP · up to ${formatBytes(
  DOCUMENT_MAX_BYTES,
)} per file · up to ${DOCUMENT_MAX_FILES_PER_REGISTRATION} files per registration`;

/**
 * Slot picker used before a registration row exists. Files are held in the
 * browser and uploaded once the record has been created.
 */
export function PendingDocumentSlots({
  value,
  onChange,
  disabled,
}: {
  value: PendingDocuments;
  onChange: (next: PendingDocuments) => void;
  disabled?: boolean;
}) {
  function addFiles(slot: RegistrationDocumentType, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const existing = value[slot] ?? [];
    const accepted: File[] = [];
    const slotLimit = slotFileLimit(slot);
    let total = countPendingDocuments(value);

    for (const file of Array.from(fileList)) {
      const problem = validateDocumentFile(file, slot);
      if (problem) {
        toast.error(problem);
        continue;
      }
      if (existing.some((f) => f.name === file.name && f.size === file.size)) continue;
      if (existing.length + accepted.length >= slotLimit) {
        toast.error(`Up to ${slotLimit} files in this card`);
        break;
      }
      if (total >= DOCUMENT_MAX_FILES_PER_REGISTRATION) {
        toast.error(`Up to ${DOCUMENT_MAX_FILES_PER_REGISTRATION} files per registration`);
        break;
      }
      accepted.push(file);
      total += 1;
    }

    if (accepted.length === 0) return;
    onChange({ ...value, [slot]: [...existing, ...accepted] });
  }

  function removeFile(slot: RegistrationDocumentType, index: number) {
    const next = (value[slot] ?? []).filter((_, i) => i !== index);
    onChange({ ...value, [slot]: next });
  }

  function slotBody(slot: (typeof ALL_DOCUMENT_SLOTS)[number]) {
    const files = value[slot.value] ?? [];
    const isPhotos = slotAcceptsImagesOnly(slot.value);
    return (
      <DocumentSlotShell
        key={slot.value}
        label={slot.label}
        hint={slot.hint}
        className={isPhotos ? "md:col-span-2" : undefined}
      >
        <SlotFilePicker
          slot={slot.value}
          disabled={disabled}
          onFiles={(files) => addFiles(slot.value, files)}
        />
        {files.length === 0 ? null : isPhotos ? (
          <PhotoStrip files={files} disabled={disabled} onRemove={(i) => removeFile(slot.value, i)} />
        ) : (
          <ul className="mt-3 grid gap-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeFile(slot.value, index)}
                  className="shrink-0 text-xs underline underline-offset-4 hover:text-destructive"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </DocumentSlotShell>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">{acceptedSummary}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {DOCUMENT_SLOTS.map((slot) => slotBody(slot))}
        {slotBody(PHOTO_SLOT)}
      </div>
    </div>
  );
}

/** Thumbnail strip for photos chosen but not yet uploaded. */
function PhotoStrip({
  files,
  disabled,
  onRemove,
}: {
  files: File[];
  disabled?: boolean;
  onRemove: (index: number) => void;
}) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const next = files.map((file) => URL.createObjectURL(file));
    setUrls(next);
    return () => next.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  return (
    <ul className="mt-3 flex flex-wrap gap-3">
      {files.map((file, index) => (
        <li key={`${file.name}-${file.size}-${index}`} className="relative">
          <img
            src={urls[index]}
            alt={file.name}
            className="size-20 rounded-xl border border-border object-cover"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemove(index)}
            aria-label={`Remove ${file.name}`}
            className="absolute -right-2 -top-2 rounded-full border border-border bg-card px-2 text-xs shadow-sm hover:text-destructive"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Slot list for a saved registration. Owners can add and remove while the
 * record is still editable; staff and read-only viewers just open files.
 */
export function RegistrationDocumentSlots({
  registrationId,
  userId,
  editable = false,
  emptyLabel = "No documents attached.",
  onUpload,
}: {
  registrationId: string;
  userId?: string;
  editable?: boolean;
  emptyLabel?: string;
  onUpload?: (slot: RegistrationDocumentType, files: FileList) => Promise<void>;
}) {
  const { data: documents, isLoading, refetch } = useRegistrationDocuments(registrationId);
  const [busyId, setBusyId] = useState<string | null>(null);

  const bySlot = new Map<RegistrationDocumentType, RegistrationDocument[]>();
  for (const document of documents ?? []) {
    const list = bySlot.get(document.document_type) ?? [];
    list.push(document);
    bySlot.set(document.document_type, list);
  }

  async function open(document: RegistrationDocument) {
    setBusyId(document.id);
    try {
      const url = await signedDocumentUrl(document.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(errorMessage(error, "Could not open this document"));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(document: RegistrationDocument) {
    setBusyId(document.id);
    try {
      await deleteRegistrationDocument(document);
      toast.success("Document removed");
      await refetch();
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove this document"));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading documents…</p>;
  }

  const total = documents?.length ?? 0;
  if (total === 0 && !editable) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-4">
      {editable ? <p className="text-xs text-muted-foreground">{acceptedSummary}</p> : null}
      {ALL_DOCUMENT_SLOTS.map((slot) => {
        const files = bySlot.get(slot.value) ?? [];
        if (!editable && files.length === 0) return null;
        return (
          <DocumentSlotShell
            key={slot.value}
            label={slot.label}
            hint={editable ? slot.hint : undefined}
          >
            {editable && onUpload ? (
              <SlotFilePicker
                slot={slot.value}
                disabled={Boolean(busyId)}
                onFiles={(fileList) => {
                  if (!fileList || !userId) return;
                  void onUpload(slot.value, fileList).then(() => refetch());
                }}
              />
            ) : null}
            {files.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Nothing attached.</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {files.map((document) => (
                  <li
                    key={document.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <button
                      type="button"
                      disabled={busyId === document.id}
                      onClick={() => void open(document)}
                      className="min-w-0 flex-1 truncate text-left underline underline-offset-4"
                    >
                      {document.file_name}
                    </button>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatBytes(Number(document.byte_size))} ·{" "}
                      {formatDateTime(document.uploaded_at)}
                    </span>
                    {editable ? (
                      <button
                        type="button"
                        disabled={busyId === document.id}
                        onClick={() => void remove(document)}
                        className="shrink-0 text-xs underline underline-offset-4 hover:text-destructive"
                      >
                        Remove
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </DocumentSlotShell>
        );
      })}
    </div>
  );
}

function DocumentSlotShell({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card/60 p-4 ${className ?? ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{label}</p>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

/** Click-to-browse plus a drag-and-drop target for the same slot. */
function SlotFilePicker({
  slot,
  disabled,
  onFiles,
}: {
  slot: RegistrationDocumentType;
  disabled?: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `document-slot-${slot}`;
  const [dragging, setDragging] = useState(false);

  return (
    <>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        accept={slotAcceptAttribute(slot)}
        disabled={disabled}
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          onFiles(event.dataTransfer.files);
        }}
        className={`mt-3 flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-4 text-sm transition-colors ${
          dragging
            ? "border-primary bg-primary/5 text-foreground"
            : "border-border bg-surface/60 text-muted-foreground hover:border-primary/60"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span className="font-medium text-foreground">Drag files here</span>
        <span className="text-xs">or click to browse</span>
      </button>
    </>
  );
}

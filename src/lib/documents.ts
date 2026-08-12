import type { Tables } from "@/integrations/supabase/types";

export const REGISTRATION_DOCUMENTS_BUCKET = "registration-documents";

export type RegistrationDocument = Tables<"registration_documents">;
export type RegistrationDocumentType = RegistrationDocument["document_type"];

/** Ordered document slots. One dedicated upload destination per evidence type
 * so submissions arrive pre-sorted for review. */
export const DOCUMENT_SLOTS = [
  {
    value: "deed_title",
    label: "Deed or title document",
    hint: "The recorded instrument naming the owner.",
  },
  {
    value: "tax_statement",
    label: "Property tax statement or assessor record",
    hint: "Shows who the jurisdiction bills for this parcel.",
  },
  {
    value: "mortgage_statement",
    label: "Mortgage, loan or payoff statement",
    hint: "A lender's record naming the owner.",
  },
  {
    value: "insurance_declaration",
    label: "Homeowners insurance declaration page",
    hint: "An insurer's record naming the owner.",
  },
  {
    value: "utility_occupancy",
    label: "Utility bill or occupancy proof",
    hint: "Ties a person to the address.",
  },
  {
    value: "photo_id",
    label: "Government-issued photo ID",
    hint: "Identity of the person making this submission.",
  },
  {
    value: "authority_document",
    label: "Authority document",
    hint: "Power of attorney, authorization letter, trust or LLC formation, probate or estate letters.",
  },
  {
    value: "other",
    label: "Other supporting document",
    hint: "Survey, closing statement, HOA letter, or anything that does not fit above.",
  },
] as const satisfies readonly { value: RegistrationDocumentType; label: string; hint: string }[];

/** Photos live in their own wide card at the end of the documents step. */
export const PHOTO_SLOT = {
  value: "property_photo",
  label: "Photos of the property",
  hint: "Exterior, street view, and any detail worth showing. Images only.",
} as const satisfies { value: RegistrationDocumentType; label: string; hint: string };

export const ALL_DOCUMENT_SLOTS = [...DOCUMENT_SLOTS, PHOTO_SLOT] as const;

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
] as const;

export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  ...ACCEPTED_IMAGE_MIME_TYPES,
] as const;

/** Some browsers report an empty type for .heic — fall back to the extension. */
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"];
const DOCUMENT_EXTENSIONS = [".pdf", ...IMAGE_EXTENSIONS];

export const DOCUMENT_ACCEPT_ATTRIBUTE = [
  ...ACCEPTED_DOCUMENT_MIME_TYPES,
  ...DOCUMENT_EXTENSIONS,
].join(",");

export const IMAGE_ACCEPT_ATTRIBUTE = [
  ...ACCEPTED_IMAGE_MIME_TYPES,
  ...IMAGE_EXTENSIONS,
].join(",");

export const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_MAX_FILES_PER_SLOT = 8;
export const PHOTO_MAX_FILES = 12;
export const DOCUMENT_MAX_FILES_PER_REGISTRATION = 40;

/** Photo slots take images only; every other slot also accepts a PDF scan. */
export function slotAcceptsImagesOnly(slot: RegistrationDocumentType) {
  return slot === PHOTO_SLOT.value;
}

export function slotAcceptAttribute(slot: RegistrationDocumentType) {
  return slotAcceptsImagesOnly(slot) ? IMAGE_ACCEPT_ATTRIBUTE : DOCUMENT_ACCEPT_ATTRIBUTE;
}

export function slotFileLimit(slot: RegistrationDocumentType) {
  return slotAcceptsImagesOnly(slot) ? PHOTO_MAX_FILES : DOCUMENT_MAX_FILES_PER_SLOT;
}

export function documentSlotLabel(value: RegistrationDocumentType) {
  return ALL_DOCUMENT_SLOTS.find((slot) => slot.value === value)?.label ?? "Document";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns an error message when the file cannot be accepted, otherwise null. */
export function validateDocumentFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const typeOk = (ACCEPTED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type);
  const extensionOk = ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension));
  if (!typeOk && !extensionOk) {
    return `${file.name}: only PDF, JPG, PNG and HEIC files are accepted`;
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    return `${file.name}: files must be ${formatBytes(DOCUMENT_MAX_BYTES)} or smaller`;
  }
  if (file.size === 0) {
    return `${file.name}: this file is empty`;
  }
  return null;
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
}

/** Object path is {user_id}/{registration_id}/{document_type}/{uuid}-{filename}
 * so storage policies can authorize on the leading user folder. */
export function buildDocumentStoragePath(input: {
  userId: string;
  registrationId: string;
  documentType: RegistrationDocumentType;
  fileName: string;
}) {
  const unique = crypto.randomUUID();
  return `${input.userId}/${input.registrationId}/${input.documentType}/${unique}-${safeFileName(
    input.fileName,
  )}`;
}

/** Files chosen before a registration row exists, grouped by slot. */
export type PendingDocuments = Partial<Record<RegistrationDocumentType, File[]>>;

export function countPendingDocuments(pending: PendingDocuments) {
  return Object.values(pending).reduce((total, files) => total + (files?.length ?? 0), 0);
}

import { z } from "zod";

export const REGISTRATION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "needs_information",
  "approved",
  "anchoring",
  "anchored",
  "rejected",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const statusLabels: Record<RegistrationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  needs_information: "Needs information",
  approved: "Approved",
  anchoring: "Anchoring",
  anchored: "Anchored",
  rejected: "Rejected",
};

export const statusHelp: Record<RegistrationStatus, string> = {
  draft: "Saved privately. Not yet sent to the registry team.",
  submitted: "Received by the registry. Waiting to be picked up for review.",
  under_review: "A reviewer is checking the submitted evidence.",
  needs_information: "We need something else from you before review can continue.",
  approved: "Review complete. Eligible for a tamper-evident record proof.",
  anchoring: "A record proof is being prepared and published.",
  anchored: "A tamper-evident record proof has been published and validated.",
  rejected: "This record could not be accepted into the registry.",
};

export const relationshipOptions = [
  { value: "owner", label: "Owner" },
  { value: "authorized_representative", label: "Authorized representative" },
  { value: "property_professional", label: "Property professional" },
  { value: "other", label: "Other" },
] as const;

export const propertyTypeOptions = [
  { value: "single_family", label: "Single family" },
  { value: "multi_family", label: "Multi family" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land", label: "Land / lot" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed use" },
  { value: "other", label: "Other" },
] as const;

export function labelFor(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
) {
  return options.find((o) => o.value === value)?.label ?? "—";
}

export const registrationSchema = z.object({
  submitter_full_name: z.string().trim().min(2, "Enter your full name").max(120),
  relationship: z.enum(["owner", "authorized_representative", "property_professional", "other"]),
  relationship_other: z.string().trim().max(160).optional().or(z.literal("")),
  address_line1: z.string().trim().min(3, "Enter the street address").max(200),
  address_line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter the city").max(120),
  state: z.string().trim().min(2, "Enter the state").max(60),
  postal_code: z
    .string()
    .trim()
    .regex(/^[0-9]{5}(-[0-9]{4})?$/, "Enter a 5 or 9 digit ZIP code"),
  county: z.string().trim().min(2, "Enter the county or jurisdiction").max(120),
  parcel_id: z.string().trim().max(80).optional().or(z.literal("")),
  property_type: z.enum([
    "single_family",
    "multi_family",
    "condo",
    "townhouse",
    "land",
    "commercial",
    "mixed_use",
    "other",
  ]),
  public_source_notes: z.string().trim().max(4000).optional().or(z.literal("")),
  user_note: z.string().trim().max(4000).optional().or(z.literal("")),
  affirm_accurate: z.boolean(),
  affirm_authorized: z.boolean(),
  affirm_not_title: z.boolean(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const emptyRegistration: RegistrationInput = {
  submitter_full_name: "",
  relationship: "owner",
  relationship_other: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "MO",
  postal_code: "",
  county: "",
  parcel_id: "",
  property_type: "single_family",
  public_source_notes: "",
  user_note: "",
  affirm_accurate: false,
  affirm_authorized: false,
  affirm_not_title: false,
};

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

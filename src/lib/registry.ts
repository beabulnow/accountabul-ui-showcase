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
  "correction_sent",
  "confirmed_by_user",
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
  correction_sent: "Needs your confirmation",
  confirmed_by_user: "Confirmed by you",
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
  correction_sent:
    "We checked your details and suggested a few corrections. Review them and confirm or tell us what's wrong.",
  confirmed_by_user: "You confirmed the reviewed details. The registry team is finalising this record.",
};

export const relationshipOptions = [
  { value: "owner", label: "Owner" },
  { value: "authorized_representative", label: "Authorized representative" },
  { value: "property_professional", label: "Licensed real estate professional" },
  { value: "other", label: "Other" },
] as const;

/**
 * The specific title a submitter holds in relation to the property. Each title
 * maps to one of the four `submitter_relationship` database categories, so the
 * stored enum stays unchanged while the person selects an accurate title.
 */
export const relationshipTitleOptions = [
  // Owner
  { value: "individual_owner", label: "Individual owner", relationship: "owner" },
  { value: "co_owner", label: "Co-owner / joint owner", relationship: "owner" },
  { value: "trustee_owner", label: "Trustee of the owning trust", relationship: "owner" },
  {
    value: "entity_owner",
    label: "Owner through a company (LLC member, partner, or officer)",
    relationship: "owner",
  },
  { value: "heir_owner", label: "Heir or beneficiary of the owner", relationship: "owner" },

  // Authorized representative
  {
    value: "attorney_of_record",
    label: "Attorney of record for the owner",
    relationship: "authorized_representative",
  },
  {
    value: "power_of_attorney",
    label: "Power of attorney holder",
    relationship: "authorized_representative",
  },
  {
    value: "executor",
    label: "Executor or administrator of the estate",
    relationship: "authorized_representative",
  },
  {
    value: "guardian",
    label: "Guardian or conservator of the owner",
    relationship: "authorized_representative",
  },
  {
    value: "corporate_officer",
    label: "Officer or authorized signer for the owning company",
    relationship: "authorized_representative",
  },
  {
    value: "property_manager",
    label: "Property manager acting for the owner",
    relationship: "authorized_representative",
  },

  // Licensed real estate professional
  {
    value: "licensed_broker",
    label: "Licensed real estate broker",
    relationship: "property_professional",
  },
  {
    value: "licensed_salesperson",
    label: "Licensed real estate salesperson or agent",
    relationship: "property_professional",
  },
  {
    value: "designated_managing_broker",
    label: "Designated or managing broker of the brokerage",
    relationship: "property_professional",
  },
  {
    value: "real_estate_attorney",
    label: "Real estate attorney handling the transaction",
    relationship: "property_professional",
  },
  {
    value: "title_closing_agent",
    label: "Title or closing agent of record",
    relationship: "property_professional",
  },
  {
    value: "licensed_appraiser",
    label: "Licensed real estate appraiser",
    relationship: "property_professional",
  },

  // Other
  { value: "other", label: "Other (describe your title)", relationship: "other" },
] as const;

export type RelationshipTitle = (typeof relationshipTitleOptions)[number]["value"];

export const relationshipTitleGroups = relationshipOptions.map((group) => ({
  ...group,
  titles: relationshipTitleOptions.filter((title) => title.relationship === group.value),
}));

export function relationshipTitleLabel(value: string | null | undefined) {
  return relationshipTitleOptions.find((title) => title.value === value)?.label ?? null;
}

/** Display string for a saved registration: the specific title when one was
 * captured, otherwise the broader relationship category. */
export function relationshipDisplay(
  relationship: string | null | undefined,
  relationshipOther: string | null | undefined,
) {
  const title = relationshipOther?.trim();
  if (title) return title;
  return labelFor(relationshipOptions, relationship);
}


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

export const registrationSchema = z
  .object({
    submitter_full_name: safeText(120).refine(
      (value) => value.length >= 2,
      "Enter your full name",
    ),
    relationship: z.enum(["owner", "authorized_representative", "property_professional", "other"]),
    relationship_title: z
      .string()
      .min(1, "Select the title that describes your role for this property"),
    relationship_other: safeText(160).optional(),
    address_line1: safeText(200).refine((value) => value.length >= 3, "Enter the street address"),
    address_line2: safeText(200).optional(),
    city: safeText(120).refine((value) => value.length >= 2, "Enter the city"),
    state: safeText(60).refine((value) => value.length >= 2, "Enter the state"),
    postal_code: z
      .string()
      .trim()
      .regex(/^[0-9]{5}(-[0-9]{4})?$/, "Enter a 5 or 9 digit ZIP code"),
    county: safeText(120).refine(
      (value) => value.length >= 2,
      "Enter the county or jurisdiction",
    ),
    parcel_id: safeText(80).optional(),
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
  })
  .superRefine((value, ctx) => {
    if (value.relationship_title === "other" && !value.relationship_other?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["relationship_other"],
        message: "Describe your title or relationship to this property",
      });
    }
  });

/** Statuses a reviewer can set by hand. `anchored` is written only by the
 * anchoring pipeline, which must supply a complete validated on-chain proof;
 * offering it in the UI would surface an action the database always rejects. */
export const STAFF_SETTABLE_STATUSES = REGISTRATION_STATUSES.filter(
  (status) => status !== "anchored",
);

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const emptyRegistration: RegistrationInput = {
  submitter_full_name: "",
  relationship: "owner",
  relationship_title: "individual_owner",
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

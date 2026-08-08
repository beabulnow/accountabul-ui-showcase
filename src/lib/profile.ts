import { z } from "zod";

import type { Tables } from "@/integrations/supabase/types";

export const PROFILE_NOTICE_VERSION = "profile-notice-v1";
export const PROFILE_AVATAR_BUCKET = "profile-avatars";
export const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const PROFILE_SELECT =
  "id, email, full_name, first_name, middle_name, last_name, date_of_birth, phone_e164, phone_verified_at, bio, avatar_path, profile_completed_at, privacy_accepted_at, privacy_policy_version, created_at, updated_at" as const;

export type Profile = Tables<"profiles">;

export const profileSchema = z.object({
  first_name: z.string().trim().min(1, "Enter your first name").max(80),
  middle_name: z.string().trim().max(80).optional().or(z.literal("")),
  last_name: z.string().trim().min(1, "Enter your last name").max(80),
  date_of_birth: z
    .string()
    .min(1, "Enter your date of birth")
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00`)), "Enter a valid date")
    .refine(
      (value) => value <= new Date().toISOString().slice(0, 10),
      "Date cannot be in the future",
    ),
  phone: z
    .string()
    .trim()
    .min(1, "Enter your phone number")
    .transform(normalizePhone)
    .refine((value) => /^\+[1-9][0-9]{7,14}$/.test(value), {
      message: "Enter a valid phone number with country code",
    }),
  bio: z.string().trim().max(500, "Bio must be 500 characters or fewer").optional(),
  privacy_accepted: z.literal(true, {
    errorMap: () => ({ message: "Confirm the identity-information notice to continue" }),
  }),
});

/**
 * Editable form state. The schema requires `privacy_accepted` to be literally
 * `true`, but the checkbox must be able to hold `false` before submission.
 */
export type ProfileFormInput = Omit<z.input<typeof profileSchema>, "privacy_accepted"> & {
  privacy_accepted: boolean;
};

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

export function profileDisplayName(
  profile:
    Pick<Profile, "first_name" | "middle_name" | "last_name" | "full_name"> | null | undefined,
) {
  if (!profile) return "Your account";
  const structured = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  return structured || profile.full_name || "Your account";
}

export function isProfileComplete(
  profile:
    | Pick<
        Profile,
        | "first_name"
        | "last_name"
        | "date_of_birth"
        | "phone_e164"
        | "privacy_accepted_at"
        | "privacy_policy_version"
        | "profile_completed_at"
      >
    | null
    | undefined,
) {
  return Boolean(
    profile?.profile_completed_at &&
    profile.first_name &&
    profile.last_name &&
    profile.date_of_birth &&
    profile.phone_e164 &&
    profile.privacy_accepted_at &&
    profile.privacy_policy_version,
  );
}

export function initialsFor(name: string | null | undefined) {
  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "A";
}

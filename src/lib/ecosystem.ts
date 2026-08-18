import type { Tables } from "@/integrations/supabase/types";

export type EcosystemApp = Pick<
  Tables<"ecosystem_apps">,
  "id" | "slug" | "name" | "description" | "home_url" | "is_first_party" | "sort_order"
>;

export type AppConsent = Pick<
  Tables<"app_consents">,
  "id" | "app_id" | "scopes" | "granted_at" | "revoked_at" | "updated_at"
>;

export const ECOSYSTEM_APP_SELECT =
  "id, slug, name, description, home_url, is_first_party, sort_order" as const;

export const APP_CONSENT_SELECT =
  "id, app_id, scopes, granted_at, revoked_at, updated_at" as const;

/** Version of the ecosystem sharing notice the user agreed to. */
export const ECOSYSTEM_CONSENT_VERSION = "ecosystem-notice-v1";

export const SHARED_SCOPES = [
  "profile.avatar",
  "profile.name",
  "profile.phone",
  "profile.email",
] as const;

export type SharedScope = (typeof SHARED_SCOPES)[number];

export const SHARED_FIELD_COPY: { scope: SharedScope; label: string; detail: string }[] = [
  {
    scope: "profile.avatar",
    label: "Profile photo",
    detail: "The picture you uploaded to your Verifiabul account.",
  },
  {
    scope: "profile.name",
    label: "First and last name",
    detail: "So the app can greet you and pre-fill forms.",
  },
  {
    scope: "profile.phone",
    label: "Phone number",
    detail: "Used for account notices, never sold or shared outside our apps.",
  },
  {
    scope: "profile.email",
    label: "Email address",
    detail: "Links your account across the ecosystem.",
  },
];

export function isConsentActive(consent: AppConsent | undefined | null) {
  return Boolean(consent?.granted_at && !consent.revoked_at);
}

export function consentByAppId(consents: AppConsent[] | undefined) {
  const map = new Map<string, AppConsent>();
  for (const consent of consents ?? []) map.set(consent.app_id, consent);
  return map;
}

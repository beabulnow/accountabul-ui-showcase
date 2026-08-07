/**
 * Data contract for the Accountabul UI hackathon baseline.
 *
 * UI-ONLY: no demo records. Every collection below is intentionally empty so the
 * app renders its empty states. When the database is wired later, replace these
 * module-level constants with loader/query calls of the same shape — components
 * read only the types declared in this file.
 *
 * `trustPrinciples` and `trustChecks` are editorial page copy, not records.
 */

export type EvidenceStatus = "verified" | "pending" | "flagged";

export interface EvidenceItem {
  id: string;
  label: string;
  source: string;
  updated: string;
  status: EvidenceStatus;
  note: string;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  address: string;
  city: string;
  region: string;
  price: string;
  priceValue: number;
  beds: number;
  baths: number;
  sqft: number;
  type: "House" | "Apartment" | "Townhome" | "Land";
  trustScore: number;
  evidenceCount: number;
  summary: string;
  highlights: string[];
  image: string;
  evidence: EvidenceItem[];
  timeline: { date: string; event: string; detail: string }[];
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  firm: string;
  city: string;
  verifiedSince: string;
  licence: string;
  rating: number;
  reviews: number;
  specialties: string[];
  bio: string;
  avatar: string;
  checks: { label: string; status: EvidenceStatus }[];
}

export const properties: Property[] = [];

export const professionals: Professional[] = [];

export const trustPrinciples = [
  {
    title: "Evidence before claims",
    body: "Nothing appears on a listing unless a document, register entry or licensed professional stands behind it. Gaps are shown, not hidden.",
  },
  {
    title: "Named sources",
    body: "Every fact carries its source and the date it was last checked, so you can judge how fresh the evidence is.",
  },
  {
    title: "Verified people",
    body: "Professionals are matched to public registers before they can attach evidence to a property.",
  },
  {
    title: "Visible gaps",
    body: "Missing or unverifiable items are surfaced as open questions rather than quietly dropped from the record.",
  },
];

export const trustChecks = [
  { label: "Identity", detail: "Government ID matched to the register entry", cadence: "At onboarding" },
  { label: "Licence", detail: "Practising status checked against the issuing body", cadence: "Quarterly" },
  { label: "Insurance", detail: "Professional indemnity certificate on file", cadence: "Annually" },
  { label: "Complaints", detail: "Public complaints and sanctions record reviewed", cadence: "Quarterly" },
  { label: "Work sample", detail: "Recent report or job audited by our review team", cadence: "Annually" },
];

export const workspaceStats: { label: string; value: string; delta: string }[] = [];

export const workspaceTasks: { id: string; title: string; owner: string; due: string; state: "blocked" | "active" | "done" }[] = [];

export const workspaceActivity: { id: string; when: string; who: string; what: string }[] = [];

export function getPropertyBySlug(slug: string) {
  return properties.find((p) => p.slug === slug);
}

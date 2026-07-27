/**
 * Mock/demo data for the Accountabul UI hackathon baseline.
 *
 * UI-ONLY: every export here is static and synchronous. When the database is
 * wired later, replace these module-level constants with loader/query calls of
 * the same shape — components read only the types declared in this file.
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

const img = (seed: string, w = 1200, h = 800) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

export const properties: Property[] = [
  {
    id: "p-1",
    slug: "elm-row-14",
    title: "14 Elm Row",
    address: "14 Elm Row, Stockbridge",
    city: "Edinburgh",
    region: "Scotland",
    price: "£615,000",
    priceValue: 615000,
    beds: 4,
    baths: 2,
    sqft: 1840,
    type: "House",
    trustScore: 94,
    evidenceCount: 12,
    summary:
      "Georgian terrace with a full documentation trail: title deeds, EPC, structural survey and two independent contractor quotes all filed and timestamped.",
    highlights: ["Title deeds on file", "EPC B", "Survey 3 months old", "No outstanding disputes"],
    image: img("photo-1568605114967-8130f3a36994"),
    evidence: [
      {
        id: "e-1",
        label: "Title deed & ownership chain",
        source: "Registers of Scotland",
        updated: "12 Mar 2026",
        status: "verified",
        note: "Single registered owner since 2011. No competing claims found.",
      },
      {
        id: "e-2",
        label: "Structural survey (Level 3)",
        source: "Harlow & Finch Surveyors",
        updated: "04 Apr 2026",
        status: "verified",
        note: "Two minor items noted: rear gutter and chimney flashing.",
      },
      {
        id: "e-3",
        label: "Energy performance certificate",
        source: "Scottish EPC Register",
        updated: "22 Jan 2026",
        status: "verified",
        note: "Rated B (84). Valid to 2036.",
      },
      {
        id: "e-4",
        label: "Roof replacement quote",
        source: "Cairn Roofing Ltd",
        updated: "18 Apr 2026",
        status: "pending",
        note: "Second quote requested to corroborate scope and pricing.",
      },
    ],
    timeline: [
      { date: "18 Apr 2026", event: "Quote uploaded", detail: "Cairn Roofing Ltd — awaiting corroboration" },
      { date: "04 Apr 2026", event: "Survey verified", detail: "Level 3 survey matched to surveyor licence" },
      { date: "12 Mar 2026", event: "Listing published", detail: "Ownership chain confirmed before publication" },
    ],
  },
  {
    id: "p-2",
    slug: "harbour-view-7b",
    title: "Harbour View 7B",
    address: "7B Harbour View, Leith",
    city: "Edinburgh",
    region: "Scotland",
    price: "£348,500",
    priceValue: 348500,
    beds: 2,
    baths: 1,
    sqft: 890,
    type: "Apartment",
    trustScore: 78,
    evidenceCount: 8,
    summary:
      "Waterfront apartment with a strong ownership record. Factor accounts are still being corroborated, so the trust score is held below 80.",
    highlights: ["Title deeds on file", "EPC C", "Factor accounts pending", "Cladding report filed"],
    image: img("photo-1502672260266-1c1ef2d93688"),
    evidence: [
      {
        id: "e-5",
        label: "Title deed & ownership chain",
        source: "Registers of Scotland",
        updated: "02 Feb 2026",
        status: "verified",
        note: "Clean chain, last transfer 2019.",
      },
      {
        id: "e-6",
        label: "Factor accounts (3 years)",
        source: "Seaforth Property Management",
        updated: "27 Mar 2026",
        status: "pending",
        note: "Year 2 statement missing; requested from factor.",
      },
      {
        id: "e-7",
        label: "External wall system report",
        source: "Nordell Fire Engineering",
        updated: "11 Nov 2025",
        status: "verified",
        note: "EWS1 rating A2. No remediation required.",
      },
    ],
    timeline: [
      { date: "27 Mar 2026", event: "Evidence gap opened", detail: "Missing factor statement flagged to seller" },
      { date: "02 Feb 2026", event: "Listing published", detail: "Published with visible evidence gap" },
    ],
  },
  {
    id: "p-3",
    slug: "kiln-lane-cottage",
    title: "Kiln Lane Cottage",
    address: "3 Kiln Lane, Dunblane",
    city: "Dunblane",
    region: "Scotland",
    price: "£429,000",
    priceValue: 429000,
    beds: 3,
    baths: 2,
    sqft: 1360,
    type: "House",
    trustScore: 88,
    evidenceCount: 10,
    summary:
      "Renovated stone cottage. Building warrant and completion certificate both on file with matched contractor licences.",
    highlights: ["Completion certificate", "EPC C", "Warrant closed", "Two verified contractors"],
    image: img("photo-1512917774080-9991f1c4c750"),
    evidence: [
      {
        id: "e-8",
        label: "Building warrant & completion",
        source: "Stirling Council",
        updated: "09 Dec 2025",
        status: "verified",
        note: "Warrant closed with completion certificate issued.",
      },
      {
        id: "e-9",
        label: "Electrical installation certificate",
        source: "Glenmore Electrical",
        updated: "14 Dec 2025",
        status: "verified",
        note: "Installer registration confirmed against scheme register.",
      },
      {
        id: "e-10",
        label: "Damp report",
        source: "Independent Damp Surveys",
        updated: "30 Jan 2026",
        status: "flagged",
        note: "Report author could not be matched to a current licence. Awaiting reissue.",
      },
    ],
    timeline: [
      { date: "30 Jan 2026", event: "Evidence flagged", detail: "Damp report author unverified" },
      { date: "14 Dec 2025", event: "Certificate verified", detail: "Electrical installation matched to register" },
    ],
  },
  {
    id: "p-4",
    slug: "meadow-gate-22",
    title: "22 Meadow Gate",
    address: "22 Meadow Gate, Bearsden",
    city: "Glasgow",
    region: "Scotland",
    price: "£522,000",
    priceValue: 522000,
    beds: 4,
    baths: 3,
    sqft: 1720,
    type: "Townhome",
    trustScore: 91,
    evidenceCount: 11,
    summary:
      "Family townhome with a complete conveyancing pack pre-assembled by a verified solicitor, reducing typical offer-to-missives time.",
    highlights: ["Home report on file", "EPC B", "Solicitor pack ready", "No disputes"],
    image: img("photo-1600596542815-ffad4c1539a9"),
    evidence: [
      {
        id: "e-11",
        label: "Home report",
        source: "Kelvin Valuation Partners",
        updated: "21 Feb 2026",
        status: "verified",
        note: "Valuation £520,000. Condition category 1 throughout.",
      },
      {
        id: "e-12",
        label: "Conveyancing pack",
        source: "Ailsa Grant LLP",
        updated: "01 Mar 2026",
        status: "verified",
        note: "Prepared and signed off by a verified solicitor.",
      },
    ],
    timeline: [
      { date: "01 Mar 2026", event: "Pack verified", detail: "Solicitor licence matched at upload" },
      { date: "21 Feb 2026", event: "Listing published", detail: "Home report verified before publication" },
    ],
  },
  {
    id: "p-5",
    slug: "quarry-field-plot",
    title: "Quarry Field Plot",
    address: "Quarry Field, Aberfeldy",
    city: "Aberfeldy",
    region: "Scotland",
    price: "£165,000",
    priceValue: 165000,
    beds: 0,
    baths: 0,
    sqft: 0,
    type: "Land",
    trustScore: 66,
    evidenceCount: 5,
    summary:
      "Serviced plot with outline planning. Access rights are documented but the drainage consent is still outstanding.",
    highlights: ["Outline planning", "Access rights filed", "Drainage consent pending"],
    image: img("photo-1500382017468-9049fed747ef"),
    evidence: [
      {
        id: "e-13",
        label: "Outline planning permission",
        source: "Perth & Kinross Council",
        updated: "16 Oct 2025",
        status: "verified",
        note: "Valid for three years from grant.",
      },
      {
        id: "e-14",
        label: "Drainage consent",
        source: "SEPA",
        updated: "—",
        status: "pending",
        note: "Application not yet submitted by the seller.",
      },
    ],
    timeline: [
      { date: "16 Oct 2025", event: "Listing published", detail: "Published with two open evidence items" },
    ],
  },
  {
    id: "p-6",
    slug: "north-parade-9",
    title: "9 North Parade",
    address: "9 North Parade, Old Aberdeen",
    city: "Aberdeen",
    region: "Scotland",
    price: "£289,000",
    priceValue: 289000,
    beds: 3,
    baths: 1,
    sqft: 1180,
    type: "House",
    trustScore: 83,
    evidenceCount: 9,
    summary:
      "Granite terrace near the university. Full rental history and gas safety records supplied by a verified letting agent.",
    highlights: ["Rental history", "Gas safety current", "EPC D", "Verified letting agent"],
    image: img("photo-1580587771525-78b9dba3b914"),
    evidence: [
      {
        id: "e-15",
        label: "Gas safety record",
        source: "Donside Heating",
        updated: "05 Mar 2026",
        status: "verified",
        note: "Engineer registration confirmed.",
      },
      {
        id: "e-16",
        label: "Rental performance history",
        source: "Granite Lets",
        updated: "28 Feb 2026",
        status: "verified",
        note: "36 months of occupancy and rent data supplied.",
      },
    ],
    timeline: [
      { date: "05 Mar 2026", event: "Certificate verified", detail: "Gas safety record renewed" },
    ],
  },
];

export const professionals: Professional[] = [
  {
    id: "pro-1",
    name: "Maren Cairncross",
    role: "Solicitor",
    firm: "Ailsa Grant LLP",
    city: "Edinburgh",
    verifiedSince: "2023",
    licence: "LSS-88214",
    rating: 4.9,
    reviews: 128,
    specialties: ["Conveyancing", "Missives", "Title review"],
    bio: "Residential conveyancing with a focus on pre-assembled packs that shorten offer-to-missives time.",
    avatar: img("photo-1573497019940-1c28c88b4f3e", 400, 400),
    checks: [
      { label: "Practising certificate", status: "verified" },
      { label: "Professional indemnity", status: "verified" },
      { label: "Complaints record", status: "verified" },
    ],
  },
  {
    id: "pro-2",
    name: "Tomas Rekdal",
    role: "Chartered Surveyor",
    firm: "Harlow & Finch",
    city: "Edinburgh",
    verifiedSince: "2022",
    licence: "RICS-40917",
    rating: 4.8,
    reviews: 94,
    specialties: ["Level 3 surveys", "Historic buildings", "Damp & timber"],
    bio: "Level 2 and 3 surveys on pre-1919 stock, with photographic evidence attached to every finding.",
    avatar: img("photo-1500648767791-00dcc994a43e", 400, 400),
    checks: [
      { label: "RICS registration", status: "verified" },
      { label: "Professional indemnity", status: "verified" },
      { label: "Sample report audit", status: "verified" },
    ],
  },
  {
    id: "pro-3",
    name: "Iona Fleet",
    role: "Mortgage Adviser",
    firm: "Fleet & Co",
    city: "Glasgow",
    verifiedSince: "2024",
    licence: "FCA-771204",
    rating: 4.7,
    reviews: 61,
    specialties: ["First-time buyers", "Self-employed", "Portfolio lending"],
    bio: "Whole-of-market adviser. Publishes lender decision rationale alongside every recommendation.",
    avatar: img("photo-1580489944761-15a19d654956", 400, 400),
    checks: [
      { label: "FCA register entry", status: "verified" },
      { label: "Professional indemnity", status: "verified" },
      { label: "Disclosure statement", status: "pending" },
    ],
  },
  {
    id: "pro-4",
    name: "Dev Prashar",
    role: "Building Contractor",
    firm: "Cairn Works",
    city: "Stirling",
    verifiedSince: "2023",
    licence: "SBF-20338",
    rating: 4.6,
    reviews: 143,
    specialties: ["Roofing", "Stone repair", "Extensions"],
    bio: "Fixed-scope quotes with itemised materials, filed directly to the property evidence trail.",
    avatar: img("photo-1507003211169-0a1dd7228f2d", 400, 400),
    checks: [
      { label: "Trade federation membership", status: "verified" },
      { label: "Public liability cover", status: "verified" },
      { label: "Recent works audit", status: "verified" },
    ],
  },
  {
    id: "pro-5",
    name: "Lena Ostrowska",
    role: "Letting Agent",
    firm: "Granite Lets",
    city: "Aberdeen",
    verifiedSince: "2021",
    licence: "LARN-1904021",
    rating: 4.8,
    reviews: 207,
    specialties: ["HMO", "Student lets", "Compliance"],
    bio: "Letting agent registration and compliance records refreshed quarterly against the public register.",
    avatar: img("photo-1544005313-94ddf0286df2", 400, 400),
    checks: [
      { label: "Letting agent registration", status: "verified" },
      { label: "Client money protection", status: "verified" },
      { label: "Compliance refresh", status: "verified" },
    ],
  },
  {
    id: "pro-6",
    name: "Callum Reid",
    role: "Energy Assessor",
    firm: "Northlight Assessments",
    city: "Dundee",
    verifiedSince: "2025",
    licence: "EPC-55870",
    rating: 4.5,
    reviews: 38,
    specialties: ["EPC", "Retrofit assessment", "Heat pumps"],
    bio: "Retrofit-first assessments with modelled savings shown next to the measured baseline.",
    avatar: img("photo-1519345182560-3f2917c472ef", 400, 400),
    checks: [
      { label: "Accreditation scheme", status: "verified" },
      { label: "Professional indemnity", status: "pending" },
      { label: "Sample audit", status: "verified" },
    ],
  },
];

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

export const workspaceStats = [
  { label: "Saved properties", value: "12", delta: "+3 this week" },
  { label: "Open evidence gaps", value: "4", delta: "2 awaiting seller" },
  { label: "Verified pros engaged", value: "5", delta: "1 new intro" },
  { label: "Median trust score", value: "86", delta: "+4 vs last month" },
];

export const workspaceTasks = [
  { id: "t-1", title: "Chase factor accounts — Harbour View 7B", owner: "Seaforth Property Management", due: "Due in 2 days", state: "blocked" as const },
  { id: "t-2", title: "Book Level 3 survey — 14 Elm Row", owner: "Harlow & Finch", due: "Due in 5 days", state: "active" as const },
  { id: "t-3", title: "Review conveyancing pack — 22 Meadow Gate", owner: "Ailsa Grant LLP", due: "Due in 6 days", state: "active" as const },
  { id: "t-4", title: "Confirm mortgage in principle", owner: "Fleet & Co", due: "Completed", state: "done" as const },
];

export const workspaceActivity = [
  { id: "a-1", when: "2h ago", who: "Harlow & Finch", what: "uploaded a structural survey to 14 Elm Row" },
  { id: "a-2", when: "Yesterday", who: "Accountabul", what: "flagged a damp report on Kiln Lane Cottage" },
  { id: "a-3", when: "2 days ago", who: "Ailsa Grant LLP", what: "completed the conveyancing pack for 22 Meadow Gate" },
  { id: "a-4", when: "4 days ago", who: "You", what: "saved Harbour View 7B to your workspace" },
];

export function getPropertyBySlug(slug: string) {
  return properties.find((p) => p.slug === slug);
}

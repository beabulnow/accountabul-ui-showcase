import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileSearch, ShieldCheck, XCircle } from "lucide-react";

import { Card, Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accountabul — Property Verification Registry" },
      {
        name: "description",
        content:
          "Register a property record, have it reviewed by registry staff, and receive a registry receipt that Accountabul can later anchor as a tamper-evident record proof.",
      },
      { property: "og:title", content: "Accountabul — Property Verification Registry" },
      {
        property: "og:description",
        content:
          "Register a property record, get it reviewed, and receive a tamper-evident registry receipt.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  {
    icon: FileSearch,
    title: "1 · Register the record",
    body: "Submit the property address, jurisdiction, parcel reference and any public sources a reviewer can check. Save a draft first if you're not ready.",
  },
  {
    icon: ShieldCheck,
    title: "2 · Staff review",
    body: "Accountabul reviewers read the submission, ask for anything missing, and record every status change with a date you can see.",
  },
  {
    icon: CheckCircle2,
    title: "3 · Record proof",
    body: "Once approved, Accountabul can publish a deterministic hash of the record to the XRP Ledger. We pay the network fee — you need no wallet.",
  },
];

const isList = [
  "A registry of property records submitted by people who identify their relationship to the property.",
  "A documented staff review workflow with visible statuses and dated history.",
  "A registry receipt held in your account, with an optional tamper-evident record proof.",
];

const isNotList = [
  "Not legal title, a deed, or proof of ownership.",
  "Not title insurance, an appraisal, or a valuation.",
  "Not property tokenization — no token, NFT, or transferable asset is issued.",
  "Not a government filing or government approval of any kind.",
];

function Home() {
  return (
    <div>
      <div className="relative overflow-hidden border-b border-border bg-surface">
        <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="min-w-0">
            <p className="eyebrow">Property Verification Registry</p>
            <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Register a property record. Have it reviewed. Keep the receipt.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Accountabul is an evidence-first registry. You submit a property record, our staff
              review what you provided, and every status change is dated and visible. Approved
              records can later carry a tamper-evident record proof published by Accountabul.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Register a property
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No wallet required. No blockchain fees for you. Registration is not title or proof of
              ownership.
            </p>
          </div>

          <div className="min-w-0">
            <Card className="bg-card">
              <p className="eyebrow">Registry receipt</p>
              <p className="mt-3 font-display text-2xl">What you get</p>
              <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                <li>A human-readable registry receipt code for each submission.</li>
                <li>A live status: draft, submitted, under review, needs information, approved.</li>
                <li>Dated status history and any message from the reviewer.</li>
                <li>
                  A record-proof panel that reads <em>Not yet anchored</em> until Accountabul
                  publishes the hash.
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, no leaps of faith"
          description="A calm workflow that replaces persuasion with documentation."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.title}>
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <div className="border-t border-border bg-surface">
        <Section>
          <SectionHeading
            eyebrow="Be clear"
            title="What this is, and what this is not"
            description="Plain language, because the difference matters."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Card>
              <h3 className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="size-5 text-verified" aria-hidden />
                What this is
              </h3>
              <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
                {isList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="flex items-center gap-2 text-xl">
                <XCircle className="size-5 text-destructive" aria-hidden />
                What this is not
              </h3>
              <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
                {isNotList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>
      </div>
    </div>
  );
}

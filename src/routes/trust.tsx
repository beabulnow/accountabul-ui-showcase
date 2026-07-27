import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Card, Section, SectionHeading } from "@/components/ui-kit";
import { trustChecks, trustPrinciples } from "@/data/mock";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust center — how verification works | Accountabul" },
      {
        name: "description",
        content:
          "How Accountabul verifies evidence and professionals: named sources, dated checks, visible gaps and a published escalation path.",
      },
      { property: "og:title", content: "Trust center — how verification works | Accountabul" },
      {
        property: "og:description",
        content: "Named sources, dated checks, visible gaps and a published escalation path.",
      },
    ],
  }),
  component: TrustPage,
});

const scoring = [
  { band: "90–100", meaning: "Complete pack", detail: "All core documents present, current and matched to verified sources." },
  { band: "75–89", meaning: "Strong, with questions", detail: "Core documents present; one or two items pending corroboration." },
  { band: "60–74", meaning: "Partial record", detail: "Material gaps remain open and are listed on the property page." },
  { band: "Below 60", meaning: "Early record", detail: "Listing published for transparency, but most evidence is outstanding." },
];

const faqs = [
  {
    q: "What happens when evidence can't be verified?",
    a: "It stays on the property page marked as flagged, with the reason shown. We never remove an item to improve a score.",
  },
  {
    q: "Who can attach evidence?",
    a: "Only professionals whose licence has been matched to the issuing register, plus the owner or their appointed agent.",
  },
  {
    q: "How fresh is a check?",
    a: "Every item shows the date it was last checked. Licences are re-checked quarterly and insurance annually.",
  },
  {
    q: "Can a seller hide an open question?",
    a: "No. Open questions are part of the published record and are visible to anyone viewing the listing.",
  },
];

function TrustPage() {
  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <p className="eyebrow">Trust center</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">Verification, written down</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            The rules we hold ourselves to, the checks we run, and what each trust score actually means.
          </p>
        </div>
      </div>

      <Section>
        <SectionHeading eyebrow="Principles" title="Four commitments" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {trustPrinciples.map((p) => (
            <Card key={p.title}>
              <h3 className="text-xl">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <div className="border-y border-border bg-surface">
        <Section>
          <SectionHeading eyebrow="Scoring" title="What a trust score means" />
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            {scoring.map((s, i) => (
              <div
                key={s.band}
                className={`grid gap-1 p-5 sm:grid-cols-[7rem_10rem_minmax(0,1fr)] sm:items-center sm:gap-5 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <span className="font-display text-xl">{s.band}</span>
                <span className="text-sm font-medium">{s.meaning}</span>
                <span className="text-sm text-muted-foreground">{s.detail}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section>
        <SectionHeading eyebrow="Checks" title="Professional verification" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trustChecks.map((c) => (
            <Card key={c.label}>
              <p className="font-medium">{c.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.detail}</p>
              <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{c.cadence}</p>
            </Card>
          ))}
        </div>
      </Section>

      <div className="border-t border-border bg-surface">
        <Section>
          <SectionHeading eyebrow="Questions" title="Common questions" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {faqs.map((f) => (
              <Card key={f.q}>
                <h3 className="text-lg">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              See it on a listing <ArrowRight className="size-4" />
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}

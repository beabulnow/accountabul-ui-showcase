import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, ScanSearch, Users } from "lucide-react";

import { Card, EmptyState, Section, SectionHeading } from "@/components/ui-kit";
import { trustPrinciples } from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accountabul — Evidence-first property discovery" },
      {
        name: "description",
        content:
          "Property discovery where every claim carries a source, a date and a verified professional behind it. Calm, evidence-first by design.",
      },
      { property: "og:title", content: "Accountabul — Evidence-first property discovery" },
      {
        property: "og:description",
        content: "Property discovery built on documented evidence and verified professionals.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      <div className="relative overflow-hidden border-b border-border bg-surface">
        <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="min-w-0">
            <p className="eyebrow">Evidence-first property discovery</p>
            <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Every listing, backed by evidence you can actually check.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Accountabul shows the documents, the source and the date behind each claim — and names
              the verified professional who stands behind it. Gaps stay visible instead of quietly
              disappearing.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { k: "Evidence items filed", v: "—" },
                { k: "Verified professionals", v: "—" },
                { k: "Median trust score", v: "—" },
              ].map((s) => (
                <div key={s.k} className="min-w-0">
                  <dt className="truncate text-xs text-muted-foreground">{s.k}</dt>
                  <dd className="mt-1 font-display text-2xl">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="min-w-0">
            <EmptyState
              title="No evidence trail to show yet"
              description="Once listings are connected, the most recently verified documents will appear here."
              className="bg-card"
            />
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
          {[
            {
              icon: ScanSearch,
              title: "Discover with context",
              body: "Search properties alongside their evidence count, trust score and open questions.",
            },
            {
              icon: FileCheck2,
              title: "Read the evidence",
              body: "Open each document, see who supplied it, when it was checked and what it says.",
            },
            {
              icon: Users,
              title: "Engage verified people",
              body: "Bring in solicitors, surveyors and contractors matched to public registers.",
            },
          ].map((s) => (
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
          <SectionHeading eyebrow="Principles" title="What evidence-first means here" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {trustPrinciples.map((p) => (
              <Card key={p.title}>
                <h3 className="text-xl">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

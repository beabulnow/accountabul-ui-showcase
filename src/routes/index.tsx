import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, ScanSearch, Users } from "lucide-react";

import { Card, EmptyState, ProfessionalCard, PropertyCard, Section, SectionHeading } from "@/components/ui-kit";
import { professionals, properties, trustPrinciples } from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accountabul — Evidence-first property discovery" },
      {
        name: "description",
        content:
          "Browse properties where every claim carries a source, a date and a verified professional behind it. Calm, evidence-first property discovery.",
      },
      { property: "og:title", content: "Accountabul — Evidence-first property discovery" },
      {
        property: "og:description",
        content: "Properties, verified professionals and a trust center built on documented evidence.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = properties.slice(0, 3);
  const pros = professionals.slice(0, 3);

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
              Accountabul shows the documents, the source and the date behind each claim — and names the
              verified professional who stands behind it. Gaps stay visible instead of quietly disappearing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
              >
                Browse properties <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/trust"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-secondary"
              >
                How verification works
              </Link>
            </div>
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
            {featured[0] ? (
              <Card className="overflow-hidden p-0">
                <img
                  src={featured[0].image}
                  alt="Featured property"
                  className="aspect-16/10 w-full object-cover"
                />
                <div className="space-y-3 p-5">
                  <p className="eyebrow">Sample evidence trail</p>
                  {featured[0].evidence.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-surface px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {e.source} · {e.updated}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{e.status}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <EmptyState
                title="No evidence trail to show yet"
                description="Once listings are connected, the most recently verified documents will appear here."
                className="bg-card"
              />
            )}
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

      <div className="border-y border-border bg-surface">
        <Section>
          <SectionHeading
            eyebrow="Featured"
            title="Properties with a documented trail"
            action={
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary"
              >
                View all <ArrowRight className="size-4" />
              </Link>
            }
          />
          {featured.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-8"
              title="No properties published yet"
              description="Listings with a documented evidence trail will appear here as soon as they are added."
            />
          )}
        </Section>
      </div>

      <Section>
        <SectionHeading
          eyebrow="Verified professionals"
          title="People whose credentials we re-check"
          action={
            <Link
              to="/professionals"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              Browse directory <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {pros.map((p) => (
            <ProfessionalCard key={p.id} pro={p} />
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
          <div className="mt-10 grid gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
            <h2 className="text-3xl">Start from evidence, not adjectives</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Open the workspace to see saved properties, open evidence gaps and the people working on them.
            </p>
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Open the workspace <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

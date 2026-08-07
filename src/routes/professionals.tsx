import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Card, EmptyState, ProfessionalCard, Section, SectionHeading, StatusPill } from "@/components/ui-kit";
import { professionals, trustChecks } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/professionals")({
  head: () => ({
    meta: [
      { title: "Verified professionals directory | Accountabul" },
      {
        name: "description",
        content:
          "Solicitors, surveyors, advisers and contractors matched to public registers, with their checks and cadence shown.",
      },
      { property: "og:title", content: "Verified professionals directory | Accountabul" },
      {
        property: "og:description",
        content: "Credentials re-checked on a schedule, with every check listed openly.",
      },
    ],
  }),
  component: ProfessionalsPage,
});

function ProfessionalsPage() {
  const roles = useMemo(() => ["All", ...new Set(professionals.map((p) => p.role))], []);
  const [role, setRole] = useState("All");
  const list = professionals.filter((p) => role === "All" || p.role === role);

  return (
    <Section>
      <SectionHeading
        eyebrow="Directory"
        title="Verified professionals"
        description="Each person below has been matched to a public register. Their checks and the cadence we re-run them at are shown on their profile."
      />

      <div className="mt-8 flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              role === r
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <div key={p.id} className="min-w-0 space-y-3">
            <ProfessionalCard pro={p} />
            <Card className="p-4">
              <p className="eyebrow">Checks</p>
              <ul className="mt-3 space-y-2">
                {p.checks.map((c) => (
                  <li key={c.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <span className="truncate text-sm text-muted-foreground">{c.label}</span>
                    <StatusPill status={c.status} />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Licence {p.licence}</p>
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-2xl">What we check, and how often</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trustChecks.map((c) => (
            <Card key={c.label} className="bg-card">
              <p className="font-medium">{c.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.detail}</p>
              <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{c.cadence}</p>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}

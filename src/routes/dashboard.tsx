import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Card, PropertyCard, StatusPill, TrustScore } from "@/components/ui-kit";
import { properties, workspaceActivity, workspaceStats, workspaceTasks } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Workspace — saved properties and evidence gaps | Accountabul" },
      {
        name: "description",
        content:
          "Track saved properties, open evidence gaps, tasks with verified professionals and recent activity in one calm workspace.",
      },
      { property: "og:title", content: "Workspace | Accountabul" },
      {
        property: "og:description",
        content: "Saved properties, open evidence gaps, tasks and activity in one place.",
      },
    ],
  }),
  component: Dashboard,
});

const tabs = ["Overview", "Saved", "Evidence gaps", "Activity"] as const;

function Dashboard() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const saved = properties.slice(0, 4);
  const gaps = properties.flatMap((p) =>
    p.evidence
      .filter((e) => e.status !== "verified")
      .map((e) => ({ ...e, property: p.title, slug: p.slug })),
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="min-w-0">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="eyebrow">Signed in as</p>
          <p className="mt-2 truncate font-medium">Demo buyer</p>
          <p className="truncate text-sm text-muted-foreground">Edinburgh search</p>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "shrink-0 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors lg:w-full",
                tab === t ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {t}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-3xl">Workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">Demo data — nothing here is persisted yet.</p>
          </div>
          <Link
            to="/properties"
            className="shrink-0 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Add property
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workspaceStats.map((s) => (
            <Card key={s.label} className="p-4">
              <p className="truncate text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-verified">{s.delta}</p>
            </Card>
          ))}
        </div>

        {tab === "Overview" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-xl">Tasks</h2>
              <ul className="mt-4 space-y-3">
                {workspaceTasks.map((t) => (
                  <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-medium", t.state === "done" && "line-through opacity-60")}>
                        {t.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.owner} · {t.due}
                      </p>
                    </div>
                    <StatusPill
                      status={t.state === "blocked" ? "flagged" : t.state === "done" ? "verified" : "pending"}
                    />
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="text-xl">Watchlist scores</h2>
              <ul className="mt-4 space-y-3">
                {saved.map((p) => (
                  <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.city}</p>
                    </div>
                    <TrustScore score={p.trustScore} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : null}

        {tab === "Saved" ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {saved.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : null}

        {tab === "Evidence gaps" ? (
          <div className="mt-8 space-y-3">
            {gaps.map((g) => (
              <Card key={g.id}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{g.label}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {g.property} · {g.source}
                    </p>
                  </div>
                  <StatusPill status={g.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{g.note}</p>
                <Link
                  to="/properties/$slug"
                  params={{ slug: g.slug }}
                  className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
                >
                  Open property
                </Link>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === "Activity" ? (
          <Card className="mt-8">
            <ol className="space-y-4 border-l border-border pl-5">
              {workspaceActivity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[1.575rem] top-1.5 size-2.5 rounded-full bg-verified" />
                  <p className="text-sm">
                    <span className="font-medium">{a.who}</span> {a.what}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.when}</p>
                </li>
              ))}
            </ol>
          </Card>
        ) : null}
      </main>
    </div>
  );
}

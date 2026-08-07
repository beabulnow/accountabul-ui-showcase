import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState, PropertyCard, Section, SectionHeading } from "@/components/ui-kit";
import { properties } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/properties/")({
  head: () => ({
    meta: [
      { title: "Properties with verified evidence | Accountabul" },
      {
        name: "description",
        content:
          "Filter properties by type, trust score and location. Each listing shows its evidence count and open questions.",
      },
      { property: "og:title", content: "Properties with verified evidence | Accountabul" },
      {
        property: "og:description",
        content: "Evidence counts, trust scores and open questions on every listing.",
      },
    ],
  }),
  component: PropertiesPage,
});

const types = ["All", "House", "Apartment", "Townhome", "Land"] as const;
const sorts = ["Trust score", "Price: low to high", "Price: high to low"] as const;

function PropertiesPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof types)[number]>("All");
  const [minTrust, setMinTrust] = useState(0);
  const [sort, setSort] = useState<(typeof sorts)[number]>("Trust score");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = properties.filter(
      (p) =>
        (type === "All" || p.type === type) &&
        p.trustScore >= minTrust &&
        (q === "" ||
          `${p.title} ${p.address} ${p.city} ${p.summary}`.toLowerCase().includes(q)),
    );
    return [...list].sort((a, b) => {
      if (sort === "Price: low to high") return a.priceValue - b.priceValue;
      if (sort === "Price: high to low") return b.priceValue - a.priceValue;
      return b.trustScore - a.trustScore;
    });
  }, [query, type, minTrust, sort]);

  return (
    <Section>
      <SectionHeading
        eyebrow="Discover"
        title="Properties"
        description="Every listing below is published with its evidence trail attached. Open questions are shown on the card."
      />

      <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by address, city or keyword"
            aria-label="Search properties"
            className="min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof sorts)[number])}
            aria-label="Sort properties"
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          >
            {sorts.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={String(minTrust)}
            onChange={(e) => setMinTrust(Number(e.target.value))}
            aria-label="Minimum trust score"
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          >
            {[0, 70, 80, 90].map((v) => (
              <option key={v} value={v}>
                {v === 0 ? "Any trust score" : `Trust ${v}+`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                type === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {results.length} {results.length === 1 ? "property" : "properties"}
      </p>

      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          className="mt-10"
          title={properties.length === 0 ? "No properties published yet" : "No properties match those filters"}
          description={
            properties.length === 0
              ? "Listings will appear here with their evidence trail, trust score and open questions once they are added."
              : "Try clearing the search, widening the trust score or selecting a different property type."
          }
        />
      ) : null}
    </Section>
  );
}

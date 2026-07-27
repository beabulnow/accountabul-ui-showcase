import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";

import { Card, ProfessionalCard, Section, StatusPill, TrustScore } from "@/components/ui-kit";
import { getPropertyBySlug, professionals, type Property } from "@/data/mock";

export const Route = createFileRoute("/properties/$slug")({
  loader: ({ params }) => {
    const property = getPropertyBySlug(params.slug);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Property unavailable | Accountabul" }, { name: "robots", content: "noindex" }] };
    }
    const { property } = loaderData;
    const title = `${property.title}, ${property.city} | Accountabul`;
    return {
      meta: [
        { title },
        { name: "description", content: property.summary.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: property.summary.slice(0, 155) },
        { property: "og:image", content: property.image },
        { name: "twitter:image", content: property.image },
      ],
    };
  },
  component: PropertyDetail,
});

function PropertyDetail() {
  const { property } = Route.useLoaderData() as { property: Property };
  const relatedPros = professionals.slice(0, 2);

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All properties
          </Link>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl">{property.title}</h1>
              <p className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                <span className="truncate">
                  {property.address}, {property.city}, {property.region}
                </span>
              </p>
            </div>
            <TrustScore score={property.trustScore} />
          </div>
        </div>
      </div>

      <Section className="py-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0 space-y-8">
            <img
              src={property.image}
              alt={`${property.title}, ${property.city}`}
              className="aspect-16/9 w-full rounded-2xl border border-border object-cover shadow-soft"
            />

            <div>
              <h2 className="text-2xl">Overview</h2>
              <p className="mt-3 text-muted-foreground">{property.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {property.highlights.map((h) => (
                  <span key={h} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <h2 className="text-2xl">Evidence trail</h2>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {property.evidenceCount} items on file
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {property.evidence.map((e) => (
                  <Card key={e.id}>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{e.label}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {e.source} · last checked {e.updated}
                        </p>
                      </div>
                      <StatusPill status={e.status} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{e.note}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl">Activity</h2>
              <ol className="mt-4 space-y-4 border-l border-border pl-5">
                {property.timeline.map((t) => (
                  <li key={t.date + t.event} className="relative">
                    <span className="absolute -left-[1.575rem] top-1.5 size-2.5 rounded-full bg-verified" />
                    <p className="text-sm font-medium">{t.event}</p>
                    <p className="text-sm text-muted-foreground">{t.detail}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.date}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <p className="font-display text-3xl">{property.price}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Fact label="Type" value={property.type} />
                <Fact label="Bedrooms" value={property.beds || "—"} />
                <Fact label="Bathrooms" value={property.baths || "—"} />
                <Fact label="Floor area" value={property.sqft ? `${property.sqft} sq ft` : "—"} />
              </dl>
              <button className="mt-5 w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Request full evidence pack
              </button>
              <button className="mt-2 w-full rounded-full border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary">
                Save to workspace
              </button>
            </Card>

            <div>
              <p className="eyebrow">Professionals on this property</p>
              <div className="mt-3 space-y-4">
                {relatedPros.map((p) => (
                  <ProfessionalCard key={p.id} pro={p} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}

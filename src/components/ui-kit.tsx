import { Link } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, Clock } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { EvidenceStatus, Professional, Property } from "@/data/mock";

export function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("mx-auto w-full max-w-6xl px-5 py-14 sm:py-20", className)}>{children}</section>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid gap-4 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-base text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatusPill({ status, className }: { status: EvidenceStatus; className?: string }) {
  const map = {
    verified: { label: "Verified", icon: BadgeCheck, cls: "bg-verified/12 text-verified border-verified/30" },
    pending: { label: "Pending", icon: Clock, cls: "bg-caution/15 text-caution-foreground border-caution/40" },
    flagged: { label: "Flagged", icon: AlertTriangle, cls: "bg-destructive/10 text-destructive border-destructive/30" },
  } as const;
  const { label, icon: Icon, cls } = map[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        cls,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

export function TrustScore({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const tone = score >= 85 ? "text-verified" : score >= 70 ? "text-caution-foreground" : "text-destructive";
  return (
    <div className={cn("shrink-0 text-right", size === "sm" && "text-xs")}>
      <p className={cn("font-display leading-none", tone, size === "md" ? "text-2xl" : "text-lg")}>{score}</p>
      <p className="mt-1 text-[0.625rem] uppercase tracking-widest text-muted-foreground">Trust</p>
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>{children}</div>
  );
}

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to="/properties/$slug"
      params={{ slug: property.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-muted">
        <img
          src={property.image}
          alt={`${property.title}, ${property.city}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
          {property.evidenceCount} evidence items
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl">{property.title}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {property.address}, {property.city}
            </p>
          </div>
          <TrustScore score={property.trustScore} />
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{property.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
          <span className="font-medium">{property.price}</span>
          <span className="text-muted-foreground">
            {property.type === "Land" ? "Plot" : `${property.beds} bed · ${property.baths} bath`}
          </span>
          {property.sqft ? <span className="text-muted-foreground">{property.sqft} sq ft</span> : null}
        </div>
      </div>
    </Link>
  );
}

export function ProfessionalCard({ pro }: { pro: Professional }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={pro.avatar}
          alt={pro.name}
          loading="lazy"
          className="size-12 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-medium">{pro.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {pro.role} · {pro.firm}
          </p>
        </div>
        <StatusPill status="verified" className="ml-auto" />
      </div>
      <p className="text-sm text-muted-foreground">{pro.bio}</p>
      <div className="flex flex-wrap gap-1.5">
        {pro.specialties.map((s) => (
          <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
            {s}
          </span>
        ))}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
        <span>
          {pro.rating} ★ · {pro.reviews} reviews
        </span>
        <span>
          {pro.city} · verified since {pro.verifiedSince}
        </span>
      </div>
    </Card>
  );
}

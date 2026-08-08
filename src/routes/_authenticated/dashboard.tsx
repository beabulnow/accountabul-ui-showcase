import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card, EmptyState, Section, SectionHeading } from "@/components/ui-kit";
import { StatusChip } from "@/components/status-chip";
import { formatDate, statusHelp, type RegistrationStatus } from "@/lib/registry";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your registrations — Accountabul Registry" },
      {
        name: "description",
        content:
          "Track the property records you have registered with Accountabul, their review status and their registry receipts.",
      },
      { property: "og:title", content: "Your registrations — Accountabul Registry" },
      { property: "og:description", content: "Your property registry dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-registrations", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows, error: queryError } = await supabase
        .from("property_registrations")
        .select(
          "id, receipt_code, status, address_line1, city, state, postal_code, created_at, submitted_at, record_anchors(xrpl_tx_hash, anchored_at)",
        )
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      return rows ?? [];
    },
  });

  return (
    <Section>
      <SectionHeading
        eyebrow="Your account"
        title="Property registrations"
        description="Only records you submitted appear here. Each one keeps its own status history and registry receipt."
        action={
          <Link
            to="/register-property"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <FilePlus2 className="size-4" />
            Register a property
          </Link>
        }
      />

      <div className="mt-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your registrations…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-destructive">
            {(error as Error).message}
          </p>
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No property records registered yet"
            description="Register a property record to start the review workflow. You can save a draft first and submit it when you're ready."
            action={
              <Link
                to="/register-property"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <FilePlus2 className="size-4" />
                Register a property
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4">
            {data!.map((row) => {
              const anchor = Array.isArray(row.record_anchors)
                ? row.record_anchors[0]
                : row.record_anchors;
              return (
                <li key={row.id}>
                  <Card className="transition-shadow hover:shadow-lift">
                    <Link
                      to="/registrations/$id"
                      params={{ id: row.id }}
                      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-display text-xl">
                          {row.address_line1}, {row.city}, {row.state} {row.postal_code}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Registry receipt {row.receipt_code} · Created {formatDate(row.created_at)}
                          {row.submitted_at ? ` · Submitted ${formatDate(row.submitted_at)}` : ""}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {statusHelp[row.status as RegistrationStatus]}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <StatusChip status={row.status as RegistrationStatus} />
                        <span className="text-xs text-muted-foreground">
                          {anchor?.xrpl_tx_hash ? "Record proof published" : "Not yet anchored"}
                        </span>
                      </div>
                    </Link>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Section>
  );
}

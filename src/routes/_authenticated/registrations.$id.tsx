import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, Section } from "@/components/ui-kit";
import { StatusChip } from "@/components/status-chip";
import {
  formatDateTime,
  labelFor,
  propertyTypeOptions,
  relationshipOptions,
  statusHelp,
  statusLabels,
  type RegistrationStatus,
} from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/registrations/$id")({
  head: () => ({
    meta: [
      { title: "Registry receipt — Accountabul Registry" },
      {
        name: "description",
        content:
          "View your Accountabul registry receipt: submitted property details, review status history and record-proof state.",
      },
      { property: "og:title", content: "Registry receipt — Accountabul Registry" },
      { property: "og:description", content: "Your property registration receipt and status." },
    ],
  }),
  component: RegistrationDetailPage,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{value ?? "—"}</dd>
    </div>
  );
}

function RegistrationDetailPage() {
  const { id } = useParams({ from: "/_authenticated/registrations/$id" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration", id],
    queryFn: async () => {
      const { data: row, error: e1 } = await supabase
        .from("property_registrations")
        .select("*, record_anchors(*)")
        .eq("id", id)
        .maybeSingle();
      if (e1) throw e1;
      const { data: history, error: e2 } = await supabase
        .from("registration_status_history")
        .select("*")
        .eq("registration_id", id)
        .order("created_at", { ascending: false });
      if (e2) throw e2;
      return { row, history: history ?? [] };
    },
  });

  if (isLoading) {
    return (
      <Section>
        <p className="text-sm text-muted-foreground">Loading registry receipt…</p>
      </Section>
    );
  }

  if (error) {
    return (
      <Section>
        <p role="alert" className="text-sm text-destructive">
          {(error as Error).message}
        </p>
      </Section>
    );
  }

  const row = data?.row;
  if (!row) {
    return (
      <Section>
        <h1 className="text-3xl">Registration not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This record does not exist, or it belongs to another account.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block underline underline-offset-4">
          Back to your registrations
        </Link>
      </Section>
    );
  }

  const anchor = Array.isArray(row.record_anchors) ? row.record_anchors[0] : row.record_anchors;
  const status = row.status as RegistrationStatus;

  return (
    <Section className="max-w-3xl">
      <Link to="/dashboard" className="text-sm text-muted-foreground underline underline-offset-4">
        ← Back to your registrations
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="eyebrow">Registry receipt {row.receipt_code}</p>
        <StatusChip status={status} />
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl">
        {row.address_line1}
        {row.address_line2 ? `, ${row.address_line2}` : ""}
      </h1>
      <p className="mt-2 text-base text-muted-foreground">
        {row.city}, {row.state} {row.postal_code} · {row.county} County/jurisdiction
      </p>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground">{statusHelp[status]}</p>

      <Card className="mt-8">
        <h2 className="text-xl">Submitted details</h2>
        <dl className="mt-3">
          <Row label="Submitter" value={row.submitter_full_name} />
          <Row
            label="Relationship"
            value={
              row.relationship === "other" && row.relationship_other
                ? `Other — ${row.relationship_other}`
                : labelFor(relationshipOptions, row.relationship)
            }
          />
          <Row label="Property type" value={labelFor(propertyTypeOptions, row.property_type)} />
          <Row label="Parcel ID" value={row.parcel_id || "—"} />
          <Row label="Public source notes" value={row.public_source_notes || "—"} />
          <Row label="Your note" value={row.user_note || "—"} />
          <Row label="Created" value={formatDateTime(row.created_at)} />
          <Row label="Submitted" value={formatDateTime(row.submitted_at)} />
        </dl>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl">Record proof</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Accountabul may publish a tamper-evident hash of an approved record to the XRP Ledger and
          pays any network fee itself. No wallet, token, or transferable asset is issued to you.
        </p>
        <div className="mt-3">
          {anchor?.xrpl_tx_hash ? (
            <dl>
              <Row label="Canonical payload hash" value={anchor.canonical_payload_hash} />
              <Row label="XRPL network" value={anchor.xrpl_network} />
              <Row label="Transaction hash" value={anchor.xrpl_tx_hash} />
              <Row label="Validated ledger index" value={anchor.validated_ledger_index} />
              <Row label="Anchored at" value={formatDateTime(anchor.anchored_at)} />
            </dl>
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-sm text-muted-foreground">
              Not yet anchored. The payload hash, network, transaction hash, validated ledger index
              and anchored timestamp will appear here once a record proof is published.
            </p>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl">Status history</h2>
        {data!.history.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No status updates yet.</p>
        ) : (
          <ol className="mt-4 grid gap-4">
            {data!.history.map((h) => (
              <li key={h.id} className="border-l-2 border-border pl-4">
                <p className="text-sm font-medium">
                  {statusLabels[h.to_status as RegistrationStatus]}
                  {h.from_status ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · from {statusLabels[h.from_status as RegistrationStatus]}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</p>
                {h.user_visible_message ? (
                  <p className="mt-1.5 text-sm text-muted-foreground">{h.user_visible_message}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <p className="mt-8 text-xs text-muted-foreground">
        A registry receipt records that a submission was made and reviewed. It is not a deed, legal
        title, title insurance, an appraisal, or proof of ownership.
      </p>
    </Section>
  );
}

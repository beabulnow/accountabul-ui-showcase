import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/utils";
import { Card, DetailRow, Section } from "@/components/ui-kit";
import { StatusChip } from "@/components/status-chip";
import { StatusHistory } from "@/components/status-history";
import { useRegistrationHistory } from "@/hooks/use-registration";
import {
  formatDateTime,
  labelFor,
  propertyTypeOptions,
  relationshipOptions,
  statusHelp,
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

function RegistrationDetailPage() {
  const { id } = useParams({ from: "/_authenticated/registrations/$id" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration", id],
    queryFn: async () => {
      const { data: row, error: queryError } = await supabase
        .from("property_registrations")
        .select("*, record_anchors(*)")
        .eq("id", id)
        .maybeSingle();
      if (queryError) throw queryError;
      return row;
    },
  });

  const { data: history } = useRegistrationHistory(id);

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
          {errorMessage(error, "This registry receipt could not be loaded.")}
        </p>
      </Section>
    );
  }

  const row = data;
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
          <DetailRow label="Submitter" value={row.submitter_full_name} />
          <DetailRow
            label="Relationship"
            value={
              row.relationship === "other" && row.relationship_other
                ? `Other — ${row.relationship_other}`
                : labelFor(relationshipOptions, row.relationship)
            }
          />
          <DetailRow label="Property type" value={labelFor(propertyTypeOptions, row.property_type)} />
          <DetailRow label="Parcel ID" value={row.parcel_id || "—"} />
          <DetailRow label="Public source notes" value={row.public_source_notes || "—"} />
          <DetailRow label="Your note" value={row.user_note || "—"} />
          <DetailRow label="Created" value={formatDateTime(row.created_at)} />
          <DetailRow label="Submitted" value={formatDateTime(row.submitted_at)} />
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
              <DetailRow label="Canonical payload hash" value={anchor.canonical_payload_hash} />
              <DetailRow label="XRPL network" value={anchor.xrpl_network} />
              <DetailRow label="Transaction hash" value={anchor.xrpl_tx_hash} />
              <DetailRow label="Validated ledger index" value={anchor.validated_ledger_index} />
              <DetailRow label="Anchored at" value={formatDateTime(anchor.anchored_at)} />
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
        <div className="mt-4">
          <StatusHistory entries={history ?? []} />
        </div>
      </Card>

      <p className="mt-8 text-xs text-muted-foreground">
        A registry receipt records that a submission was made and reviewed. It is not a deed, legal
        title, title insurance, an appraisal, or proof of ownership.
      </p>
    </Section>
  );
}

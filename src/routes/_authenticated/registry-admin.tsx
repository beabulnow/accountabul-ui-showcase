import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Card, EmptyState, Section, SectionHeading } from "@/components/ui-kit";
import { StatusChip } from "@/components/status-chip";
import { useIsStaff, useSession } from "@/hooks/use-session";
import {
  REGISTRATION_STATUSES,
  formatDateTime,
  labelFor,
  propertyTypeOptions,
  relationshipOptions,
  statusLabels,
  type RegistrationStatus,
} from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/registry-admin")({
  head: () => ({
    meta: [
      { title: "Registry staff workspace — Accountabul" },
      {
        name: "description",
        content:
          "Internal Accountabul registry workspace for reviewing property record submissions. Staff authorization required.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Registry staff workspace — Accountabul" },
      { property: "og:description", content: "Staff-only registry review workspace." },
    ],
  }),
  component: RegistryAdminPage,
});

const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

function RegistryAdminPage() {
  const { role, isStaff, checking } = useIsStaff();

  if (checking) {
    return (
      <Section>
        <p className="text-sm text-muted-foreground">Checking your registry authorization…</p>
      </Section>
    );
  }

  if (!isStaff) {
    return (
      <Section className="max-w-xl">
        <h1 className="text-3xl">Access denied</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This workspace is limited to authorized registry staff. Your account does not have a
          reviewer or admin role assigned.
        </p>
      </Section>
    );
  }

  return <StaffWorkspace role={role!} />;
}

function StaffWorkspace({ role }: { role: "admin" | "reviewer" }) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [statusFilter, setStatusFilter] = useState<"all" | RegistrationStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_registrations")
        .select("*, record_anchors(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const emailById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of profiles ?? []) map.set(p.id, p.email ?? "");
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (registrations ?? []).filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!term) return true;
      const email = emailById.get(r.user_id) ?? "";
      return [
        r.address_line1,
        r.address_line2 ?? "",
        r.city,
        r.postal_code,
        r.county,
        r.parcel_id ?? "",
        r.receipt_code,
        email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [registrations, statusFilter, search, emailById]);

  const selected = (registrations ?? []).find((r) => r.id === selectedId) ?? null;

  return (
    <Section>
      <SectionHeading
        eyebrow={`Staff workspace · ${role}`}
        title="Registry review"
        description="Every submitted property record, with internal notes and user-visible messages kept separate."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="grid gap-1.5">
          <label htmlFor="admin-search" className="text-sm font-medium">
            Search
          </label>
          <input
            id="admin-search"
            className={inputClass}
            placeholder="Address, parcel ID, receipt code or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="admin-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="admin-status"
            className={inputClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | RegistrationStatus)}
          >
            <option value="all">All statuses</option>
            {REGISTRATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <h2 className="text-xl">Submissions ({filtered.length})</h2>
          {isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="No submissions match"
              description="Adjust the filters, or wait for the first property record to arrive."
            />
          ) : (
            <ul className="mt-4 grid gap-3">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    aria-pressed={selectedId === r.id}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      selectedId === r.id
                        ? "border-primary/50 bg-accent"
                        : "border-border bg-card hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 truncate font-medium">
                        {r.address_line1}, {r.city} {r.postal_code}
                      </p>
                      <StatusChip status={r.status as RegistrationStatus} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {r.receipt_code} · {emailById.get(r.user_id) || "unknown submitter"} ·{" "}
                      {formatDateTime(r.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 text-xl">Registered users ({profiles?.length ?? 0})</h2>
          <ul className="mt-3 grid gap-2">
            {(profiles ?? []).map((p) => (
              <li key={p.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <p className="truncate font-medium">{p.full_name || "—"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.email} · joined {formatDateTime(p.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          {selected ? (
            <SubmissionInspector
              key={selected.id}
              registration={selected}
              staffUserId={user?.id ?? ""}
              submitterEmail={emailById.get(selected.user_id) ?? ""}
              onChanged={() => {
                void queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
              }}
            />
          ) : (
            <EmptyState
              title="Select a submission"
              description="Pick a record on the left to inspect its details, add notes and move it through review."
            />
          )}
        </div>
      </div>
    </Section>
  );
}

type Registration = {
  id: string;
  user_id: string;
  receipt_code: string;
  status: string;
  submitter_full_name: string;
  relationship: string;
  relationship_other: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  county: string;
  parcel_id: string | null;
  property_type: string;
  public_source_notes: string | null;
  user_note: string | null;
  created_at: string;
  submitted_at: string | null;
  record_anchors: unknown;
};

function SubmissionInspector({
  registration,
  staffUserId,
  submitterEmail,
  onChanged,
}: {
  registration: Registration;
  staffUserId: string;
  submitterEmail: string;
  onChanged: () => void;
}) {
  const [nextStatus, setNextStatus] = useState<RegistrationStatus>(
    registration.status as RegistrationStatus,
  );
  const [userMessage, setUserMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ["staff-notes", registration.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_notes")
        .select("*")
        .eq("registration_id", registration.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ["staff-history", registration.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_status_history")
        .select("*")
        .eq("registration_id", registration.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function applyStatus() {
    if (nextStatus === registration.status) return;
    setBusy(true);

    const { error } = await supabase.rpc("review_registration_status", {
      _registration_id: registration.id,
      _to_status: nextStatus,
      _user_visible_message: userMessage.trim() || undefined,
    });

    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setUserMessage("");
    toast.success(`Status set to ${statusLabels[nextStatus]}`);
    onChanged();
    void refetchHistory();
  }

  async function addNote() {
    if (!internalNote.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("staff_notes").insert({
      registration_id: registration.id,
      author_id: staffUserId,
      body: internalNote.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setInternalNote("");
    toast.success("Internal note added");
    void refetchNotes();
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl">{registration.receipt_code}</h2>
          <StatusChip status={registration.status as RegistrationStatus} />
        </div>
        <dl className="mt-4 grid gap-2 text-sm">
          <Detail
            label="Submitter"
            value={`${registration.submitter_full_name} (${submitterEmail})`}
          />
          <Detail
            label="Relationship"
            value={
              registration.relationship === "other" && registration.relationship_other
                ? `Other — ${registration.relationship_other}`
                : labelFor(relationshipOptions, registration.relationship)
            }
          />
          <Detail
            label="Address"
            value={`${registration.address_line1}${
              registration.address_line2 ? `, ${registration.address_line2}` : ""
            }, ${registration.city}, ${registration.state} ${registration.postal_code}`}
          />
          <Detail label="County" value={registration.county} />
          <Detail label="Parcel ID" value={registration.parcel_id || "—"} />
          <Detail
            label="Property type"
            value={labelFor(propertyTypeOptions, registration.property_type)}
          />
          <Detail label="Public sources" value={registration.public_source_notes || "—"} />
          <Detail label="User note" value={registration.user_note || "—"} />
          <Detail label="Submitted" value={formatDateTime(registration.submitted_at)} />
        </dl>
      </Card>

      <Card className="grid gap-3">
        <h3 className="text-lg">Change status</h3>
        <select
          aria-label="New status"
          className={inputClass}
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value as RegistrationStatus)}
        >
          {REGISTRATION_STATUSES.map((s) => (
            <option key={s} value={s} disabled={s === registration.status}>
              {statusLabels[s]}
              {s === registration.status ? " (current)" : ""}
            </option>
          ))}
        </select>
        <textarea
          aria-label="Message visible to the submitter"
          rows={3}
          placeholder="Message visible to the submitter (optional)"
          className={inputClass}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          &quot;Anchored&quot; is rejected by the database until a validated record proof with a
          canonical payload hash, network, transaction hash, validated ledger index and anchored
          timestamp exists.
        </p>
        <button
          type="button"
          disabled={busy || nextStatus === registration.status}
          onClick={() => void applyStatus()}
          className="justify-self-start rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Apply status
        </button>
      </Card>

      <Card className="grid gap-3">
        <h3 className="text-lg">Internal notes</h3>
        <p className="text-xs text-muted-foreground">Never visible to the submitter.</p>
        <textarea
          aria-label="Internal note"
          rows={3}
          className={inputClass}
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void addNote()}
          className="justify-self-start rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
        >
          Add internal note
        </button>
        <ul className="grid gap-2">
          {(notes ?? []).map((n) => (
            <li
              key={n.id}
              className="rounded-xl border border-border bg-surface px-3.5 py-3 text-sm"
            >
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="grid gap-2">
        <h3 className="text-lg">History</h3>
        <ol className="grid gap-3">
          {(history ?? []).map((h) => (
            <li key={h.id} className="border-l-2 border-border pl-3 text-sm">
              <p className="font-medium">{statusLabels[h.to_status as RegistrationStatus]}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</p>
              {h.user_visible_message ? (
                <p className="mt-1 text-muted-foreground">{h.user_visible_message}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}

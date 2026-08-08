import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProfileAvatar } from "@/components/profile-avatar";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  DetailRow,
  EmptyState,
  Section,
  SectionHeading,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui-kit";
import { StatusChip } from "@/components/status-chip";
import { StatusHistory } from "@/components/status-history";
import { RegistrationDocumentSlots } from "@/components/document-slots";

import { useRegistrationHistory, useStaffNotes } from "@/hooks/use-registration";
import { useIsStaff, useSession } from "@/hooks/use-session";
import {
  REGISTRATION_STATUSES,
  STAFF_SETTABLE_STATUSES,
  formatDateTime,
  labelFor,
  propertyTypeOptions,
  relationshipOptions,
  statusLabels,
  type RegistrationStatus,
} from "@/lib/registry";
import { profileDisplayName } from "@/lib/profile";
import { errorMessage } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/registry-admin/queue")({
  head: () => ({
    meta: [
      { title: "Review queue — Accountabul registry staff" },
      {
        name: "description",
        content:
          "Internal review queue for Accountabul property record submissions. Staff authorization required.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Review queue — Accountabul registry staff" },
      { property: "og:description", content: "Staff-only registry review queue." },
    ],
  }),
  component: RegistryQueuePage,
});

// The parent /registry-admin layout already gates on staff authorization.
function RegistryQueuePage() {
  const { role, isStaff, checking } = useIsStaff();
  if (checking || !isStaff || !role) return null;
  return <StaffWorkspace role={role} />;
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
        .select(
          "id, email, full_name, first_name, middle_name, last_name, phone_e164, phone_verified_at, avatar_path, profile_completed_at, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const profileById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof profiles>[number]>();
    for (const profile of profiles ?? []) map.set(profile.id, profile);
    return map;
  }, [profiles]);

  const registrationCountByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const registration of registrations ?? []) {
      map.set(registration.user_id, (map.get(registration.user_id) ?? 0) + 1);
    }
    return map;
  }, [registrations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (registrations ?? []).filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!term) return true;
      const submitterProfile = profileById.get(r.user_id);
      return [
        r.address_line1,
        r.address_line2 ?? "",
        r.city,
        r.postal_code,
        r.county,
        r.parcel_id ?? "",
        r.receipt_code,
        submitterProfile?.email ?? "",
        profileDisplayName(submitterProfile),
        submitterProfile?.phone_e164 ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [registrations, statusFilter, search, profileById]);

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
                      {r.receipt_code} · {profileById.get(r.user_id)?.email || "unknown submitter"}{" "}
                      · {formatDateTime(r.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 text-xl">Registered users ({profiles?.length ?? 0})</h2>
          <ul className="mt-3 grid gap-2">
            {(profiles ?? []).map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"
              >
                <ProfileAvatar
                  avatarPath={p.avatar_path}
                  name={profileDisplayName(p)}
                  className="size-11 text-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{profileDisplayName(p)}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        p.profile_completed_at
                          ? "bg-verified/10 text-verified"
                          : "bg-caution/10 text-caution"
                      }`}
                    >
                      {p.profile_completed_at ? "Profile complete" : "Profile incomplete"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.email} {p.phone_e164 ? `· ${p.phone_e164}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {registrationCountByUser.get(p.id) ?? 0} properties · joined{" "}
                    {formatDateTime(p.created_at)}
                  </p>
                </div>
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
              submitterEmail={profileById.get(selected.user_id)?.email ?? ""}
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

  const { data: notes, refetch: refetchNotes } = useStaffNotes(registration.id);
  const { data: history, refetch: refetchHistory } = useRegistrationHistory(registration.id);

  async function applyStatus() {
    setBusy(true);
    const { error } = await supabase.rpc("review_registration_status", {
      _registration_id: registration.id,
      _to_status: nextStatus,
      _user_visible_message: userMessage.trim() || undefined,
    });

    if (error) {
      setBusy(false);
      toast.error(errorMessage(error, "Could not update this status"));
      return;
    }

    setBusy(false);
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
      toast.error(errorMessage(error, "Could not add this note"));
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
          <DetailRow
            compact
            label="Submitter"
            value={`${registration.submitter_full_name} (${submitterEmail})`}
          />
          <DetailRow
            compact
            label="Relationship"
            value={
              registration.relationship === "other" && registration.relationship_other
                ? `Other — ${registration.relationship_other}`
                : labelFor(relationshipOptions, registration.relationship)
            }
          />
          <DetailRow
            compact
            label="Address"
            value={`${registration.address_line1}${
              registration.address_line2 ? `, ${registration.address_line2}` : ""
            }, ${registration.city}, ${registration.state} ${registration.postal_code}`}
          />
          <DetailRow compact label="County" value={registration.county} />
          <DetailRow compact label="Parcel ID" value={registration.parcel_id || "—"} />
          <DetailRow
            compact
            label="Property type"
            value={labelFor(propertyTypeOptions, registration.property_type)}
          />
          <DetailRow
            compact
            label="Public sources"
            value={registration.public_source_notes || "—"}
          />
          <DetailRow compact label="User note" value={registration.user_note || "—"} />
          <DetailRow compact label="Submitted" value={formatDateTime(registration.submitted_at)} />
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
          {STAFF_SETTABLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
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
          &quot;Anchored&quot; is not settable here: it is written only by the anchoring pipeline
          once a complete validated record proof exists (payload hash, network, transaction hash,
          ledger index and anchor time).
        </p>
        <button
          type="button"
          disabled={busy || nextStatus === registration.status}
          onClick={() => void applyStatus()}
          className={`justify-self-start ${primaryButtonClass}`}
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
          className={`justify-self-start ${secondaryButtonClass}`}
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
        <h3 className="text-lg">Supporting documents</h3>
        <RegistrationDocumentSlots
          registrationId={registration.id}
          emptyLabel="No documents were attached to this submission."
        />
      </Card>


      <Card className="grid gap-2">
        <h3 className="text-lg">History</h3>
        <StatusHistory entries={history ?? []} />
      </Card>
    </div>
  );
}

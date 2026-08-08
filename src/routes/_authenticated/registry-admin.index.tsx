import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Card, EmptyState, Section, SectionHeading, primaryButtonClass } from "@/components/ui-kit";
import { StatusChip } from "@/components/status-chip";
import { useIsStaff, useSession } from "@/hooks/use-session";
import { DOCUMENT_SLOTS, documentSlotLabel } from "@/lib/documents";
import {
  REGISTRATION_STATUSES,
  formatDateTime,
  statusLabels,
  type RegistrationStatus,
} from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/registry-admin/")({
  head: () => ({
    meta: [
      { title: "Business portal overview — Accountabul registry staff" },
      {
        name: "description",
        content:
          "Registry operations overview: submission volume, review workload, evidence coverage and recent staff activity.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Business portal overview — Accountabul" },
      { property: "og:description", content: "Staff-only registry operations overview." },
    ],
  }),
  component: RegistryAdminHome,
});

const NEEDS_ACTION: RegistrationStatus[] = ["submitted", "under_review"];

function RegistryAdminHome() {
  const { role, isStaff, checking } = useIsStaff();
  const { user } = useSession();

  const { data: myReviews } = useQuery({
    queryKey: ["admin-overview-my-reviews", user?.id],
    enabled: isStaff && Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_status_history")
        .select("id, registration_id, from_status, to_status, created_at, user_visible_message")
        .eq("changed_by", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: myNotes } = useQuery({
    queryKey: ["admin-overview-my-notes", user?.id],
    enabled: isStaff && Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_notes")
        .select("id, registration_id, created_at")
        .eq("author_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });


  const { data: registrations, isLoading } = useQuery({
    queryKey: ["admin-overview-registrations"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_registrations")
        .select(
          "id, user_id, receipt_code, status, city, state, county, created_at, submitted_at, updated_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-overview-profiles"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, first_name, last_name, profile_completed_at, created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["admin-overview-documents"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_documents")
        .select("id, registration_id, document_type, uploaded_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["admin-overview-activity"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_status_history")
        .select("id, registration_id, from_status, to_status, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: staff } = useQuery({
    queryKey: ["admin-overview-staff"],
    enabled: isStaff && role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const rows = registrations ?? [];
    const byStatus = new Map<RegistrationStatus, number>();
    for (const status of REGISTRATION_STATUSES) byStatus.set(status, 0);
    for (const row of rows) {
      const status = row.status as RegistrationStatus;
      byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
    }

    const now = Date.now();
    const week = rows.filter(
      (r) => now - new Date(r.created_at).getTime() < 7 * 24 * 60 * 60 * 1000,
    ).length;

    const queue = rows
      .filter((r) => NEEDS_ACTION.includes(r.status as RegistrationStatus))
      .sort(
        (a, b) =>
          new Date(a.submitted_at ?? a.created_at).getTime() -
          new Date(b.submitted_at ?? b.created_at).getTime(),
      );

    const oldest = queue[0];
    const oldestDays = oldest
      ? Math.floor(
          (now - new Date(oldest.submitted_at ?? oldest.created_at).getTime()) /
            (24 * 60 * 60 * 1000),
        )
      : null;

    const withDocuments = new Set((documents ?? []).map((d) => d.registration_id));
    const submitted = rows.filter((r) => r.status !== "draft");

    return {
      total: rows.length,
      byStatus,
      week,
      queue,
      oldestDays,
      documentCount: documents?.length ?? 0,
      evidenceCoverage: submitted.length
        ? Math.round(
            (submitted.filter((r) => withDocuments.has(r.id)).length / submitted.length) * 100,
          )
        : null,
      missingEvidence: submitted.filter((r) => !withDocuments.has(r.id)).length,
    };
  }, [registrations, documents]);

  const documentsByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const document of documents ?? []) {
      map.set(document.document_type, (map.get(document.document_type) ?? 0) + 1);
    }
    return map;
  }, [documents]);

  const profileById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof profiles>[number]>();
    for (const profile of profiles ?? []) map.set(profile.id, profile);
    return map;
  }, [profiles]);

  const registrationById = useMemo(() => {
    const map = new Map<string, NonNullable<typeof registrations>[number]>();
    for (const row of registrations ?? []) map.set(row.id, row);
    return map;
  }, [registrations]);

  if (checking || !isStaff) return null;

  const completedProfiles = (profiles ?? []).filter((p) => p.profile_completed_at).length;
  const myProfile = user ? profileById.get(user.id) : undefined;
  const myName =
    myProfile?.full_name ??
    [myProfile?.first_name, myProfile?.last_name].filter(Boolean).join(" ") ??
    null;
  const displayName = myName || myProfile?.email || user?.email || "reviewer";
  const myLastReview = (myReviews ?? [])[0];

  return (
    <Section>
      <SectionHeading
        eyebrow="Business portal"
        title={`Welcome back, ${displayName}`}
        description="Your personal registry portal: what you have reviewed, plus the current state of the registry across the whole team."
      />

      <Card className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">Signed in as</p>
            <p className="mt-1 truncate text-lg">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {myProfile?.email ?? user?.email} · {role === "admin" ? "Administrator" : "Reviewer"}
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Your decisions</p>
              <p className="text-2xl tabular-nums">{myReviews?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Your notes</p>
              <p className="text-2xl tabular-nums">{myNotes?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last decision</p>
              <p className="text-sm">
                {myLastReview ? formatDateTime(myLastReview.created_at) : "—"}
              </p>
            </div>
          </div>
        </div>
        {(myReviews ?? []).length > 0 ? (
          <ul className="mt-5 grid gap-2">
            {(myReviews ?? []).slice(0, 5).map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
              >
                <p className="truncate">
                  {registrationById.get(event.registration_id)?.receipt_code ?? "Record"} ·{" "}
                  {event.from_status
                    ? `${statusLabels[event.from_status as RegistrationStatus]} → `
                    : ""}
                  {statusLabels[event.to_status as RegistrationStatus]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(event.created_at)}
                  {event.user_visible_message ? ` · “${event.user_visible_message}”` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            You have not recorded a review decision yet. Open the review queue to take the next
            submission.
          </p>
        )}
      </Card>



      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading registry data…</p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Total records"
              value={stats.total}
              hint="Every submission, drafts included"
            />
            <Metric
              label="Waiting on staff"
              value={
                (stats.byStatus.get("submitted") ?? 0) + (stats.byStatus.get("under_review") ?? 0)
              }
              hint={
                stats.oldestDays === null
                  ? "Nothing in the queue"
                  : `Oldest waiting ${stats.oldestDays} day${stats.oldestDays === 1 ? "" : "s"}`
              }
            />
            <Metric
              label="Waiting on submitter"
              value={stats.byStatus.get("needs_information") ?? 0}
              hint="Marked needs information"
            />
            <Metric label="New this week" value={stats.week} hint="Created in the last 7 days" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl">Records by status</h2>
                <Link to="/registry-admin/queue" className={primaryButtonClass}>
                  Open review queue
                </Link>
              </div>
              <ul className="mt-4 grid gap-2">
                {REGISTRATION_STATUSES.map((status) => (
                  <li
                    key={status}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                  >
                    <StatusChip status={status} />
                    <span className="tabular-nums">{stats.byStatus.get(status) ?? 0}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="text-xl">Oldest in the queue</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted or under review, oldest first.
              </p>
              {stats.queue.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  title="Queue is clear"
                  description="No submission is currently waiting on a reviewer."
                />
              ) : (
                <ul className="mt-4 grid gap-2">
                  {stats.queue.slice(0, 6).map((row) => (
                    <li
                      key={row.id}
                      className="rounded-xl border border-border bg-surface px-3.5 py-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{row.receipt_code}</span>
                        <StatusChip status={row.status as RegistrationStatus} />
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {row.city}, {row.state} · {row.county} · waiting since{" "}
                        {formatDateTime(row.submitted_at ?? row.created_at)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {profileById.get(row.user_id)?.email ?? "unknown submitter"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h2 className="text-xl">Evidence coverage</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.evidenceCoverage === null
                  ? "No submitted records yet."
                  : `${stats.evidenceCoverage}% of submitted records have at least one document · ${stats.missingEvidence} without any · ${stats.documentCount} files total.`}
              </p>
              <ul className="mt-4 grid gap-2">
                {DOCUMENT_SLOTS.map((slot) => (
                  <li
                    key={slot.value}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                  >
                    <span className="min-w-0 truncate">{documentSlotLabel(slot.value)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {documentsByType.get(slot.value) ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="grid gap-6">
              <Card>
                <h2 className="text-xl">Accounts</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profiles?.length ?? 0} registered{" "}
                  {profiles?.length === 1 ? "account" : "accounts"} · {completedProfiles} with a
                  completed verification profile.
                </p>
              </Card>

              <Card>
                <h2 className="text-xl">Recent review activity</h2>
                {(activity ?? []).length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No status changes recorded yet.
                  </p>
                ) : (
                  <ul className="mt-4 grid gap-2">
                    {(activity ?? []).map((event) => (
                      <li
                        key={event.id}
                        className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                      >
                        <p className="truncate">
                          {registrationById.get(event.registration_id)?.receipt_code ?? "Record"} ·{" "}
                          {event.from_status
                            ? `${statusLabels[event.from_status as RegistrationStatus]} → `
                            : ""}
                          {statusLabels[event.to_status as RegistrationStatus]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(event.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {role === "admin" ? (
                <Card>
                  <h2 className="text-xl">Staff access</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Accounts with registry authorization. Approved teammates receive their role
                    automatically the first time they sign in with a confirmed email.
                  </p>
                  <ul className="mt-4 grid gap-2">
                    {(staff ?? []).map((member) => (
                      <li
                        key={member.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          {profileById.get(member.user_id)?.email ?? member.user_id}
                        </span>
                        <span className="text-xs text-muted-foreground">{member.role}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          </div>
        </>
      )}
    </Section>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

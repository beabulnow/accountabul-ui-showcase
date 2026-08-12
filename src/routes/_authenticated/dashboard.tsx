import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock3, FilePlus2, Files, Link2, ShieldCheck, UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Card, EmptyState, Section, SectionHeading } from "@/components/ui-kit";
import { StatusChip } from "@/components/status-chip";
import { formatDate, statusHelp, type RegistrationStatus } from "@/lib/registry";
import { profileDisplayName } from "@/lib/profile";
import { useProfile } from "@/hooks/use-profile";
import { useIsStaff, useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your registrations | Verifiabul" },
      {
        name: "description",
        content:
          "Track the property records you have registered with Verifiabul, their review status and their registry receipts.",
      },
      { property: "og:title", content: "Your registrations | Verifiabul" },
      { property: "og:description", content: "Your property registry dashboard." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useSession();
  const { isStaff, role } = useIsStaff();
  const { data: profile } = useProfile(user?.id);

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

  const total = data?.length ?? 0;
  const drafts = data?.filter((row) => row.status === "draft").length ?? 0;
  const inReview =
    data?.filter((row) => ["submitted", "under_review", "needs_information"].includes(row.status))
      .length ?? 0;
  const approved =
    data?.filter((row) => ["approved", "anchoring", "anchored"].includes(row.status)).length ?? 0;
  const anchored = data?.filter((row) => row.status === "anchored").length ?? 0;
  const name = profileDisplayName(profile);

  return (
    <Section>
      <SectionHeading
        as="h1"
        eyebrow="Your account"
        title={profile?.first_name ? `Welcome, ${profile.first_name}` : "Your registry dashboard"}
        description="Manage your profile, register properties, and follow every registry submission from one place."
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

      <Card className="mt-8 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <ProfileAvatar avatarPath={profile?.avatar_path} name={name} className="size-16 text-lg" />
        <div className="min-w-0">
          <p className="truncate font-display text-2xl">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{profile?.email ?? user?.email}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-verified">
            <BadgeCheck className="size-4" /> Profile complete
          </p>
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <UserRound className="size-4" /> Edit profile
        </Link>
      </Card>

      {isStaff ? (
        <Card className="mt-4 flex flex-col gap-3 border-primary/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-lg">Registry staff access</p>
            <p className="text-sm text-muted-foreground">
              Your account is authorized as {role}. Open the business portal to review submissions.
            </p>
          </div>
          <Link
            to="/registry-admin"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ShieldCheck className="size-4" /> Open admin portal
          </Link>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total properties", value: total, icon: Files },
          { label: "Drafts", value: drafts, icon: FilePlus2 },
          { label: "In review", value: inReview, icon: Clock3 },
          { label: "Approved", value: approved, icon: BadgeCheck },
          { label: "Anchored", value: anchored, icon: Link2 },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <stat.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-display text-3xl">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <div>
          <p className="eyebrow">Your activity</p>
          <h2 className="mt-2 text-2xl sm:text-3xl">Property registrations</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only records you submitted appear here. Each one keeps its own status history and
            registry receipt.
          </p>
        </div>
        <div className="mt-6">
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
                            Registry receipt {row.receipt_code} · Created{" "}
                            {formatDate(row.created_at)}
                            {row.submitted_at ? ` · Submitted ${formatDate(row.submitted_at)}` : ""}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {statusHelp[row.status as RegistrationStatus]}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                          <StatusChip status={row.status as RegistrationStatus} />
                          {anchor?.xrpl_tx_hash ? (
                            <span className="text-xs text-muted-foreground">
                              Record proof published
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { Section } from "@/components/ui-kit";
import { useIsStaff } from "@/hooks/use-session";

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
  component: RegistryAdminLayout,
});

function RegistryAdminLayout() {
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

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 sm:px-8">
          <p className="eyebrow shrink-0">Business portal · {role}</p>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link
              to="/registry-admin"
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground font-medium" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="underline-offset-4 hover:underline"
            >
              Overview
            </Link>
            <Link
              to="/registry-admin/queue"
              activeProps={{ className: "text-foreground font-medium" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="underline-offset-4 hover:underline"
            >
              Review queue
            </Link>
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { ECOSYSTEM_CONSENT_VERSION } from "@/lib/ecosystem";
import { isProfileComplete, PROFILE_SELECT } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Use the locally persisted session as the gate. A network getUser() call
    // can fail transiently, and redirecting on that bounces the user back to
    // /auth, which then sees the session and redirects forward again — a loop
    // that looks like a frozen sign-in. Server-side checks still re-validate.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }

    const profileRoutes = ["/complete-profile", "/profile"];
    if (!profileRoutes.includes(location.pathname)) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (error) throw error;
      if (!isProfileComplete(profile)) {
        throw redirect({
          to: "/complete-profile",
          search: { redirect: location.href },
        });
      }

      // First run: show the ecosystem sharing notice before anything else.
      if (
        location.pathname !== "/ecosystem-consent" &&
        profile?.ecosystem_consent_version !== ECOSYSTEM_CONSENT_VERSION
      ) {
        throw redirect({
          to: "/ecosystem-consent",
          search: { redirect: location.href },
        });
      }
    }
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});

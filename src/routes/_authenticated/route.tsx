import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
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
    }
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

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
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});

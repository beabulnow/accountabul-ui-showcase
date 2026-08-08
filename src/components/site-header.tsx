import { Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useIsStaff, useSession } from "@/hooks/use-session";

export function SiteHeader() {
  const { user, loading } = useSession();
  const { isStaff } = useIsStaff();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
        <Link to="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:size-9">
            <ShieldCheck className="size-4 sm:size-4.5" />
          </span>
          <span className="font-display text-base leading-none whitespace-nowrap sm:text-xl">
            Accountabul
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 text-[13px] sm:gap-2 sm:text-sm">

          {loading ? null : user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-full px-3 py-2 transition-colors hover:bg-accent"
              >
                Dashboard
              </Link>
              {isStaff ? (
                <Link
                  to="/registry-admin"
                  className="hidden rounded-full px-3 py-2 transition-colors hover:bg-accent sm:inline-flex"
                >
                  Registry admin
                </Link>
              ) : null}
              <Link
                to="/register-property"
                className="hidden rounded-full bg-primary px-3.5 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:inline-flex"
              >
                Register a property
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-full border border-input px-3 py-2 transition-colors hover:bg-accent"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="rounded-full px-3 py-2 transition-colors hover:bg-accent">
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="rounded-full bg-primary px-3.5 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

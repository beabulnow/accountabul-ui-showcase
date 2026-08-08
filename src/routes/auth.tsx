import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Section } from "@/components/ui-kit";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or create an account — Accountabul Registry" },
      {
        name: "description",
        content:
          "Sign in to the Accountabul Property Verification Registry, or create an account to register a property record for staff review.",
      },
      { property: "og:title", content: "Sign in — Accountabul Registry" },
      {
        property: "og:description",
        content: "Access your property registrations and registry receipts.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isSafePath = (value: string | null | undefined): value is string =>
    !!value && value.startsWith("/") && !value.startsWith("//");

  // Read at call time, never during render: touching sessionStorage while
  // rendering makes the server and client disagree and breaks hydration.
  const resolveRedirect = useCallback(() => {
    if (isSafePath(search.redirect)) return search.redirect;
    const stored =
      typeof window === "undefined" ? null : sessionStorage.getItem("accountabul:redirect");
    return isSafePath(stored) ? stored : "/dashboard";
  }, [search.redirect]);

  useEffect(() => {
    const go = () => {
      sessionStorage.removeItem("accountabul:redirect");
      navigate({ to: safeRedirect, replace: true });
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, safeRedirect]);

  // If the Google popup is closed or blocked, its promise never settles. Clear
  // the pending state when the user comes back so the page is never stuck.
  useEffect(() => {
    if (!googleBusy) return;
    const clear = () => setGoogleBusy(false);
    window.addEventListener("focus", clear);
    return () => window.removeEventListener("focus", clear);
  }, [googleBusy]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice("If that email has an account, a password reset link is on its way.");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice(
            "Account created. Check your inbox and confirm your email address before signing in.",
          );
          setMode("signin");
          return;
        }
        toast.success("Account created");
        navigate({ to: safeRedirect, replace: true });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: safeRedirect, replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setNotice(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setNotice(null);
    setGoogleBusy(true);
    try {
      // The redirect target must be a plain, allow-listed same-origin URL. The
      // intended destination is kept separately and applied after the session
      // is confirmed.
      sessionStorage.setItem("accountabul:redirect", safeRedirect);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
      if (result.redirected) return;
      toast.success("Signed in");
      navigate({ to: safeRedirect, replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setNotice(message);
      toast.error(message);
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <Section className="max-w-lg">
      <p className="eyebrow">Accountabul Registry</p>
      <h1 className="mt-3 text-3xl sm:text-4xl">
        {mode === "signup"
          ? "Create your registry account"
          : mode === "forgot"
            ? "Reset your password"
            : "Sign in to the registry"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Registry accounts are used to submit property records for staff review and to hold your
        registry receipts. No wallet or blockchain fees are involved.
      </p>

      {mode !== "forgot" ? (
        <div className="mt-8 grid gap-4">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleBusy}
            className="inline-flex items-center justify-center gap-2.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-60"
          >
            <svg aria-hidden="true" viewBox="0 0 18 18" className="h-4 w-4">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18Z"
              />
              <path
                fill="#FBBC05"
                d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.03-2.33Z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
              />
            </svg>
            {googleBusy ? "Opening Google…" : "Continue with Google"}
          </button>
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or use email
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
        {mode === "signup" ? (
          <div className="grid gap-1.5">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full name
            </label>
            <input
              id="fullName"
              name="name"
              autoComplete="name"
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {mode !== "forgot" ? (
          <div className="grid gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            {mode === "signup" ? (
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            ) : null}
          </div>
        ) : null}

        {notice ? (
          <p
            role="status"
            className="rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-muted-foreground"
          >
            {notice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy
            ? "Working…"
            : mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Sign in"}
        </button>
      </form>

      <div className="mt-6 grid gap-2 text-sm">
        {mode !== "signin" ? (
          <button
            type="button"
            className="justify-self-start underline underline-offset-4 hover:opacity-80"
            onClick={() => {
              setMode("signin");
              setNotice(null);
            }}
          >
            Back to sign in
          </button>
        ) : (
          <>
            <button
              type="button"
              className="justify-self-start underline underline-offset-4 hover:opacity-80"
              onClick={() => {
                setMode("signup");
                setNotice(null);
              }}
            >
              Create an account
            </button>
            <button
              type="button"
              className="justify-self-start underline underline-offset-4 hover:opacity-80"
              onClick={() => {
                setMode("forgot");
                setNotice(null);
              }}
            >
              Forgot your password?
            </button>
          </>
        )}
        <Link to="/" className="justify-self-start text-muted-foreground hover:opacity-80">
          Return to the homepage
        </Link>
      </div>
    </Section>
  );
}

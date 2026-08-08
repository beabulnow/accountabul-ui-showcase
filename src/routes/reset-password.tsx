import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { inputClass, primaryButtonClass, Section } from "@/components/ui-kit";
import { errorMessage } from "@/lib/utils";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Accountabul Registry" },
      {
        name: "description",
        content:
          "Choose a new password for your Accountabul Property Verification Registry account.",
      },
      { property: "og:title", content: "Set a new password — Accountabul Registry" },
      { property: "og:description", content: "Complete your password reset." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      const message = errorMessage(updateError, "Could not update your password");
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <Section className="max-w-lg">
      <p className="eyebrow">Accountabul Registry</p>
      <h1 className="mt-3 text-3xl sm:text-4xl">Set a new password</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Open this page from the reset link in your email. If the link has expired, request a new one
        from the sign-in page.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="new-password" className="text-sm font-medium">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </Section>
  );
}

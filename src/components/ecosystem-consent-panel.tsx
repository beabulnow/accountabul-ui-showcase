import { useEffect, useMemo, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";

import { useAppConsents, useEcosystemApps, useSaveConsents } from "@/hooks/use-ecosystem";
import { useSession } from "@/hooks/use-session";
import {
  SHARED_FIELD_COPY,
  consentByAppId,
  isConsentActive,
  type EcosystemApp,
} from "@/lib/ecosystem";
import { Card, CardTitle, Muted, primaryButtonClass, secondaryButtonClass } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

export function EcosystemConsentPanel({
  mode = "onboarding",
  requiredAppId,
  submitLabel,
  onSaved,
}: {
  mode?: "onboarding" | "manage";
  /** App the user is being sent to; it stays ticked and cannot be cleared inline. */
  requiredAppId?: string | null;
  submitLabel?: string;
  onSaved?: (selectedAppIds: string[]) => void | Promise<void>;
}) {
  const { user } = useSession();
  const apps = useEcosystemApps();
  const consents = useAppConsents(user?.id);
  const save = useSaveConsents(user?.id);

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [saved, setSaved] = useState(false);

  const consentMap = useMemo(() => consentByAppId(consents.data), [consents.data]);

  useEffect(() => {
    if (selected || !apps.data || !consents.data) return;
    const next = new Set<string>();
    for (const app of apps.data) {
      const consent = consentMap.get(app.id);
      // First run: default to sharing with every first-party app; returning
      // users see exactly what they previously chose.
      const previouslyDecided = Boolean(consent);
      if (previouslyDecided ? isConsentActive(consent) : mode === "onboarding") next.add(app.id);
    }
    if (requiredAppId) next.add(requiredAppId);
    setSelected(next);
  }, [apps.data, consents.data, consentMap, mode, requiredAppId, selected]);

  function toggle(app: EcosystemApp) {
    if (app.id === requiredAppId) return;
    setSaved(false);
    setSelected((current) => {
      const next = new Set(current ?? []);
      if (next.has(app.id)) next.delete(app.id);
      else next.add(app.id);
      return next;
    });
  }

  async function handleSave() {
    const ids = [...(selected ?? [])];
    await save.mutateAsync(ids);
    setSaved(true);
    await onSaved?.(ids);
  }

  const loading = apps.isLoading || consents.isLoading || !selected;

  return (
    <div className="grid gap-5">
      <Card tone="notice">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="grid gap-2">
            <CardTitle>Welcome to the Verifiabul ecosystem</CardTitle>
            <Muted>
              One profile works across every Verifiabul app. When you sign in somewhere else in the
              family, we can pass along a small set of basic profile details so you never have to
              fill them in twice. You choose which apps receive them, and you can change your mind
              at any time.
            </Muted>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>What we share</CardTitle>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {SHARED_FIELD_COPY.map((field) => (
            <li key={field.scope} className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span className="text-sm">
                <span className="font-medium">{field.label}</span>
                <span className="block text-xs text-muted-foreground">{field.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Nothing else travels between apps. Your property records, documents and verification
          reports stay in the app you submitted them to. If we ever add another field to this list,
          we will show you this notice again before anything new is shared.
        </p>
      </Card>

      <Card>
        <CardTitle>Choose the apps that can use your profile</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          These are all Verifiabul apps. Untick one and it stops receiving your profile.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading apps…</p>
        ) : (
          <ul className="mt-4 grid gap-2.5">
            {(apps.data ?? []).map((app) => {
              const checked = selected.has(app.id);
              const locked = app.id === requiredAppId;
              return (
                <li key={app.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3.5 transition-colors",
                      checked ? "bg-inset" : "hover:bg-inset/70",
                      locked && "cursor-default",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
                      checked={checked}
                      disabled={locked}
                      onChange={() => toggle(app)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{app.name}</span>
                      {app.description ? (
                        <span className="block text-xs text-muted-foreground">
                          {app.description}
                        </span>
                      ) : null}
                      {locked ? (
                        <span className="mt-1 block text-xs text-primary">
                          Required to continue into this app
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {save.error ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {(save.error as Error).message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={handleSave}
            disabled={loading || save.isPending}
          >
            {save.isPending ? "Saving…" : (submitLabel ?? "Confirm and continue")}
          </button>
          {mode === "onboarding" ? (
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => {
                setSelected(new Set(requiredAppId ? [requiredAppId] : []));
                setSaved(false);
              }}
              disabled={save.isPending}
            >
              Clear all
            </button>
          ) : null}
          {saved && !save.isPending ? (
            <span className="text-sm text-muted-foreground">Your choices are saved.</span>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

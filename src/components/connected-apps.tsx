import { useMemo } from "react";
import { Link } from "@tanstack/react-router";

import { useAppConsents, useEcosystemApps, useSaveConsents } from "@/hooks/use-ecosystem";
import { useSession } from "@/hooks/use-session";
import { consentByAppId, isConsentActive } from "@/lib/ecosystem";
import { Card, CardTitle, secondaryButtonClass } from "@/components/ui-kit";

/** "Connected apps" management card shown on the profile page. */
export function ConnectedApps() {
  const { user } = useSession();
  const apps = useEcosystemApps();
  const consents = useAppConsents(user?.id);
  const save = useSaveConsents(user?.id);

  const consentMap = useMemo(() => consentByAppId(consents.data), [consents.data]);
  const activeIds = useMemo(
    () => (apps.data ?? []).filter((app) => isConsentActive(consentMap.get(app.id))).map((a) => a.id),
    [apps.data, consentMap],
  );

  function setAccess(appId: string, grant: boolean) {
    const next = new Set(activeIds);
    if (grant) next.add(appId);
    else next.delete(appId);
    save.mutate([...next]);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Connected apps</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Apps in the Verifiabul family that can use your shared profile: photo, name, phone and
            email.
          </p>
        </div>
        <Link to="/ecosystem-consent" className={secondaryButtonClass}>
          Review notice
        </Link>
      </div>

      {apps.isLoading || consents.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="mt-4 grid gap-2.5">
          {(apps.data ?? []).map((app) => {
            const active = activeIds.includes(app.id);
            return (
              <li
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{app.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {active ? "Sharing your profile" : "No access"}
                  </p>
                </div>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={save.isPending}
                  onClick={() => setAccess(app.id, !active)}
                >
                  {active ? "Revoke" : "Allow"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {save.error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {(save.error as Error).message}
        </p>
      ) : null}
    </Card>
  );
}

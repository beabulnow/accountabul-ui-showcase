import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EcosystemConsentPanel } from "@/components/ecosystem-consent-panel";
import { Card, Section, SectionHeading, secondaryButtonClass } from "@/components/ui-kit";
import { useSession } from "@/hooks/use-session";
import { useProfile } from "@/hooks/use-profile";
import { isProfileComplete } from "@/lib/profile";
import { issueIdentityCode, resolveEcosystemApp, type IdentityAppInfo } from "@/lib/identity.functions";

type ConnectSearch = { app?: string; return?: string; state?: string };

export const Route = createFileRoute("/connect")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ConnectSearch => ({
    ...(typeof search["app"] === "string" ? { app: search["app"] } : {}),
    ...(typeof search["return"] === "string" ? { return: search["return"] } : {}),
    ...(typeof search["state"] === "string" ? { state: search["state"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Continue with Verifiabul | Verifiabul" },
      {
        name: "description",
        content: "Sign in with your Verifiabul profile to continue into another Verifiabul app.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);

  const [app, setApp] = useState<IdentityAppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handing, setHanding] = useState(false);

  const slug = search.app ?? "";
  const returnUrl = search.return ?? "";

  // Send unauthenticated visitors through the normal sign-in, then back here.
  useEffect(() => {
    if (loading || user) return;
    navigate({
      to: "/auth",
      search: { redirect: window.location.pathname + window.location.search },
      replace: true,
    });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || profileLoading) return;
    if (!isProfileComplete(profile)) {
      navigate({
        to: "/complete-profile",
        search: { redirect: window.location.pathname + window.location.search },
        replace: true,
      });
    }
  }, [user, profile, profileLoading, navigate]);

  useEffect(() => {
    let active = true;
    if (!slug || !returnUrl) {
      setError("This link is missing the app or return address.");
      return;
    }
    resolveEcosystemApp({ data: { slug, returnUrl } })
      .then((result) => {
        if (!active) return;
        if (result.ok) setApp(result.app);
        else
          setError(
            result.reason === "unknown_app"
              ? "That app is not part of the Verifiabul ecosystem."
              : "That return address is not registered for this app.",
          );
      })
      .catch(() => active && setError("We could not verify that app right now."));
    return () => {
      active = false;
    };
  }, [slug, returnUrl]);

  function returnWith(params: Record<string, string>) {
    const url = new URL(returnUrl);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    if (search.state) url.searchParams.set("state", search.state);
    window.location.replace(url.toString());
  }

  async function completeHandoff() {
    setHanding(true);
    try {
      const result = await issueIdentityCode({ data: { slug, returnUrl } });
      if (result.ok) returnWith({ code: result.code });
      else returnWith({ error: result.reason });
    } catch {
      setError("We could not complete the handoff. Try again.");
      setHanding(false);
    }
  }

  if (error) {
    return (
      <Section className="max-w-2xl">
        <SectionHeading as="h1" eyebrow="Verifiabul ID" title="We can't continue" />
        <Card className="mt-6">
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      </Section>
    );
  }

  if (loading || profileLoading || !app) {
    return (
      <Section className="max-w-2xl">
        <p className="text-sm text-muted-foreground">Preparing your Verifiabul profile…</p>
      </Section>
    );
  }

  return (
    <Section className="max-w-3xl">
      <SectionHeading
        as="h1"
        eyebrow="Verifiabul ID"
        title={`Continue to ${app.name}`}
        description="Confirm the profile details we may pass along, then you'll be sent straight back."
      />
      <div className="mt-8">
        <EcosystemConsentPanel
          mode="onboarding"
          requiredAppId={app.id}
          submitLabel={handing ? "Returning…" : `Confirm and continue to ${app.name}`}
          onSaved={completeHandoff}
        />
        <div className="mt-4">
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={handing}
            onClick={() => returnWith({ error: "access_denied" })}
          >
            Cancel and go back
          </button>
        </div>
      </div>
    </Section>
  );
}

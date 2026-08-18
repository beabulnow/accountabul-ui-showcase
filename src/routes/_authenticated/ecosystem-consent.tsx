import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EcosystemConsentPanel } from "@/components/ecosystem-consent-panel";
import { Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/ecosystem-consent")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Data sharing across Verifiabul | Verifiabul" },
      {
        name: "description",
        content: "Choose which Verifiabul apps can use your shared profile.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EcosystemConsentPage,
});

function safePath(value: string | undefined) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/ecosystem-consent")) return "/dashboard";
  return value;
}

function EcosystemConsentPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <Section className="max-w-3xl">
      <SectionHeading
        as="h1"
        eyebrow="Verifiabul ID"
        title="One profile across our apps"
        description="Set this once. You can update it any time from your profile."
      />
      <div className="mt-8">
        <EcosystemConsentPanel
          mode="onboarding"
          onSaved={() => {
            navigate({ to: safePath(redirect), replace: true });
          }}
        />
      </div>
    </Section>
  );
}

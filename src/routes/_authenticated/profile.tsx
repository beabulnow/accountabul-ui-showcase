import { createFileRoute } from "@tanstack/react-router";

import { ConnectedApps } from "@/components/connected-apps";
import { ProfileForm } from "@/components/profile-form";
import { Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (search: Record<string, unknown>): { returnTo?: string } =>
    typeof search["returnTo"] === "string" ? { returnTo: search["returnTo"] } : {},

  head: () => ({
    meta: [
      { title: "Your profile | Verifiabul" },
      { name: "description", content: "Review and update your Verifiabul registry profile." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { returnTo } = Route.useSearch();
  return (
    <Section className="max-w-3xl">
      <SectionHeading
        as="h1"
        eyebrow="Your account"
        title="Profile and identity information"
        description="Keep the information connected to your property registrations accurate and current."
      />
      <ProfileForm mode="edit" redirectTo={returnTo ?? null} />
      <div className="mt-10">
        <ConnectedApps />
      </div>
    </Section>
  );
}

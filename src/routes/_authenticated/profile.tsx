import { createFileRoute } from "@tanstack/react-router";

import { ProfileForm } from "@/components/profile-form";
import { Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search["returnTo"] === "string" ? (search["returnTo"] as string) : undefined,
  }),
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
    </Section>
  );
}

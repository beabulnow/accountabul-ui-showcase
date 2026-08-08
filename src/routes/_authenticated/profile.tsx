import { createFileRoute } from "@tanstack/react-router";

import { ProfileForm } from "@/components/profile-form";
import { Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/profile")({
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
  return (
    <Section className="max-w-3xl">
      <SectionHeading
        as="h1"
        eyebrow="Your account"
        title="Profile and identity information"
        description="Keep the information connected to your property registrations accurate and current."
      />
      <ProfileForm mode="edit" />
    </Section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ProfileForm } from "@/components/profile-form";
import { Section, SectionHeading } from "@/components/ui-kit";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/_authenticated/complete-profile")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Complete your profile | Verifiabul" },
      {
        name: "description",
        content:
          "Set up your private Verifiabul registry account: add your name, date of birth and contact details before submitting a property record for review.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const search = Route.useSearch();

  return (
    <Section className="max-w-3xl">
      <SectionHeading
        as="h1"
        eyebrow="One-time account setup"
        title="Complete your profile"
        description="Before you register a property, tell us who is using this account. Your information stays private to you and authorized registry staff."
      />
      <ProfileForm mode="onboarding" redirectTo={search.redirect} />
    </Section>
  );
}

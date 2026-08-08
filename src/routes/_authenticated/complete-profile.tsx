import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ProfileForm } from "@/components/profile-form";
import { Section, SectionHeading } from "@/components/ui-kit";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/_authenticated/complete-profile")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Complete your profile — Accountabul Registry" },
      { name: "description", content: "Complete your private registry account profile." },
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
        eyebrow="One-time account setup"
        title="Complete your profile"
        description="Before you register a property, tell us who is using this account. Your information stays private to you and authorized registry staff."
      />
      <ProfileForm mode="onboarding" redirectTo={search.redirect} />
    </Section>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileSearch, ShieldCheck, XCircle } from "lucide-react";

import { Card, Section, SectionHeading } from "@/components/ui-kit";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verifiabul — Property Verification Registry" },
      {
        name: "description",
        content:
          "Submit your property information and have it reviewed by our team. You can follow the review from your account and see exactly where it stands.",
      },
      { property: "og:title", content: "Verifiabul — Property Verification Registry" },
      {
        property: "og:description",
        content:
          "Submit your property information, our team reviews it, and you can follow every step from your account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const steps = [
  {
    icon: FileSearch,
    title: "1 · Tell us about the property",
    body: "Add the address, where it's located, the parcel or lot number, and how you're connected to it. You can save a draft and finish later.",
  },
  {
    icon: ShieldCheck,
    title: "2 · Upload your documents",
    body: "Attach things like a deed, tax statement, or utility bill. Each document has its own upload slot, so nothing gets lost or mixed up.",
  },
  {
    icon: CheckCircle2,
    title: "3 · We review and respond",
    body: "Our team checks what you sent, asks for anything missing, and updates the status. You'll see the decision and the date it was made.",
  },
];

const isList = [
  "A place to submit property information and supporting documents for review.",
  "A real person on our team reading what you sent and responding.",
  "A clear status and dated history you can check any time from your account.",
];

const isNotList = [
  "Not legal title, a deed, or proof of ownership.",
  "Not title insurance, an appraisal, or a valuation.",
  "Not a sale, transfer, or listing of the property.",
  "Not a government filing or government approval of any kind.",
];

function Home() {
  const { user } = useSession();

  return (
    <div>
      <div className="relative overflow-hidden border-b border-border bg-surface">
        <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="min-w-0">
            <p className="eyebrow">Property Verification Registry</p>
            <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Submit your property. We'll review it and tell you where it stands.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Verifiabul is a property registry built on evidence, not claims. You share the
              property details and your documents, our team reviews them, and you can follow
              every step from your account — no guessing, no waiting in the dark.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link
                    to="/register-property"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Register a property
                  </Link>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    Go to dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Register a property
                  </Link>
                  <Link
                    to="/auth"
                    className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free to submit. Submitting a property here is not legal title or proof of ownership.
            </p>
          </div>

          <div className="min-w-0">
            <Card className="bg-card">
              <p className="eyebrow">Your account</p>
              <p className="mt-3 font-display text-2xl">What you get</p>
              <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                <li>A reference number for every property you submit.</li>
                <li>
                  A plain status at a glance: draft, submitted, under review, needs information, or
                  approved.
                </li>
                <li>A dated history of what changed, plus any message from the reviewer.</li>
                <li>Your uploaded documents kept together in one private place.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, start to finish"
          description="No jargon, no surprises — you always know what happens next."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.title}>
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <div className="border-t border-border bg-surface">
        <Section>
          <SectionHeading
            eyebrow="Be clear"
            title="What this is, and what this is not"
            description="Plain language, because the difference matters."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Card>
              <h3 className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="size-5 text-verified" aria-hidden />
                What this is
              </h3>
              <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
                {isList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="flex items-center gap-2 text-xl">
                <XCircle className="size-5 text-destructive" aria-hidden />
                What this is not
              </h3>
              <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
                {isNotList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>
      </div>
    </div>
  );
}

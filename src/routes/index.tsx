import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleAlert,
  Database,
  FileSearch,
  ShieldCheck,
} from "lucide-react";

import { Card, Section, SectionHeading } from "@/components/ui-kit";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Property Record Verification | Verifiabul" },
      {
        name: "description",
        content:
          "Verify property information through evidence review, available public record research, and a clear result you can follow from your Verifiabul account.",
      },
      { property: "og:title", content: "Property Record Verification | Verifiabul" },
      {
        property: "og:description",
        content:
          "Register a property, submit supporting records, and receive a clear verification result from Verifiabul.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://verifiabul.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://verifiabul.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://verifiabul.com/#website",
              name: "Verifiabul",
              url: "https://verifiabul.com/",
              description:
                "Property record verification through organized evidence, available public record research, and clear review results.",
              publisher: { "@id": "https://verifiabul.com/#organization" },
            },
            {
              "@type": "Organization",
              "@id": "https://verifiabul.com/#organization",
              name: "Verifiabul",
              url: "https://verifiabul.com/",
              description:
                "Verifiabul helps owners and authorized representatives organize evidence, research available property information, and receive clear verification results.",
            },
          ],
        }),
      },
    ],
  }),

  component: Home,
});

const verificationAreas = [
  {
    icon: Building2,
    title: "Property identity",
    body: "We organize the address, parcel details, county, property type, and other information that identifies the record.",
  },
  {
    icon: FileSearch,
    title: "Supporting evidence",
    body: "We compare the details you submit with deeds, tax records, statements, identification, and other supporting documents.",
  },
  {
    icon: ShieldCheck,
    title: "Record and lien signals",
    body: "When included in the review scope, we research available public records and flag lien indicators, conflicts, or gaps that need attention.",
  },
  {
    icon: Database,
    title: "A structured property record",
    body: "Verified information is organized into a reusable property record that can be maintained as the property changes over time.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    body: "Your account is the private workspace for your properties, documents, reviewer messages, and verification results.",
  },
  {
    number: "02",
    title: "Register a property",
    body: "Add the property details, explain your relationship to it, and upload the records that support the information you provide.",
  },
  {
    number: "03",
    title: "We analyze the record",
    body: "Our team reviews the submission, compares the evidence, researches available sources, and asks for anything else needed.",
  },
  {
    number: "04",
    title: "Receive a clear result",
    body: "Your account shows whether the information was verified, needs more information, or could not be verified within the review scope.",
  },
];

const results = [
  {
    icon: CheckCircle2,
    label: "Verified",
    body: "The submitted information and reviewed evidence are consistent within the stated verification scope.",
    tone: "text-verified bg-verified/10",
  },
  {
    icon: CircleAlert,
    label: "Needs information",
    body: "The review needs another document, a correction, or clarification before it can be completed.",
    tone: "text-caution bg-caution/10",
  },
  {
    icon: FileSearch,
    label: "Unable to verify",
    body: "The available information did not support a verified result, and your account will explain what could not be confirmed.",
    tone: "text-muted-foreground bg-muted",
  },
];

function Home() {
  const { user } = useSession();

  const primaryCta = user ? (
    <Link
      to="/register-property"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
    >
      Register a property
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  ) : (
    <Link
      to="/auth"
      search={{ mode: "signup" }}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
    >
      Start property verification
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );

  return (
    <div>
      <div className="relative overflow-hidden border-b border-border bg-surface">
        <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="min-w-0">
            <p className="eyebrow">Property record verification</p>
            <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Turn property information into a verified record.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Verifiabul helps property owners and authorized representatives organize their
              records, submit evidence, and receive a clear verification result. We review what you
              provide, research available property information, and flag anything that needs more
              attention.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryCta}
              <Link
                to={user ? "/dashboard" : "/auth"}
                className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                {user ? "View my properties" : "Sign in to your account"}
              </Link>
            </div>
            <p className="mt-4 max-w-xl text-xs text-muted-foreground">
              Start with an address and supporting documents. Your account keeps each submission,
              reviewer request, status update, and result together.
            </p>
          </div>

          <Card className="relative overflow-hidden bg-card shadow-lift">
            <div className="absolute inset-x-0 top-0 h-1 bg-verified" aria-hidden />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">A Verifiabul result</p>
                <p className="mt-3 font-display text-2xl">A clear answer with a record behind it</p>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                <BadgeCheck className="size-6" aria-hidden />
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              {[
                "Property details organized",
                "Supporting evidence reviewed",
                "Issues and missing information flagged",
                "Verification status recorded",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-verified" aria-hidden />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              A verification result reflects the information and sources reviewed. The exact scope
              is documented with the record.
            </p>
          </Card>
        </div>
      </div>

      <Section>
        <SectionHeading
          eyebrow="The service"
          title="We help you verify the property record"
          description="A property is more than an address. We bring its identifying information, supporting evidence, and review history into one organized record."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {verificationAreas.map((area) => (
            <Card key={area.title}>
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <area.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl">{area.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{area.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <div className="border-y border-border bg-surface">
        <Section>
          <SectionHeading
            eyebrow="Your journey"
            title="From property registration to verification"
            description="Your account shows what is happening, what we need, and what the review found."
          />
          <ol className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <li key={step.number}>
                <Card className="h-full">
                  <p className="font-display text-3xl text-verified">{step.number}</p>
                  <h3 className="mt-4 text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section>
        <SectionHeading
          eyebrow="The outcome"
          title="You always know where the property record stands"
          description="The result is written in plain language and supported by a dated review history in your account."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {results.map((result) => (
            <Card key={result.label}>
              <span className={`grid size-10 place-items-center rounded-xl ${result.tone}`}>
                <result.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-xl">{result.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{result.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <div className="border-y border-border bg-primary text-primary-foreground">
        <Section className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.16em] uppercase opacity-70">
              A property record that can grow with you
            </p>
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Verify it now. Keep it ready for what comes next.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 opacity-80">
              A structured, verified property record can help support future marketing,
              transactions, title services, and digital property workflows as those services become
              available. When the property changes hands or the record changes, Verifiabul can help
              keep the information current.
            </p>
          </div>
          <Card className="border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground shadow-none">
            <p className="font-display text-2xl">Built for trustworthy property data</p>
            <ul className="mt-4 grid gap-3 text-sm opacity-80">
              <li>One organized record for property facts and evidence</li>
              <li>A review history that explains how the result was reached</li>
              <li>Structured information ready for future approved uses</li>
            </ul>
          </Card>
        </Section>
      </div>

      <Section>
        <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">Start your property record</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Ready to verify a property?</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Create an account, register the property, and submit the information you want us to
              review. Your account will guide you through every step.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {primaryCta}
            {!user ? (
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-4xl text-center text-xs leading-5 text-muted-foreground">
          Verifiabul provides an informational review of submitted evidence and available records.
          Verification is not a legal title opinion, title insurance, a government certification, an
          appraisal, a lien guarantee, or proof of ownership. Formal title work may require a
          licensed title professional.
        </p>
      </Section>
    </div>
  );
}

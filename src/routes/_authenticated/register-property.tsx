import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PendingDocumentSlots } from "@/components/document-slots";
import {
  Card,
  Field,
  Section,
  SectionHeading,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui-kit";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { uploadRegistrationDocuments } from "@/hooks/use-registration-documents";
import { countPendingDocuments, type PendingDocuments } from "@/lib/documents";
import { profileDisplayName } from "@/lib/profile";
import { errorMessage } from "@/lib/utils";
import {
  emptyRegistration,
  propertyTypeOptions,
  registrationSchema,
  relationshipOptions,
  type RegistrationInput,
} from "@/lib/registry";

export const Route = createFileRoute("/_authenticated/register-property")({
  head: () => ({
    meta: [
      { title: "Register a property record — Verifiabul Registry" },
      {
        name: "description",
        content:
          "Submit a property record to the Verifiabul registry for staff review. Registration is not title, ownership transfer, valuation or government approval.",
      },
      { property: "og:title", content: "Register a property record — Verifiabul Registry" },
      { property: "og:description", content: "Submit a property record for registry review." },
    ],
  }),
  component: RegisterPropertyPage,
});

function RegisterPropertyPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [form, setForm] = useState<RegistrationInput>(emptyRegistration);
  const [documents, setDocuments] = useState<PendingDocuments>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const documentCount = countPendingDocuments(documents);

  useEffect(() => {
    if (!profile) return;
    const name = profileDisplayName(profile);
    setForm((previous) =>
      previous.submitter_full_name ? previous : { ...previous, submitter_full_name: name },
    );
  }, [profile]);

  function set<K extends keyof RegistrationInput>(key: K, value: RegistrationInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(intent: "draft" | "submit") {
    if (!user) return;
    setErrors({});

    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error("Please correct the highlighted fields");
      return;
    }
    if (intent === "submit") {
      const missing = !form.affirm_accurate || !form.affirm_authorized || !form.affirm_not_title;
      if (missing) {
        setErrors({ affirmations: "All three affirmations are required before submitting." });
        toast.error("All three affirmations are required before submitting");
        return;
      }
      if (documentCount === 0) {
        setErrors({
          documents: "Attach at least one supporting document before submitting for review.",
        });
        toast.error("At least one supporting document is required to submit");
        return;
      }
    }

    setBusy(true);
    const payload = {
      ...parsed.data,
      relationship_other: parsed.data.relationship_other || null,
      address_line2: parsed.data.address_line2 || null,
      parcel_id: parsed.data.parcel_id || null,
      public_source_notes: parsed.data.public_source_notes || null,
      user_note: parsed.data.user_note || null,
      user_id: user.id,
      status: intent === "submit" ? ("submitted" as const) : ("draft" as const),
    };

    const { data, error } = await supabase
      .from("property_registrations")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      setBusy(false);
      toast.error(errorMessage(error, "Could not save this registration"));
      return;
    }

    // The initial status history event is written server-side by a database
    // trigger so clients cannot fabricate history entries.

    // Documents upload after the row exists so every object carries a real
    // registration id. A failed file is reported; the saved record stands.
    if (documentCount > 0) {
      setUploading(true);
      const { failures } = await uploadRegistrationDocuments({
        userId: user.id,
        registrationId: data.id,
        documents,
      });
      setUploading(false);
      for (const failure of failures) {
        toast.error(`${failure.fileName}: ${failure.message}`);
      }
    }

    setBusy(false);
    toast.success(intent === "submit" ? "Submitted for review" : "Draft saved");
    navigate({ to: "/registrations/$id", params: { id: data.id } });
  }

  return (
    <Section className="max-w-3xl">
      <SectionHeading
        eyebrow="Registry submission"
        title="Register a property record"
        description="This creates a registry record for staff review. It is not title, a deed, an appraisal, or proof of ownership."
      />

      <form
        className="mt-8 grid gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          void save("submit");
        }}
        noValidate
      >
        <Card className="grid gap-4">
          <h2 className="text-xl">About you</h2>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface px-4 py-4">
            <ProfileAvatar
              avatarPath={profile?.avatar_path}
              name={profileDisplayName(profile)}
              className="size-12 text-sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {profileLoading ? "Loading your profile…" : form.submitter_full_name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {profile?.email ?? user?.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your confirmed profile name will be saved with this registration.
              </p>
            </div>
            <Link to="/profile" className="text-sm underline underline-offset-4">
              Edit profile
            </Link>
          </div>
          {errors["submitter_full_name"] ? (
            <p role="alert" className="text-xs text-destructive">
              {errors["submitter_full_name"]}
            </p>
          ) : null}
          <Field label="Relationship to the property" htmlFor="relationship">
            <select
              id="relationship"
              className={inputClass}
              value={form.relationship}
              onChange={(e) =>
                set("relationship", e.target.value as RegistrationInput["relationship"])
              }
            >
              {relationshipOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {form.relationship === "other" ? (
            <Field
              label="Describe your relationship"
              htmlFor="relationship_other"
              error={errors["relationship_other"]}
            >
              <input
                id="relationship_other"
                className={inputClass}
                value={form.relationship_other ?? ""}
                onChange={(e) => set("relationship_other", e.target.value)}
              />
            </Field>
          ) : null}
        </Card>

        <Card className="grid gap-4">
          <h2 className="text-xl">Property location</h2>
          <Field label="Address line 1" htmlFor="address_line1" error={errors["address_line1"]}>
            <input
              id="address_line1"
              autoComplete="address-line1"
              className={inputClass}
              value={form.address_line1}
              onChange={(e) => set("address_line1", e.target.value)}
            />
          </Field>
          <Field label="Address line 2 (optional)" htmlFor="address_line2">
            <input
              id="address_line2"
              autoComplete="address-line2"
              className={inputClass}
              value={form.address_line2 ?? ""}
              onChange={(e) => set("address_line2", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" htmlFor="city" error={errors["city"]}>
              <input
                id="city"
                autoComplete="address-level2"
                className={inputClass}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </Field>
            <Field label="State" htmlFor="state" error={errors["state"]}>
              <input
                id="state"
                autoComplete="address-level1"
                className={inputClass}
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
            </Field>
            <Field label="ZIP code" htmlFor="postal_code" error={errors["postal_code"]}>
              <input
                id="postal_code"
                inputMode="numeric"
                autoComplete="postal-code"
                className={inputClass}
                value={form.postal_code}
                onChange={(e) => set("postal_code", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="County or jurisdiction" htmlFor="county" error={errors["county"]}>
              <input
                id="county"
                className={inputClass}
                value={form.county}
                onChange={(e) => set("county", e.target.value)}
              />
            </Field>
            <Field label="Parcel ID (optional)" htmlFor="parcel_id" error={errors["parcel_id"]}>
              <input
                id="parcel_id"
                className={inputClass}
                value={form.parcel_id ?? ""}
                onChange={(e) => set("parcel_id", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Property type" htmlFor="property_type">
            <select
              id="property_type"
              className={inputClass}
              value={form.property_type}
              onChange={(e) =>
                set("property_type", e.target.value as RegistrationInput["property_type"])
              }
            >
              {propertyTypeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        <Card className="grid gap-4">
          <h2 className="text-xl">Supporting context</h2>
          <Field
            label="Public source or reference notes (optional)"
            htmlFor="public_source_notes"
            hint="Assessor links, recorded document numbers, register references — anything a reviewer can check."
            error={errors["public_source_notes"]}
          >
            <textarea
              id="public_source_notes"
              rows={4}
              className={inputClass}
              value={form.public_source_notes ?? ""}
              onChange={(e) => set("public_source_notes", e.target.value)}
            />
          </Field>
          <Field
            label="Note to the reviewer (optional)"
            htmlFor="user_note"
            error={errors["user_note"]}
          >
            <textarea
              id="user_note"
              rows={3}
              className={inputClass}
              value={form.user_note ?? ""}
              onChange={(e) => set("user_note", e.target.value)}
            />
          </Field>
        </Card>

        <Card className="grid gap-4">
          <div>
            <h2 className="text-xl">Supporting documents</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each evidence type has its own slot so reviewers receive a pre-sorted file. At least
              one document is required to submit for review; drafts can be saved without any.
            </p>
          </div>
          <PendingDocumentSlots value={documents} onChange={setDocuments} disabled={busy} />
          {errors["documents"] ? (
            <p role="alert" className="text-xs text-destructive">
              {errors["documents"]}
            </p>
          ) : null}
        </Card>

        <Card className="grid gap-3">
          <h2 className="text-xl">Affirmations</h2>
          <p className="text-sm text-muted-foreground">
            All three are required before a record can be submitted for review.
          </p>
          {(
            [
              {
                key: "affirm_accurate" as const,
                label: "The information I am providing is accurate to the best of my knowledge.",
              },
              {
                key: "affirm_authorized" as const,
                label: "I am authorized to provide this information about this property.",
              },
              {
                key: "affirm_not_title" as const,
                label:
                  "I understand this registration is not title, ownership transfer, valuation, tokenization, or government approval.",
              },
            ] as const
          ).map((item) => (
            <label key={item.key} className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                checked={form[item.key]}
                onChange={(e) => set(item.key, e.target.checked)}
              />
              <span className="text-muted-foreground">{item.label}</span>
            </label>
          ))}
          {errors["affirmations"] ? (
            <p role="alert" className="text-xs text-destructive">
              {errors["affirmations"]}
            </p>
          ) : null}
        </Card>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || profileLoading || !form.submitter_full_name}
            className={primaryButtonClass}
          >
            {uploading ? "Uploading documents…" : busy ? "Working…" : "Submit for review"}
          </button>

          <button
            type="button"
            disabled={busy || profileLoading || !form.submitter_full_name}
            onClick={() => void save("draft")}
            className={secondaryButtonClass}
          >
            Save draft
          </button>
        </div>
      </form>
    </Section>
  );
}

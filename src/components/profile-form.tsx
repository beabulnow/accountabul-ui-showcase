import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Camera, CheckCircle2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ProfileAvatar } from "@/components/profile-avatar";
import { Card, Field, inputClass, primaryButtonClass } from "@/components/ui-kit";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  PROFILE_AVATAR_BUCKET,
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_NOTICE_VERSION,
  profileDisplayName,
  profileSchema,
  type ProfileFormInput,
} from "@/lib/profile";
import { errorMessage } from "@/lib/utils";

const emptyForm: ProfileFormInput = {
  first_name: "",
  middle_name: "",
  last_name: "",
  date_of_birth: "",
  phone: "",
  bio: "",
  privacy_accepted: false,
};

function namePartsFromMetadata(metadata: Record<string, unknown> | undefined) {
  const given = typeof metadata?.given_name === "string" ? metadata.given_name.trim() : "";
  const family = typeof metadata?.family_name === "string" ? metadata.family_name.trim() : "";
  if (given || family) return { first: given, last: family };

  const full =
    typeof metadata?.full_name === "string"
      ? metadata.full_name.trim()
      : typeof metadata?.name === "string"
        ? metadata.name.trim()
        : "";
  const parts = full.split(/\s+/).filter(Boolean);
  return {
    first: parts[0] ?? "",
    last: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

function safeRedirect(value: string | null | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function ProfileForm({
  mode,
  redirectTo,
}: {
  mode: "onboarding" | "edit";
  redirectTo?: string | null;
}) {
  const { user } = useSession();
  const { data: profile, isLoading, error } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const initializedFor = useRef<string | null>(null);
  const [form, setForm] = useState<ProfileFormInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [busy, setBusy] = useState(false);

  const previewUrl = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!profile || !user || initializedFor.current === profile.id) return;
    const metadataName = namePartsFromMetadata(user.user_metadata);
    setForm({
      first_name: profile.first_name ?? metadataName.first,
      middle_name: profile.middle_name ?? "",
      last_name: profile.last_name ?? metadataName.last,
      date_of_birth: profile.date_of_birth ?? "",
      phone: profile.phone_e164 ?? "",
      bio: profile.bio ?? "",
      privacy_accepted: Boolean(profile.privacy_accepted_at),
    });
    initializedFor.current = profile.id;
  }, [profile, user]);

  function set<K extends keyof ProfileFormInput>(key: K, value: ProfileFormInput[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function chooseAvatar(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > PROFILE_AVATAR_MAX_BYTES) {
      toast.error("Profile photos must be 2 MB or smaller");
      return;
    }
    setAvatarFile(file);
    setRemoveAvatar(false);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !profile) return;
    setErrors({});

    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error("Please correct the highlighted fields");
      return;
    }

    setBusy(true);
    let avatarPath = removeAvatar ? null : profile.avatar_path;

    try {
      if (avatarFile) {
        avatarPath = `${user.id}/avatar`;
        const { error: uploadError } = await supabase.storage
          .from(PROFILE_AVATAR_BUCKET)
          .upload(avatarPath, avatarFile, {
            cacheControl: "3600",
            contentType: avatarFile.type,
            upsert: true,
          });
        if (uploadError) throw uploadError;
      }

      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: parsed.data.first_name,
          middle_name: parsed.data.middle_name || null,
          last_name: parsed.data.last_name,
          date_of_birth: parsed.data.date_of_birth,
          phone_e164: parsed.data.phone,
          bio: parsed.data.bio || null,
          avatar_path: avatarPath,
          privacy_policy_version: profile.privacy_policy_version ?? PROFILE_NOTICE_VERSION,
        })
        .eq("id", user.id)
        .select("profile_completed_at")
        .single();
      if (updateError) throw updateError;
      if (!updated.profile_completed_at)
        throw new Error("Your profile could not be marked complete");

      if (removeAvatar && profile.avatar_path) {
        const { error: removeError } = await supabase.storage
          .from(PROFILE_AVATAR_BUCKET)
          .remove([profile.avatar_path]);
        if (removeError) toast.error("Profile saved, but the old photo could not be removed");
      }

      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success(mode === "onboarding" ? "Profile completed" : "Profile updated");

      if (mode === "onboarding") {
        window.location.replace(safeRedirect(redirectTo));
      } else {
        setAvatarFile(null);
        setRemoveAvatar(false);
      }
    } catch (saveError) {
      toast.error(errorMessage(saveError, "Could not save your profile"));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return <p className="mt-8 text-sm text-muted-foreground">Loading your profile…</p>;
  }

  if (error || !profile) {
    return (
      <p role="alert" className="mt-8 text-sm text-destructive">
        {errorMessage(error, "Your profile could not be loaded.")}
      </p>
    );
  }

  const name = profileDisplayName(profile);
  const showExistingAvatar = !removeAvatar;

  return (
    <form onSubmit={save} className="mt-8 grid gap-6" noValidate>
      <Card className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <ProfileAvatar
          avatarPath={showExistingAvatar ? profile.avatar_path : null}
          name={name}
          className="size-24 text-xl"
          previewUrl={previewUrl}
        />
        <div>
          <h2 className="text-xl">Profile photo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional. JPEG, PNG, or WebP up to 2 MB. Your photo is kept private to your account and
            authorized registry staff.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
              <Camera className="size-4" />
              Choose photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => chooseAvatar(event.target.files?.[0])}
              />
            </label>
            {(profile.avatar_path || avatarFile) && !removeAvatar ? (
              <button
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  setRemoveAvatar(true);
                }}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                <Trash2 className="size-4" /> Remove
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="grid gap-5">
        <div>
          <h2 className="text-xl">Your identity information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This information connects your account to the property records you submit. It is not
            displayed publicly.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="first_name" error={errors.first_name}>
            <input
              id="first_name"
              autoComplete="given-name"
              className={inputClass}
              value={form.first_name}
              onChange={(event) => set("first_name", event.target.value)}
            />
          </Field>
          <Field label="Middle name (optional)" htmlFor="middle_name" error={errors.middle_name}>
            <input
              id="middle_name"
              autoComplete="additional-name"
              className={inputClass}
              value={form.middle_name ?? ""}
              onChange={(event) => set("middle_name", event.target.value)}
            />
          </Field>
        </div>

        <Field label="Last name" htmlFor="last_name" error={errors.last_name}>
          <input
            id="last_name"
            autoComplete="family-name"
            className={inputClass}
            value={form.last_name}
            onChange={(event) => set("last_name", event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Date of birth"
            htmlFor="date_of_birth"
            hint="Used to distinguish and identify account holders."
            error={errors.date_of_birth}
          >
            <input
              id="date_of_birth"
              type="date"
              autoComplete="bday"
              max={new Date().toISOString().slice(0, 10)}
              className={inputClass}
              value={form.date_of_birth}
              onChange={(event) => set("date_of_birth", event.target.value)}
            />
          </Field>
          <Field
            label="Phone number"
            htmlFor="phone"
            hint="US numbers can be entered normally; other numbers should include the country code."
            error={errors.phone}
          >
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className={inputClass}
              placeholder="(314) 555-0123"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
            />
          </Field>
        </div>

        <Field label="Email address" htmlFor="email" hint="Managed by your sign-in account.">
          <input
            id="email"
            type="email"
            className={inputClass}
            value={profile.email ?? user?.email ?? ""}
            readOnly
          />
        </Field>

        <Field label="Bio (optional)" htmlFor="bio" error={errors.bio}>
          <textarea
            id="bio"
            rows={4}
            maxLength={500}
            className={inputClass}
            placeholder="A short introduction or context for registry staff."
            value={form.bio ?? ""}
            onChange={(event) => set("bio", event.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground">{form.bio?.length ?? 0}/500</p>
        </Field>
      </Card>

      <Card className="grid gap-3">
        <div className="flex items-start gap-3">
          <input
            id="privacy_accepted"
            type="checkbox"
            className="mt-1 size-4 shrink-0 rounded border-input accent-primary"
            checked={form.privacy_accepted}
            disabled={Boolean(profile.privacy_accepted_at)}
            onChange={(event) => set("privacy_accepted", event.target.checked)}
          />
          <label htmlFor="privacy_accepted" className="text-sm text-muted-foreground">
            I understand that Verifiabul stores this private identity information to connect me with
            my property submissions and support registry review. This does not mean my identity has
            been independently KYC-verified.
          </label>
        </div>
        {errors.privacy_accepted ? (
          <p role="alert" className="text-xs text-destructive">
            {errors.privacy_accepted}
          </p>
        ) : null}
        {profile.privacy_accepted_at ? (
          <p className="flex items-center gap-2 text-xs text-verified">
            <CheckCircle2 className="size-4" /> Notice accepted for this account.
          </p>
        ) : null}
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Saving…" : mode === "onboarding" ? "Save and continue" : "Save profile"}
        </button>
        {mode === "edit" ? (
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Back to dashboard
          </Link>
        ) : null}
      </div>
    </form>
  );
}

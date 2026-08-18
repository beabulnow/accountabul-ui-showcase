import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IdentityAppInfo = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  home_url: string | null;
};

/**
 * Looks up a registered ecosystem app and validates that the caller-supplied
 * return URL is on that app's allowlist. Runs server-side so the allowlist and
 * the app registry never reach the browser.
 */
export const resolveEcosystemApp = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; returnUrl: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; app: IdentityAppInfo } | { ok: false; reason: "unknown_app" | "bad_return_url" }
    > => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: app, error } = await supabaseAdmin
        .from("ecosystem_apps")
        .select("id, slug, name, description, home_url, redirect_urls, is_active")
        .eq("slug", data.slug)
        .maybeSingle();
      if (error) throw error;
      if (!app || !app.is_active) return { ok: false, reason: "unknown_app" };
      if (!(app.redirect_urls ?? []).includes(data.returnUrl)) {
        return { ok: false, reason: "bad_return_url" };
      }
      return {
        ok: true,
        app: {
          id: app.id,
          slug: app.slug,
          name: app.name,
          description: app.description,
          home_url: app.home_url,
        },
      };
    },
  );

/**
 * Issues a short-lived, single-use handoff code for the signed-in user. The
 * partner app exchanges it server-to-server for the consented profile fields.
 */
export const issueIdentityCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string; returnUrl: string }) => input)
  .handler(
    async ({
      data,
      context,
    }): Promise<
      | { ok: true; code: string }
      | { ok: false; reason: "unknown_app" | "bad_return_url" | "no_consent" }
    > => {
      const { randomBytes, createHash } = await import("node:crypto");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: app, error } = await supabaseAdmin
        .from("ecosystem_apps")
        .select("id, redirect_urls, is_active")
        .eq("slug", data.slug)
        .maybeSingle();
      if (error) throw error;
      if (!app || !app.is_active) return { ok: false, reason: "unknown_app" };
      if (!(app.redirect_urls ?? []).includes(data.returnUrl)) {
        return { ok: false, reason: "bad_return_url" };
      }

      const { data: consent, error: consentError } = await supabaseAdmin
        .from("app_consents")
        .select("scopes, granted_at, revoked_at")
        .eq("user_id", context.userId)
        .eq("app_id", app.id)
        .maybeSingle();
      if (consentError) throw consentError;
      if (!consent?.granted_at || consent.revoked_at) return { ok: false, reason: "no_consent" };

      const code = randomBytes(32).toString("base64url");
      const codeHash = createHash("sha256").update(code).digest("hex");

      const { error: insertError } = await supabaseAdmin.from("identity_auth_codes").insert({
        code_hash: codeHash,
        user_id: context.userId,
        app_id: app.id,
        redirect_uri: data.returnUrl,
        scopes: consent.scopes,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });
      if (insertError) throw insertError;

      return { ok: true, code };
    },
  );

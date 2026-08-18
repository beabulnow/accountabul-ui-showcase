import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

import { PROFILE_AVATAR_BUCKET } from "@/lib/profile";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function hashesMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Server-to-server exchange: a registered ecosystem app trades a one-time
 * handoff code for the profile fields the user consented to share.
 */
export const Route = createFileRoute("/api/public/identity/profile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: { code?: unknown; client_id?: unknown; client_secret?: unknown };
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return json({ error: "invalid_request" }, 400);
        }

        const code = typeof payload.code === "string" ? payload.code : "";
        const clientId = typeof payload.client_id === "string" ? payload.client_id : "";
        const clientSecret =
          typeof payload.client_secret === "string" ? payload.client_secret : "";
        if (!code || !clientId || !clientSecret) return json({ error: "invalid_request" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: app } = await supabaseAdmin
          .from("ecosystem_apps")
          .select("id, slug, client_secret_hash, is_active")
          .eq("slug", clientId)
          .maybeSingle();
        if (!app || !app.is_active || !app.client_secret_hash) {
          return json({ error: "invalid_client" }, 401);
        }
        const presented = createHash("sha256").update(clientSecret).digest("hex");
        if (!hashesMatch(presented, app.client_secret_hash)) {
          return json({ error: "invalid_client" }, 401);
        }

        const codeHash = createHash("sha256").update(code).digest("hex");
        const { data: authCode } = await supabaseAdmin
          .from("identity_auth_codes")
          .select("id, user_id, app_id, scopes, expires_at, consumed_at")
          .eq("code_hash", codeHash)
          .maybeSingle();
        if (!authCode || authCode.app_id !== app.id) return json({ error: "invalid_code" }, 400);
        if (authCode.consumed_at || new Date(authCode.expires_at).getTime() < Date.now()) {
          return json({ error: "invalid_code" }, 400);
        }

        // Burn the code before returning any data.
        const { data: burned } = await supabaseAdmin
          .from("identity_auth_codes")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", authCode.id)
          .is("consumed_at", null)
          .select("id")
          .maybeSingle();
        if (!burned) return json({ error: "invalid_code" }, 400);

        const { data: consent } = await supabaseAdmin
          .from("app_consents")
          .select("scopes, granted_at, revoked_at")
          .eq("user_id", authCode.user_id)
          .eq("app_id", app.id)
          .maybeSingle();
        if (!consent?.granted_at || consent.revoked_at) {
          return json({ error: "consent_revoked" }, 403);
        }

        const scopes = (consent.scopes ?? []).filter((scope) =>
          (authCode.scopes ?? []).includes(scope),
        );

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email, first_name, last_name, phone_e164, avatar_path")
          .eq("id", authCode.user_id)
          .maybeSingle();
        if (!profile) return json({ error: "profile_not_found" }, 404);

        const shared: Record<string, string | null> = {};
        if (scopes.includes("profile.email")) shared["email"] = profile.email;
        if (scopes.includes("profile.name")) {
          shared["first_name"] = profile.first_name;
          shared["last_name"] = profile.last_name;
        }
        if (scopes.includes("profile.phone")) shared["phone_e164"] = profile.phone_e164;
        if (scopes.includes("profile.avatar")) {
          let avatarUrl: string | null = null;
          if (profile.avatar_path) {
            const { data: signed } = await supabaseAdmin.storage
              .from(PROFILE_AVATAR_BUCKET)
              .createSignedUrl(profile.avatar_path, 60 * 60);
            avatarUrl = signed?.signedUrl ?? null;
          }
          shared["avatar_url"] = avatarUrl;
        }

        return json({ user_id: authCode.user_id, scopes, profile: shared });
      },
    },
  },
});

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  APP_CONSENT_SELECT,
  ECOSYSTEM_APP_SELECT,
  ECOSYSTEM_CONSENT_VERSION,
  SHARED_SCOPES,
  type AppConsent,
  type EcosystemApp,
} from "@/lib/ecosystem";

export function useEcosystemApps() {
  return useQuery({
    queryKey: ["ecosystem-apps"],
    queryFn: async (): Promise<EcosystemApp[]> => {
      const { data, error } = await supabase
        .from("ecosystem_apps")
        .select(ECOSYSTEM_APP_SELECT)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAppConsents(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["app-consents", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<AppConsent[]> => {
      const { data, error } = await supabase.from("app_consents").select(APP_CONSENT_SELECT);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Writes the user's per-app sharing choices. Apps that are ticked get an
 * active grant; unticked apps are recorded as revoked rather than deleted so
 * the audit trail stays complete.
 */
export function useSaveConsents(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selectedAppIds: string[]) => {
      if (!userId) throw new Error("You need to be signed in.");
      const now = new Date().toISOString();

      const { data: existing, error: readError } = await supabase
        .from("app_consents")
        .select(APP_CONSENT_SELECT);
      if (readError) throw readError;

      const { data: apps, error: appsError } = await supabase
        .from("ecosystem_apps")
        .select("id");
      if (appsError) throw appsError;

      const selected = new Set(selectedAppIds);
      const rows = (apps ?? []).map((app) => {
        const previous = (existing ?? []).find((row) => row.app_id === app.id);
        const grant = selected.has(app.id);
        return {
          ...(previous?.id ? { id: previous.id } : {}),
          user_id: userId,
          app_id: app.id,
          scopes: [...SHARED_SCOPES],
          granted_at: grant ? (previous?.granted_at ?? now) : null,
          revoked_at: grant ? null : now,
        };
      });

      const { error: upsertError } = await supabase
        .from("app_consents")
        .upsert(rows, { onConflict: "user_id,app_id" });
      if (upsertError) throw upsertError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          ecosystem_consent_at: now,
          ecosystem_consent_version: ECOSYSTEM_CONSENT_VERSION,
        })
        .eq("id", userId);
      if (profileError) throw profileError;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["app-consents", userId] }),
        queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
      ]);
    },
  });
}

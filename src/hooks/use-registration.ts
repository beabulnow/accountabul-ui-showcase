import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * Status history for one registration. RLS decides what each caller sees:
 * owners get user-visible events, staff get everything.
 */
export function useRegistrationHistory(registrationId: string | null | undefined) {
  return useQuery({
    queryKey: ["registration-history", registrationId],
    enabled: Boolean(registrationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_status_history")
        .select("id, from_status, to_status, user_visible_message, created_at")
        .eq("registration_id", registrationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Internal staff notes. Never readable by submitters (staff-only RLS policy). */
export function useStaffNotes(registrationId: string | null | undefined) {
  return useQuery({
    queryKey: ["staff-notes", registrationId],
    enabled: Boolean(registrationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_notes")
        .select("id, body, created_at")
        .eq("registration_id", registrationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

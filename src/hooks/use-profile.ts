import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PROFILE_SELECT } from "@/lib/profile";

export function useProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

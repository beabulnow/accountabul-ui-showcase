import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        setLoading(false);
      });
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      });
      return () => sub.subscription.unsubscribe();
    } catch (error) {
      // Backend not reachable (e.g. missing config): stay signed-out instead of blanking the page.
      console.error(error);
      setSession(null);
      setLoading(false);
      return;
    }
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useIsStaff() {
  const { user, loading } = useSession();
  const [role, setRole] = useState<"admin" | "reviewer" | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    if (loading) return;
    if (!user) {
      setRole(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    // sync_staff_access grants an allowlisted staff role to the caller's own
    // account (confirmed email only) and returns the effective role.
    supabase.rpc("sync_staff_access").then(({ data, error }) => {
      if (!active) return;
      if (!error) {
        setRole(data === "admin" ? "admin" : data === "reviewer" ? "reviewer" : null);
        setChecking(false);
        return;
      }
      supabase
        .from("staff_roles")
        .select("role")
        .eq("user_id", user.id)
        .then(({ data: rows }) => {
          if (!active) return;
          const roles = (rows ?? []).map((r) => r.role);
          setRole(
            roles.includes("admin") ? "admin" : roles.includes("reviewer") ? "reviewer" : null,
          );
          setChecking(false);
        });
    });

    return () => {
      active = false;
    };
  }, [user, loading]);

  return { role, isStaff: role !== null, checking: checking || loading };
}

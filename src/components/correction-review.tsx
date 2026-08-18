import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Card, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui-kit";
import { formatDateTime } from "@/lib/registry";
import { errorMessage } from "@/lib/utils";

type CorrectedField = { label?: string; from?: unknown; to?: unknown };

const FIELD_LABELS: Record<string, string> = {
  address_line1: "Street address",
  address_line2: "Unit / suite",
  city: "City",
  state: "State",
  postal_code: "ZIP code",
  county: "County",
  parcel_id: "Parcel ID",
  property_type: "Property type",
  submitter_full_name: "Your name",
};

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function useLatestCorrection(registrationId: string) {
  return useQuery({
    queryKey: ["registration-correction", registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_corrections")
        .select("*")
        .eq("registration_id", registrationId)
        .order("round", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Shows the corrections our review turned up and lets the submitter either
 * confirm them (which finalises the record) or say what is still wrong.
 */
export function CorrectionReview({ registrationId }: { registrationId: string }) {
  const queryClient = useQueryClient();
  const { data: correction, isLoading } = useLatestCorrection(registrationId);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (isLoading || !correction || !correction.sent_at) return null;

  const fields = (correction.corrected_fields ?? {}) as Record<string, CorrectedField>;
  const entries = Object.entries(fields);
  const answered = Boolean(correction.response);

  async function respond(response: "confirmed" | "disputed", note?: string) {
    if (!correction) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("registration_corrections")
        .update({ response, dispute_note: note ?? null })
        .eq("id", correction.id);
      if (error) throw error;
      toast.success(
        response === "confirmed"
          ? "Thanks — your record is confirmed."
          : "Thanks — we'll take another look.",
      );
      setDisputeOpen(false);
      setDisputeNote("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["registration-correction", registrationId] }),
        queryClient.invalidateQueries({ queryKey: ["registration", registrationId] }),
        queryClient.invalidateQueries({ queryKey: ["registration-history", registrationId] }),
      ]);
    } catch (error) {
      toast.error(errorMessage(error, "Could not send your answer"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-6 border-caution/40">
      <h2 className="text-xl">Review our corrections</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {correction.source === "engine"
          ? "Our property checks compared your submission with public records."
          : "A reviewer compared your submission with public records."}{" "}
        Sent {formatDateTime(correction.sent_at)}.
      </p>
      {correction.staff_rationale ? (
        <p className="mt-3 rounded-xl border border-border bg-inset px-4 py-3 text-sm">
          {correction.staff_rationale}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nothing needed changing — please confirm the details as submitted.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {entries.map(([key, change]) => (
            <li key={key} className="rounded-xl border border-border bg-inset px-4 py-3 text-sm">
              <p className="font-medium">{change.label ?? FIELD_LABELS[key] ?? key}</p>
              <p className="mt-1 text-muted-foreground">
                <span className="line-through">{displayValue(change.from)}</span>
                <span aria-hidden> → </span>
                <span className="font-medium text-foreground">{displayValue(change.to)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}

      {answered ? (
        <p className="mt-4 text-sm text-muted-foreground">
          You {correction.response === "confirmed" ? "confirmed" : "disputed"} these corrections on{" "}
          {formatDateTime(correction.responded_at)}.
          {correction.dispute_note ? ` Your note: “${correction.dispute_note}”` : ""}
        </p>
      ) : (
        <div className="mt-5 grid gap-3">
          {disputeOpen ? (
            <div className="grid gap-2">
              <label htmlFor="dispute-note" className="text-sm font-medium">
                What is still wrong?
              </label>
              <textarea
                id="dispute-note"
                rows={4}
                className={inputClass}
                value={disputeNote}
                onChange={(event) => setDisputeNote(event.target.value)}
                placeholder="Tell us which detail is incorrect and what it should be."
              />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={primaryButtonClass}
              disabled={saving}
              onClick={() => void respond("confirmed")}
            >
              These details are correct
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={saving || (disputeOpen && disputeNote.trim().length < 5)}
              onClick={() => {
                if (!disputeOpen) {
                  setDisputeOpen(true);
                  return;
                }
                void respond("disputed", disputeNote.trim());
              }}
            >
              {disputeOpen ? "Send my correction" : "Something is still wrong"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

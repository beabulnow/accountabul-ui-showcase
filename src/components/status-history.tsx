import { formatDateTime, statusLabels, type RegistrationStatus } from "@/lib/registry";

type HistoryEntry = {
  id: string;
  from_status: string | null;
  to_status: string;
  user_visible_message: string | null;
  created_at: string;
};

/**
 * Shared status timeline. The receipt page and the staff workspace render the
 * same events, so they render them through the same component.
 */
export function StatusHistory({
  entries,
  emptyMessage = "No status updates yet.",
  showTransition = true,
}: {
  entries: readonly HistoryEntry[];
  emptyMessage?: string;
  showTransition?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="grid gap-4">
      {entries.map((entry) => (
        <li key={entry.id} className="border-l-2 border-border pl-4">
          <p className="text-sm font-medium">
            {statusLabels[entry.to_status as RegistrationStatus]}
            {showTransition && entry.from_status ? (
              <span className="text-muted-foreground">
                {" "}
                · from {statusLabels[entry.from_status as RegistrationStatus]}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
          {entry.user_visible_message ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{entry.user_visible_message}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

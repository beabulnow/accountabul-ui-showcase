import { cn } from "@/lib/utils";
import { statusLabels, type RegistrationStatus } from "@/lib/registry";

const tone: Record<RegistrationStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  submitted: "border-border bg-secondary text-secondary-foreground",
  under_review: "border-border bg-secondary text-secondary-foreground",
  needs_information: "border-caution/40 bg-caution/15 text-caution-foreground",
  approved: "border-verified/40 bg-verified/15 text-verified-foreground",
  anchoring: "border-primary/30 bg-primary/10 text-primary",
  anchored: "border-verified/50 bg-verified/20 text-verified-foreground",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function StatusChip({
  status,
  className,
}: {
  status: RegistrationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tone[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

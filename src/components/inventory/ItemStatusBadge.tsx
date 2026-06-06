import { statusLabels } from "@/lib/status";
import type { ItemStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold",
        status === "normal" && "border-success/30 bg-success/10 text-success",
        status === "low" && "border-warning/30 bg-warning/10 text-warning",
        status === "empty" && "border-danger/30 bg-danger/10 text-danger",
        status === "unknown" && "border-secondary/30 bg-secondary/10 text-secondary",
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

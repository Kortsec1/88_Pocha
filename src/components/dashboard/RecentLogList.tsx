import { Card } from "@/components/ui/Card";
import type { InventoryLog } from "@/lib/types";
import { formatTime } from "@/lib/utils";

export function RecentLogList({ logs }: { logs: InventoryLog[] }) {
  return (
    <Card className="space-y-3">
      {logs.slice(0, 5).length === 0 ? (
        <p className="py-2 text-sm text-secondary">아직 변경 이력이 없습니다.</p>
      ) : (
        logs.slice(0, 5).map((log) => (
          <div key={log.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
            <div className="min-w-0">
              <div className="truncate font-medium">{log.itemName}</div>
              <div className="text-sm text-secondary">
                {formatTime(log.createdAt)} · {log.updatedByName}
              </div>
            </div>
            <div className="shrink-0 text-right font-mono text-sm">
              {log.beforeQuantity} → {log.afterQuantity} {log.unit}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

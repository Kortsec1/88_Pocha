import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ItemStatusBadge } from "@/components/inventory/ItemStatusBadge";
import { Card } from "@/components/ui/Card";
import { categoryLabels } from "@/lib/seed";
import type { Item } from "@/lib/types";
import { formatTime } from "@/lib/utils";

export function ItemCard({ item }: { item: Item }) {
  return (
    <Link href={`/items/${encodeURIComponent(item.id)}`}>
      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold">{item.name}</h3>
            <ItemStatusBadge status={item.status} />
          </div>
          <p className="text-sm text-secondary">
            {categoryLabels[item.category]} · {formatTime(item.updatedAt)} · {item.updatedBy}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">{item.quantity}</div>
            <div className="text-xs text-secondary">{item.unit}</div>
          </div>
          <ChevronRight className="text-secondary" size={20} />
        </div>
      </Card>
    </Link>
  );
}

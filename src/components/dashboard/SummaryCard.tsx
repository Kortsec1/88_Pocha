import { AlertTriangle, CheckCircle2, Package, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { Item } from "@/lib/types";

export function SummaryCard({ items }: { items: Item[] }) {
  const total = items.length;
  const normal = items.filter((item) => item.status === "normal").length;
  const low = items.filter((item) => item.status === "low").length;
  const empty = items.filter((item) => item.status === "empty").length;
  const rows = [
    { label: "전체", value: total, icon: Package, color: "text-primary" },
    { label: "정상", value: normal, icon: CheckCircle2, color: "text-success" },
    { label: "부족", value: low, icon: AlertTriangle, color: "text-warning" },
    { label: "소진", value: empty, icon: XCircle, color: "text-danger" },
  ];

  return (
    <Card className="grid grid-cols-4 gap-2">
      {rows.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-lg bg-elevated/70 p-3 text-center">
          <Icon className={`mx-auto mb-2 ${color}`} size={22} />
          <div className="text-2xl font-bold tabular-nums">{value}</div>
          <div className="text-xs text-secondary">{label}</div>
        </div>
      ))}
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ItemStatusBadge } from "@/components/inventory/ItemStatusBadge";
import { QuantityControl } from "@/components/inventory/QuantityControl";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { categoryLabels } from "@/lib/seed";
import { useAuthUser, useInventory } from "@/lib/useInventory";
import { formatTime } from "@/lib/utils";

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthUser();
  const { items, logs, updateQuantity, updateItemDetails } = useInventory(user);
  const item = items.find((candidate) => candidate.id === decodeURIComponent(params.id));
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState(0);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setUnit(item.unit);
      setMinimumQuantity(item.minimumQuantity);
    }
  }, [item]);

  const itemLogs = useMemo(() => logs.filter((log) => log.itemId === item?.id).slice(0, 5), [item?.id, logs]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!item) return;
    setSaving(true);
    await updateItemDetails(item.id, unit, minimumQuantity);
    await updateQuantity(item.id, quantity, memo.trim() || undefined, unit);
    setSaving(false);
    setMemo("");
    router.push("/dashboard?updated=inventory");
  }

  if (!item) {
    return (
      <MobileShell>
        <Link className="mb-5 inline-flex items-center gap-2 text-secondary" href="/items">
          <ArrowLeft size={18} /> 목록
        </Link>
        <p className="text-secondary">품목을 찾을 수 없습니다.</p>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <Link className="mb-5 inline-flex items-center gap-2 text-secondary" href="/items">
        <ArrowLeft size={18} /> 목록
      </Link>
      <header className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <ItemStatusBadge status={item.status} />
        </div>
        <p className="text-secondary">
          {categoryLabels[item.category]} · 최소 {minimumQuantity}
          {unit}
        </p>
      </header>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Card className="text-center">
          <div className="text-sm text-secondary">현재 수량</div>
          <div className="mt-1 text-6xl font-black tabular-nums">{quantity}</div>
          <div className="mt-1 text-secondary">{item.unit}</div>
        </Card>
        <QuantityControl value={quantity} onChange={setQuantity} />
        <label className="block">
          <span className="mb-2 block text-sm text-secondary">직접 입력</span>
          <Input inputMode="numeric" type="number" min={0} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-2 block text-sm text-secondary">단위</span>
            <Input value={unit} onChange={(event) => setUnit(event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-secondary">최소 수량</span>
            <Input inputMode="numeric" type="number" min={0} value={minimumQuantity} onChange={(event) => setMinimumQuantity(Number(event.target.value))} />
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm text-secondary">메모</span>
          <Textarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="예: 창고에도 남은 수량 없음" />
        </label>
        <Button className="w-full" size="lg" disabled={saving}>
          {saving ? "저장 중" : "저장하고 홈으로"}
        </Button>
      </form>

      <section className="mt-7">
        <h2 className="mb-3 text-lg font-semibold">최근 변경 이력</h2>
        <Card className="space-y-3">
          {itemLogs.length ? (
            itemLogs.map((log) => (
              <div key={log.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{log.updatedByName}</span>
                  <span className="font-mono text-sm text-secondary">{formatTime(log.createdAt)}</span>
                </div>
                <div className="mt-1 text-sm">
                  {log.beforeQuantity}개 → {log.afterQuantity}개
                </div>
                {log.memo ? <div className="mt-1 text-sm text-secondary">메모: {log.memo}</div> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-secondary">아직 변경 이력이 없습니다.</p>
          )}
        </Card>
      </section>
    </MobileShell>
  );
}

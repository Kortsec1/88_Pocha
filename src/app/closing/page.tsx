"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ClipboardCheck } from "lucide-react";
import { ItemStatusBadge } from "@/components/inventory/ItemStatusBadge";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { categoryLabels, categoryOrder } from "@/lib/seed";
import { useAuthUser, useInventory } from "@/lib/useInventory";
import { cn, formatDate } from "@/lib/utils";

export default function ClosingPage() {
  const { user } = useAuthUser();
  const { items, checks, toggleCheck, checkAll, completeClosing } = useInventory(user);
  const [memo, setMemo] = useState("");
  const [done, setDone] = useState(false);
  const checkedCount = useMemo(() => items.filter((item) => checks[item.id]).length, [checks, items]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await completeClosing(memo.trim() || undefined);
    setDone(true);
    setMemo("");
  }

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">{formatDate()}</p>
        <h1 className="mt-1 text-3xl font-bold">마감 체크</h1>
      </header>
      <Card className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-secondary">확인 완료</div>
          <div className="mt-1 text-3xl font-bold tabular-nums">
            {checkedCount}/{items.length}
          </div>
        </div>
        <Button variant="secondary" onClick={checkAll}>
          <ClipboardCheck size={18} /> 전체 확인
        </Button>
      </Card>

      <div className="space-y-5">
        {categoryOrder.map((category) => (
          <section key={category}>
            <h2 className="mb-3 text-lg font-semibold">{categoryLabels[category]}</h2>
            <div className="space-y-2">
              {items
                .filter((item) => item.category === category)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="truncate font-semibold">{item.name}</span>
                        <ItemStatusBadge status={item.status} />
                      </div>
                      <p className="text-sm text-secondary">
                        {item.quantity}
                        {item.unit}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-secondary",
                        checks[item.id] && "border-success bg-success text-white",
                      )}
                    >
                      <Check size={20} />
                    </span>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Textarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="마감 메모" />
        {done ? <p className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">오늘 마감 스냅샷이 저장됐습니다.</p> : null}
        <Button className="w-full" size="lg">
          오늘 마감 완료
        </Button>
      </form>
    </MobileShell>
  );
}

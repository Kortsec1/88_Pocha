"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ClipboardCheck, DoorClosed } from "lucide-react";
import { ItemStatusBadge } from "@/components/inventory/ItemStatusBadge";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { categoryLabels, categoryOrder } from "@/lib/seed";
import { useAuthUser, useInventory, useOperations } from "@/lib/useInventory";
import { cn, formatDate } from "@/lib/utils";

export default function ClosingPage() {
  const { user } = useAuthUser();
  const { items, checks, toggleCheck, checkAll, completeClosing } = useInventory(user);
  const { settlement, businessSession, closeBusiness } = useOperations(user);
  const [memo, setMemo] = useState("");
  const [done, setDone] = useState(false);
  const checkedCount = useMemo(() => items.filter((item) => checks[item.id]).length, [checks, items]);
  const cashTotal = settlement.cashEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const transferTotal = settlement.transferEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const isOpen = businessSession?.status === "open";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isOpen) return;
    const confirmed = confirm(`마감 처리할까요?\n\n재고 확인 ${checkedCount}/${items.length}\n현금 ${cashTotal.toLocaleString("ko-KR")}원\n계좌 ${transferTotal.toLocaleString("ko-KR")}원\n모듬과일 ${settlement.fruitCount}개`);
    if (!confirmed) return;
    await completeClosing(memo.trim() || undefined);
    await closeBusiness({
      inventoryChecked: checkedCount,
      inventoryTotal: items.length,
      cashTotal,
      transferTotal,
      fruitCount: settlement.fruitCount,
      memo: memo.trim() || undefined,
    });
    setDone(true);
    setMemo("");
  }

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">{formatDate()}</p>
        <h1 className="mt-1 text-3xl font-bold">마감 체크</h1>
      </header>
      <Card className={cn("mb-4 border-accent/20", isOpen ? "bg-accent text-white" : "bg-elevated")}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className={cn("text-sm font-bold", isOpen ? "text-white/75" : "text-secondary")}>현재 운영 상태</div>
            <div className="mt-1 text-2xl font-black">{isOpen ? "영업 중" : "마감 상태"}</div>
            <p className={cn("mt-1 text-sm", isOpen ? "text-white/75" : "text-secondary")}>
              {isOpen ? "재고와 정산을 확인한 뒤 마감 처리하세요." : "대시보드에서 오픈을 먼저 진행하세요."}
            </p>
          </div>
          <DoorClosed size={34} />
        </div>
      </Card>
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
      <section className="mb-5 grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="text-xs font-bold text-secondary">현금</div>
          <div className="mt-1 truncate text-lg font-black">{cashTotal.toLocaleString("ko-KR")}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs font-bold text-secondary">계좌</div>
          <div className="mt-1 truncate text-lg font-black">{transferTotal.toLocaleString("ko-KR")}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs font-bold text-secondary">과일</div>
          <div className="mt-1 truncate text-lg font-black">{settlement.fruitCount}개</div>
        </Card>
      </section>

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
        {done ? <p className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">영업 마감 처리가 저장됐습니다.</p> : null}
        <Button className="w-full" size="lg" disabled={!isOpen}>
          영업 마감 완료
        </Button>
      </form>
    </MobileShell>
  );
}

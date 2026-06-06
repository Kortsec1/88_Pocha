"use client";

import { useMemo, useState } from "react";
import { CategoryTabs } from "@/components/inventory/CategoryTabs";
import { MobileShell } from "@/components/layout/MobileShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { categoryLabels } from "@/lib/seed";
import type { Category } from "@/lib/types";
import { useAuthUser, useInventory } from "@/lib/useInventory";
import { formatTime } from "@/lib/utils";

export default function HistoryPage() {
  const { user } = useAuthUser();
  const { logs } = useInventory(user);
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [editor, setEditor] = useState("");

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (category !== "all" && log.category !== category) return false;
      if (query && !log.itemName.includes(query)) return false;
      if (date && log.createdAt.slice(0, 10) !== date) return false;
      if (editor && !log.updatedByName.includes(editor)) return false;
      return true;
    });
  }, [category, date, editor, logs, query]);

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">시간순 변경 기록</p>
        <h1 className="mt-1 text-3xl font-bold">변경 이력</h1>
      </header>
      <div className="space-y-3">
        <CategoryTabs value={category} onChange={setCategory} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="품목명" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Input placeholder="수정자" value={editor} onChange={(event) => setEditor(event.target.value)} />
        </div>
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      <section className="mt-5 space-y-3">
        {filtered.length ? (
          filtered.map((log) => (
            <Card key={log.id}>
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold">{log.itemName}</div>
                  <div className="mt-1 text-sm text-secondary">
                    {categoryLabels[log.category]} · {log.updatedByName}
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono text-sm text-secondary">{formatTime(log.createdAt)}</div>
              </div>
              <div className="mt-3 text-xl font-bold">
                {log.beforeQuantity} → {log.afterQuantity} {log.unit}
              </div>
              {log.memo ? <p className="mt-2 text-sm text-secondary">메모: {log.memo}</p> : null}
            </Card>
          ))
        ) : (
          <p className="text-sm text-secondary">조건에 맞는 변경 이력이 없습니다.</p>
        )}
      </section>
    </MobileShell>
  );
}

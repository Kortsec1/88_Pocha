"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { CategoryShortcut } from "@/components/dashboard/CategoryShortcut";
import { RecentLogList } from "@/components/dashboard/RecentLogList";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ItemCard } from "@/components/inventory/ItemCard";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { useAuthUser, useInventory } from "@/lib/useInventory";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuthUser();
  const { items, logs, loading } = useInventory(user);
  const needs = items.filter((item) => item.status === "low" || item.status === "empty");

  return (
    <MobileShell>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-secondary">{formatDate()}</p>
          <h1 className="mt-1 text-3xl font-bold">오늘의 홀 재고</h1>
        </div>
        <Link href="/closing">
          <Button size="sm">마감</Button>
        </Link>
      </header>

      {loading ? <p className="text-secondary">재고를 불러오는 중입니다.</p> : null}

      <section className="space-y-3">
        <SummaryCard items={items} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="text-warning" size={20} /> 먼저 확인
          </h2>
          <span className="text-sm text-secondary">{needs.length}개</span>
        </div>
        <div className="space-y-3">
          {needs.length ? needs.map((item) => <ItemCard key={item.id} item={item} />) : <p className="text-sm text-secondary">부족하거나 소진된 품목이 없습니다.</p>}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">카테고리</h2>
        <CategoryShortcut items={items} />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">최근 변경</h2>
        <RecentLogList logs={logs} />
      </section>
    </MobileShell>
  );
}

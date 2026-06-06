"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, Ban, CalendarDays, ClipboardList } from "lucide-react";
import { CategoryShortcut } from "@/components/dashboard/CategoryShortcut";
import { RecentLogList } from "@/components/dashboard/RecentLogList";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ItemCard } from "@/components/inventory/ItemCard";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { useAuthUser, useInventory, useOperations } from "@/lib/useInventory";
import { formatDate } from "@/lib/utils";

function DashboardContent() {
  const params = useSearchParams();
  const { user } = useAuthUser();
  const { items, logs, loading } = useInventory(user);
  const { reservations, tableMemos, soldOutMenus } = useOperations(user);
  const needs = items.filter((item) => item.status === "low" || item.status === "empty");
  const waitingReservations = reservations.filter((reservation) => reservation.status === "reserved");

  return (
    <MobileShell>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-secondary">{formatDate()}</p>
          <h1 className="mt-1 text-3xl font-bold">오늘의 홀 재고</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/soldout"><Button size="sm" variant="secondary">품절</Button></Link>
          <Link href="/closing"><Button size="sm">마감</Button></Link>
        </div>
      </header>

      {loading ? <p className="text-secondary">재고를 불러오는 중입니다.</p> : null}
      {params.get("updated") === "inventory" ? (
        <div className="mb-4 rounded-lg border border-success/40 bg-success/10 p-3 text-sm font-semibold text-success">재고 수정이 저장됐습니다.</div>
      ) : null}

      <section className="space-y-3">
        <SummaryCard items={items} />
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <Link href="/reservations" className="rounded-lg border border-border bg-surface p-3">
          <CalendarDays className="mb-2 text-accent" size={20} />
          <div className="text-2xl font-bold">{waitingReservations.length}</div>
          <div className="text-xs text-secondary">대기 예약</div>
        </Link>
        <Link href="/tables" className="rounded-lg border border-border bg-surface p-3">
          <ClipboardList className="mb-2 text-warning" size={20} />
          <div className="text-2xl font-bold">{tableMemos.length}</div>
          <div className="text-xs text-secondary">주문 메모</div>
        </Link>
        <Link href="/soldout" className="rounded-lg border border-border bg-surface p-3">
          <Ban className="mb-2 text-danger" size={20} />
          <div className="text-2xl font-bold">{soldOutMenus.length}</div>
          <div className="text-xs text-secondary">판매 불가</div>
        </Link>
      </section>

      {soldOutMenus.length ? (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Ban className="text-danger" size={20} /> 오늘 판매 불가
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {soldOutMenus.map((menu) => (
              <Link key={menu.id} href="/soldout" className="shrink-0 rounded-full border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger">
                {menu.menuName}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

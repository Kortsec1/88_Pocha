"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ItemCard } from "@/components/inventory/ItemCard";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthUser, useInventory, useOperations } from "@/lib/useInventory";
import { formatDate } from "@/lib/utils";

function DashboardContent() {
  const params = useSearchParams();
  const { user } = useAuthUser();
  const { items, loading } = useInventory(user);
  const { reservations, tableMemos, soldOutMenus, bookings, settlement } = useOperations(user);
  const needs = items.filter((item) => item.status === "low" || item.status === "empty");
  const waitingReservations = reservations.filter((reservation) => reservation.status === "reserved");
  const activeBookings = bookings.filter((booking) => booking.status === "scheduled" || booking.status === "seated");
  const normalCount = items.filter((item) => item.status === "normal").length;
  const cashTotal = settlement.cashEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const transferTotal = settlement.transferEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const settlementTotal = cashTotal + transferTotal;
  const dashboardCards = [
    { href: "/items", label: "재고 점검", value: needs.length, caption: `정상 ${normalCount} / 전체 ${items.length}`, tone: "text-accent bg-accent/[0.06] border-accent/15" },
    { href: "/reservations", label: "웨이팅", value: waitingReservations.length, caption: "현재 접수", tone: "text-warning bg-warning/[0.08] border-warning/20" },
    { href: "/bookings", label: "금일 예약", value: activeBookings.length, caption: "예정 및 착석", tone: "text-success bg-success/[0.06] border-success/15" },
    { href: "/tables", label: "테이블 메모", value: tableMemos.length, caption: "진행 중", tone: "text-primary bg-elevated border-border" },
  ];

  return (
    <MobileShell>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-secondary">{formatDate()}</p>
          <h1 className="mt-1 whitespace-nowrap text-3xl font-black text-primary">88포차 운영판</h1>
        </div>
        <div className="rounded-full border border-accent/20 bg-surface px-3 py-1 text-sm font-black text-accent shadow-soft">1988</div>
      </header>

      {loading ? <p className="text-secondary">재고를 불러오는 중입니다.</p> : null}
      {params.get("updated") === "inventory" ? (
        <div className="mb-4 rounded-lg border border-success/40 bg-success/10 p-3 text-sm font-semibold text-success">재고 수정이 저장됐습니다.</div>
      ) : null}

      <section className="rounded-lg border border-border bg-surface p-5 shadow-soft">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-accent">TODAY</div>
            <div className="mt-1 text-2xl font-black">운영 요약</div>
            <p className="mt-1 text-sm text-secondary">웨이팅 · 예약 · 재고 · 정산</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-secondary">정산 합계</div>
            <div className="mt-1 text-lg font-black">{settlementTotal.toLocaleString("ko-KR")}원</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {dashboardCards.map((card) => (
            <Link key={card.href} href={card.href} className={`rounded-lg border p-4 transition active:scale-[0.98] ${card.tone}`}>
              <div className="truncate text-sm font-bold">{card.label}</div>
              <div className="mt-3 text-3xl font-black tabular-nums text-primary">{card.value}</div>
              <div className="mt-1 truncate text-xs font-medium text-secondary">{card.caption}</div>
            </Link>
          ))}
          <Link href="/settlement" className="col-span-2 rounded-lg border border-accent/15 bg-accent/[0.04] p-4 transition active:scale-[0.98]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-accent">일일 정산</div>
                <div className="mt-2 text-3xl font-black tabular-nums">{settlementTotal.toLocaleString("ko-KR")}원</div>
                <div className="mt-1 truncate text-sm text-secondary">현금 {cashTotal.toLocaleString("ko-KR")} · 계좌 {transferTotal.toLocaleString("ko-KR")}</div>
              </div>
              <div className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-bold text-primary">과일 {settlement.fruitCount}</div>
            </div>
          </Link>
        </div>
      </section>

      <Link href="/soldout" className="mt-3 block rounded-lg border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/[0.06] text-sm font-black text-accent">품절</span>
            <div>
              <div className="font-semibold">품절 메뉴</div>
              <div className="line-clamp-1 text-sm text-secondary">{soldOutMenus.length ? soldOutMenus.map((menu) => menu.menuName).join(", ") : "등록된 품절 메뉴 없음"}</div>
            </div>
          </div>
          <span className="text-2xl font-black tabular-nums">{soldOutMenus.length}</span>
        </div>
      </Link>

      {activeBookings.length ? (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">금일 예약</h2>
            <Link href="/bookings" className="text-sm text-accent">전체</Link>
          </div>
          <div className="space-y-2">
            {activeBookings.slice(0, 3).map((booking) => (
              <Card key={booking.id} className="p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{booking.title}</div>
                    <div className="text-sm text-secondary">{booking.time} · {booking.partySize}명 · {booking.tables.join(", ") || "테이블 미지정"}</div>
                  </div>
                  <span className="text-sm text-accent">{booking.menu}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">재고 알림</h2>
          <span className="text-sm text-secondary">{needs.length}개</span>
        </div>
        <div className="space-y-3">
          {needs.length ? needs.map((item) => <ItemCard key={item.id} item={item} />) : <p className="text-sm text-secondary">부족하거나 소진된 품목이 없습니다.</p>}
        </div>
      </section>
      <section className="mt-6 grid grid-cols-2 gap-2">
        <Link href="/closing"><Button className="w-full" variant="secondary">마감 체크</Button></Link>
        <Link href="/history"><Button className="w-full" variant="secondary">변경 이력</Button></Link>
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

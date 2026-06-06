"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, Ban, CalendarClock, CalendarDays, ClipboardList, Package } from "lucide-react";
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
  const { reservations, tableMemos, soldOutMenus, bookings } = useOperations(user);
  const needs = items.filter((item) => item.status === "low" || item.status === "empty");
  const waitingReservations = reservations.filter((reservation) => reservation.status === "reserved");
  const activeBookings = bookings.filter((booking) => booking.status === "scheduled" || booking.status === "seated");
  const normalCount = items.filter((item) => item.status === "normal").length;

  return (
    <MobileShell>
      <header className="mb-5">
        <div>
          <p className="text-sm text-secondary">{formatDate()}</p>
          <h1 className="mt-1 text-3xl font-bold">운영 대시보드</h1>
        </div>
      </header>

      {loading ? <p className="text-secondary">재고를 불러오는 중입니다.</p> : null}
      {params.get("updated") === "inventory" ? (
        <div className="mb-4 rounded-lg border border-success/40 bg-success/10 p-3 text-sm font-semibold text-success">재고 수정이 저장됐습니다.</div>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <Link href="/items" className="rounded-lg border border-border bg-surface p-4">
          <Package className="mb-3 text-accent" size={22} />
          <div className="text-3xl font-bold">{needs.length}</div>
          <div className="mt-1 text-sm text-secondary">재고 확인 필요</div>
          <div className="mt-2 text-xs text-secondary">정상 {normalCount} / 전체 {items.length}</div>
        </Link>
        <Link href="/reservations" className="rounded-lg border border-border bg-surface p-4">
          <CalendarDays className="mb-3 text-warning" size={22} />
          <div className="text-3xl font-bold">{waitingReservations.length}</div>
          <div className="mt-1 text-sm text-secondary">웨이팅 접수</div>
        </Link>
        <Link href="/bookings" className="rounded-lg border border-border bg-surface p-4">
          <CalendarClock className="mb-3 text-success" size={22} />
          <div className="text-3xl font-bold">{activeBookings.length}</div>
          <div className="mt-1 text-sm text-secondary">금일 예약</div>
        </Link>
        <Link href="/tables" className="rounded-lg border border-border bg-surface p-4">
          <ClipboardList className="mb-3 text-accent" size={22} />
          <div className="text-3xl font-bold">{tableMemos.length}</div>
          <div className="mt-1 text-sm text-secondary">테이블 메모</div>
        </Link>
      </section>

      <Link href="/soldout" className="mt-3 block rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ban className="text-danger" size={22} />
            <div>
              <div className="font-semibold">품절 메뉴</div>
              <div className="text-sm text-secondary">{soldOutMenus.length ? soldOutMenus.map((menu) => menu.menuName).join(", ") : "등록된 품절 메뉴 없음"}</div>
            </div>
          </div>
          <span className="text-2xl font-bold">{soldOutMenus.length}</span>
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
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="text-warning" size={20} /> 재고 알림
          </h2>
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

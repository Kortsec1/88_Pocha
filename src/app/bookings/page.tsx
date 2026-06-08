"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { menuCategoryLabels, tableAreas } from "@/lib/menu";
import type { MenuCategory } from "@/lib/types";
import { useAuthUser, useOperations } from "@/lib/useInventory";
import { cn } from "@/lib/utils";

const selectableTables = [
  ...tableAreas.indoor.tables.map((table) => `실내 ${table}`),
  ...tableAreas.middle.tables.map((table) => `미들 ${table}`),
  ...tableAreas.yard.tables.map((table) => `야장 ${table}`),
];

const statusLabels = {
  scheduled: "예정",
  seated: "착석",
  completed: "완료",
  canceled: "취소",
};

const partySizeOptions = Array.from({ length: 40 }, (_, index) => index + 1);
const menuCategories: MenuCategory[] = ["main", "fried", "meal", "side", "alcohol", "drink"];

export default function BookingsPage() {
  const { user } = useAuthUser();
  const { bookings, menus, addBooking, updateBookingStatus } = useOperations(user);
  const [title, setTitle] = useState("");
  const [partySize, setPartySize] = useState(4);
  const [menu, setMenu] = useState("");
  const [menuQuery, setMenuQuery] = useState("");
  const [category, setCategory] = useState<MenuCategory>("main");
  const [time, setTime] = useState("");
  const [tables, setTables] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  const activeBookings = useMemo(() => bookings.filter((booking) => booking.status === "scheduled" || booking.status === "seated"), [bookings]);
  const selectableMenus = useMemo(() => {
    return menus
      .filter((item) => item.category === category)
      .filter((item) => !menuQuery || item.name.includes(menuQuery))
      .slice(0, 18);
  }, [category, menuQuery, menus]);

  function toggleTable(table: string) {
    setTables((current) => current.includes(table) ? current.filter((value) => value !== table) : [...current, table]);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await addBooking({ title, partySize, menu: menu || menuQuery.trim(), time, tables, memo: memo.trim() || undefined });
    setTitle("");
    setPartySize(4);
    setMenu("");
    setMenuQuery("");
    setTime("");
    setTables([]);
    setMemo("");
  }

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">단체 예약과 지정 테이블</p>
        <h1 className="mt-1 text-3xl font-bold">금일 예약</h1>
      </header>

      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input placeholder="예약 제목" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="h-12 min-w-0 w-full rounded-lg border border-border bg-surface px-4 text-base font-semibold text-primary outline-none transition focus:border-accent"
              value={partySize}
              onChange={(event) => setPartySize(Number(event.target.value))}
              required
            >
              {partySizeOptions.map((count) => <option key={count} value={count}>{count}명</option>)}
            </select>
            <Input className="min-w-0" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-secondary">주문 예정 메뉴</div>
              {menu ? <button type="button" className="text-sm font-bold text-danger" onClick={() => setMenu("")}>선택 해제</button> : null}
            </div>
            <Input placeholder="메뉴 검색 또는 직접 입력" value={menu || menuQuery} onChange={(event) => {
              setMenu("");
              setMenuQuery(event.target.value);
            }} />
            <div className="flex gap-2 overflow-x-auto py-1">
              {menuCategories.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={cn("h-10 shrink-0 rounded-full border border-border bg-elevated px-4 text-sm font-bold text-secondary", category === value && "border-accent bg-accent text-white")}
                >
                  {menuCategoryLabels[value]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {selectableMenus.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMenu(item.name);
                    setMenuQuery("");
                  }}
                  className={cn("min-h-14 rounded-lg border border-border bg-elevated p-2 text-left text-sm font-bold", menu === item.name && "border-accent bg-accent/10 text-accent")}
                >
                  <span className="line-clamp-2">{item.name}</span>
                </button>
              ))}
            </div>
            {menu ? <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-sm font-bold text-accent">선택됨: {menu}</div> : null}
          </div>
          <div className="flex gap-2 overflow-x-auto py-1">
            {selectableTables.map((table) => (
              <button
                key={table}
                type="button"
                onClick={() => toggleTable(table)}
                className={cn("h-12 shrink-0 rounded-full border border-border bg-elevated px-4 text-sm font-bold text-secondary transition active:scale-[0.98]", tables.includes(table) && "border-accent bg-accent text-white shadow-soft")}
              >
                {table}
              </button>
            ))}
          </div>
          <Textarea placeholder="요청사항" value={memo} onChange={(event) => setMemo(event.target.value)} />
          <Button className="w-full" size="lg">예약 등록</Button>
        </form>
      </Card>

      <section className="mt-6 space-y-3">
        {activeBookings.length ? activeBookings.map((booking) => (
          <Card key={booking.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-secondary">{booking.time} · {booking.partySize}명</p>
                <h2 className="mt-1 text-xl font-bold">{booking.title}</h2>
                <p className="mt-1 text-sm text-secondary">{booking.menu || "주메뉴 미지정"}</p>
                <p className="mt-2 text-sm text-accent">{booking.tables.join(", ") || "테이블 미지정"}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-secondary">{statusLabels[booking.status]}</span>
            </div>
            {booking.memo ? <p className="mt-3 text-sm text-secondary">{booking.memo}</p> : null}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button variant="secondary" onClick={() => updateBookingStatus(booking.id, "seated")}>착석</Button>
              <Button variant="secondary" onClick={() => updateBookingStatus(booking.id, "completed")}>
                <CheckCircle2 size={16} /> 완료
              </Button>
              <Button variant="ghost" onClick={() => updateBookingStatus(booking.id, "canceled")}>취소</Button>
            </div>
          </Card>
        )) : <p className="text-sm text-secondary">등록된 금일 예약이 없습니다.</p>}
      </section>
    </MobileShell>
  );
}

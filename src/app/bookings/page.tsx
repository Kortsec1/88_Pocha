"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { tableAreas } from "@/lib/menu";
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

export default function BookingsPage() {
  const { user } = useAuthUser();
  const { bookings, menus, addBooking, updateBookingStatus } = useOperations(user);
  const [title, setTitle] = useState("");
  const [partySize, setPartySize] = useState(4);
  const [menu, setMenu] = useState("");
  const [time, setTime] = useState("");
  const [tables, setTables] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  const activeBookings = useMemo(() => bookings.filter((booking) => booking.status !== "canceled"), [bookings]);

  function toggleTable(table: string) {
    setTables((current) => current.includes(table) ? current.filter((value) => value !== table) : [...current, table]);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await addBooking({ title, partySize, menu, time, tables, memo: memo.trim() || undefined });
    setTitle("");
    setPartySize(4);
    setMenu("");
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
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input placeholder="예약 제목" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={1} placeholder="인원 수" value={partySize} onChange={(event) => setPartySize(Number(event.target.value))} required />
            <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
          </div>
          <Input list="booking-menu-list" placeholder="대표 메뉴" value={menu} onChange={(event) => setMenu(event.target.value)} required />
          <datalist id="booking-menu-list">
            {menus.map((item) => <option key={item.id} value={item.name} />)}
          </datalist>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectableTables.map((table) => (
              <button
                key={table}
                type="button"
                onClick={() => toggleTable(table)}
                className={cn("h-10 shrink-0 rounded-full border border-border px-3 text-sm font-semibold text-secondary", tables.includes(table) && "border-accent bg-accent text-white")}
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
                <p className="mt-1 text-sm text-secondary">{booking.menu}</p>
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

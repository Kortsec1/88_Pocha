"use client";

import { FormEvent, useState } from "react";
import { Phone } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { ReservationZone } from "@/lib/types";
import { useAuthUser, useOperations } from "@/lib/useInventory";
import { cn, formatTime } from "@/lib/utils";

const statusLabels = {
  reserved: "접수",
  arrived: "입장 완료",
  no_show: "미방문",
  canceled: "취소",
};

const partySizeOptions = Array.from({ length: 30 }, (_, index) => index + 1);

export default function ReservationsPage() {
  const { user } = useAuthUser();
  const { reservations, addReservation, updateReservationStatus } = useOperations(user);
  const [zone, setZone] = useState<ReservationZone>("middle");
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [phone, setPhone] = useState("");
  const [memo, setMemo] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await addReservation({ zone, name, partySize, phone, memo: memo.trim() || undefined });
    setName("");
    setPartySize(2);
    setPhone("");
    setMemo("");
  }

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">방문 대기 고객 관리</p>
        <h1 className="mt-1 text-3xl font-bold">웨이팅 현황</h1>
      </header>

      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            {(["middle", "yard"] as ReservationZone[]).map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setZone(value)}
                className={cn("h-14 rounded-lg border border-border bg-elevated font-bold text-secondary transition active:scale-[0.98]", zone === value && "border-accent bg-accent text-white shadow-soft")}
              >
                {value === "middle" ? "미들" : "야장"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} required />
            <select
              className="h-12 w-full rounded-lg border border-border bg-surface px-4 text-base font-semibold text-primary outline-none transition focus:border-accent"
              value={partySize}
              onChange={(event) => setPartySize(Number(event.target.value))}
              required
            >
              {partySizeOptions.map((count) => <option key={count} value={count}>{count}명</option>)}
            </select>
          </div>
          <Input inputMode="tel" placeholder="전화번호" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          <Textarea placeholder="메모" value={memo} onChange={(event) => setMemo(event.target.value)} />
          <Button className="w-full" size="lg">웨이팅 등록</Button>
        </form>
      </Card>

      <section className="mt-6 space-y-3">
        {reservations.length ? (
          reservations.map((reservation, index) => (
            <Card key={reservation.id} className={cn(reservation.status !== "reserved" && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-secondary">#{index + 1} · {reservation.zone === "middle" ? "미들" : "야장"} · {formatTime(reservation.createdAt)}</div>
                  <h2 className="mt-1 text-xl font-bold">{reservation.name} · {reservation.partySize}명</h2>
                  <a className="mt-2 inline-flex items-center gap-2 text-accent" href={`tel:${reservation.phone}`}>
                    <Phone size={16} /> {reservation.phone}
                  </a>
                  {reservation.memo ? <p className="mt-2 text-sm text-secondary">{reservation.memo}</p> : null}
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-secondary">{statusLabels[reservation.status]}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button variant="secondary" onClick={() => updateReservationStatus(reservation.id, "arrived")}>입장 완료</Button>
                <Button variant="secondary" onClick={() => updateReservationStatus(reservation.id, "no_show")}>미방문</Button>
                <Button variant="ghost" onClick={() => updateReservationStatus(reservation.id, "canceled")}>취소</Button>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-secondary">현재 접수된 웨이팅이 없습니다.</p>
        )}
      </section>
    </MobileShell>
  );
}

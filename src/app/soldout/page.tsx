"use client";

import { FormEvent, useState } from "react";
import { Ban, X } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthUser, useOperations } from "@/lib/useInventory";
import { formatTime } from "@/lib/utils";

export default function SoldOutPage() {
  const { user } = useAuthUser();
  const { soldOutMenus, addSoldOutMenu, resolveSoldOutMenu, menus } = useOperations(user);
  const [menuName, setMenuName] = useState("");
  const [reason, setReason] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await addSoldOutMenu(menuName, reason.trim() || undefined);
    setMenuName("");
    setReason("");
  }

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">오늘 주문 받지 않기</p>
        <h1 className="mt-1 text-3xl font-bold">판매 불가</h1>
      </header>
      <Card>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input list="menu-list" placeholder="메뉴명" value={menuName} onChange={(event) => setMenuName(event.target.value)} required />
          <datalist id="menu-list">
            {menus.map((item) => <option key={item.id} value={item.name} />)}
          </datalist>
          <Input placeholder="사유" value={reason} onChange={(event) => setReason(event.target.value)} />
          <Button className="w-full" size="lg"><Ban size={18} /> 판매 불가 추가</Button>
        </form>
      </Card>
      <section className="mt-6 space-y-3">
        {soldOutMenus.length ? soldOutMenus.map((menu) => (
          <Card key={menu.id} className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-danger">{menu.menuName}</h2>
              <p className="text-sm text-secondary">{formatTime(menu.createdAt)} · {menu.createdByName}</p>
              {menu.reason ? <p className="mt-1 text-sm text-secondary">{menu.reason}</p> : null}
            </div>
            <Button variant="secondary" size="icon" onClick={() => resolveSoldOutMenu(menu.id)} aria-label="해제">
              <X size={18} />
            </Button>
          </Card>
        )) : <p className="text-sm text-secondary">현재 판매 불가 메뉴가 없습니다.</p>}
      </section>
    </MobileShell>
  );
}

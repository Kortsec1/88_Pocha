"use client";

import { FormEvent, useState } from "react";
import { Ban, X } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { menuCategoryLabels } from "@/lib/menu";
import type { MenuCategory } from "@/lib/types";
import { useAuthUser, useOperations } from "@/lib/useInventory";
import { cn, formatTime } from "@/lib/utils";

const menuCategories: MenuCategory[] = ["main", "fried", "meal", "side", "alcohol", "drink"];
const reasonTemplates = ["재료 소진", "조리 지연", "입고 대기", "품질 확인", "일시 중단"];

export default function SoldOutPage() {
  const { user } = useAuthUser();
  const { soldOutMenus, addSoldOutMenu, resolveSoldOutMenu, menus } = useOperations(user);
  const [menuName, setMenuName] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<MenuCategory>("main");
  const soldOutNames = new Set(soldOutMenus.map((menu) => menu.menuName));
  const filteredMenus = menus
    .filter((menu) => menu.category === category)
    .filter((menu) => !soldOutNames.has(menu.name))
    .filter((menu) => menu.name.includes(menuName) || !menuName);

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
          <Input placeholder="메뉴 검색" value={menuName} onChange={(event) => setMenuName(event.target.value)} required />
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
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border bg-elevated p-2">
            {filteredMenus.slice(0, 20).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMenuName(item.name)}
                className={cn("flex w-full items-center justify-between rounded-lg bg-surface px-3 py-2 text-left", menuName === item.name && "outline outline-2 outline-accent")}
              >
                <span className="font-semibold">{item.name}</span>
                <span className="text-xs text-secondary">{item.price.toLocaleString("ko-KR")}원</span>
              </button>
            ))}
            {!filteredMenus.length ? <p className="p-3 text-sm text-secondary">선택 가능한 메뉴가 없습니다.</p> : null}
          </div>
          <Input placeholder="사유" value={reason} onChange={(event) => setReason(event.target.value)} />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {reasonTemplates.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => setReason(template)}
                className={cn("h-9 shrink-0 rounded-full border border-border bg-surface px-3 text-sm font-bold text-secondary", reason === template && "border-warning bg-warning text-background")}
              >
                {template}
              </button>
            ))}
          </div>
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

"use client";

import { FormEvent, useMemo, useState } from "react";
import { Minus, Plus, Save } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { menuCategoryLabels, tableAreas } from "@/lib/menu";
import type { MenuCategory, TableArea, TableOrderLine } from "@/lib/types";
import { useAuthUser, useOperations } from "@/lib/useInventory";
import { cn, formatTime } from "@/lib/utils";

const menuCategories: MenuCategory[] = ["main", "fried", "meal", "alcohol", "drink"];
const freeRequests = ["맥주잔", "담요", "얼음컵", "수저", "물", "앞접시", "물티슈", "냅킨", "집게", "가위"];

function formatPrice(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function TablesPage() {
  const { user } = useAuthUser();
  const { tableMemos, saveTableMemo, menus } = useOperations(user);
  const [area, setArea] = useState<TableArea>("indoor");
  const [tableNo, setTableNo] = useState("1");
  const [customTableNo, setCustomTableNo] = useState("");
  const [category, setCategory] = useState<MenuCategory>("main");
  const [orders, setOrders] = useState<TableOrderLine[]>([]);
  const [note, setNote] = useState("");
  const [lastAdded, setLastAdded] = useState("");

  const selectedTableNo = area === "custom" ? customTableNo : tableNo;
  const filteredMenus = useMemo(() => menus.filter((item) => item.category === category), [category, menus]);
  const total = orders.reduce((sum, order) => sum + order.price * order.quantity, 0);
  const itemCount = orders.reduce((sum, order) => sum + order.quantity, 0);
  const selectedNames = orders.slice(0, 3).map((order) => `${order.name} ${order.quantity}`).join(", ");

  function selectedQuantity(menuId: string) {
    return orders.find((order) => order.menuId === menuId)?.quantity || 0;
  }

  function addMenu(menuId: string) {
    const menu = menus.find((item) => item.id === menuId);
    if (!menu) return;
    setLastAdded(menu.name);
    setOrders((current) => {
      const existing = current.find((order) => order.menuId === menu.id);
      if (existing) {
        return current.map((order) => (order.menuId === menu.id ? { ...order, quantity: order.quantity + 1 } : order));
      }
      return [{ menuId: menu.id, name: menu.name, price: menu.price, quantity: 1 }, ...current];
    });
  }

  function addFreeRequest(name: string) {
    const id = `request-${name}`;
    setLastAdded(name);
    setOrders((current) => {
      const existing = current.find((order) => order.menuId === id);
      if (existing) {
        return current.map((order) => (order.menuId === id ? { ...order, quantity: order.quantity + 1 } : order));
      }
      return [{ menuId: id, name, price: 0, quantity: 1 }, ...current];
    });
  }

  function changeQuantity(menuId: string, delta: number) {
    setOrders((current) =>
      current
        .map((order) => (order.menuId === menuId ? { ...order, quantity: order.quantity + delta } : order))
        .filter((order) => order.quantity > 0),
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedTableNo || !orders.length) return;
    await saveTableMemo({ area, tableNo: selectedTableNo, orders, note: note.trim() || undefined });
    setOrders([]);
    setNote("");
  }

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">테이블별 임시 주문 저장</p>
        <h1 className="mt-1 text-3xl font-bold">테이블 메모</h1>
      </header>

      {lastAdded ? (
        <div className="mb-3 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-bold text-success">
          {lastAdded} 추가됨
        </div>
      ) : null}

      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(tableAreas) as TableArea[]).map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => {
                  setArea(value);
                  setTableNo(tableAreas[value].tables[0] || "");
                }}
                className={cn("h-11 rounded-lg border border-border text-sm font-semibold text-secondary", area === value && "border-accent bg-accent text-white")}
              >
                {tableAreas[value].label}
              </button>
            ))}
          </div>

          {area === "custom" ? (
            <Input placeholder="기타 테이블 번호" value={customTableNo} onChange={(event) => setCustomTableNo(event.target.value)} />
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tableAreas[area].tables.map((table) => (
                <button
                  type="button"
                  key={table}
                  onClick={() => setTableNo(table)}
                  className={cn("h-10 min-w-12 rounded-full border border-border px-3 text-sm font-bold text-secondary", tableNo === table && "border-warning bg-warning text-background")}
                >
                  {table}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {menuCategories.map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setCategory(value)}
                className={cn("h-10 shrink-0 rounded-full border border-border px-4 text-sm font-semibold text-secondary", category === value && "border-accent bg-accent text-white")}
              >
                {menuCategoryLabels[value]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredMenus.map((menu) => {
              const quantity = selectedQuantity(menu.id);
              return (
              <button
                key={menu.id}
                type="button"
                onClick={() => addMenu(menu.id)}
                className={cn(
                  "relative min-h-20 rounded-lg border bg-elevated p-3 text-left transition active:scale-[0.98]",
                  quantity ? "border-accent bg-accent/5 shadow-soft" : "border-border",
                )}
              >
                <div className="text-sm font-bold leading-5">{menu.name}</div>
                <div className="mt-1 text-xs text-secondary">{formatPrice(menu.price)}원</div>
                {quantity ? (
                  <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-2 text-sm font-black text-white">
                    {quantity}
                  </span>
                ) : null}
              </button>
              );
            })}
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-secondary">기타 요청</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {freeRequests.map((request) => (
                <button
                  key={request}
                  type="button"
                  onClick={() => addFreeRequest(request)}
                  className={cn(
                    "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold",
                    selectedQuantity(`request-${request}`) ? "border-accent bg-accent text-white" : "border-border bg-surface text-secondary",
                  )}
                >
                  {request}{selectedQuantity(`request-${request}`) ? ` ${selectedQuantity(`request-${request}`)}` : ""}
                </button>
              ))}
            </div>
          </div>

          {orders.length ? (
            <div className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
              {orders.map((order) => (
                <div key={order.menuId} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{order.name}</div>
                    <div className="text-xs text-secondary">{formatPrice(order.price * order.quantity)}원</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" size="icon" onClick={() => changeQuantity(order.menuId, -1)}><Minus size={16} /></Button>
                    <span className="w-8 text-center text-lg font-bold">{order.quantity}</span>
                    <Button type="button" variant="secondary" size="icon" onClick={() => changeQuantity(order.menuId, 1)}><Plus size={16} /></Button>
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-2 text-right text-lg font-bold">{formatPrice(total)}원</div>
            </div>
          ) : null}

          <Textarea placeholder="요청사항, 단체 주문 구분 등" value={note} onChange={(event) => setNote(event.target.value)} />
          <div className="sticky bottom-24 z-20 rounded-lg border border-accent/20 bg-surface p-3 shadow-soft">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold">{selectedTableNo ? `${tableAreas[area].label} ${selectedTableNo}` : "테이블 선택 필요"}</div>
                <div className="truncate text-sm text-secondary">{itemCount ? selectedNames : "선택한 메뉴가 없습니다"}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-secondary">합계</div>
                <div className="font-black text-accent">{formatPrice(total)}원</div>
              </div>
            </div>
            <Button className="w-full" size="lg" disabled={!selectedTableNo || !orders.length}>
              <Save size={18} /> 주문 메모 저장
            </Button>
          </div>
        </form>
      </Card>

      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold">열려 있는 메모</h2>
        {tableMemos.length ? tableMemos.map((memo) => (
          <Card key={memo.id}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold">{tableAreas[memo.area].label} {memo.tableNo}</h3>
              <span className="text-xs text-secondary">{formatTime(memo.updatedAt)}</span>
            </div>
            <div className="space-y-1">
              {memo.orders.map((order) => (
                <div key={order.menuId} className="flex justify-between text-sm">
                  <span>{order.name}</span>
                  <span className="font-mono">x{order.quantity}</span>
                </div>
              ))}
            </div>
            {memo.note ? <p className="mt-2 text-sm text-secondary">{memo.note}</p> : null}
          </Card>
        )) : <p className="text-sm text-secondary">저장된 테이블 메모가 없습니다.</p>}
      </section>
    </MobileShell>
  );
}

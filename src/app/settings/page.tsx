"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { History, LogOut, Smartphone, UserPlus } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { developerCode, menuCategoryLabels } from "@/lib/menu";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { useAuthUser, useInventory, useOperations } from "@/lib/useInventory";

export default function SettingsPage() {
  const { user, signOut, demoMode } = useAuthUser();
  const { closings } = useInventory(user);
  const { staff, addStaff, menus, saveMenu, removeMenu } = useOperations(user);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [menuForm, setMenuForm] = useState<{ id?: string; name: string; category: MenuCategory; price: number }>({
    name: "",
    category: "main",
    price: 0,
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await addStaff(name, code || `88-${name.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`, "staff");
    setName("");
    setCode("");
  }

  async function onMenuSubmit(event: FormEvent) {
    event.preventDefault();
    await saveMenu({ ...menuForm, active: true });
    setMenuForm({ name: "", category: "main", price: 0 });
  }

  function editMenu(menu: MenuItem) {
    setMenuForm({ id: menu.id, name: menu.name, category: menu.category, price: menu.price });
  }

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">매장 설정</p>
        <h1 className="mt-1 text-3xl font-bold">설정</h1>
      </header>
      <div className="space-y-3">
        <Card>
          <div className="text-sm text-secondary">로그인 사용자</div>
          <div className="mt-1 text-lg font-semibold">{user?.name || "미로그인"}</div>
          <div className="text-sm text-secondary">권한: {user?.role}</div>
          {user?.role === "developer" ? <div className="mt-2 rounded-lg bg-accent/10 p-2 text-sm text-accent">개발자 코드: {developerCode}</div> : null}
        </Card>
        {user?.role === "developer" || user?.role === "admin" ? (
          <>
            <Card>
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <UserPlus size={18} /> 사용자 코드 관리
              </div>
              <form className="space-y-2" onSubmit={onSubmit}>
                <Input placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} required />
                <Input placeholder="개인 코드 예: HALL-001" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
                <Button className="w-full">사용자 추가</Button>
              </form>
              <div className="mt-4 space-y-2">
                {staff.map((member) => (
                  <div key={member.id} className="rounded-lg border border-border bg-background/60 p-3">
                    <div className="font-semibold">{member.name}</div>
                    <div className="font-mono text-sm text-accent">{member.code}</div>
                    <div className="text-xs text-secondary">{member.role}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="mb-3 font-semibold">메뉴 관리</div>
              <form className="space-y-2" onSubmit={onMenuSubmit}>
                <Input placeholder="메뉴명" value={menuForm.name} onChange={(event) => setMenuForm((current) => ({ ...current, name: event.target.value }))} required />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="h-12 rounded-lg border border-border bg-surface px-3 text-primary"
                    value={menuForm.category}
                    onChange={(event) => setMenuForm((current) => ({ ...current, category: event.target.value as MenuCategory }))}
                  >
                    {(Object.keys(menuCategoryLabels) as MenuCategory[]).map((category) => (
                      <option key={category} value={category}>{menuCategoryLabels[category]}</option>
                    ))}
                  </select>
                  <Input type="number" min={0} placeholder="가격" value={menuForm.price} onChange={(event) => setMenuForm((current) => ({ ...current, price: Number(event.target.value) }))} />
                </div>
                <Button className="w-full">{menuForm.id ? "메뉴 수정" : "메뉴 추가"}</Button>
              </form>
              <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
                {menus.map((menu) => (
                  <div key={menu.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/60 p-3">
                    <button className="min-w-0 text-left" onClick={() => editMenu(menu)}>
                      <div className="truncate font-semibold">{menu.name}</div>
                      <div className="text-xs text-secondary">{menuCategoryLabels[menu.category]} · {menu.price.toLocaleString("ko-KR")}원</div>
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => removeMenu(menu.id)}>비활성</Button>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : null}
        <Card>
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <Smartphone size={18} /> PWA 설치
          </div>
          <p className="text-sm leading-6 text-secondary">iPhone Safari 공유 버튼에서 홈 화면에 추가를 선택하면 앱처럼 실행됩니다.</p>
        </Card>
        <Card>
          <div className="text-sm text-secondary">마감 저장 건수</div>
          <div className="mt-1 text-3xl font-bold tabular-nums">{closings.length}</div>
        </Card>
        <Link href="/history">
          <Button variant="secondary" className="w-full" size="lg">
            <History size={18} /> 변경 이력 보기
          </Button>
        </Link>
        {demoMode ? <p className="text-sm text-secondary">현재 데모 저장소를 사용 중입니다. Supabase 환경변수를 추가하면 실제 DB와 Realtime으로 전환됩니다.</p> : null}
        <Button variant="secondary" className="w-full" size="lg" onClick={signOut}>
          <LogOut size={18} /> 로그아웃
        </Button>
      </div>
    </MobileShell>
  );
}

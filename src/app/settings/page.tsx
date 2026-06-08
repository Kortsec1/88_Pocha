"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, History, LogOut, Smartphone, Trash2, UserPlus } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { reconnectPushNotifications, type PushStatus } from "@/components/layout/OperationNotifications";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { menuCategoryLabels } from "@/lib/menu";
import type { MenuCategory, MenuItem, UserRole } from "@/lib/types";
import { useAuthUser, useInventory, useOperations } from "@/lib/useInventory";

const roleLabels: Record<UserRole, string> = {
  staff: "스태프",
  manager: "매니저",
  admin: "관리자",
  developer: "개발자",
};

const roleDescriptions: Record<UserRole, string> = {
  staff: "웨이팅, 예약, 테이블, 재고, 정산 입력",
  manager: "스태프 기능 + 메뉴/사용자 확인",
  admin: "운영 설정과 사용자 추가",
  developer: "전체 권한, 사용자 삭제/권한 변경",
};

export default function SettingsPage() {
  const { user, signOut, demoMode } = useAuthUser();
  const { closings } = useInventory(user);
  const { staff, addStaff, removeStaff, updateStaffRole, menus, saveMenu, removeMenu, sessionArchives } = useOperations(user);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [testingPush, setTestingPush] = useState(false);
  const [menuForm, setMenuForm] = useState<{ id?: string; name: string; category: MenuCategory; price: number }>({
    name: "",
    category: "main",
    price: 0,
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await addStaff(name, code || `88-${name.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`, role);
    setName("");
    setCode("");
    setRole("staff");
  }

  async function onMenuSubmit(event: FormEvent) {
    event.preventDefault();
    await saveMenu({ ...menuForm, active: true });
    setMenuForm({ name: "", category: "main", price: 0 });
  }

  function editMenu(menu: MenuItem) {
    setMenuForm({ id: menu.id, name: menu.name, category: menu.category, price: menu.price });
  }

  const activeStaff = staff.filter((member) => member.active);
  const visibleArchives = user?.role === "developer" ? sessionArchives : [];

  useEffect(() => {
    function onPushStatus(event: Event) {
      setPushStatus((event as CustomEvent<PushStatus>).detail);
    }
    window.addEventListener("hall-stock-push-status", onPushStatus);
    return () => window.removeEventListener("hall-stock-push-status", onPushStatus);
  }, []);

  async function reconnectPush() {
    const status = await reconnectPushNotifications(user?.id);
    setPushStatus(status);
  }

  async function testPush() {
    setTestingPush(true);
    const response = await fetch("/api/push/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: "demo-store", area: "테스트", message: "88포차 앱 알림 테스트입니다.", url: "/dashboard" }),
    });
    const result = await response.json().catch(() => ({ sent: 0, failed: 0 }));
    setPushStatus({
      supported: true,
      permission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
      ready: Number(result.sent || 0) > 0,
      message: `테스트 발송 ${result.sent || 0}건, 실패 ${result.failed || 0}건`,
    });
    setTestingPush(false);
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
          <div className="text-sm text-secondary">권한: {user ? roleLabels[user.role] : "-"}</div>
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <Bell size={18} /> 휴대폰 알림
          </div>
          <p className="text-sm leading-6 text-secondary">{pushStatus?.message || "홈 화면에 설치한 앱에서 알림을 연결해 주세요."}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={reconnectPush}>알림 다시 연결</Button>
            <Button variant="secondary" onClick={testPush} disabled={testingPush}>{testingPush ? "발송 중" : "테스트 발송"}</Button>
          </div>
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
                <select
                  className="h-12 w-full rounded-lg border border-border bg-surface px-3 text-primary"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                >
                  {(["staff", "manager", "admin"] as UserRole[]).map((value) => <option key={value} value={value}>{roleLabels[value]}</option>)}
                </select>
                <Button className="w-full">사용자 추가</Button>
              </form>
              <div className="mt-4 space-y-2">
                {activeStaff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{member.name}</div>
                      <div className="font-mono text-sm text-accent">{user?.role === "developer" ? member.code : "개인 코드 등록됨"}</div>
                      <div className="mt-1 text-xs text-secondary">{roleLabels[member.role]} · {roleDescriptions[member.role]}</div>
                    </div>
                    <div className="shrink-0 space-y-2">
                      {user?.role === "developer" && member.id !== user.id && member.role !== "developer" ? (
                        <>
                          <select
                            className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-primary"
                            value={member.role}
                            onChange={(event) => updateStaffRole(member.id, event.target.value as UserRole)}
                          >
                            {(["staff", "manager", "admin"] as UserRole[]).map((value) => <option key={value} value={value}>{roleLabels[value]}</option>)}
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
                                removeStaff(member.id);
                              }
                            }}
                          >
                            <Trash2 size={15} /> 삭제
                          </Button>
                        </>
                      ) : null}
                    </div>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("정말로 이 메뉴를 비활성화하시겠습니까?")) {
                          removeMenu(menu.id);
                        }
                      }}
                    >비활성</Button>
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
        {user?.role === "developer" ? (
          <Card>
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <History size={18} /> 회차 기록
            </div>
            {visibleArchives.length ? (
              <div className="space-y-3">
                {visibleArchives.map((archive) => {
                  const archivedSettlement = archive.settlement || { fruitCount: 0, cashEntries: [], transferEntries: [] };
                  const cashTotal = archivedSettlement.cashEntries.reduce((sum, entry) => sum + entry.amount, 0);
                  const transferTotal = archivedSettlement.transferEntries.reduce((sum, entry) => sum + entry.amount, 0);
                  return (
                    <details key={archive.id} className="rounded-lg border border-border bg-background/60 p-3">
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-bold">
                              {new Date(archive.openedAt).toLocaleDateString("ko-KR")} 회차
                            </div>
                            <div className="mt-1 text-xs leading-5 text-secondary">
                              오픈 {new Date(archive.openedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                              {" · "}
                              마감 {new Date(archive.closedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-xs text-secondary">
                            <div>{archive.closedByName}</div>
                            <div className="font-mono">{(cashTotal + transferTotal).toLocaleString("ko-KR")}원</div>
                          </div>
                        </div>
                      </summary>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg bg-surface p-2">
                          <div className="text-xs text-secondary">테이블 메모</div>
                          <div className="font-bold">{archive.tableMemos.length}건</div>
                        </div>
                        <div className="rounded-lg bg-surface p-2">
                          <div className="text-xs text-secondary">금일 예약</div>
                          <div className="font-bold">{archive.bookings.length}건</div>
                        </div>
                        <div className="rounded-lg bg-surface p-2">
                          <div className="text-xs text-secondary">품절 메뉴</div>
                          <div className="font-bold">{archive.soldOutMenus.length}건</div>
                        </div>
                        <div className="rounded-lg bg-surface p-2">
                          <div className="text-xs text-secondary">모듬과일</div>
                          <div className="font-bold">{archivedSettlement.fruitCount}개</div>
                        </div>
                        <div className="col-span-2 rounded-lg bg-surface p-2">
                          <div className="text-xs text-secondary">정산</div>
                          <div className="mt-1 font-bold">
                            현금 {cashTotal.toLocaleString("ko-KR")}원 · 계좌 {transferTotal.toLocaleString("ko-KR")}원
                          </div>
                        </div>
                      </div>
                      {archive.summary?.memo ? <p className="mt-3 text-sm text-secondary">{archive.summary.memo}</p> : null}
                    </details>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm leading-6 text-secondary">아직 저장된 회차 기록이 없습니다. 마감 처리를 완료하면 현재 운영 데이터가 이곳에 보관됩니다.</p>
            )}
          </Card>
        ) : null}
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

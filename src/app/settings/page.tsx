"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { History, LogOut, Smartphone, UserPlus } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { developerCode } from "@/lib/menu";
import { useAuthUser, useInventory, useOperations } from "@/lib/useInventory";

export default function SettingsPage() {
  const { user, signOut, demoMode } = useAuthUser();
  const { closings } = useInventory(user);
  const { staff, addStaff } = useOperations(user);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await addStaff(name, code || `88-${name.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`, "staff");
    setName("");
    setCode("");
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
          <Card>
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <UserPlus size={18} /> 사용자 코드 추가
            </div>
            <form className="space-y-2" onSubmit={onSubmit}>
              <Input placeholder="이름" value={name} onChange={(event) => setName(event.target.value)} required />
              <Input placeholder="개인 코드 예: HALL-001" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} />
              <Button className="w-full">추가</Button>
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

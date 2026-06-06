"use client";

import { LogOut, Smartphone } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthUser, useInventory } from "@/lib/useInventory";

export default function SettingsPage() {
  const { user, signOut, demoMode } = useAuthUser();
  const { closings } = useInventory(user);

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
          <div className="text-sm text-secondary">{user?.email}</div>
        </Card>
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
        {demoMode ? <p className="text-sm text-secondary">현재 데모 저장소를 사용 중입니다. Supabase 환경변수를 추가하면 실제 DB와 Realtime으로 전환됩니다.</p> : null}
        <Button variant="secondary" className="w-full" size="lg" onClick={signOut}>
          <LogOut size={18} /> 로그아웃
        </Button>
      </div>
    </MobileShell>
  );
}

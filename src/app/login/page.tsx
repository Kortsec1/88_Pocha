"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { developerCode } from "@/lib/menu";
import { useAuthUser } from "@/lib/useInventory";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, demoMode } = useAuthUser();
  const [code, setCode] = useState(developerCode);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await signIn(code);
    setSaving(false);
    if (result) {
      setError(result.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-dvh items-center bg-background px-4 py-10 text-primary">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-black text-white shadow-soft">1988</div>
          <h1 className="text-4xl font-black tracking-tight"><span className="text-success">88</span><span className="text-accent">포장마차</span></h1>
          <p className="mt-3 text-secondary">개인 코드로 빠르게 접속하고 홀 운영 상태를 공유합니다.</p>
        </div>
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-secondary">
                <KeyRound size={16} /> 개인 코드
              </span>
              <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} required autoComplete="one-time-code" />
            </label>
            {error ? <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
            {demoMode ? <p className="text-sm text-secondary">개발자 기본 코드: {developerCode}</p> : null}
            <Button className="w-full" size="lg" disabled={saving}>
              {saving ? "확인 중" : "코드로 로그인"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

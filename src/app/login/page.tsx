"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthUser } from "@/lib/useInventory";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, demoMode } = useAuthUser();
  const [email, setEmail] = useState("staff@hallstock.local");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await signIn(email, password);
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
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-accent text-2xl font-black">홀</div>
          <h1 className="text-4xl font-bold tracking-tight">홀스톡</h1>
          <p className="mt-3 text-secondary">마감 재고와 부족 품목을 직원들과 실시간으로 공유합니다.</p>
        </div>
        <Card>
          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-secondary">
                <Mail size={16} /> 이메일
              </span>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-secondary">
                <LockKeyhole size={16} /> 비밀번호
              </span>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {error ? <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
            {demoMode ? <p className="text-sm text-secondary">Supabase 환경변수가 없어서 데모 로그인으로 실행됩니다.</p> : null}
            <Button className="w-full" size="lg" disabled={saving}>
              {saving ? "로그인 중" : "로그인"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { useAuthUser } from "@/lib/useInventory";

export function MobileShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthUser();

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, pathname, router, user]);

  if (!loading && !user) {
    return (
      <main className="min-h-dvh bg-background px-4 py-10 text-primary">
        <p className="text-secondary">로그인 화면으로 이동 중입니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background text-primary">
      <div className="mx-auto max-w-md px-4 pb-28 pt-[max(env(safe-area-inset-top),1rem)]">{children}</div>
      <BottomNavigation />
    </main>
  );
}

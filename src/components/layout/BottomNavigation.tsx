"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "홈", mark: "88" },
  { href: "/items", label: "재고", mark: "재" },
  { href: "/reservations", label: "웨이팅", mark: "W" },
  { href: "/tables", label: "테이블", mark: "T" },
  { href: "/settings", label: "설정", mark: "설" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {links.map(({ href, label, mark }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold text-secondary",
                active && "bg-accent/10 text-accent",
              )}
            >
              <span className={cn("flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-black", active ? "bg-accent text-white" : "bg-elevated text-secondary")}>
                {mark}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

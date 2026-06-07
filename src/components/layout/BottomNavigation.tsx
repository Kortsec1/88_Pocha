"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, Package, Settings, TableProperties } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "홈", icon: Home },
  { href: "/items", label: "재고", icon: Package },
  { href: "/reservations", label: "웨이팅", icon: ClipboardList },
  { href: "/tables", label: "테이블", icon: TableProperties },
  { href: "/settings", label: "설정", icon: Settings },
];

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/90 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[4.1rem] flex-col items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold text-secondary transition active:scale-[0.98]",
                active && "bg-accent text-white shadow-soft",
              )}
            >
              <Icon size={24} strokeWidth={2.4} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

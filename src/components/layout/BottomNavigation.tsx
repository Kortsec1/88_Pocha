"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, Home, Package, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "홈", icon: Home },
  { href: "/items", label: "재고", icon: Package },
  { href: "/reservations", label: "예약", icon: CalendarDays },
  { href: "/tables", label: "테이블", icon: ClipboardList },
  { href: "/settings", label: "설정", icon: Settings },
];

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-secondary",
                active && "bg-elevated text-primary",
              )}
            >
              <Icon size={20} strokeWidth={2.2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

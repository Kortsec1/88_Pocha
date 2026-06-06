"use client";

import type { Category } from "@/lib/types";
import { categoryLabels, categoryOrder } from "@/lib/seed";
import { cn } from "@/lib/utils";

export function CategoryTabs({
  value,
  onChange,
}: {
  value: Category | "all";
  onChange: (value: Category | "all") => void;
}) {
  const tabs: (Category | "all")[] = ["all", ...categoryOrder];
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={cn(
            "h-10 shrink-0 rounded-full border border-border px-4 text-sm font-semibold text-secondary",
            value === category && "border-accent bg-accent text-white",
          )}
        >
          {category === "all" ? "전체" : categoryLabels[category]}
        </button>
      ))}
    </div>
  );
}

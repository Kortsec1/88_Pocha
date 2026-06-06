"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { CategoryTabs } from "@/components/inventory/CategoryTabs";
import { ItemCard } from "@/components/inventory/ItemCard";
import { MobileShell } from "@/components/layout/MobileShell";
import { categoryLabels } from "@/lib/seed";
import type { Category } from "@/lib/types";
import { useAuthUser, useInventory } from "@/lib/useInventory";

function ItemsContent() {
  const params = useSearchParams();
  const initialCategory = (params.get("category") as Category | null) || "all";
  const [category, setCategory] = useState<Category | "all">(initialCategory);
  const { user } = useAuthUser();
  const { items } = useInventory(user);

  const filtered = useMemo(() => {
    return category === "all" ? items : items.filter((item) => item.category === category);
  }, [category, items]);

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">{category === "all" ? "전체 카테고리" : categoryLabels[category]}</p>
        <h1 className="mt-1 text-3xl font-bold">품목 목록</h1>
      </header>
      <CategoryTabs value={category} onChange={setCategory} />
      <div className="mt-4 space-y-3">
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </MobileShell>
  );
}

export default function ItemsPage() {
  return (
    <Suspense>
      <ItemsContent />
    </Suspense>
  );
}

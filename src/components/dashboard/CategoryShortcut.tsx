import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { categoryLabels, categoryOrder } from "@/lib/seed";
import type { Item } from "@/lib/types";

export function CategoryShortcut({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {categoryOrder.map((category) => {
        const scoped = items.filter((item) => item.category === category);
        const needs = scoped.filter((item) => item.status !== "normal").length;
        return (
          <Link key={category} href={`/items?category=${category}`}>
            <Card className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{categoryLabels[category]}</div>
                <div className="mt-1 text-sm text-secondary">
                  {scoped.length}개 · 주의 {needs}개
                </div>
              </div>
              <ChevronRight size={18} className="text-secondary" />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

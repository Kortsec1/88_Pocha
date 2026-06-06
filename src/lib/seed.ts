import type { Category, Item } from "@/lib/types";
import { getStatus } from "@/lib/status";

export const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || "demo-store";

export const categoryLabels: Record<Category, string> = {
  drink: "음료",
  alcohol: "주류",
  cooking: "홀 조리",
  hall: "홀 품목",
};

export const categoryOrder: Category[] = ["drink", "alcohol", "cooking", "hall"];

type SeedRow = {
  category: Category;
  name: string;
  unit: string;
  minimumQuantity: number;
  quantity?: number;
};

export const seedRows: SeedRow[] = [
  ...["환타", "사이다", "콜라", "제로콜라", "밀키스", "파워에이드"].map((name) => ({
    category: "drink" as const,
    name,
    unit: "병",
    minimumQuantity: 5,
    quantity: name === "환타" ? 4 : 8,
  })),
  ...[
    ["참이슬", 5],
    ["새로", 5],
    ["진로", 5],
    ["처음처럼", 5],
    ["린", 5],
    ["청하", 3],
    ["카스", 5],
    ["테라", 5],
    ["카스제로레몬", 3],
    ["테라라이트", 3],
    ["카스제로", 3],
    ["켈리", 5],
    ["새로살구", 3],
    ["새로다래", 3],
    ["새로오미자", 3],
    ["진로골드", 3],
  ].map(([name, minimumQuantity], index) => ({
    category: "alcohol" as const,
    name: String(name),
    unit: "병",
    minimumQuantity: Number(minimumQuantity),
    quantity: index === 0 ? 3 : index === 5 ? 0 : 7,
  })),
  ...["김가루", "케찹", "머스타드", "마요네즈", "통깨", "후리가케", "파슬리", "레인보우 슈가"].map((name, index) => ({
    category: "cooking" as const,
    name,
    unit: "통",
    minimumQuantity: 1,
    quantity: index === 2 ? 1 : 2,
  })),
  { category: "hall", name: "냅킨", unit: "묶음", minimumQuantity: 2, quantity: 1 },
  { category: "hall", name: "키친타올", unit: "롤", minimumQuantity: 2, quantity: 4 },
  { category: "hall", name: "물티슈", unit: "팩", minimumQuantity: 2, quantity: 0 },
];

export function createSeedItems(): Item[] {
  const now = new Date().toISOString();
  return seedRows.map((row, index) => {
    const quantity = row.quantity ?? row.minimumQuantity + 3;
    return {
      id: `${row.category}-${index + 1}-${row.name}`,
      storeId: STORE_ID,
      category: row.category,
      name: row.name,
      unit: row.unit,
      quantity,
      minimumQuantity: row.minimumQuantity,
      status: getStatus(quantity, row.minimumQuantity),
      updatedAt: now,
      updatedBy: "시스템",
    };
  });
}

import type { ItemStatus } from "@/lib/types";

export function getStatus(quantity: number, minimumQuantity: number): ItemStatus {
  if (!Number.isFinite(quantity)) return "unknown";
  if (quantity <= 0) return "empty";
  if (quantity <= minimumQuantity) return "low";
  return "normal";
}

export const statusLabels: Record<ItemStatus, string> = {
  normal: "정상",
  low: "부족",
  empty: "소진",
  unknown: "미확인",
};

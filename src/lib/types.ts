export type UserRole = "staff" | "manager" | "admin";
export type Category = "drink" | "alcohol" | "cooking" | "hall";
export type ItemStatus = "normal" | "low" | "empty" | "unknown";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type Store = {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
};

export type Item = {
  id: string;
  storeId: string;
  category: Category;
  name: string;
  unit: string;
  quantity: number;
  minimumQuantity: number;
  status: ItemStatus;
  updatedAt: string;
  updatedBy: string;
};

export type InventoryLog = {
  id: string;
  storeId: string;
  itemId: string;
  itemName: string;
  category: Category;
  beforeQuantity: number;
  afterQuantity: number;
  unit: string;
  memo?: string;
  updatedBy: string;
  updatedByName: string;
  createdAt: string;
};

export type DailyClosing = {
  id: string;
  storeId: string;
  date: string;
  items: {
    itemId: string;
    itemName: string;
    category: Category;
    quantity: number;
    unit: string;
    status: ItemStatus;
  }[];
  completedBy: string;
  completedByName: string;
  completedAt: string;
  memo?: string;
};

export type ClosingCheck = Record<string, boolean>;

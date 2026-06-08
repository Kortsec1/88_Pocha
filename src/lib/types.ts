export type UserRole = "staff" | "manager" | "admin" | "developer";
export type Category = "drink" | "alcohol" | "cooking" | "hall";
export type ItemStatus = "normal" | "low" | "empty" | "unknown";
export type ReservationZone = "middle" | "yard";
export type ReservationStatus = "reserved" | "arrived" | "no_show" | "canceled";
export type BookingStatus = "scheduled" | "seated" | "completed" | "canceled";
export type PaymentMethod = "cash" | "transfer";
export type BusinessSessionStatus = "open" | "closed";
export type TableArea = "indoor" | "middle" | "yard" | "custom";
export type TableMemoStatus = "open" | "closed";

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

export type StaffUser = {
  id: string;
  storeId: string;
  name: string;
  code: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type Reservation = {
  id: string;
  storeId: string;
  zone: ReservationZone;
  name: string;
  partySize: number;
  phone: string;
  status: ReservationStatus;
  memo?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
};

export type MenuCategory = "main" | "fried" | "meal" | "side" | "drink" | "alcohol";

export type MenuItem = {
  id: string;
  storeId?: string;
  category: MenuCategory;
  name: string;
  price: number;
  active?: boolean;
  updatedAt?: string;
};

export type TableOrderLine = {
  menuId: string;
  name: string;
  quantity: number;
  price: number;
};

export type TableMemo = {
  id: string;
  storeId: string;
  area: TableArea;
  tableNo: string;
  orders: TableOrderLine[];
  note?: string;
  status: TableMemoStatus;
  createdAt: string;
  updatedAt: string;
  updatedByName: string;
};

export type SoldOutMenu = {
  id: string;
  storeId: string;
  menuName: string;
  reason?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
};

export type TodayBooking = {
  id: string;
  storeId: string;
  title: string;
  partySize: number;
  menu: string;
  time: string;
  tables: string[];
  status: BookingStatus;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
};

export type PaymentEntry = {
  id: string;
  amount: number;
  memo?: string;
  receiptImage?: string;
  createdAt: string;
  createdByName: string;
};

export type DailySettlement = {
  id: string;
  storeId: string;
  date: string;
  fruitCount: number;
  cashEntries: PaymentEntry[];
  transferEntries: PaymentEntry[];
  createdAt: string;
  updatedAt: string;
  updatedByName: string;
};

export type BusinessSession = {
  id: string;
  storeId: string;
  status: BusinessSessionStatus;
  openedAt: string;
  openedByName: string;
  closedAt?: string;
  closedByName?: string;
  closeSummary?: {
    inventoryChecked: number;
    inventoryTotal: number;
    cashTotal: number;
    transferTotal: number;
    fruitCount: number;
    memo?: string;
  };
};

export type SessionArchive = {
  id: string;
  storeId: string;
  sessionId: string;
  openedAt: string;
  openedByName: string;
  closedAt: string;
  closedByName: string;
  tableMemos: TableMemo[];
  soldOutMenus: SoldOutMenu[];
  bookings: TodayBooking[];
  settlement: DailySettlement;
  summary?: BusinessSession["closeSummary"];
  createdAt: string;
};

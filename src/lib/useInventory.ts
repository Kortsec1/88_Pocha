"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { developerCode, initialMenuItems } from "@/lib/menu";
import { createSeedItems, STORE_ID } from "@/lib/seed";
import { getStatus } from "@/lib/status";
import { getSupabase, hasSupabaseEnv } from "@/lib/supabase";
import { todayKey } from "@/lib/utils";
import type {
  ClosingCheck,
  BusinessSession,
  DailyClosing,
  DailySettlement,
  InventoryLog,
  Item,
  MenuItem,
  PaymentEntry,
  PaymentMethod,
  Reservation,
  ReservationStatus,
  SoldOutMenu,
  StaffUser,
  TableMemo,
  TableOrderLine,
  TodayBooking,
  User,
} from "@/lib/types";

const ITEMS_KEY = "hall-stock-items";
const LOGS_KEY = "hall-stock-logs";
const CLOSINGS_KEY = "hall-stock-closings";
const CHECKS_KEY = "hall-stock-closing-checks";
const USER_KEY = "hall-stock-user";
const STAFF_KEY = "hall-stock-staff";
const RESERVATIONS_KEY = "hall-stock-reservations";
const TABLE_MEMOS_KEY = "hall-stock-table-memos";
const SOLD_OUT_KEY = "hall-stock-sold-out";
const MENUS_KEY = "hall-stock-menus";
const BOOKINGS_KEY = "hall-stock-bookings";
const SETTLEMENT_KEY = "hall-stock-settlement";
const BUSINESS_SESSION_KEY = "hall-stock-business-session";

const defaultUser: User = {
  id: "developer-park",
  name: "박찬웅",
  email: "developer@hallstock.local",
  role: "developer",
  createdAt: new Date().toISOString(),
};

const defaultStaff: StaffUser[] = [
  {
    id: "developer-park",
    storeId: STORE_ID,
    name: "박찬웅",
    code: developerCode,
    role: "developer",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function emitOperationEvent(message: string, area: "재고" | "웨이팅" | "예약" | "테이블" | "정산" | "품절" | "운영") {
  if (typeof window === "undefined") return;
  const channel = new BroadcastChannel("hall-stock-events");
  const payload = {
    id: crypto.randomUUID(),
    message,
    area,
    storeId: STORE_ID,
    createdAt: new Date().toISOString(),
  };
  channel.postMessage({
    id: payload.id,
    message: payload.message,
    area: payload.area,
    createdAt: payload.createdAt,
  });
  channel.close();
  fetch("/api/push/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}

function ensureDemoStaff() {
  const current = readJson<StaffUser[]>(STAFF_KEY, []);
  if (current.length) return current;
  writeJson(STAFF_KEY, defaultStaff);
  return defaultStaff;
}

function fromDbItem(row: any): Item {
  return {
    id: row.id,
    storeId: row.store_id,
    category: row.category,
    name: row.name,
    unit: row.unit,
    quantity: row.quantity,
    minimumQuantity: row.minimum_quantity,
    status: row.status,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by_name || row.updated_by || "미확인",
  };
}

function toDbItem(item: Item) {
  return {
    id: item.id,
    store_id: item.storeId,
    category: item.category,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    minimum_quantity: item.minimumQuantity,
    status: item.status,
    updated_at: item.updatedAt,
    updated_by: item.updatedBy,
    updated_by_name: item.updatedBy,
  };
}

function fromDbLog(row: any): InventoryLog {
  return {
    id: row.id,
    storeId: row.store_id,
    itemId: row.item_id,
    itemName: row.item_name,
    category: row.category,
    beforeQuantity: row.before_quantity,
    afterQuantity: row.after_quantity,
    unit: row.unit,
    memo: row.memo || undefined,
    updatedBy: row.updated_by,
    updatedByName: row.updated_by_name,
    createdAt: row.created_at,
  };
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = readJson<User | null>(USER_KEY, null);
    if (storedUser) {
      setUser(storedUser);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(false);
  }, []);

  const signIn = useCallback(async (code: string) => {
    const normalizedCode = code.trim();
    const supabase = getSupabase();
    if (!supabase) {
      const staff = ensureDemoStaff().find((member) => member.active && member.code === normalizedCode);
      if (!staff) return { message: "등록되지 않은 코드입니다." };
      const demoUser = {
        id: staff.id,
        name: staff.name,
        email: `${staff.id}@hallstock.local`,
        role: staff.role,
        createdAt: staff.createdAt,
      };
      writeJson(USER_KEY, demoUser);
      setUser(demoUser);
      return null;
    }
    const { data, error } = await supabase.rpc("login_with_staff_code", {
      p_store_id: STORE_ID,
      p_code: normalizedCode,
    });
    if (error) return error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { message: "등록되지 않은 코드입니다." };
    const appUser = {
      id: row.id,
      name: row.name,
      email: `${row.id}@hallstock.local`,
      role: row.role,
      createdAt: row.created_at,
    };
    writeJson(USER_KEY, appUser);
    setUser(appUser);
    return error;
  }, []);

  const signOut = useCallback(async () => {
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return { user, loading, signIn, signOut, demoMode: !hasSupabaseEnv() };
}

export function useInventory(user?: User | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [checks, setChecks] = useState<ClosingCheck>({});
  const [loading, setLoading] = useState(true);

  const broadcast = useMemo(() => (typeof window !== "undefined" ? new BroadcastChannel("hall-stock") : null), []);

  const loadDemo = useCallback(() => {
    const seeded = readJson<Item[]>(ITEMS_KEY, []);
    const nextItems = seeded.length ? seeded : createSeedItems();
    writeJson(ITEMS_KEY, nextItems);
    setItems(nextItems);
    setLogs(readJson(LOGS_KEY, []));
    setClosings(readJson(CLOSINGS_KEY, []));
    setChecks(readJson(`${CHECKS_KEY}-${todayKey()}`, {}));
    setLoading(false);
  }, []);

  const loadSupabase = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: itemRows } = await supabase.from("items").select("*").eq("store_id", STORE_ID).order("category");
    if (!itemRows?.length) {
      await supabase.from("items").upsert(createSeedItems().map(toDbItem));
    }
    const [{ data: refreshedItems }, { data: logRows }, { data: closingRows }] = await Promise.all([
      supabase.from("items").select("*").eq("store_id", STORE_ID).order("category"),
      supabase.from("inventory_logs").select("*").eq("store_id", STORE_ID).order("created_at", { ascending: false }).limit(100),
      supabase.from("daily_closings").select("*").eq("store_id", STORE_ID).order("completed_at", { ascending: false }).limit(30),
    ]);
    setItems((refreshedItems || []).map(fromDbItem));
    setLogs((logRows || []).map(fromDbLog));
    setClosings((closingRows || []).map((row: any) => ({
      id: row.id,
      storeId: row.store_id,
      date: row.date,
      items: row.items,
      completedBy: row.completed_by,
      completedByName: row.completed_by_name,
      completedAt: row.completed_at,
      memo: row.memo || undefined,
    })));
    setChecks(readJson(`${CHECKS_KEY}-${todayKey()}`, {}));
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      loadDemo();
      broadcast?.addEventListener("message", loadDemo);
      return () => {
        broadcast?.removeEventListener("message", loadDemo);
        broadcast?.close();
      };
    }

    loadSupabase();
    const channel = supabase
      .channel("hall-stock-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "items", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_logs", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_closings", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [broadcast, loadDemo, loadSupabase]);

  const persistDemo = useCallback((nextItems: Item[], nextLogs = logs, nextClosings = closings, nextChecks = checks) => {
    writeJson(ITEMS_KEY, nextItems);
    writeJson(LOGS_KEY, nextLogs);
    writeJson(CLOSINGS_KEY, nextClosings);
    writeJson(`${CHECKS_KEY}-${todayKey()}`, nextChecks);
    broadcast?.postMessage("changed");
  }, [broadcast, checks, closings, logs]);

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number, memo?: string, unit?: string) => {
      const currentUser = user || defaultUser;
      const current = items.find((item) => item.id === itemId);
      if (!current) return;
      const nextQuantity = Math.max(0, Math.round(quantity));
      const nextUnit = unit?.trim() || current.unit;
      const now = new Date().toISOString();
      const nextItem: Item = {
        ...current,
        unit: nextUnit,
        quantity: nextQuantity,
        status: getStatus(nextQuantity, current.minimumQuantity),
        updatedAt: now,
        updatedBy: currentUser.name,
      };
      const log: InventoryLog = {
        id: crypto.randomUUID(),
        storeId: current.storeId,
        itemId: current.id,
        itemName: current.name,
        category: current.category,
        beforeQuantity: current.quantity,
        afterQuantity: nextQuantity,
        unit: nextUnit,
        memo,
        updatedBy: currentUser.id,
        updatedByName: currentUser.name,
        createdAt: now,
      };

      const nextItems = items.map((item) => (item.id === itemId ? nextItem : item));
      const nextLogs = [log, ...logs].slice(0, 100);
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.rpc("update_item_quantity", {
          p_item_id: itemId,
          p_after_quantity: nextQuantity,
          p_unit: nextUnit,
          p_memo: memo || null,
          p_updated_by: currentUser.id,
          p_updated_by_name: currentUser.name,
        });
        if (error) throw error;
        setItems(nextItems);
        setLogs(nextLogs);
        persistDemo(nextItems, nextLogs);
        return;
      }

      setItems(nextItems);
      setLogs(nextLogs);
      persistDemo(nextItems, nextLogs);
    },
    [items, logs, persistDemo, user],
  );

  const updateItemDetails = useCallback(
    async (itemId: string, unit: string, minimumQuantity: number) => {
      const currentUser = user || defaultUser;
      const current = items.find((item) => item.id === itemId);
      if (!current) return;
      const now = new Date().toISOString();
      const nextItem: Item = {
        ...current,
        unit: unit.trim() || current.unit,
        minimumQuantity: Math.max(0, Math.round(minimumQuantity)),
        status: getStatus(current.quantity, Math.max(0, Math.round(minimumQuantity))),
        updatedAt: now,
        updatedBy: currentUser.name,
      };

      const nextItems = items.map((item) => (item.id === itemId ? nextItem : item));
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase
          .from("items")
          .update({
            unit: nextItem.unit,
            minimum_quantity: nextItem.minimumQuantity,
            status: nextItem.status,
            updated_at: nextItem.updatedAt,
            updated_by: currentUser.id,
            updated_by_name: currentUser.name,
          })
          .eq("id", itemId);
        if (error) throw error;
        setItems(nextItems);
        persistDemo(nextItems);
        return;
      }

      setItems(nextItems);
      persistDemo(nextItems);
  },
    [items, persistDemo, user],
  );

  const toggleCheck = useCallback(
    (itemId: string) => {
      const nextChecks = { ...checks, [itemId]: !checks[itemId] };
      setChecks(nextChecks);
      writeJson(`${CHECKS_KEY}-${todayKey()}`, nextChecks);
      broadcast?.postMessage("changed");
    },
    [broadcast, checks],
  );

  const checkAll = useCallback(() => {
    const nextChecks = Object.fromEntries(items.map((item) => [item.id, true]));
    setChecks(nextChecks);
    writeJson(`${CHECKS_KEY}-${todayKey()}`, nextChecks);
    broadcast?.postMessage("changed");
  }, [broadcast, items]);

  const completeClosing = useCallback(
    async (memo?: string) => {
      const currentUser = user || defaultUser;
      const closing: DailyClosing = {
        id: crypto.randomUUID(),
        storeId: STORE_ID,
        date: todayKey(),
        items: items.map((item) => ({
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          status: item.status,
        })),
        completedBy: currentUser.id,
        completedByName: currentUser.name,
        completedAt: new Date().toISOString(),
        memo,
      };

      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.from("daily_closings").upsert({
          id: closing.id,
          store_id: closing.storeId,
          date: closing.date,
          items: closing.items,
          completed_by: closing.completedBy,
          completed_by_name: closing.completedByName,
          completed_at: closing.completedAt,
          memo: closing.memo || null,
        });
        if (error) throw error;
        return;
      }

      const nextClosings = [closing, ...closings];
      setClosings(nextClosings);
      persistDemo(items, logs, nextClosings);
    },
    [closings, items, logs, persistDemo, user],
  );

  return {
    items,
    logs,
    closings,
    checks,
    loading,
    updateQuantity,
    updateItemDetails,
    toggleCheck,
    checkAll,
    completeClosing,
  };
}

function fromDbStaff(row: any): StaffUser {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    code: row.code,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  };
}

function fromDbReservation(row: any): Reservation {
  return {
    id: row.id,
    storeId: row.store_id,
    zone: row.zone,
    name: row.name,
    partySize: row.party_size,
    phone: row.phone,
    status: row.status,
    memo: row.memo || undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByName: row.created_by_name,
  };
}

function fromDbTableMemo(row: any): TableMemo {
  return {
    id: row.id,
    storeId: row.store_id,
    area: row.area,
    tableNo: row.table_no,
    orders: row.orders || [],
    note: row.note || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedByName: row.updated_by_name,
  };
}

function fromDbSoldOut(row: any): SoldOutMenu {
  return {
    id: row.id,
    storeId: row.store_id,
    menuName: row.menu_name,
    reason: row.reason || undefined,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByName: row.created_by_name,
  };
}

function normalizeMenuItem(item: MenuItem): MenuItem {
  return {
    ...item,
    storeId: item.storeId || STORE_ID,
    active: item.active ?? true,
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

function fromDbMenu(row: any): MenuItem {
  return {
    id: row.id,
    storeId: row.store_id,
    category: row.category,
    name: row.name,
    price: row.price,
    active: row.active,
    updatedAt: row.updated_at,
  };
}

function fromDbBooking(row: any): TodayBooking {
  return {
    id: row.id,
    storeId: row.store_id,
    title: row.title,
    partySize: row.party_size,
    menu: row.menu,
    time: row.time,
    tables: row.tables || [],
    status: row.status,
    memo: row.memo || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByName: row.created_by_name,
  };
}

function createEmptySettlement(date = todayKey()): DailySettlement {
  const now = new Date().toISOString();
  return {
    id: `settlement-${date}`,
    storeId: STORE_ID,
    date,
    fruitCount: 0,
    cashEntries: [],
    transferEntries: [],
    createdAt: now,
    updatedAt: now,
    updatedByName: "직원",
  };
}

function normalizeSettlement(settlement?: DailySettlement | null): DailySettlement {
  const date = todayKey();
  if (!settlement || settlement.date !== date) return createEmptySettlement(date);
  return {
    ...createEmptySettlement(date),
    ...settlement,
    fruitCount: Math.max(0, settlement.fruitCount || 0),
    cashEntries: settlement.cashEntries || [],
    transferEntries: settlement.transferEntries || [],
  };
}

function fromDbSettlement(row: any): DailySettlement {
  return {
    id: row.id,
    storeId: row.store_id,
    date: row.date,
    fruitCount: row.fruit_count || 0,
    cashEntries: row.cash_entries || [],
    transferEntries: row.transfer_entries || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedByName: row.updated_by_name || "직원",
  };
}

function fromDbBusinessSession(row: any): BusinessSession {
  return {
    id: row.id,
    storeId: row.store_id,
    status: row.status,
    openedAt: row.opened_at,
    openedByName: row.opened_by_name,
    closedAt: row.closed_at || undefined,
    closedByName: row.closed_by_name || undefined,
    closeSummary: row.close_summary || undefined,
  };
}

function ensureDemoMenus() {
  const current = readJson<MenuItem[]>(MENUS_KEY, []);
  if (current.length) return current.map(normalizeMenuItem);
  const next = initialMenuItems.map(normalizeMenuItem);
  writeJson(MENUS_KEY, next);
  return next;
}

export function useOperations(user?: User | null) {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tableMemos, setTableMemos] = useState<TableMemo[]>([]);
  const [soldOutMenus, setSoldOutMenus] = useState<SoldOutMenu[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [bookings, setBookings] = useState<TodayBooking[]>([]);
  const [settlement, setSettlement] = useState<DailySettlement>(() => createEmptySettlement());
  const [businessSession, setBusinessSession] = useState<BusinessSession | null>(null);
  const [loading, setLoading] = useState(true);
  const broadcast = useMemo(() => (typeof window !== "undefined" ? new BroadcastChannel("hall-stock-ops") : null), []);

  const loadDemo = useCallback(() => {
    const demoStaff = ensureDemoStaff();
    setStaff(demoStaff);
    setReservations(readJson<Reservation[]>(RESERVATIONS_KEY, []));
    setTableMemos(readJson<TableMemo[]>(TABLE_MEMOS_KEY, []));
    setSoldOutMenus(readJson<SoldOutMenu[]>(SOLD_OUT_KEY, []));
    setMenus(ensureDemoMenus());
    setBookings(readJson<TodayBooking[]>(BOOKINGS_KEY, []));
    setSettlement(normalizeSettlement(readJson<DailySettlement | null>(SETTLEMENT_KEY, null)));
    setBusinessSession(readJson<BusinessSession | null>(BUSINESS_SESSION_KEY, null));
    setLoading(false);
  }, []);

  const loadSupabase = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const [{ data: staffRows }, { data: reservationRows }, { data: memoRows }, { data: soldOutRows }, { data: menuRows }, { data: bookingRows }, { data: settlementRows }, { data: sessionRows }] = await Promise.all([
      supabase.from("app_users").select("*").eq("store_id", STORE_ID).order("created_at"),
      supabase.from("reservations").select("*").eq("store_id", STORE_ID).order("sort_order"),
      supabase.from("table_memos").select("*").eq("store_id", STORE_ID).eq("status", "open").order("updated_at", { ascending: false }),
      supabase.from("sold_out_menus").select("*").eq("store_id", STORE_ID).eq("active", true).order("created_at", { ascending: false }),
      supabase.from("menu_items").select("*").eq("store_id", STORE_ID).eq("active", true).order("category").order("name"),
      supabase.from("today_bookings").select("*").eq("store_id", STORE_ID).order("time"),
      supabase.from("daily_settlements").select("*").eq("store_id", STORE_ID).eq("date", todayKey()).limit(1),
      supabase.from("business_sessions").select("*").eq("store_id", STORE_ID).order("opened_at", { ascending: false }).limit(1),
    ]);
    if (!staffRows?.length) {
      await supabase.from("app_users").upsert(defaultStaff.map((member) => ({
        id: member.id,
        store_id: member.storeId,
        name: member.name,
        code: member.code,
        role: member.role,
        active: member.active,
        created_at: member.createdAt,
      })));
    }
    if (!menuRows?.length) {
      await supabase.from("menu_items").upsert(initialMenuItems.map((item) => ({
        id: item.id,
        store_id: STORE_ID,
        category: item.category,
        name: item.name,
        price: item.price,
        active: true,
      })));
    }
    setStaff((staffRows || defaultStaff).map(fromDbStaff));
    setReservations((reservationRows || []).map(fromDbReservation));
    setTableMemos((memoRows || []).map(fromDbTableMemo));
    setSoldOutMenus((soldOutRows || []).map(fromDbSoldOut));
    setMenus((menuRows?.length ? menuRows : initialMenuItems.map((item) => ({ ...item, store_id: STORE_ID, active: true }))).map(fromDbMenu));
    setBookings((bookingRows || []).map(fromDbBooking));
    setSettlement(settlementRows?.length ? fromDbSettlement(settlementRows[0]) : createEmptySettlement());
    setBusinessSession(sessionRows?.length ? fromDbBusinessSession(sessionRows[0]) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      loadDemo();
      broadcast?.addEventListener("message", loadDemo);
      return () => {
        broadcast?.removeEventListener("message", loadDemo);
        broadcast?.close();
      };
    }

    loadSupabase();
    const channel = supabase
      .channel("hall-stock-operations")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_users", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "table_memos", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "sold_out_menus", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "today_bookings", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_settlements", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "business_sessions", filter: `store_id=eq.${STORE_ID}` }, loadSupabase)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [broadcast, loadDemo, loadSupabase]);

  const persistDemo = useCallback((nextReservations = reservations, nextMemos = tableMemos, nextSoldOut = soldOutMenus, nextStaff = staff, nextMenus = menus, nextBookings = bookings, nextSettlement = settlement, nextBusinessSession = businessSession) => {
    writeJson(RESERVATIONS_KEY, nextReservations);
    writeJson(TABLE_MEMOS_KEY, nextMemos);
    writeJson(SOLD_OUT_KEY, nextSoldOut);
    writeJson(STAFF_KEY, nextStaff);
    writeJson(MENUS_KEY, nextMenus);
    writeJson(BOOKINGS_KEY, nextBookings);
    writeJson(SETTLEMENT_KEY, nextSettlement);
    writeJson(BUSINESS_SESSION_KEY, nextBusinessSession);
    broadcast?.postMessage("changed");
  }, [bookings, broadcast, businessSession, menus, reservations, settlement, soldOutMenus, staff, tableMemos]);

  const addStaff = useCallback(async (name: string, code: string, role: StaffUser["role"] = "staff") => {
    const member: StaffUser = {
      id: crypto.randomUUID(),
      storeId: STORE_ID,
      name,
      code: code.trim(),
      role,
      active: true,
      createdAt: new Date().toISOString(),
    };
    const nextStaff = [...staff, member];
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("app_users").insert({
        id: member.id,
        store_id: member.storeId,
        name: member.name,
        code: member.code,
        role: member.role,
        active: member.active,
        created_at: member.createdAt,
      });
      if (error) throw error;
      setStaff(nextStaff);
      persistDemo(reservations, tableMemos, soldOutMenus, nextStaff);
      return;
    }
    setStaff(nextStaff);
    persistDemo(reservations, tableMemos, soldOutMenus, nextStaff);
  }, [persistDemo, reservations, soldOutMenus, staff, tableMemos]);

  const removeStaff = useCallback(async (id: string) => {
    if (id === user?.id) return;
    const target = staff.find((member) => member.id === id);
    if (!target || target.role === "developer") return;
    const nextStaff = staff.map((member) => (member.id === id ? { ...member, active: false } : member));
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("app_users")
        .update({ active: false })
        .eq("id", id)
        .eq("store_id", STORE_ID)
        .neq("role", "developer");
      if (error) throw error;
      setStaff(nextStaff);
      persistDemo(reservations, tableMemos, soldOutMenus, nextStaff);
      return;
    }
    setStaff(nextStaff);
    persistDemo(reservations, tableMemos, soldOutMenus, nextStaff);
  }, [persistDemo, reservations, soldOutMenus, staff, tableMemos, user?.id]);

  const updateStaffRole = useCallback(async (id: string, role: StaffUser["role"]) => {
    if (id === user?.id || role === "developer") return;
    const target = staff.find((member) => member.id === id);
    if (!target || target.role === "developer") return;
    const nextStaff = staff.map((member) => (member.id === id ? { ...member, role } : member));
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("app_users")
        .update({ role })
        .eq("id", id)
        .eq("store_id", STORE_ID)
        .neq("role", "developer");
      if (error) throw error;
      setStaff(nextStaff);
      persistDemo(reservations, tableMemos, soldOutMenus, nextStaff);
      return;
    }
    setStaff(nextStaff);
    persistDemo(reservations, tableMemos, soldOutMenus, nextStaff);
  }, [persistDemo, reservations, soldOutMenus, staff, tableMemos, user?.id]);

  const addReservation = useCallback(async (input: Pick<Reservation, "zone" | "name" | "partySize" | "phone" | "memo">) => {
    const now = new Date().toISOString();
    const reservation: Reservation = {
      id: crypto.randomUUID(),
      storeId: STORE_ID,
      zone: input.zone,
      name: input.name,
      partySize: input.partySize,
      phone: input.phone,
      memo: input.memo,
      status: "reserved",
      sortOrder: Date.now(),
      createdAt: now,
      updatedAt: now,
      createdByName: user?.name || "직원",
    };
    const supabase = getSupabase();
    const next = [...reservations, reservation].sort((a, b) => a.sortOrder - b.sortOrder);
    if (supabase) {
      const { error } = await supabase.from("reservations").insert({
        id: reservation.id,
        store_id: reservation.storeId,
        zone: reservation.zone,
        name: reservation.name,
        party_size: reservation.partySize,
        phone: reservation.phone,
        status: reservation.status,
        memo: reservation.memo || null,
        sort_order: reservation.sortOrder,
        created_by_name: reservation.createdByName,
      });
      if (error) throw error;
      setReservations(next);
      emitOperationEvent(`${reservation.name}님 웨이팅이 등록됐습니다.`, "웨이팅");
      return;
    }
    setReservations(next);
    persistDemo(next);
    emitOperationEvent(`${reservation.name}님 웨이팅이 등록됐습니다.`, "웨이팅");
  }, [persistDemo, reservations, user?.name]);

  const updateReservationStatus = useCallback(async (id: string, status: ReservationStatus) => {
    const reservation = reservations.find((item) => item.id === id);
    if (!reservation) return;
    const now = new Date().toISOString();
    const nextSortOrder = status !== "reserved" ? Math.max(...reservations.map((item) => item.sortOrder), reservation.sortOrder) + 1 : reservation.sortOrder;

    const supabase = getSupabase();
    const next = reservations
      .map((item) =>
        item.id === id
          ? { ...item, status, sortOrder: nextSortOrder, updatedAt: now }
          : item,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (supabase) {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: now,
      };
      if (status !== "reserved") {
        updateData.sort_order = nextSortOrder;
      }
      const { error } = await supabase.from("reservations").update(updateData).eq("id", id);
      if (error) throw error;
      setReservations(next);
      persistDemo(next);
      return;
    }

    setReservations(next);
    persistDemo(next);
  }, [persistDemo, reservations]);

  const saveTableMemo = useCallback(async (memo: Partial<TableMemo> & { area: TableMemo["area"]; tableNo: string; orders: TableOrderLine[] }) => {
    const now = new Date().toISOString();
    const nextMemo: TableMemo = {
      id: memo.id || crypto.randomUUID(),
      storeId: STORE_ID,
      area: memo.area,
      tableNo: memo.tableNo,
      orders: memo.orders,
      note: memo.note,
      status: memo.status || "open",
      createdAt: memo.createdAt || now,
      updatedAt: now,
      updatedByName: user?.name || "직원",
    };
    const next = [nextMemo, ...tableMemos.filter((row) => row.id !== nextMemo.id)];
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("table_memos").upsert({
        id: nextMemo.id,
        store_id: nextMemo.storeId,
        area: nextMemo.area,
        table_no: nextMemo.tableNo,
        orders: nextMemo.orders,
        note: nextMemo.note || null,
        status: nextMemo.status,
        updated_at: nextMemo.updatedAt,
        updated_by_name: nextMemo.updatedByName,
      });
      if (error) throw error;
      setTableMemos(next);
      persistDemo(reservations, next);
      return;
    }
    setTableMemos(next);
    persistDemo(reservations, next);
  }, [persistDemo, reservations, tableMemos, user?.name]);

  const addSoldOutMenu = useCallback(async (menuName: string, reason?: string) => {
    const now = new Date().toISOString();
    const soldOut: SoldOutMenu = {
      id: crypto.randomUUID(),
      storeId: STORE_ID,
      menuName,
      reason,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdByName: user?.name || "직원",
    };
    const next = [soldOut, ...soldOutMenus];
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("sold_out_menus").insert({
        id: soldOut.id,
        store_id: soldOut.storeId,
        menu_name: soldOut.menuName,
        reason: soldOut.reason || null,
        active: true,
        created_by_name: soldOut.createdByName,
      });
      if (error) throw error;
      setSoldOutMenus(next);
      persistDemo(reservations, tableMemos, next);
      emitOperationEvent(`${soldOut.menuName} 품절이 등록됐습니다.`, "품절");
      return;
    }
    setSoldOutMenus(next);
    persistDemo(reservations, tableMemos, next);
    emitOperationEvent(`${soldOut.menuName} 품절이 등록됐습니다.`, "품절");
  }, [persistDemo, reservations, soldOutMenus, tableMemos, user?.name]);

  const resolveSoldOutMenu = useCallback(async (id: string) => {
    const next = soldOutMenus.map((menu) => (menu.id === id ? { ...menu, active: false, updatedAt: new Date().toISOString() } : menu));
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("sold_out_menus").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      setSoldOutMenus(next);
      persistDemo(reservations, tableMemos, next);
      return;
    }
    setSoldOutMenus(next);
    persistDemo(reservations, tableMemos, next);
  }, [persistDemo, reservations, soldOutMenus, tableMemos]);

  const saveMenu = useCallback(async (input: Omit<MenuItem, "id"> & { id?: string }) => {
    const now = new Date().toISOString();
    const menu: MenuItem = {
      id: input.id || crypto.randomUUID(),
      storeId: STORE_ID,
      category: input.category,
      name: input.name,
      price: Math.max(0, Math.round(input.price)),
      active: input.active ?? true,
      updatedAt: now,
    };
    const nextMenus = [menu, ...menus.filter((item) => item.id !== menu.id)].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("menu_items").upsert({
        id: menu.id,
        store_id: STORE_ID,
        category: menu.category,
        name: menu.name,
        price: menu.price,
        active: menu.active,
        updated_at: now,
      });
      if (error) throw error;
      setMenus(nextMenus);
      persistDemo(reservations, tableMemos, soldOutMenus, staff, nextMenus, bookings);
      return;
    }
    setMenus(nextMenus);
    persistDemo(reservations, tableMemos, soldOutMenus, staff, nextMenus, bookings);
  }, [bookings, menus, persistDemo, reservations, soldOutMenus, staff, tableMemos]);

  const removeMenu = useCallback(async (id: string) => {
    const nextMenus = menus.filter((item) => item.id !== id);
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("menu_items").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      setMenus(nextMenus);
      persistDemo(reservations, tableMemos, soldOutMenus, staff, nextMenus, bookings);
      return;
    }
    setMenus(nextMenus);
    persistDemo(reservations, tableMemos, soldOutMenus, staff, nextMenus, bookings);
  }, [bookings, menus, persistDemo, reservations, soldOutMenus, staff, tableMemos]);

  const addBooking = useCallback(async (input: Pick<TodayBooking, "title" | "partySize" | "menu" | "time" | "tables" | "memo">) => {
    const now = new Date().toISOString();
    const booking: TodayBooking = {
      id: crypto.randomUUID(),
      storeId: STORE_ID,
      title: input.title,
      partySize: input.partySize,
      menu: input.menu,
      time: input.time,
      tables: input.tables,
      memo: input.memo,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
      createdByName: user?.name || "직원",
    };
    const supabase = getSupabase();
    const nextBookings = [...bookings, booking].sort((a, b) => a.time.localeCompare(b.time));
    if (supabase) {
      const { error } = await supabase.from("today_bookings").insert({
        id: booking.id,
        store_id: STORE_ID,
        title: booking.title,
        party_size: booking.partySize,
        menu: booking.menu,
        time: booking.time,
        tables: booking.tables,
        status: booking.status,
        memo: booking.memo || null,
        created_by_name: booking.createdByName,
      });
      if (error) throw error;
      setBookings(nextBookings);
      emitOperationEvent(`${booking.title} 금일 예약이 등록됐습니다.`, "예약");
      return;
    }
    setBookings(nextBookings);
    persistDemo(reservations, tableMemos, soldOutMenus, staff, menus, nextBookings);
    emitOperationEvent(`${booking.title} 금일 예약이 등록됐습니다.`, "예약");
  }, [bookings, menus, persistDemo, reservations, soldOutMenus, staff, tableMemos, user?.name]);

  const updateBookingStatus = useCallback(async (id: string, status: TodayBooking["status"]) => {
    const nextBookings = bookings.map((booking) => (booking.id === id ? { ...booking, status, updatedAt: new Date().toISOString() } : booking));
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("today_bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      setBookings(nextBookings);
      persistDemo(reservations, tableMemos, soldOutMenus, staff, menus, nextBookings);
      return;
    }
    setBookings(nextBookings);
    persistDemo(reservations, tableMemos, soldOutMenus, staff, menus, nextBookings);
  }, [bookings, menus, persistDemo, reservations, soldOutMenus, staff, tableMemos]);

  const saveSettlement = useCallback(async (nextSettlement: DailySettlement) => {
    const normalized: DailySettlement = {
      ...nextSettlement,
      fruitCount: Math.max(0, Math.round(nextSettlement.fruitCount)),
      updatedAt: new Date().toISOString(),
      updatedByName: user?.name || "직원",
    };
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("daily_settlements").upsert({
        id: normalized.id,
        store_id: STORE_ID,
        date: normalized.date,
        fruit_count: normalized.fruitCount,
        cash_entries: normalized.cashEntries,
        transfer_entries: normalized.transferEntries,
        updated_by_name: normalized.updatedByName,
        updated_at: normalized.updatedAt,
      });
      if (error) throw error;
      setSettlement(normalized);
      persistDemo(reservations, tableMemos, soldOutMenus, staff, menus, bookings, normalized);
      return;
    }
    setSettlement(normalized);
    persistDemo(reservations, tableMemos, soldOutMenus, staff, menus, bookings, normalized);
  }, [bookings, menus, persistDemo, reservations, soldOutMenus, staff, tableMemos, user?.name]);

  const updateFruitCount = useCallback(async (fruitCount: number) => {
    await saveSettlement({ ...settlement, fruitCount });
  }, [saveSettlement, settlement]);

  const addPaymentEntry = useCallback(async (method: PaymentMethod, input: Pick<PaymentEntry, "amount" | "memo" | "receiptImage">) => {
    const entry: PaymentEntry = {
      id: crypto.randomUUID(),
      amount: Math.max(0, Math.round(input.amount)),
      memo: input.memo?.trim() || undefined,
      receiptImage: input.receiptImage,
      createdAt: new Date().toISOString(),
      createdByName: user?.name || "직원",
    };
    const nextSettlement: DailySettlement = method === "cash"
      ? { ...settlement, cashEntries: [entry, ...settlement.cashEntries] }
      : { ...settlement, transferEntries: [entry, ...settlement.transferEntries] };
    await saveSettlement(nextSettlement);
  }, [saveSettlement, settlement, user?.name]);

  const removePaymentEntry = useCallback(async (method: PaymentMethod, id: string) => {
    const nextSettlement: DailySettlement = method === "cash"
      ? { ...settlement, cashEntries: settlement.cashEntries.filter((entry) => entry.id !== id) }
      : { ...settlement, transferEntries: settlement.transferEntries.filter((entry) => entry.id !== id) };
    await saveSettlement(nextSettlement);
  }, [saveSettlement, settlement]);

  const openBusiness = useCallback(async () => {
    if (businessSession?.status === "open") return;
    const session: BusinessSession = {
      id: crypto.randomUUID(),
      storeId: STORE_ID,
      status: "open",
      openedAt: new Date().toISOString(),
      openedByName: user?.name || "직원",
    };
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("business_sessions")
        .insert({
          id: session.id,
          store_id: STORE_ID,
          status: "open",
          opened_at: session.openedAt,
          opened_by_name: session.openedByName,
        })
        .select()
        .single();
      if (error) {
        console.error("openBusiness failed", error);
        throw error;
      }
      setBusinessSession(data ? fromDbBusinessSession(data) : session);
      emitOperationEvent("영업 오픈 처리가 완료됐습니다.", "운영");
      return;
    }
    setBusinessSession(session);
    persistDemo(reservations, tableMemos, soldOutMenus, staff, menus, bookings, settlement, session);
    emitOperationEvent("영업 오픈 처리가 완료됐습니다.", "운영");
  }, [bookings, businessSession?.status, menus, persistDemo, reservations, settlement, soldOutMenus, staff, tableMemos, user?.name]);

  const closeBusiness = useCallback(async (summary: NonNullable<BusinessSession["closeSummary"]>) => {
    if (!businessSession || businessSession.status !== "open") return;
    const closed: BusinessSession = {
      ...businessSession,
      status: "closed",
      closedAt: new Date().toISOString(),
      closedByName: user?.name || "직원",
      closeSummary: summary,
    };
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("business_sessions")
        .update({
          status: "closed",
          closed_at: closed.closedAt,
          closed_by_name: closed.closedByName,
          close_summary: summary,
        })
        .eq("id", businessSession.id)
        .select()
        .single();
      if (error) {
        console.error("closeBusiness failed", error);
        throw error;
      }
      setBusinessSession(data ? fromDbBusinessSession(data) : closed);
      emitOperationEvent("영업 마감 처리가 완료됐습니다.", "운영");
      return;
    }
    setBusinessSession(closed);
    persistDemo(reservations, tableMemos, soldOutMenus, staff, menus, bookings, settlement, closed);
    emitOperationEvent("영업 마감 처리가 완료됐습니다.", "운영");
  }, [bookings, businessSession, menus, persistDemo, reservations, settlement, soldOutMenus, staff, tableMemos, user?.name]);

  return {
    staff,
    reservations,
    tableMemos,
    soldOutMenus: soldOutMenus.filter((menu) => menu.active),
    menus: menus.filter((menu) => menu.active !== false),
    bookings,
    settlement,
    businessSession,
    loading,
    addStaff,
    removeStaff,
    updateStaffRole,
    addReservation,
    updateReservationStatus,
    saveTableMemo,
    addSoldOutMenu,
    resolveSoldOutMenu,
    saveMenu,
    removeMenu,
    addBooking,
    updateBookingStatus,
    updateFruitCount,
    addPaymentEntry,
    removePaymentEntry,
    openBusiness,
    closeBusiness,
  };
}

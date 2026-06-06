"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSeedItems, STORE_ID } from "@/lib/seed";
import { getStatus } from "@/lib/status";
import { getSupabase, hasSupabaseEnv } from "@/lib/supabase";
import { todayKey } from "@/lib/utils";
import type { ClosingCheck, DailyClosing, InventoryLog, Item, User } from "@/lib/types";

const ITEMS_KEY = "hall-stock-items";
const LOGS_KEY = "hall-stock-logs";
const CLOSINGS_KEY = "hall-stock-closings";
const CHECKS_KEY = "hall-stock-closing-checks";
const USER_KEY = "hall-stock-user";

const defaultUser: User = {
  id: "demo-user",
  name: "박찬웅",
  email: "staff@hallstock.local",
  role: "manager",
  createdAt: new Date().toISOString(),
};

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
    const supabase = getSupabase();
    if (!supabase) {
      setUser(readJson(USER_KEY, defaultUser));
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      const authUser = data.user;
      setUser(
        authUser
          ? {
              id: authUser.id,
              name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "직원",
              email: authUser.email || "",
              role: "staff",
              createdAt: authUser.created_at,
            }
          : null,
      );
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user;
      setUser(
        authUser
          ? {
              id: authUser.id,
              name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "직원",
              email: authUser.email || "",
              role: "staff",
              createdAt: authUser.created_at,
            }
          : null,
      );
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      const demoUser = { ...defaultUser, email, name: email.split("@")[0] || "직원" };
      writeJson(USER_KEY, demoUser);
      setUser(demoUser);
      return null;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
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
    async (itemId: string, quantity: number, memo?: string) => {
      const currentUser = user || defaultUser;
      const current = items.find((item) => item.id === itemId);
      if (!current) return;
      const nextQuantity = Math.max(0, Math.round(quantity));
      const now = new Date().toISOString();
      const nextItem: Item = {
        ...current,
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
        unit: current.unit,
        memo,
        updatedBy: currentUser.id,
        updatedByName: currentUser.name,
        createdAt: now,
      };

      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.rpc("update_item_quantity", {
          p_item_id: itemId,
          p_after_quantity: nextQuantity,
          p_memo: memo || null,
          p_updated_by: currentUser.id,
          p_updated_by_name: currentUser.name,
        });
        if (error) throw error;
        return;
      }

      const nextItems = items.map((item) => (item.id === itemId ? nextItem : item));
      const nextLogs = [log, ...logs].slice(0, 100);
      setItems(nextItems);
      setLogs(nextLogs);
      persistDemo(nextItems, nextLogs);
    },
    [items, logs, persistDemo, user],
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
    toggleCheck,
    checkAll,
    completeClosing,
  };
}

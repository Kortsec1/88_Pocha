"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { STORE_ID } from "@/lib/seed";
import { useAuthUser } from "@/lib/useInventory";

type Notice = {
  id: string;
  area: string;
  message: string;
  createdAt: string;
};

export type PushStatus = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  ready: boolean;
  message: string;
};

const PUSH_STATUS_EVENT = "hall-stock-push-status";
const OPERATION_EVENT = "hall-stock-operation-event";

function notifySystem(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function emitPushStatus(status: PushStatus) {
  window.dispatchEvent(new CustomEvent<PushStatus>(PUSH_STATUS_EVENT, { detail: status }));
}

async function registerPushSubscription(userId?: string, forceNew = false) {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    const status = { supported: false, permission: "unsupported" as const, ready: false, message: "이 기기는 웹 푸시 알림을 지원하지 않습니다." };
    emitPushStatus(status);
    return status;
  }
  if (Notification.permission !== "granted") {
    const status = { supported: true, permission: Notification.permission, ready: false, message: "알림 권한이 아직 허용되지 않았습니다." };
    emitPushStatus(status);
    return status;
  }
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    const status = { supported: true, permission: Notification.permission, ready: false, message: "푸시 공개키가 설정되지 않았습니다." };
    emitPushStatus(status);
    return status;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (forceNew && existing) await existing.unsubscribe();
    const current = forceNew ? null : existing;
    const subscription = current || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: STORE_ID, userId, subscription }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.warn("Push subscription save failed", response.status, text);
      throw new Error("구독 저장 실패");
    }
    const status = { supported: true, permission: Notification.permission, ready: true, message: "휴대폰 푸시 알림이 연결됐습니다." };
    emitPushStatus(status);
    return status;
  } catch (error) {
    console.warn("Push subscription failed", error);
    const status = { supported: true, permission: Notification.permission, ready: false, message: "푸시 구독 저장에 실패했습니다. 앱을 홈 화면에서 실행한 뒤 다시 시도해 주세요." };
    emitPushStatus(status);
    return status;
  }
}

export async function reconnectPushNotifications(userId?: string) {
  if (!("Notification" in window)) return registerPushSubscription(userId, true);
  if (Notification.permission === "default") await Notification.requestPermission();
  return registerPushSubscription(userId, true);
}

export function OperationNotifications() {
  const { user } = useAuthUser();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pushStatus, setPushStatus] = useState<PushStatus>({
    supported: false,
    permission: "unsupported",
    ready: false,
    message: "알림 상태를 확인 중입니다.",
  });
  const lastNoticeId = useRef<string | null>(null);

  const canAskPermission = useMemo(() => (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) &&
    Notification.permission !== "granted"
  ), []);

  const showNotice = useCallback((next: Notice) => {
    if (lastNoticeId.current === next.id) return;
    lastNoticeId.current = next.id;
    setNotice(next);
    notifySystem(`88포차 ${next.area}`, next.message);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushStatus((current) => ({
        ...current,
        permission: Notification.permission,
        supported: true,
        message: Notification.permission === "granted" ? "알림 연결 상태를 확인 중입니다." : "알림 권한을 허용해 주세요.",
      }));
    }
  }, []);

  useEffect(() => {
    if (pushStatus.permission !== "granted" || !user || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
    registerPushSubscription(user.id).then((status) => setPushStatus(status));
  }, [pushStatus.permission, user]);

  useEffect(() => {
    const channel = new BroadcastChannel("hall-stock-events");
    channel.addEventListener("message", (event) => {
      const data = event.data as Notice;
      if (!data?.message) return;
      showNotice(data);
    });
    return () => channel.close();
  }, [showNotice]);

  useEffect(() => {
    function handleLocalOperation(event: Event) {
      const data = (event as CustomEvent<Notice>).detail;
      if (!data?.message) return;
      showNotice(data);
    }
    window.addEventListener(OPERATION_EVENT, handleLocalOperation);
    return () => window.removeEventListener(OPERATION_EVENT, handleLocalOperation);
  }, [showNotice]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel("hall-stock-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "items", filter: `store_id=eq.${STORE_ID}` }, (payload) => {
        showNotice({ id: `${payload.commit_timestamp}-items`, area: "재고", message: "재고 정보가 업데이트됐습니다.", createdAt: payload.commit_timestamp });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `store_id=eq.${STORE_ID}` }, (payload) => {
        showNotice({ id: `${payload.commit_timestamp}-reservations`, area: "웨이팅", message: "웨이팅 현황이 업데이트됐습니다.", createdAt: payload.commit_timestamp });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "today_bookings", filter: `store_id=eq.${STORE_ID}` }, (payload) => {
        showNotice({ id: `${payload.commit_timestamp}-today_bookings`, area: "예약", message: "금일 예약이 업데이트됐습니다.", createdAt: payload.commit_timestamp });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "table_memos", filter: `store_id=eq.${STORE_ID}` }, (payload) => {
        showNotice({ id: `${payload.commit_timestamp}-table_memos`, area: "테이블", message: "테이블 메모가 업데이트됐습니다.", createdAt: payload.commit_timestamp });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_settlements", filter: `store_id=eq.${STORE_ID}` }, (payload) => {
        showNotice({ id: `${payload.commit_timestamp}-daily_settlements`, area: "정산", message: "일일 정산이 업데이트됐습니다.", createdAt: payload.commit_timestamp });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sold_out_menus", filter: `store_id=eq.${STORE_ID}` }, (payload) => {
        showNotice({ id: `${payload.commit_timestamp}-sold_out_menus`, area: "품절", message: "품절 메뉴가 업데이트됐습니다.", createdAt: payload.commit_timestamp });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "business_sessions", filter: `store_id=eq.${STORE_ID}` }, (payload) => {
        showNotice({ id: `${payload.commit_timestamp}-business_sessions`, area: "운영", message: "오픈/마감 상태가 업데이트됐습니다.", createdAt: payload.commit_timestamp });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [showNotice]);

  async function requestPermission() {
    const next = "Notification" in window ? await Notification.requestPermission() : "unsupported";
    setPushStatus((current) => ({
      ...current,
      permission: next,
      supported: next !== "unsupported",
      message: next === "granted" ? "알림 연결 상태를 확인 중입니다." : "알림 권한을 허용해 주세요.",
    }));
    if (next === "granted") {
      const status = await registerPushSubscription(user?.id, true);
      setPushStatus(status);
    }
  }

  const showPushReconnectBanner =
    pushStatus.permission === "granted" &&
    !pushStatus.ready &&
    (
      pushStatus.message.includes("실패") ||
      pushStatus.message.includes("지원하지") ||
      pushStatus.message.includes("설정되지")
    );

  return (
    <>
      {canAskPermission && pushStatus.permission === "default" ? (
        <button
          type="button"
          onClick={requestPermission}
          className="fixed right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[60] rounded-full border border-accent/20 bg-surface px-4 py-2 text-sm font-bold text-accent shadow-soft"
        >
          앱 알림 켜기
        </button>
      ) : null}
      {showPushReconnectBanner ? (
        <div className="fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+3.5rem)] z-[60] mx-auto max-w-md rounded-xl border border-border bg-yellow-50 p-3 text-sm text-yellow-900 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>{pushStatus.message}</div>
            <button
              type="button"
              className="rounded-full border border-accent/20 bg-surface px-3 py-1 text-xs font-bold text-accent"
              onClick={() => registerPushSubscription(user?.id, true).then((status) => setPushStatus(status))}
            >
              다시 연결
            </button>
          </div>
        </div>
      ) : null}
      {pushStatus.permission === "granted" && pushStatus.ready ? (
        <span className="sr-only">휴대폰 푸시 알림이 활성화됐습니다.</span>
      ) : null}
      {notice ? (
        <div className="fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[70] mx-auto max-w-md rounded-xl border border-border bg-surface p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-accent">{notice.area}</p>
              <p className="mt-1 text-sm font-bold text-primary">{notice.message}</p>
            </div>
            <button type="button" className="text-sm font-bold text-secondary" onClick={() => setNotice(null)}>닫기</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { STORE_ID } from "@/lib/seed";

type Notice = {
  id: string;
  area: string;
  message: string;
  createdAt: string;
};

function notifySystem(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/icon.svg",
    badge: "/icon.svg",
  });
}

export function OperationNotifications() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const lastNoticeId = useRef<string | null>(null);

  const canAskPermission = useMemo(() => typeof window !== "undefined" && "Notification" in window && Notification.permission === "default", []);

  const showNotice = useCallback((next: Notice) => {
    if (lastNoticeId.current === next.id) return;
    lastNoticeId.current = next.id;
    setNotice(next);
    notifySystem(`88포차 ${next.area}`, next.message);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [showNotice]);

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const next = await Notification.requestPermission();
    setPermission(next);
  }

  return (
    <>
      {canAskPermission && permission === "default" ? (
        <button
          type="button"
          onClick={requestPermission}
          className="fixed right-4 top-[max(env(safe-area-inset-top),1rem)] z-[60] rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-primary shadow-soft"
        >
          알림 켜기
        </button>
      ) : null}
      {notice ? (
        <div className="fixed left-4 right-4 top-[max(env(safe-area-inset-top),1rem)] z-[70] mx-auto max-w-md rounded-xl border border-border bg-surface p-4 shadow-soft">
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

export type NotificationArea = "재고" | "웨이팅" | "예약" | "테이블" | "정산" | "품절" | "운영" | "설정" | "테스트";

export type NotificationPreferences = Record<NotificationArea, boolean>;

export const NOTIFICATION_PREFS_KEY = "hall-stock-notification-preferences";
export const NOTIFICATION_PREFS_EVENT = "hall-stock-notification-preferences";

export const defaultNotificationPreferences: NotificationPreferences = {
  재고: true,
  웨이팅: true,
  예약: true,
  테이블: true,
  정산: true,
  품절: true,
  운영: true,
  설정: false,
  테스트: true,
};

export const notificationAreaLabels: { area: NotificationArea; label: string; description: string }[] = [
  { area: "운영", label: "오픈/마감", description: "영업 시작과 마감 완료" },
  { area: "예약", label: "금일 예약", description: "예약 등록과 상태 변경" },
  { area: "웨이팅", label: "웨이팅", description: "웨이팅 접수와 입장 처리" },
  { area: "테이블", label: "테이블 메모", description: "테이블 주문 메모 변경" },
  { area: "정산", label: "정산", description: "현금, 계좌, 영수증 기록" },
  { area: "품절", label: "판매 불가", description: "품절 메뉴 등록과 해제" },
  { area: "재고", label: "재고", description: "재고 수량과 단위 변경" },
  { area: "설정", label: "설정", description: "사용자와 메뉴 설정 변경" },
];

export function normalizeNotificationPreferences(value?: Partial<Record<string, boolean>> | null): NotificationPreferences {
  return {
    ...defaultNotificationPreferences,
    ...(value || {}),
  };
}

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return defaultNotificationPreferences;
  try {
    return normalizeNotificationPreferences(JSON.parse(window.localStorage.getItem(NOTIFICATION_PREFS_KEY) || "{}"));
  } catch {
    return defaultNotificationPreferences;
  }
}

export function setNotificationPreferences(next: NotificationPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFS_EVENT, { detail: next }));
}

export function notificationEnabled(area?: string, preferences?: Partial<Record<string, boolean>> | null) {
  const normalized = normalizeNotificationPreferences(preferences);
  return normalized[(area || "테스트") as NotificationArea] !== false;
}


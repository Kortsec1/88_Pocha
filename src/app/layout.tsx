import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/layout/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "홀스톡",
  description: "홀 마감과 실시간 부족 품목 공유를 위한 모바일 재고 관리 PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "홀스톡",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#C9151E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

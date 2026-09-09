import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "서울소방 화재조사관 정보공유 플랫폼",
  description: "재현실험 아카이브 활성화 및 화재조사관 역량 강화",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700;900&family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

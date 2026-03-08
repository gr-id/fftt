import type { Metadata } from "next";
import { Manrope, Noto_Sans_KR } from "next/font/google";

import "./globals.css";

const bodyFont = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const displayFont = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FFTT | MBTI 소통 트레이닝",
  description:
    "MBTI별 맞춤 대화법과 실전 피드백으로 더 자연스럽게 소통하는 모바일 우선 트레이닝 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

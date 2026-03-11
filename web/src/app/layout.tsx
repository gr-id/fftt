import type { Metadata } from "next";
import { Manrope, Noto_Sans_KR } from "next/font/google";

import "./globals.css";

const bodyFont = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const displayFont = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FFTT | MBTI 커뮤니케이션 트레이닝",
  description:
    "MBTI 성향에 맞는 말하기 방식을 연습하고 AI 피드백으로 개선하는 커뮤니케이션 트레이닝 앱",
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

import type { Metadata } from "next";
import "./globals.css";
import { ChatBot } from "@/components/ui/ChatBot";

export const metadata: Metadata = {
  title: "GNI-AN 지니안 | AI 사업제안서 작성 도구",
  description: "굿네이버스 AI 기반 KOICA 시민사회협력사업 제안서 작성 도구",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">
        {children}
        <ChatBot />
      </body>
    </html>
  );
}

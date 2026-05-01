import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NoticeModal from "./components/NoticeModal";
import ReportButton from "./components/FeedbackWidget"; // 👈 你的 Import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Course Review (Private)",
  description: "Private tool for course planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 这里是你网站主要的内容 */}
        {children}
        
        {/* 👇 把你的两个全局组件放在 body 的最后面 */}
        <NoticeModal />
        <ReportButton />
      </body>
    </html>
  );
}
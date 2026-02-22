import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NoticeModal from "./components/NoticeModal"; 
// 👇 新增这一行，用相对路径 ./
import ReportButton from "./components/ReportButton"; 

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        {children}
        
        <NoticeModal />
        {/* 👇 把按钮组件放进来 */}
        <ReportButton />
        
      </body>
    </html>
  );
}
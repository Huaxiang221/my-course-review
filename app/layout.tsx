import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BuyMeCoffee from "./components/BuyMeCoffee"; // 👈 引入刚才写的组件

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lecturer Review App", // 我顺便帮你把标题改得更好听了一点
  description: "Review your university lecturers and avoid killer subjects.",
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
        
        {/* 👇 把按钮放在这里，它就会在所有页面出现 */}
        <BuyMeCoffee />
        
      </body>
    </html>
  );
}
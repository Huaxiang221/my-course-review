import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// ❌ 删除这一行： import BuyMeCoffee from "@/components/BuyMeCoffee"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lecturer Review App",
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
        
        {/* ❌ 删除这一行： <BuyMeCoffee /> */}
        
      </body>
    </html>
  );
}
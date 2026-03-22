import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolarVerse — Think Different About Energy",
  description: "Solar Investment Intelligence for วลีรัตน์ คลินิก",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-black text-[#f5f5f7]">{children}</body>
    </html>
  );
}

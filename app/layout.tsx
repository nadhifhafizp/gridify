import type { Metadata } from "next";
import { Inter } from "next/font/google"; // ✅ GANTI JADI INTER
import "./globals.css";

const inter = Inter({ subsets: ["latin"] }); // ✅ INISIALISASI INTER

export const metadata: Metadata = {
  title: "Gridify",
  description: "Esport Tournament Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}> {/* ✅ PAKAI CLASS INTER */}
        {children}
      </body>
    </html>
  );
}
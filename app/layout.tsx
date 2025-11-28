import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/app-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gridify - Free Tournament Bracket Generator & Manager",
  description:
    "Create esports tournaments easily. Support Single Elimination, Double Elimination, Round Robin, and Battle Royale. Realtime updates & shareable brackets.",
  keywords: [
    "tournament bracket",
    "esport manager",
    "pembuat bagan turnamen",
    "mlbb tournament",
    "pubg leaderboard",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

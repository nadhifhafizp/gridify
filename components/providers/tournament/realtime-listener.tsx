"use client";

import { useTournamentRealtime } from "@/hooks/use-tournament-realtime";
import { Wifi, WifiOff } from "lucide-react";

export default function RealtimeListener({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const isConnected = useTournamentRealtime(tournamentId);

  // Tampilkan indikator status koneksi (Pojok Kanan Bawah atau di Header)
  // Disini kita buat badge kecil yang diskrit
  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg transition-all duration-500 ${
          isConnected
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        }`}
      >
        {isConnected ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE UPDATES</span>
          </>
        ) : (
          <>
            <WifiOff size={12} />
            <span>CONNECTING...</span>
          </>
        )}
      </div>
    </div>
  );
}

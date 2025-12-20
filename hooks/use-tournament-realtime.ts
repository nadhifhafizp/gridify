"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useTournamentRealtime(tournamentId: string) {
  const router = useRouter();
  const supabase = createClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Channel unik per turnamen agar tidak tumpang tindih
    const channel = supabase.channel(`tournament-${tournamentId}`);

    channel
      // 1. Dengar perubahan di tabel MATCHES
      .on(
        "postgres_changes",
        {
          event: "*", // Insert, Update, Delete
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          console.log("Realtime Match Update:", payload);
          router.refresh(); // Trigger re-fetch data server

          // Opsional: Tampilkan notifikasi kecil jika bukan user yang mengedit
          // (Logic detilnya butuh cek user_id, tapi ini cukup untuk UX dasar)
        }
      )
      // 2. Dengar perubahan di tabel PARTICIPANTS (misal ada tim baru join)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          console.log("Realtime Participant Update");
          router.refresh();
        }
      )
      // 3. Dengar perubahan STATUS TURNAMEN (misal Stage berubah)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${tournamentId}`,
        },
        () => {
          console.log("Realtime Tournament Status Update");
          router.refresh();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          console.error("Realtime connection failed");
        }
      });

    // Cleanup saat unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, tournamentId]);

  return isConnected;
}

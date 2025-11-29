"use client";

import { useState, useTransition } from "react";
import { generateBracketAction } from "@/features/bracket/actions/bracket-actions";
import { Shuffle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function GenerateBracketButton({
  tournamentId,
  participantCount,
  label = "Generate Bracket Sekarang",
}: {
  tournamentId: string;
  participantCount: number;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = async () => {
    // Validasi minimal peserta
    if (participantCount < 2) {
      toast.error("Minimal butuh 2 peserta untuk membuat bracket.");
      return;
    }

    // Kita tidak perlu lagi validasi Power of Two (4, 8, 16)
    // karena backend generator sekarang sudah otomatis handle BYE / Round Robin.

    if (
      !confirm(
        "Apakah Anda yakin ingin membuat/mereset bracket? Data match lama akan dihapus."
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await generateBracketAction(tournamentId);

        if (result?.error) {
          toast.error("Gagal membuat bracket", { description: result.error });
        } else {
          toast.success("Berhasil!", {
            description: "Bracket pertandingan telah disusun.",
          });
        }
      } catch (err) {
        toast.error("Terjadi kesalahan sistem.");
      }
    });
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {isPending ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Shuffle size={20} />
      )}
      {isPending ? "Sedang Mengacak..." : label}
    </button>
  );
}

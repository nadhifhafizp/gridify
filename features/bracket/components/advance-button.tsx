"use client";

import { useState } from "react";
import { advanceToKnockoutAction } from "@/features/bracket/actions/stage-actions";
import { ArrowRightCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdvanceButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdvance = async () => {
    if (
      !confirm(
        "Yakin ingin memproses klasemen akhir? Pemenang akan otomatis masuk ke bracket playoff."
      )
    )
      return;

    setLoading(true);
    try {
      const result = await advanceToKnockoutAction(tournamentId);

      if (result.success) {
        toast.success("Berhasil!", {
          description: "Babak Knockout telah dibuat.",
        });
        router.refresh();
      } else {
        toast.error("Gagal lanjut stage", { description: result.error });
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAdvance}
      disabled={loading}
      className="w-full py-4 mt-6 rounded-xl bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 size={20} className="animate-spin" /> Memproses...
        </>
      ) : (
        <>
          Lanjut ke Babak Knockout <ArrowRightCircle />
        </>
      )}
    </button>
  );
}

"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { updateMatchScoreAction } from "@/features/bracket/actions/match-actions";
import { Match, Participant } from "@/types/database";
import { toast } from "sonner";

// Extend tipe Match agar TypeScript tau ada object participant
type MatchWithParticipants = Match & {
  participant_a: Participant | null;
  participant_b: Participant | null;
};

type ScoreModalProps = {
  match: MatchWithParticipants;
  isOpen: boolean;
  onClose: () => void;
};

export default function ScoreModal({
  match,
  isOpen,
  onClose,
}: ScoreModalProps) {
  const [scoreA, setScoreA] = useState(match.scores?.a || 0);
  const [scoreB, setScoreB] = useState(match.scores?.b || 0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);

    try {
      const result = await updateMatchScoreAction(
        match.id,
        scoreA,
        scoreB,
        match.tournament_id
      );

      if (result.success) {
        toast.success("Skor berhasil disimpan!");
        onClose();
      } else {
        toast.error("Gagal update skor", { description: result.error });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-lg font-bold text-white">Update Skor</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="flex items-center justify-between gap-6">
            {/* Tim A */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl border-2 border-indigo-500/50">
                {match.participant_a?.name?.[0] || "A"}
              </div>
              <span
                className="text-sm font-bold text-white text-center truncate w-full"
                title={match.participant_a?.name}
              >
                {match.participant_a?.name || "TBD"}
              </span>
              <input
                type="number"
                min={0}
                value={scoreA}
                onChange={(e) => setScoreA(Number(e.target.value))}
                className="w-20 text-center py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <span className="text-slate-500 font-bold text-2xl">VS</span>

            {/* Tim B */}
            <div className="flex flex-col items-center gap-3 w-1/3">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xl border-2 border-red-500/50">
                {match.participant_b?.name?.[0] || "B"}
              </div>
              <span
                className="text-sm font-bold text-white text-center truncate w-full"
                title={match.participant_b?.name}
              >
                {match.participant_b?.name || "TBD"}
              </span>
              <input
                type="number"
                min={0}
                value={scoreB}
                onChange={(e) => setScoreB(Number(e.target.value))}
                className="w-20 text-center py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xl focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-white text-black font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {loading ? "Menyimpan..." : "Simpan Skor"}
          </button>
        </div>
      </div>
    </div>
  );
}

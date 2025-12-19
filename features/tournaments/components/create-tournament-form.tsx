"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation"; // Tambahkan ini
import { createTournamentAction } from "@/features/tournaments/actions/tournament-actions";
import {
  Gamepad2, Trophy, Swords, Info, Users, Target, Repeat,
  Settings2, AlignLeft, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type Game = {
  id: string;
  name: string;
  platform: string;
  genre: "MOBA" | "FPS" | "SPORTS" | "BATTLE_ROYALE";
};

// ... (Kode helper getFormatLabel, getFormatDesc, FORMAT_OPTIONS biarkan sama) ...
// Agar lebih ringkas, salin bagian Helper dari file lamamu ke sini, atau biarkan jika sudah ada.
// Pastikan kode di bawah ini menggantikan komponen utamanya.

// Helper untuk Label (Salin ulang dari kode lamamu atau pakai yang ini)
const getFormatLabel = (formatId: string, genre?: string) => {
  if (formatId === "HYBRID_UCL") {
    if (genre === "MOBA") return "Hybrid (Group + Playoff MPL)";
    if (genre === "FPS") return "Hybrid (Group + Playoff Major)";
    return "Hybrid (Group + Knockout UCL)";
  }
  if (formatId === "DOUBLE_ELIMINATION") return "Double Elimination";
  if (formatId === "SINGLE_ELIMINATION") return "Single Elimination (Knockout)";
  if (formatId === "ROUND_ROBIN") return "Round Robin (League)";
  if (formatId === "BATTLE_ROYALE") return "Battle Royale System";
  return formatId;
};

const getFormatDesc = (formatId: string, genre?: string) => {
  if (formatId === "HYBRID_UCL") {
    if (genre === "MOBA") return "Fase Grup lalu lanjut ke Upper/Lower Bracket (Standar M-Series/MPL).";
    return "Fase Grup lalu lanjut ke Fase Gugur (Standar Piala Dunia/UCL).";
  }
  if (formatId === "DOUBLE_ELIMINATION") return "Sistem kalah 2x eliminasi, dengan Upper & Lower Bracket.";
  if (formatId === "SINGLE_ELIMINATION") return "Kalah sekali langsung gugur, sistem knockout murni.";
  if (formatId === "ROUND_ROBIN") return "Semua tim bertemu semua tim, sistem poin seperti liga.";
  if (formatId === "BATTLE_ROYALE") return "Sistem poin kumulatif dari multiple match days.";
  return "Format standar kompetisi.";
};

const FORMAT_OPTIONS = [
  { id: "SINGLE_ELIMINATION", icon: Swords, validFor: ["MOBA", "FPS", "SPORTS"], recommendedFor: ["FPS", "SPORTS"] },
  { id: "DOUBLE_ELIMINATION", icon: Repeat, validFor: ["MOBA", "FPS"], recommendedFor: ["MOBA"] },
  { id: "ROUND_ROBIN", icon: Users, validFor: ["MOBA", "FPS", "SPORTS"], recommendedFor: ["SPORTS"] },
  { id: "HYBRID_UCL", icon: Trophy, validFor: ["MOBA", "FPS", "SPORTS"], recommendedFor: ["SPORTS", "MOBA"] },
  { id: "BATTLE_ROYALE", icon: Target, validFor: ["BATTLE_ROYALE"], recommendedFor: ["BATTLE_ROYALE"] },
];

export default function CreateTournamentForm({ games }: { games: Game[] }) {
  const router = useRouter(); // Init Router
  const [isPending, startTransition] = useTransition();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [matchConfig, setMatchConfig] = useState({
    bestOf: "1",
    homeAway: false,
    pointsPerWin: 3,
  });

  const availableFormats = selectedGame
    ? FORMAT_OPTIONS.filter((f) => f.validFor.includes(selectedGame.genre))
    : [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    formData.append("settings", JSON.stringify(matchConfig));

    startTransition(async () => {
      try {
        const result = await createTournamentAction(formData);

        if (result?.error) {
          toast.error("Gagal membuat turnamen", {
            description: result.error,
            icon: <AlertCircle className="w-5 h-5" />,
          });
          setFormErrors({ general: result.error });
        } else if (result?.success && result?.id) {
          // UPDATE: Handle Redirect Manual di Sini
          toast.success("Tournament berhasil dibuat!", {
            description: "Mengalihkan ke dashboard...",
            icon: <CheckCircle2 className="w-5 h-5" />,
          });
          router.push(`/dashboard/tournaments/${result.id}`);
        }
      } catch (error) {
        toast.error("Terjadi kesalahan", {
          description: "Silakan coba lagi nanti",
        });
      }
    });
  };

  const handleGameChange = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    setSelectedGame(game || null);
    setSelectedFormat("");
    setMatchConfig({
      bestOf: "1",
      homeAway: false,
      pointsPerWin: 3,
    });
    setFormErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500"
    >
      {/* Error Alert Global */}
      {formErrors.general && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">
              {formErrors.general}
            </p>
          </div>
        </div>
      )}

      {/* 1. INFO DASAR */}
      <section className="p-4 sm:p-6 rounded-2xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Info className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white">
            Info Dasar Turnamen
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Nama Turnamen <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Sunday Cup Season 1"
              required
              minLength={3}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gameId" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Pilih Game <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                id="gameId"
                name="gameId"
                required
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 pr-10 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer transition-all duration-200"
                onChange={(e) => handleGameChange(e.target.value)}
                value={selectedGame?.id || ""}
              >
                <option value="" disabled>-- Pilih Game --</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} • {g.platform}</option>
                ))}
              </select>
              <Gamepad2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none w-5 h-5" />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <label htmlFor="description" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Deskripsi <span className="text-slate-600">(Opsional)</span>
            </label>
            <div className="relative">
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Jelaskan detail turnamen, aturan, hadiah, atau informasi penting lainnya..."
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 pr-10 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
              />
              <AlignLeft className="absolute right-4 top-3.5 text-slate-500 pointer-events-none w-5 h-5" />
            </div>
          </div>
        </div>
        {selectedGame && (
          <div className="mt-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 animate-in slide-in-from-top-2">
            <Gamepad2 className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300">
              <span className="font-semibold">{selectedGame.name}</span> •{" "}
              <span className="text-indigo-400">{selectedGame.genre}</span>
            </span>
          </div>
        )}
      </section>

      {/* 2. FORMAT KOMPETISI */}
      <section className="p-4 sm:p-6 rounded-2xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Format Kompetisi</h3>
        </div>

        {!selectedGame ? (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
              <Trophy className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-500 font-medium">Pilih game terlebih dahulu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {availableFormats.map((format) => {
              const isRecommended = format.recommendedFor?.includes(selectedGame.genre);
              const isSelected = selectedFormat === format.id;
              const label = getFormatLabel(format.id, selectedGame.genre);
              const desc = getFormatDesc(format.id, selectedGame.genre);

              return (
                <label key={format.id} className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 group ${isSelected ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20 scale-[1.02]" : "border-slate-700/50 bg-slate-900/30 hover:border-slate-600 hover:bg-slate-800/50 hover:scale-[1.01]"}`}>
                  <input type="radio" name="formatType" value={format.id} className="sr-only" checked={isSelected} onChange={() => setSelectedFormat(format.id)} required />
                  {isRecommended && <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">Direkomendasikan</span>}
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${isSelected ? "bg-indigo-500 text-white" : "bg-slate-800/50 text-slate-400 group-hover:text-white group-hover:bg-slate-700"}`}>
                      <format.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`block font-bold text-sm sm:text-base mb-1 ${isSelected ? "text-white" : "text-slate-200"}`}>{label}</span>
                      <span className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2">{desc}</span>
                    </div>
                  </div>
                  {isSelected && <div className="absolute bottom-3 right-3"><CheckCircle2 className="w-5 h-5 text-indigo-400" /></div>}
                </label>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. PENGATURAN MATCH */}
      {selectedGame && selectedFormat && selectedFormat !== "BATTLE_ROYALE" && (
        <section className="p-4 sm:p-6 rounded-2xl bg-linear-to-br from-white/5 to-white/2 border border-white/10 backdrop-blur-sm shadow-xl animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Settings2 className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Pengaturan Match</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {selectedGame.genre === "SPORTS" && (
              <div className="sm:col-span-2">
                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-700/50 bg-slate-900/30 cursor-pointer hover:border-slate-600 hover:bg-slate-800/50 transition-all group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm sm:text-base">Mode Home & Away</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">2 LEG</span>
                    </div>
                    <span className="text-xs sm:text-sm text-slate-400">Setiap pertandingan dimainkan 2x (kandang & tandang), pemenang ditentukan dari agregat skor.</span>
                  </div>
                  <div className="relative ml-4">
                    <input type="checkbox" className="sr-only peer" checked={matchConfig.homeAway} onChange={(e) => setMatchConfig({ ...matchConfig, homeAway: e.target.checked })} />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            )}

            {(selectedGame.genre === "MOBA" || selectedGame.genre === "FPS") && (
              <div className="sm:col-span-2 space-y-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Match Series (Best Of)</label>
                <div className="grid grid-cols-3 gap-3">
                  {["1", "3", "5"].map((bo) => (
                    <button key={bo} type="button" onClick={() => setMatchConfig({ ...matchConfig, bestOf: bo })} className={`relative py-3 sm:py-4 rounded-xl border-2 font-bold text-sm sm:text-base transition-all duration-200 ${matchConfig.bestOf === bo ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105" : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 hover:scale-105"}`}>
                      <div className="flex flex-col items-center gap-1">
                        <span>BO{bo}</span>
                        <span className="text-[10px] text-slate-500">{bo === "1" ? "Single Game" : `First to ${Math.ceil(parseInt(bo) / 2)}`}</span>
                      </div>
                      {matchConfig.bestOf === bo && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SUBMIT BUTTON */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4">
        <div className="text-sm text-slate-500"><span className="text-red-400">*</span> Wajib diisi</div>
        <button type="submit" disabled={isPending || !selectedFormat} className="relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base sm:text-lg shadow-xl shadow-indigo-500/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group">
          <span className="absolute inset-0 bg-linear-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
          <span className="relative flex items-center justify-center gap-2">
            {isPending ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Processing...</span></> : <><Trophy className="w-5 h-5" /><span>Create Tournament</span></>}
          </span>
        </button>
      </div>
    </form>
  );
}
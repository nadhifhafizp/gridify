"use client";

import { useState } from "react";
import { createTournamentAction } from "@/features/tournaments/actions/tournament-actions";
import {
  Gamepad2,
  Trophy,
  Info,
  Settings2,
  Loader2,
  AlignLeft,
} from "lucide-react";
import { toast } from "sonner";

// ... (Type definitions sama seperti sebelumnya)
type Game = {
  id: string;
  name: string;
  platform: string;
  genre: string;
};

const FORMAT_OPTIONS = [
  { id: "SINGLE_ELIMINATION", validFor: ["MOBA", "FPS", "SPORTS"] },
  { id: "DOUBLE_ELIMINATION", validFor: ["MOBA", "FPS"] },
  { id: "ROUND_ROBIN", validFor: ["MOBA", "FPS", "SPORTS"] },
  { id: "HYBRID_UCL", validFor: ["MOBA", "FPS", "SPORTS"] },
  { id: "BATTLE_ROYALE", validFor: ["BATTLE_ROYALE"] },
];

export default function CreateTournamentForm({ games }: { games: Game[] }) {
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedFormat, setSelectedFormat] = useState("");

  const [matchConfig, setMatchConfig] = useState({
    bestOf: "1",
    homeAway: false,
    pointsPerWin: 3,
    hasThirdPlace: false,
  });

  const availableFormats = selectedGame
    ? FORMAT_OPTIONS.filter((f) => f.validFor.includes(selectedGame.genre))
    : [];

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    formData.append("settings", JSON.stringify(matchConfig));

    try {
      const result = await createTournamentAction(formData);

      // Jika kode masuk sini, berarti Action me-return object error/success
      // (Redirect biasanya melempar error sebelum sampai sini, jadi aman)
      if (result?.error) {
        toast.error(result.error);
        setLoading(false); // Stop loading jika error
      } else {
        // Sukses tapi redirect belum terjadi (edge case), atau menunggu redirect
        toast.success("Mengarahkan ke dashboard...");
      }
    } catch (error) {
      // Catch jika ada error tak terduga selain redirect
      console.error(error);
      setLoading(false);
    }
  };

  return (
    // ... (JSX Form UI sama persis seperti sebelumnya)
    <form
      action={handleSubmit}
      className="space-y-8 animate-in fade-in duration-500"
    >
      {/* ... Info Dasar, Pilih Format, Settings, dll ... */}

      {/* Kode form Anda tidak perlu diubah layout-nya, 
          hanya pastikan menggunakan handleSubmit di atas */}

      {/* 1. INFO DASAR */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6">
        {/* ... */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Info size={20} />
          </div>
          <h3 className="text-lg font-semibold text-white">Info Dasar</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">
              Nama Turnamen
            </label>
            <input
              name="title"
              type="text"
              placeholder="e.g. Sunday Cup Season 1"
              required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">
              Pilih Game
            </label>
            <div className="relative">
              <select
                name="gameId"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                onChange={(e) => {
                  const game = games.find((g) => g.id === e.target.value);
                  setSelectedGame(game || null);
                  setSelectedFormat("");
                  setMatchConfig({
                    bestOf: "1",
                    homeAway: false,
                    pointsPerWin: 3,
                    hasThirdPlace: false,
                  });
                }}
              >
                <option value="">-- Select Game --</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.platform})
                  </option>
                ))}
              </select>
              <Gamepad2
                className="absolute right-4 top-3.5 text-slate-500 pointer-events-none"
                size={18}
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">
              Deskripsi (Opsional)
            </label>
            <div className="relative">
              <textarea
                name="description"
                rows={3}
                placeholder="Jelaskan detail turnamen, aturan, atau hadiah..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600 resize-none"
              />
              <AlignLeft
                className="absolute right-4 top-3.5 text-slate-500 pointer-events-none"
                size={18}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PILIH FORMAT */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
            <Trophy size={20} />
          </div>
          <h3 className="text-lg font-semibold text-white">Format Kompetisi</h3>
        </div>

        {!selectedGame ? (
          <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            <p>Pilih game dulu untuk melihat format yang cocok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableFormats.map((format) => (
              <label
                key={format.id}
                className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all group ${
                  selectedFormat === format.id
                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                    : "border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="formatType"
                  value={format.id}
                  className="absolute opacity-0"
                  checked={selectedFormat === format.id}
                  onChange={() => setSelectedFormat(format.id)}
                  required
                />
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedFormat === format.id
                        ? "border-indigo-400"
                        : "border-slate-500"
                    }`}
                  >
                    {selectedFormat === format.id && (
                      <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                    )}
                  </div>
                  <span
                    className={`font-bold ${
                      selectedFormat === format.id
                        ? "text-white"
                        : "text-slate-300"
                    }`}
                  >
                    {format.id.replace("_", " ")}
                  </span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 3. SETTINGS */}
      {selectedGame && selectedFormat && selectedFormat !== "BATTLE_ROYALE" && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
              <Settings2 size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">Match Config</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Opsi 3rd Place Match */}
            {selectedFormat === "SINGLE_ELIMINATION" && (
              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-900/50 cursor-pointer hover:bg-slate-900/80 transition-colors">
                <div>
                  <span className="font-bold text-white block">
                    Bronze Match (3rd Place)
                  </span>
                  <span className="text-xs text-slate-400">
                    Adakan match perebutan juara 3
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={matchConfig.hasThirdPlace}
                  onChange={(e) =>
                    setMatchConfig({
                      ...matchConfig,
                      hasThirdPlace: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                />
              </label>
            )}

            {selectedGame.genre === "SPORTS" && (
              <label className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-900/50 cursor-pointer hover:bg-slate-900/80 transition-colors">
                <span className="font-bold text-white">Mode Home & Away</span>
                <input
                  type="checkbox"
                  checked={matchConfig.homeAway}
                  onChange={(e) =>
                    setMatchConfig({
                      ...matchConfig,
                      homeAway: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                />
              </label>
            )}

            {(selectedGame.genre === "MOBA" ||
              selectedGame.genre === "FPS") && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">
                  Best Of (Series)
                </label>
                <div className="flex gap-2">
                  {["1", "3", "5"].map((bo) => (
                    <button
                      key={bo}
                      type="button"
                      onClick={() =>
                        setMatchConfig({ ...matchConfig, bestOf: bo })
                      }
                      className={`flex-1 py-2 rounded-lg border font-bold transition-all ${
                        matchConfig.bestOf === bo
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-400"
                      }`}
                    >
                      BO{bo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMIT */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading || !selectedFormat}
          className="px-8 py-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Processing..." : "Create Tournament"}
        </button>
      </div>
    </form>
  );
}

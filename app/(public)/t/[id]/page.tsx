import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RealtimeListener from "@/components/providers/tournament/realtime-listener";
import BracketVisualizer from "@/features/bracket/components/bracket-visualizer";
import BattleRoyaleView from "@/features/bracket/components/br-view";
import StandingsTable from "@/features/bracket/components/standings-table";
import { Trophy, Calendar, Gamepad2, Users } from "lucide-react";

// Force dynamic rendering karena halaman ini butuh data realtime/fresh
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PublicTournamentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch Tournament Data
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*, games(*)") // Join games untuk nama game
    .eq("id", id)
    .single();

  if (!tournament) {
    notFound();
  }

  // 2. Fetch Active Stage
  // Ambil stage dengan sequence terkecil (Main Stage) atau yang sedang berjalan
  const { data: stages } = await supabase
    .from("stages")
    .select("*")
    .eq("tournament_id", id)
    .order("sequence_order", { ascending: true });

  const activeStage = stages?.[0];

  // 3. Fetch Matches & Participants
  // Kita perlu mengambil match yang sesuai dengan stage aktif
  const { data: matches } = await supabase
    .from("matches")
    .select(
      "*, participant_a:participants!participant_a_id(*), participant_b:participants!participant_b_id(*)"
    )
    .eq("tournament_id", id)
    .eq("stage_id", activeStage?.id)
    .order("match_number", { ascending: true });

  const { data: participants } = await supabase
    .from("participants")
    .select("*")
    .eq("tournament_id", id)
    .eq("is_verified", true);

  // -- RENDER HELPERS --
  const renderContent = () => {
    // State: Belum ada match generated
    if (!activeStage || !matches || matches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
          <Trophy className="text-slate-600 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white">
            Turnamen Belum Dimulai
          </h3>
          <p className="text-slate-400 mt-2">
            Jadwal pertandingan belum tersedia.
          </p>
        </div>
      );
    }

    switch (activeStage.type) {
      case "SINGLE_ELIMINATION":
      case "DOUBLE_ELIMINATION":
        return (
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 overflow-x-auto min-h-[500px]">
            <BracketVisualizer matches={matches} isReadOnly={true} />
          </div>
        );

      case "LEADERBOARD": // Battle Royale
        return (
          <BattleRoyaleView
            matches={matches}
            participants={participants || []}
            tournamentId={id}
            isReadOnly={true}
          />
        );

      case "ROUND_ROBIN": // Liga / Group Stage
        return (
          <StandingsTable
            matches={matches}
            participants={participants || []}
            tournamentId={id} // <--- FIX: Property required ditambahkan
            isReadOnly={true} // <--- Added: Mode baca saja untuk publik
          />
        );

      default:
        return (
          <p className="text-center text-slate-500">
            Format turnamen tidak didukung.
          </p>
        );
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pb-20 selection:bg-indigo-500/30">
      {/* --- REALTIME LISTENER --- */}
      {/* Penting: Agar penonton melihat skor berubah live tanpa refresh */}
      <RealtimeListener tournamentId={id} />

      {/* HERO SECTION */}
      <div className="relative bg-slate-900 border-b border-white/5 pt-20 pb-10 px-6 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-50%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                {tournament.status}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                {tournament.format_type.replace("_", " ")}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              {tournament.title}
            </h1>

            <div className="flex flex-wrap gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Gamepad2 size={16} className="text-indigo-400" />
                <span>{tournament.games?.name || "Game Undefined"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-400" />
                <span>{participants?.length || 0} Participants</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-400" />
                <span>
                  {new Date(tournament.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action / Register Button (Placeholder Logic) */}
          {tournament.status === "DRAFT" && (
            <button className="px-6 py-3 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/5">
              Register Now
            </button>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Description (Jika ada) */}
        {tournament.description && (
          <div className="prose prose-invert max-w-none bg-slate-900/30 p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2">
              About this Tournament
            </h3>
            <p className="text-slate-400 whitespace-pre-line">
              {tournament.description}
            </p>
          </div>
        )}

        {/* Dynamic Content (Bracket/Leaderboard/Standings) */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Live Results</h2>
          </div>

          {renderContent()}
        </div>
      </div>
    </main>
  );
}

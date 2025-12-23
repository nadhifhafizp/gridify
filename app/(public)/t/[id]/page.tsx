// File: app/(public)/t/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Calendar,
  Trophy,
  Users,
  Swords,
  LayoutList,
  GitGraph,
  Target,
  Share2,
} from "lucide-react";
import BracketVisualizer from "@/features/bracket/components/bracket-visualizer";
import StandingsTable from "@/features/bracket/components/standings-table";
import BattleRoyaleView from "@/features/bracket/components/br-view";
import { Tournament } from "@/types/database";

// --- IMPORT KOMPONEN REALTIME ---
import RealtimeListener from "@/components/providers/tournament/realtime-listener"; 

export const dynamic = "force-dynamic";

export default async function PublicTournamentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { id } = await params;
  const { stage: stageIdParam } = await searchParams;
  const supabase = await createClient();

  // 1. Ambil Data Tournament (termasuk owner untuk keperluan internal jika butuh)
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*, owner:owner_id(email)") 
    .eq("id", id)
    .single();

  if (!tournament) return notFound();

  // 2. Ambil Stages
  const { data: stages } = await supabase
    .from("stages")
    .select("*")
    .eq("tournament_id", id)
    .order("sequence_order", { ascending: true });

  // Tentukan stage aktif (dari URL atau default ke stage pertama)
  const activeStage = stageIdParam
    ? stages?.find((s) => s.id === stageIdParam)
    : stages?.[0];

  // 3. Ambil Peserta
  const { data: participants } = await supabase
    .from("participants")
    .select("*")
    .eq("tournament_id", id);

  // 4. Ambil Matches untuk stage aktif
  const { data: matches } = activeStage
    ? await supabase
        .from("matches")
        .select(
          `*, participant_a:participant_a_id(*), participant_b:participant_b_id(*)`
        )
        .eq("stage_id", activeStage.id)
        .order("round_number", { ascending: true })
        .order("match_number", { ascending: true })
    : { data: [] };

  const hasBracket = matches && matches.length > 0;
  const participantCount = participants?.length || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* --- INTEGRASI REALTIME --- */}
      {/* Komponen ini akan mentrigger router.refresh() saat ada update di tabel matches/participants */}
      <RealtimeListener tournamentId={id} />

      {/* --- HERO SECTION --- */}
      <div className="relative border-b border-white/10 bg-slate-900/50">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-size-[32px]" />
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/0 to-slate-950" />
        
        <div className="container mx-auto px-4 pt-20 pb-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-500/20">
              <Trophy size={14} /> Official Tournament
            </span>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
              {tournament.title}
            </h1>
            
            {tournament.description && (
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                {tournament.description}
              </p>
            )}

            {/* Stats Grid */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm font-medium text-slate-400">
              <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-white/5">
                <Users size={18} className="text-indigo-400" />
                <span className="text-white">{participantCount}</span> Participants
              </div>
              <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-white/5">
                <Calendar size={18} className="text-emerald-400" />
                <span>{new Date(tournament.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-white/5">
                <Swords size={18} className="text-rose-400" />
                <span>{tournament.format_type.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="container mx-auto px-4 py-12">
        
        {/* Stage Navigation */}
        {stages && stages.length > 1 && (
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-slate-900 p-1.5 rounded-xl border border-white/10 shadow-xl overflow-x-auto max-w-full">
              {stages.map((s) => (
                <a
                  key={s.id}
                  href={`?stage=${s.id}`}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                    activeStage?.id === s.id
                      ? "bg-indigo-600 text-white shadow-lg ring-1 ring-white/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* BRACKET VIEW AREA */}
        <div className="max-w-[1400px] mx-auto">
          {!activeStage ? (
            <div className="text-center py-20 text-slate-500">
              <p>Belum ada stage yang dibuat.</p>
            </div>
          ) : !hasBracket ? (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <Swords className="text-slate-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white">Bracket Belum Dirilis</h3>
              <p className="text-slate-500 mt-2">Penyelenggara belum membuat jadwal pertandingan.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Header Stage Type */}
              <div className="flex items-center gap-3 mb-8 px-4">
                {activeStage.type === "ROUND_ROBIN" ? (
                  <LayoutList className="text-blue-400" />
                ) : activeStage.type === "LEADERBOARD" ? (
                  <Target className="text-red-400" />
                ) : (
                  <GitGraph className="text-orange-400" />
                )}
                <h2 className="text-xl font-bold text-white">
                  {activeStage.type === "ROUND_ROBIN"
                    ? "Group Stage Standings"
                    : activeStage.type === "LEADERBOARD"
                    ? "Leaderboard"
                    : "Playoff Bracket"}
                </h2>
              </div>

              {/* 1. Round Robin View */}
              {activeStage.type === "ROUND_ROBIN" && (
                <StandingsTable
                  matches={matches || []}
                  participants={participants || []}
                  tournamentId={id}
                  isReadOnly={true}
                />
              )}

              {/* 2. Elimination Bracket View */}
              {(activeStage.type === "SINGLE_ELIMINATION" ||
                activeStage.type === "DOUBLE_ELIMINATION") && (
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-1 shadow-2xl overflow-hidden relative min-h-[600px]">
                   {/* Scroll Hint */}
                   <div className="absolute top-6 right-6 z-20 pointer-events-none">
                    <span className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-slate-400 border border-white/10 flex items-center gap-2">
                      Scroll / Drag <Share2 size={12} className="rotate-90" />
                    </span>
                  </div>

                  <div className="p-6 md:p-10 overflow-x-auto">
                    {/* PERBAIKAN: Menambahkan props 'tournament' yang dibutuhkan untuk ChampionsView */}
                    <BracketVisualizer
                      matches={matches || []}
                      allParticipants={participants || []}
                      tournament={tournament as unknown as Tournament}
                      isReadOnly={true}
                    />
                  </div>
                </div>
              )}

              {/* 3. Battle Royale View */}
              {activeStage.type === "LEADERBOARD" && (
                <BattleRoyaleView
                  matches={matches || []}
                  participants={participants || []}
                  tournamentId={id}
                  isReadOnly={true}
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/5 mt-20 py-8 text-center text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Gridify Tournament Platform</p>
      </footer>
    </div>
  );
}
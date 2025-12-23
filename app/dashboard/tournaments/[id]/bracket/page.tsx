// File: app/dashboard/tournaments/[id]/bracket/page.tsx

import { createClient } from "@/lib/supabase/server";
import {
  Swords,
  LayoutList,
  GitGraph,
  Target,
} from "lucide-react";
import Link from "next/link";
import GenerateBracketButton from "./generate-button";
import BracketVisualizer from "@/features/bracket/components/bracket-visualizer";
import StandingsTable from "@/features/bracket/components/standings-table";
import BattleRoyaleView from "@/features/bracket/components/br-view";
import { Tournament } from "@/types/database"; // Import Type Tournament

export const dynamic = "force-dynamic";

export default async function BracketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { id } = await params;
  const { stage: stageIdParam } = await searchParams;
  const supabase = await createClient();

  // --- 1. Ambil Data Tournament (PERBAIKAN: Diperlukan untuk Visualizer) ---
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  // --- 2. Ambil Semua Stage ---
  const { data: stages } = await supabase
    .from("stages")
    .select("*")
    .eq("tournament_id", id)
    .order("sequence_order", { ascending: true });

  const activeStage = stageIdParam
    ? stages?.find((s) => s.id === stageIdParam)
    : stages?.[0];

  // Jika belum ada stage atau tournament tidak ditemukan
  if (!stages || stages.length === 0 || !tournament) {
    const { count: participantCount } = await supabase
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", id);

    return (
      <EmptyState tournamentId={id} participantCount={participantCount || 0} />
    );
  }

  // --- 3. Ambil Match ---
  const { data: matches } = await supabase
    .from("matches")
    .select(
      `*, participant_a:participant_a_id(*), participant_b:participant_b_id(*)`
    )
    .eq("stage_id", activeStage?.id)
    .order("round_number", { ascending: true })
    .order("match_number", { ascending: true });

  // --- 4. Ambil Peserta ---
  const { data: participants } = await supabase
    .from("participants")
    .select("*")
    .eq("tournament_id", id);

  const hasBracket = matches && matches.length > 0;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {activeStage?.type === "ROUND_ROBIN" ? (
              <LayoutList className="text-blue-400" />
            ) : activeStage?.type === "LEADERBOARD" ? (
              <Target className="text-red-400" />
            ) : (
              <GitGraph className="text-orange-400" />
            )}
            {activeStage?.type === "ROUND_ROBIN"
              ? "Klasemen Liga"
              : activeStage?.type === "LEADERBOARD"
              ? "Battle Royale Standings"
              : "Bracket Pertandingan"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Format:{" "}
            <span className="text-indigo-400 font-medium">
              {activeStage?.type.replace("_", " ")}
            </span>
          </p>
        </div>

        {stages.length > 1 && (
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10">
            {stages.map((s) => (
              <Link
                key={s.id}
                href={`?stage=${s.id}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeStage?.id === s.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        {hasBracket && activeStage?.sequence_order === 1 && (
          <GenerateBracketButton
            tournamentId={id}
            participantCount={participants?.length || 0}
            label="Reset Sistem"
          />
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 animate-in fade-in duration-500">
        {!hasBracket ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-800/30">
              <Swords size={40} className="text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Arena Belum Siap
            </h3>
            <p className="text-slate-400 max-w-md mb-8">
              Ada{" "}
              <span className="text-indigo-400 font-bold text-lg">
                {participants?.length || 0}
              </span>{" "}
              peserta siap.
            </p>
            <GenerateBracketButton
              tournamentId={id}
              participantCount={participants?.length || 0}
              label="Buat Jadwal"
            />
          </div>
        ) : (
          <>
            {activeStage?.type === "ROUND_ROBIN" && (
              <StandingsTable
                matches={matches || []}
                participants={participants || []}
                tournamentId={id}
              />
            )}

            {(activeStage?.type === "SINGLE_ELIMINATION" ||
              activeStage?.type === "DOUBLE_ELIMINATION") && (
              <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 overflow-hidden relative min-h-96">
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 bg-black/40 backdrop-blur rounded-full text-xs text-slate-500 border border-white/5">
                    Geser Horizontal 👉
                  </span>
                </div>
                {/* --- UPDATE: PASS TOURNAMENT PROP HERE --- */}
                <BracketVisualizer 
                  matches={matches} 
                  allParticipants={participants || []} 
                  tournament={tournament as unknown as Tournament} // Pass data tournament
                />
              </div>
            )}

            {activeStage?.type === "LEADERBOARD" && (
              <BattleRoyaleView
                matches={matches || []}
                participants={participants || []}
                tournamentId={id}
                isReadOnly={false}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  tournamentId,
  participantCount,
}: {
  tournamentId: string;
  participantCount: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-800/30">
        <Swords size={40} className="text-slate-500" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Arena Belum Siap</h3>
      <p className="text-slate-400 max-w-md mb-8">
        Silakan generate bracket untuk memulai.
      </p>
      <GenerateBracketButton
        tournamentId={tournamentId}
        participantCount={participantCount}
        label="Buat Bracket"
      />
    </div>
  );
}
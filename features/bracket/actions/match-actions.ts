"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Match, Stage } from "@/types/database";

// --- ACTION 1: Update Skor 1vs1 (Bracket/League) ---
export async function updateMatchScoreAction(
  matchId: string,
  scoreA: number,
  scoreB: number,
  tournamentId: string
) {
  const supabase = await createClient();

  if (scoreA < 0 || scoreB < 0)
    return { success: false, error: "Skor tidak boleh negatif" };

  const { data: matchData, error: fetchError } = await supabase
    .from("matches")
    .select("*, stages(id, type, sequence_order)")
    .eq("id", matchId)
    .single();

  if (fetchError || !matchData)
    return { success: false, error: "Match tidak ditemukan" };

  const match = matchData as unknown as Match & { stages: Stage };

  let winnerId: string | null = null;
  let loserId: string | null = null;

  if (scoreA > scoreB) {
    winnerId = match.participant_a_id;
    loserId = match.participant_b_id;
  } else if (scoreB > scoreA) {
    winnerId = match.participant_b_id;
    loserId = match.participant_a_id;
  }

  // Preserve existing scores properties if needed, but for 1v1 usually simple overwrite is fine
  // But strictly speaking, merging is safer.
  const newScores = { ...match.scores, a: scoreA, b: scoreB };

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      scores: newScores, // Gunakan merged scores
      winner_id: winnerId,
      status: "COMPLETED",
    })
    .eq("id", matchId);

  if (updateError) return { success: false, error: updateError.message };

  // ADVANCE LOGIC
  const stageType = match.stages?.type;

  if (winnerId) {
    if (match.next_match_id) {
      await advanceParticipant(
        supabase,
        match.next_match_id,
        match.match_number,
        winnerId
      );
    }

    if (
      stageType === "DOUBLE_ELIMINATION" &&
      loserId &&
      match.round_number > 0 &&
      match.round_number < 999
    ) {
      await dropToLowerBracket(supabase, match, loserId);
    }
  }

  await checkTournamentCompletion(
    supabase,
    tournamentId,
    match.stage_id,
    match.stages.sequence_order
  );

  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);

  return { success: true };
}

// --- ACTION 2: Update Skor Battle Royale (DIPERBAIKI) ---
export async function updateBRMatchScoreAction(
  matchId: string,
  results: { teamId: string; rank: number; kills: number; total: number }[],
  tournamentId: string
) {
  const supabase = await createClient();

  if (!Array.isArray(results) || results.length === 0) {
    return { success: false, error: "Data hasil tidak valid" };
  }

  // 1. Ambil data match lama untuk mendapatkan 'groups' yang sudah ada
  const { data: existingMatch, error: fetchError } = await supabase
    .from("matches")
    .select("scores")
    .eq("id", matchId)
    .single();

  if (fetchError || !existingMatch) {
    return { success: false, error: "Match tidak ditemukan" };
  }

  // 2. Gabungkan data lama (groups) dengan data baru (results)
  // Casting ke any/Match karena Supabase return type kadang loose
  const currentScores = existingMatch.scores as Match["scores"];

  const updatedScores = {
    ...currentScores, // Pertahankan properti 'groups'
    results: results, // Update hasil pertandingan
  };

  // 3. Simpan ke Database
  const { error } = await supabase
    .from("matches")
    .update({
      scores: updatedScores,
      status: "COMPLETED",
    })
    .eq("id", matchId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);
  return { success: true };
}

// --- HELPER FUNCTIONS ---

async function advanceParticipant(
  supabase: any,
  targetMatchId: string,
  currentMatchNum: number,
  participantId: string
) {
  const isOdd = currentMatchNum % 2 !== 0;
  const targetCol = isOdd ? "participant_a_id" : "participant_b_id";
  await supabase
    .from("matches")
    .update({ [targetCol]: participantId })
    .eq("id", targetMatchId);
}

async function dropToLowerBracket(
  supabase: any,
  currentMatch: Match,
  loserId: string
) {
  const wbRound = currentMatch.round_number;
  const targetLBRound = -wbRound;

  const { data: targetMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("stage_id", currentMatch.stage_id)
    .eq("round_number", targetLBRound)
    .order("match_number", { ascending: true });

  if (!targetMatches || targetMatches.length === 0) return;

  for (const m of targetMatches) {
    if (!m.participant_a_id) {
      await supabase
        .from("matches")
        .update({ participant_a_id: loserId })
        .eq("id", m.id);
      break;
    } else if (!m.participant_b_id) {
      await supabase
        .from("matches")
        .update({ participant_b_id: loserId })
        .eq("id", m.id);
      break;
    }
  }
}

async function checkTournamentCompletion(
  supabase: any,
  tournamentId: string,
  stageId: string,
  stageOrder: number
) {
  const { count: stagesAfter } = await supabase
    .from("stages")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)
    .gt("sequence_order", stageOrder);

  if (stagesAfter === 0) {
    const { count: pendingMatches } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("stage_id", stageId)
      .neq("status", "COMPLETED");

    if (pendingMatches === 0) {
      await supabase
        .from("tournaments")
        .update({ status: "COMPLETED" })
        .eq("id", tournamentId);
    }
  }
}

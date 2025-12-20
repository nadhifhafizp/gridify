"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Match, Stage, Tournament } from "@/types/database";
import * as progressionService from "../services/progression-service";

// --- ACTION 1: Update Skor 1vs1 (Bracket/League) ---
export async function updateMatchScoreAction(
  matchId: string,
  scoreA: number,
  scoreB: number,
  tournamentId: string
) {
  const supabase = await createClient();

  // 1. Validasi Basic
  if (scoreA < 0 || scoreB < 0)
    return { success: false, error: "Skor tidak boleh negatif" };

  // 2. Fetch Match Data (Join Stages & Tournament Settings)
  const { data: matchData, error: fetchError } = await supabase
    .from("matches")
    .select("*, stages(id, type, sequence_order), tournaments(settings)")
    .eq("id", matchId)
    .single();

  if (fetchError || !matchData)
    return { success: false, error: "Match tidak ditemukan" };

  // Casting Type
  const match = matchData as unknown as Match & {
    stages: Stage;
    tournaments: { settings: { hasThirdPlace?: boolean } };
  };

  // 3. Tentukan Winner & Loser
  let winnerId: string | null = null;
  let loserId: string | null = null;

  if (scoreA > scoreB) {
    winnerId = match.participant_a_id;
    loserId = match.participant_b_id;
  } else if (scoreB > scoreA) {
    winnerId = match.participant_b_id;
    loserId = match.participant_a_id;
  }

  // 4. Update Database
  const currentScores = match.scores || {};
  const updatedScores = { ...currentScores, a: scoreA, b: scoreB };

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      scores: updatedScores,
      winner_id: winnerId,
      status: "COMPLETED",
    })
    .eq("id", matchId);

  if (updateError) return { success: false, error: updateError.message };

  // =====================================
  // 5. SERVICE LAYER DELEGATION
  // =====================================
  const stageType = match.stages?.type;
  const settings = match.tournaments?.settings || {};

  try {
    if (winnerId) {
      // A. Advance Winner
      if (match.next_match_id) {
        await progressionService.advanceParticipant(supabase, match, winnerId);
      }

      // B. Drop Loser (Double Elim)
      if (
        stageType === "DOUBLE_ELIMINATION" &&
        loserId &&
        match.round_number > 0 &&
        match.round_number < 999
      ) {
        await progressionService.dropToLowerBracket(supabase, match, loserId);
      }

      // C. Bronze Match Logic (Single Elim)
      // Jika Single Elim, ada loser, dan setting aktif -> Cek apakah ini Semifinal
      if (
        stageType === "SINGLE_ELIMINATION" &&
        loserId &&
        settings.hasThirdPlace
      ) {
        await progressionService.handleSemiFinalLoser(
          supabase,
          match,
          loserId,
          settings
        );
      }
    }

    // 6. Cek Penyelesaian Turnamen
    await progressionService.checkAndCompleteStage(
      supabase,
      tournamentId,
      match.stage_id,
      match.stages.sequence_order
    );
  } catch (error: any) {
    console.error("Progression Error:", error);
  }

  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);

  return { success: true };
}

// ... (Action Battle Royale tetap sama)
export async function updateBRMatchScoreAction(
  matchId: string,
  results: { teamId: string; rank: number; kills: number; total: number }[],
  tournamentId: string
) {
  const supabase = await createClient();

  if (!Array.isArray(results) || results.length === 0) {
    return { success: false, error: "Data hasil tidak valid" };
  }

  const { data: existingMatch } = await supabase
    .from("matches")
    .select("scores")
    .eq("id", matchId)
    .single();

  const currentScores = existingMatch?.scores || {};
  const updatedScores = { ...(currentScores as object), results };

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

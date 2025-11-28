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

  // Validasi basic
  if (scoreA < 0 || scoreB < 0)
    return { success: false, error: "Skor tidak boleh negatif" };

  // 1. Ambil data match dengan Tipe yang Benar
  const { data: matchData, error: fetchError } = await supabase
    .from("matches")
    .select("*, stages(id, type, sequence_order)")
    .eq("id", matchId)
    .single();

  if (fetchError || !matchData)
    return { success: false, error: "Match tidak ditemukan" };

  // Casting ke tipe Match agar autocomplete jalan (Supabase join result perlu handling khusus, tapi kita simplify disini)
  const match = matchData as unknown as Match & { stages: Stage };

  // 2. Tentukan Pemenang
  let winnerId: string | null = null;
  let loserId: string | null = null;

  if (scoreA > scoreB) {
    winnerId = match.participant_a_id;
    loserId = match.participant_b_id;
  } else if (scoreB > scoreA) {
    winnerId = match.participant_b_id;
    loserId = match.participant_a_id;
  }
  // Jika seri (Draw), winnerId tetap null (Hanya valid untuk League)

  // 3. Update Match Ini
  const { error: updateError } = await supabase
    .from("matches")
    .update({
      scores: { a: scoreA, b: scoreB },
      winner_id: winnerId,
      status: "COMPLETED",
    })
    .eq("id", matchId);

  if (updateError) return { success: false, error: updateError.message };

  // =====================================
  // 4. AUTO-ADVANCE LOGIC
  // =====================================
  const stageType = match.stages?.type;

  if (winnerId) {
    // A. SINGLE ELIMINATION
    if (stageType === "SINGLE_ELIMINATION" && match.next_match_id) {
      await advanceToNextMatch(
        supabase,
        match.next_match_id,
        match.match_number,
        winnerId
      );
    }

    // B. DOUBLE ELIMINATION (Simplified MVP Logic)
    if (stageType === "DOUBLE_ELIMINATION") {
      const currentRound = match.round_number;

      // Upper Bracket (Round > 0)
      if (currentRound > 0 && currentRound < 999) {
        // Pemenang -> Lanjut di Upper
        await findAndFillSlot(
          supabase,
          match.stage_id,
          currentRound + 1,
          winnerId
        );

        // Kalah -> Turun ke Lower (TODO: Logic Lower Bracket yang presisi butuh mapping khusus)
        // Untuk MVP Phase 1: Kita biarkan manual atau implementasi sederhana nanti
      }
    }
  }

  // 5. Cek Tournament Finish
  await checkTournamentCompletion(
    supabase,
    tournamentId,
    match.stage_id,
    match.stages.sequence_order
  );

  // 6. Refresh
  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);

  return { success: true };
}

// --- ACTION 2: Update Skor Battle Royale ---
export async function updateBRMatchScoreAction(
  matchId: string,
  results: { teamId: string; rank: number; kills: number; total: number }[],
  tournamentId: string
) {
  const supabase = await createClient();

  // Validasi Array
  if (!Array.isArray(results) || results.length === 0) {
    return { success: false, error: "Data hasil tidak valid" };
  }

  const { error } = await supabase
    .from("matches")
    .update({
      scores: { results },
      status: "COMPLETED",
    })
    .eq("id", matchId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);
  return { success: true };
}

// --- HELPER FUNCTIONS ---

async function advanceToNextMatch(
  supabase: any,
  nextMatchId: string,
  currentMatchNum: number,
  winnerId: string
) {
  // Ganjil masuk slot A, Genap masuk slot B (Asumsi struktur binary tree standar)
  const isOdd = currentMatchNum % 2 !== 0;
  const targetCol = isOdd ? "participant_a_id" : "participant_b_id";
  await supabase
    .from("matches")
    .update({ [targetCol]: winnerId })
    .eq("id", nextMatchId);
}

async function findAndFillSlot(
  supabase: any,
  stageId: string,
  roundNum: number,
  teamId: string
) {
  const { data: targetMatches } = await supabase
    .from("matches")
    .select("id, participant_a_id, participant_b_id")
    .eq("stage_id", stageId)
    .eq("round_number", roundNum)
    .order("match_number", { ascending: true });

  if (!targetMatches) return;

  // Cari slot kosong pertama
  for (const target of targetMatches) {
    if (!target.participant_a_id) {
      await supabase
        .from("matches")
        .update({ participant_a_id: teamId })
        .eq("id", target.id);
      break;
    } else if (!target.participant_b_id) {
      await supabase
        .from("matches")
        .update({ participant_b_id: teamId })
        .eq("id", target.id);
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
  // Cek apakah ada stage lagi setelah ini?
  const { count: stagesAfter } = await supabase
    .from("stages")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)
    .gt("sequence_order", stageOrder);

  if (stagesAfter === 0) {
    // Cek apakah semua match di stage ini sudah selesai?
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

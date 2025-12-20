// features/bracket/services/progression-service.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Match } from "@/types/database";

/**
 * Menjatuhkan Loser ke Lower Bracket dengan Mapping Deterministik.
 * (Logika ini dipindahkan dari match-actions.ts agar reusable)
 */
export async function dropToLowerBracket(
  supabase: SupabaseClient,
  currentMatch: Match,
  loserId: string
) {
  const wbRound = currentMatch.round_number;

  // 1. Tentukan Target Round & Match Number
  let targetLBRound = 0;
  let targetMatchNum = 0;
  let targetSlot = "participant_a_id"; // Default Slot A

  if (wbRound === 1) {
    // WB R1 kalah -> Masuk LB R1
    // Mapping: Merge (Match 1 & 2 -> Match 1)
    targetLBRound = -1;
    targetMatchNum = Math.ceil(currentMatch.match_number / 2);
    targetSlot =
      currentMatch.match_number % 2 !== 0
        ? "participant_a_id"
        : "participant_b_id";
  } else {
    // WB R2+ kalah -> Masuk LB Round Genap
    // Rumus: LB Round = (WB - 1) * 2
    // Mapping: Direct (Match 1 -> Match 1)
    targetLBRound = -((wbRound - 1) * 2);
    targetMatchNum = currentMatch.match_number;
    targetSlot = "participant_a_id"; // Selalu A
  }

  // 2. Cari Match Tujuan
  const { data: targetMatch } = await supabase
    .from("matches")
    .select("id")
    .eq("stage_id", currentMatch.stage_id)
    .eq("round_number", targetLBRound)
    .eq("match_number", targetMatchNum)
    .single();

  // 3. Update Slot
  if (targetMatch) {
    const { error } = await supabase
      .from("matches")
      .update({ [targetSlot]: loserId })
      .eq("id", targetMatch.id);

    if (error)
      throw new Error(
        `Gagal memindahkan loser ke Lower Bracket: ${error.message}`
      );
  }
}

export async function handleSemiFinalLoser(
  supabase: SupabaseClient,
  currentMatch: Match,
  loserId: string,
  settings: { hasThirdPlace?: boolean }
) {
  // 1. Cek apakah fitur aktif
  if (!settings?.hasThirdPlace) return;

  // 2. Cek apakah ini Semifinal?
  // Cara cek: next_match_id menunjuk ke Final (Round Terakhir, Match 1)
  if (!currentMatch.next_match_id) return;

  const { data: nextMatch } = await supabase
    .from("matches")
    .select("round_number, match_number")
    .eq("id", currentMatch.next_match_id)
    .single();

  if (!nextMatch) return;

  // Asumsi: Final ada di Round X, Match 1. Bronze ada di Round X, Match 2.
  // Jika next match adalah Match #1, berarti currentMatch adalah Semifinal.
  if (nextMatch.match_number !== 1) return;

  // 3. Cari Match Bronze (Round yang sama dengan Final, tapi Match #2)
  const bronzeRound = nextMatch.round_number;

  const { data: bronzeMatch } = await supabase
    .from("matches")
    .select("id, participant_a_id, participant_b_id")
    .eq("stage_id", currentMatch.stage_id)
    .eq("round_number", bronzeRound)
    .eq("match_number", 2) // Match Bronze
    .single();

  if (!bronzeMatch) return;

  // 4. Masukkan Loser ke Slot Kosong di Bronze Match
  let targetCol = "participant_a_id";

  if (!bronzeMatch.participant_a_id) {
    targetCol = "participant_a_id";
  } else if (!bronzeMatch.participant_b_id) {
    targetCol = "participant_b_id";
  } else {
    // Slot penuh (seharusnya tidak terjadi jika logic benar)
    return;
  }

  await supabase
    .from("matches")
    .update({ [targetCol]: loserId })
    .eq("id", bronzeMatch.id);
}

/**
 * Memindahkan pemenang ke match selanjutnya (Advance).
 * Handle logika slot A/B berdasarkan tipe flow dan nomor match.
 */
export async function advanceParticipant(
  supabase: SupabaseClient,
  currentMatch: Match,
  participantId: string
) {
  if (!currentMatch.next_match_id) return;

  // Default Logic: Ganjil -> A, Genap -> B
  const isOdd = currentMatch.match_number % 2 !== 0;
  let targetCol = isOdd ? "participant_a_id" : "participant_b_id";

  // Special Case: Lower Bracket Progression
  if (currentMatch.round_number < 0) {
    const lbRoundAbs = Math.abs(currentMatch.round_number);

    // Logic: Winner Lower Bracket Round Ganjil (1, 3...) HARUS masuk Slot B di Round Genap
    // Karena Slot A di Round Genap sudah di-booking untuk Loser dari Upper Bracket
    if (lbRoundAbs % 2 !== 0) {
      targetCol = "participant_b_id";
    }
  }

  const { error } = await supabase
    .from("matches")
    .update({ [targetCol]: participantId })
    .eq("id", currentMatch.next_match_id);

  if (error) throw new Error(`Gagal memajukan peserta: ${error.message}`);
}

/**
 * Cek apakah turnamen/stage sudah selesai sepenuhnya.
 */
export async function checkAndCompleteStage(
  supabase: SupabaseClient,
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
    // Ini stage terakhir. Cek apakah semua match beres?
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

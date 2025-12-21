// features/bracket/services/progression-service.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Match } from "@/types/database";

/**
 * Menjatuhkan Loser ke Lower Bracket dengan Logika Double Elimination Standard.
 * Rumus Umum: Loser dari WB Round N jatuh ke LB Round (N * 2) - 1.
 */
export async function dropToLowerBracket(
  supabase: SupabaseClient,
  currentMatch: Match,
  loserId: string
) {
  const wbRound = currentMatch.round_number;

  // Safety: Jangan jalankan jika ini match LB (negatif) atau Grand Final (999)
  if (wbRound < 0 || wbRound === 999) return;

  // 1. Tentukan Target Round LB
  // Rumus: WB R1 -> LB R1 | WB R2 -> LB R3 | WB R3 -> LB R5 (Final LB)
  const targetLBRound = -((wbRound * 2) - 1);

  // 2. Tentukan Target Match Number & Slot
  let targetMatchNum = 0;
  let targetSlot = "participant_a_id"; 

  if (wbRound === 1) {
    // SPECIAL CASE: WB Round 1
    // 2 Match WB (1 & 2) bergabung ke 1 Match LB.
    // Ganjil masuk Slot A, Genap masuk Slot B.
    targetMatchNum = Math.ceil(currentMatch.match_number / 2);
    targetSlot = currentMatch.match_number % 2 !== 0 ? "participant_a_id" : "participant_b_id";
  } else {
    // STANDARD CASE: WB Round 2 ke atas
    // Match WB langsung drop ke Match LB yang sesuai.
    // Biasanya Loser WB mengambil Slot A, menunggu Winner dari LB Round sebelumnya.
    targetMatchNum = Math.ceil(currentMatch.match_number / 2); // Mapping match number (4 match -> 2 match -> 1 match)
    
    // Namun untuk WB Final (hanya 1 match), dia pasti ke LB Final (Match 1)
    if (currentMatch.match_number === 1) {
       targetMatchNum = 1;
    }
    
    targetSlot = "participant_a_id"; // Default: Loser WB "Menunggu" di atas (Slot A)
  }

  // 3. Cari Match Tujuan di Database
  const { data: targetMatch } = await supabase
    .from("matches")
    .select("id, participant_a_id, participant_b_id")
    .eq("stage_id", currentMatch.stage_id)
    .eq("round_number", targetLBRound)
    .eq("match_number", targetMatchNum)
    .single();

  // 4. Update Slot
  if (targetMatch) {
    // Cek apakah slot sudah terisi (safety check)
    // Jika targetSlot sudah ada isinya, jangan timpa (kecuali kita mau force update)
    const canUpdate = targetSlot === "participant_a_id" 
      ? !targetMatch.participant_a_id || targetMatch.participant_a_id === loserId
      : !targetMatch.participant_b_id || targetMatch.participant_b_id === loserId;

    if (canUpdate) {
        const { error } = await supabase
        .from("matches")
        .update({ [targetSlot]: loserId })
        .eq("id", targetMatch.id);

        if (error)
        throw new Error(
            `Gagal memindahkan loser ke Lower Bracket (Round ${targetLBRound}): ${error.message}`
        );
    }
  }
}

/**
 * Khusus Single Elimination: Menangani perebutan juara 3 (Bronze Match).
 * Tidak digunakan di Double Elimination murni.
 */
export async function handleSemiFinalLoser(
  supabase: SupabaseClient,
  currentMatch: Match,
  loserId: string,
  settings: { hasThirdPlace?: boolean }
) {
  // 1. Cek apakah fitur aktif
  if (!settings?.hasThirdPlace) return;

  // 2. Cek apakah ini Semifinal?
  if (!currentMatch.next_match_id) return;

  const { data: nextMatch } = await supabase
    .from("matches")
    .select("round_number, match_number")
    .eq("id", currentMatch.next_match_id)
    .single();

  if (!nextMatch || nextMatch.match_number !== 1) return;

  // 3. Cari Match Bronze (Round yang sama dengan Final, tapi Match #2)
  const bronzeRound = nextMatch.round_number;

  const { data: bronzeMatch } = await supabase
    .from("matches")
    .select("id, participant_a_id, participant_b_id")
    .eq("stage_id", currentMatch.stage_id)
    .eq("round_number", bronzeRound)
    .eq("match_number", 2) 
    .single();

  if (!bronzeMatch) return;

  // 4. Masukkan Loser ke Slot Kosong
  let targetCol = "participant_a_id";
  if (!bronzeMatch.participant_a_id) targetCol = "participant_a_id";
  else if (!bronzeMatch.participant_b_id) targetCol = "participant_b_id";
  else return;

  await supabase
    .from("matches")
    .update({ [targetCol]: loserId })
    .eq("id", bronzeMatch.id);
}

/**
 * Memindahkan pemenang ke match selanjutnya (Advance).
 * Handle logika Grand Final Slot A/B.
 */
export async function advanceParticipant(
  supabase: SupabaseClient,
  currentMatch: Match,
  participantId: string
) {
  // Jika tidak ada next match (misal: ini sudah Grand Final dan juara sudah ditentukan), berhenti.
  if (!currentMatch.next_match_id) return;

  // Ambil data next match untuk tahu dia Round berapa (Penting untuk Grand Final)
  const { data: nextMatchData } = await supabase
     .from("matches")
     .select("round_number")
     .eq("id", currentMatch.next_match_id)
     .single();

  if (!nextMatchData) return;

  let targetCol = "participant_a_id";

  // --- LOGIC GRAND FINAL (Round 999) ---
  if (nextMatchData.round_number === 999) {
      // Jika dari Upper Bracket (Round Positif) -> Masuk Slot A
      if (currentMatch.round_number > 0) {
          targetCol = "participant_a_id";
      } 
      // Jika dari Lower Bracket (Round Negatif) -> Masuk Slot B
      else {
          targetCol = "participant_b_id";
      }
  } 
  // --- LOGIC STANDARD BRACKET ---
  else {
      // Default: Ganjil -> A, Genap -> B
      const isOdd = currentMatch.match_number % 2 !== 0;
      targetCol = isOdd ? "participant_a_id" : "participant_b_id";

      // Special Logic Lower Bracket:
      // Di LB, perpindahan dari Round Genap ke Ganjil (Advance) biasanya masuk ke Slot B,
      // Karena Slot A sudah menunggu 'Drop' dari Upper Bracket.
      if (currentMatch.round_number < 0) {
         const lbRoundAbs = Math.abs(currentMatch.round_number);
         // Jika round saat ini Genap (misal LB R2), next round adalah LB R3 (Ganjil).
         // Winner LB R2 ketemu Loser WB R2.
         // Loser WB biasanya di Slot A (set via dropToLowerBracket).
         // Winner LB harus masuk Slot B.
         if (lbRoundAbs % 2 === 0) {
             targetCol = "participant_b_id";
         } else {
             // Jika round saat ini Ganjil (LB R1 -> LB R2), sesama LB.
             // Kembali ke logic Ganjil/Genap standard.
             targetCol = isOdd ? "participant_a_id" : "participant_b_id";
         }
      }
  }

  // Update Database
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
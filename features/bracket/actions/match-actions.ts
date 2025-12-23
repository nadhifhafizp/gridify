"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Match, Stage } from "@/types/database";
import * as progressionService from "../services/progression-service";

// --- ACTION UTAMA: Update Match (Skor + Nama Tim + Progresi) ---
export async function updateMatchDetails(
  matchId: string,
  scores: { a: number; b: number },
  participants: { id: string; name: string }[], // Data nama tim yang diedit
  tournamentId: string
) {
  const supabase = await createClient();

  try {
    // 1. UPDATE NAMA PESERTA (Fitur Baru)
    // Loop update ke tabel participants jika user mengedit nama
    for (const p of participants) {
      if (p.id && p.name) {
        const { error: pError } = await supabase
          .from("participants")
          .update({ name: p.name })
          .eq("id", p.id);
        
        if (pError) console.error("Error updating participant name:", pError);
      }
    }

    // 2. VALIDASI SKOR
    if (scores.a < 0 || scores.b < 0) {
      return { success: false, error: "Skor tidak boleh negatif" };
    }

    // 3. FETCH MATCH DATA (Join Stages & Settings)
    // Penting: Kita butuh data stages & settings untuk logika progresi bracket
    const { data: matchData, error: fetchError } = await supabase
      .from("matches")
      .select("*, stages(id, type, sequence_order), tournaments(settings)")
      .eq("id", matchId)
      .single();

    if (fetchError || !matchData) {
      return { success: false, error: "Match tidak ditemukan" };
    }

    // Casting Type agar TypeScript aman saat akses properti relasi
    const match = matchData as unknown as Match & {
      stages: Stage;
      tournaments: { settings: { hasThirdPlace?: boolean } };
    };

    // 4. TENTUKAN PEMENANG & STATUS
    let winnerId: string | null = null;
    let loserId: string | null = null;
    let status = "IN_PROGRESS"; // Default jika seri

    // Jika skor tidak seri, kita anggap match selesai (COMPLETED)
    if (scores.a !== scores.b) {
      status = "COMPLETED";
      if (scores.a > scores.b) {
        winnerId = match.participant_a_id;
        loserId = match.participant_b_id;
      } else {
        winnerId = match.participant_b_id;
        loserId = match.participant_a_id;
      }
    }

    // 5. UPDATE MATCH DI DATABASE
    // Kita merge skor lama dengan skor baru
    const currentScores = match.scores as any || {};
    const updatedScores = { ...currentScores, a: scores.a, b: scores.b };
    
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        scores: updatedScores,
        winner_id: winnerId,
        status: status,
      })
      .eq("id", matchId);

    if (updateError) return { success: false, error: updateError.message };

    // 6. JALANKAN SERVICE PROGRESSION (Logika Bracket Otomatis)
    // Bagian ini WAJIB ADA agar bracket lanjut ke babak berikutnya
    const stageType = match.stages?.type;
    const settings = match.tournaments?.settings || {};

    try {
      if (winnerId) {
        // A. Majukan Pemenang (Advance Winner)
        if (match.next_match_id) {
          await progressionService.advanceParticipant(supabase, match, winnerId);
        }

        // B. Lempar Kalah ke Lower Bracket (Double Elim)
        if (
          stageType === "DOUBLE_ELIMINATION" &&
          loserId &&
          match.round_number > 0 &&
          match.round_number < 999
        ) {
          await progressionService.dropToLowerBracket(supabase, match, loserId);
        }

        // C. Bronze Match Logic (Single Elim)
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

      // 7. Cek Penyelesaian Stage (Apakah stage ini sudah selesai semua?)
      await progressionService.checkAndCompleteStage(
        supabase,
        tournamentId,
        match.stage_id,
        match.stages.sequence_order
      );
    } catch (progressionError: any) {
      console.error("Progression Error:", progressionError);
      // Kita log error tapi return success true karena update data utama berhasil
    }

    // 8. REVALIDATE HALAMAN
    revalidatePath(`/dashboard/tournaments/${tournamentId}`);
    revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);

    return { success: true };

  } catch (error) {
    console.error("Failed to update match:", error);
    return { success: false, error: error };
  }
}

// --- ACTION 2: Update Skor Battle Royale (Tetap dipertahankan) ---
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

// --- ACTION 3: Update Peserta Manual (Tetap dipertahankan) ---
export async function updateMatchParticipantAction(
  matchId: string,
  slot: "a" | "b",
  participantId: string | null,
  tournamentId: string
) {
  const supabase = await createClient();
  const columnToUpdate = slot === "a" ? "participant_a_id" : "participant_b_id";

  const { error } = await supabase
    .from("matches")
    .update({ [columnToUpdate]: participantId })
    .eq("id", matchId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/tournaments/${tournamentId}`);
  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);

  return { success: true };
}
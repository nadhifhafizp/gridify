"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { shuffleArray } from "@/features/bracket/utils/bracket-math";
import * as generators from "@/features/bracket/generators";

export async function generateBracketAction(tournamentId: string) {
  const supabase = await createClient();

  // 1. Data Fetching
  const { data: participants } = await supabase
    .from("participants")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("is_verified", true);

  const { data: stage } = await supabase
    .from("stages")
    .select("id, type")
    .eq("tournament_id", tournamentId)
    .order("sequence_order", { ascending: true })
    .limit(1)
    .single();

  if (!participants || participants.length < 2)
    return { success: false, error: "Minimal 2 peserta." };
  if (!stage) return { success: false, error: "Stage tidak ditemukan." };

  // 2. Reset Match Lama (Clean Slate)
  await supabase.from("matches").delete().eq("stage_id", stage.id);

  // 3. Routing Generator
  try {
    const shuffledParticipants = shuffleArray(participants);
    const params = {
      supabase,
      tournamentId,
      stageId: stage.id,
      participants: shuffledParticipants,
    };

    switch (stage.type) {
      case "SINGLE_ELIMINATION":
        await generators.generateSingleElimination(params);
        break;
      case "DOUBLE_ELIMINATION":
        await generators.generateDoubleElimination(params);
        break;
      case "ROUND_ROBIN":
        await generators.generateRoundRobin(params);
        break;
      case "LEADERBOARD":
        await generators.generateBattleRoyale(params);
        break;
      default:
        throw new Error(`Format ${stage.type} belum didukung.`);
    }
  } catch (error: any) {
    console.error("Generator Error:", error);
    return { success: false, error: error.message };
  }

  // 4. Update Status & Revalidate
  await supabase
    .from("tournaments")
    .update({ status: "ONGOING" })
    .eq("id", tournamentId);
  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);

  return { success: true };
}

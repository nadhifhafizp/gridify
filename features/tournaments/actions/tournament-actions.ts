"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

// Helper untuk membersihkan input FormData (Best Practice)
// Mengubah null atau string kosong menjadi undefined agar cocok dengan .optional() Zod
const parseString = (value: FormDataEntryValue | null) => {
  if (!value || value === "") return undefined;
  return value.toString();
};

// 1. Definisikan Schema Validasi
const CreateTournamentSchema = z.object({
  title: z.string().min(3, { message: "Nama turnamen minimal 3 karakter" }),
  gameId: z.string().uuid({ message: "Game ID tidak valid" }),
  formatType: z.enum(
    [
      "SINGLE_ELIMINATION",
      "DOUBLE_ELIMINATION",
      "ROUND_ROBIN",
      "HYBRID_UCL",
      "BATTLE_ROYALE",
    ],
    {
      // FIX ERROR 1: Gunakan 'message' bukan 'errorMap'
      message: "Format turnamen tidak valid",
    }
  ),
  description: z.string().optional(),
  settings: z.string().optional(),
});

export async function createTournamentAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      error: "Unauthorized: Harap login terlebih dahulu",
    };

  // 2. Parsing & Sanitasi Data (FIX: Pakai helper parseString)
  const rawData = {
    title: formData.get("title")?.toString(), // Tetap string untuk required
    gameId: formData.get("gameId")?.toString(),
    formatType: formData.get("formatType")?.toString(),
    // Handle optional fields dengan aman
    description: parseString(formData.get("description")),
    settings: parseString(formData.get("settings")),
  };

  const validatedFields = CreateTournamentSchema.safeParse(rawData);

  // Validasi Error Handling
  if (!validatedFields.success) {
    // FIX ERROR 2: Gunakan 'issues' bukan 'errors'
    return {
      success: false,
      error: validatedFields.error.issues[0].message,
    };
  }

  const { title, gameId, formatType, description, settings } =
    validatedFields.data;
  const settingsJson = settings ? JSON.parse(settings) : {};

  // 3. Logic Database (Sama seperti sebelumnya)
  const { data: gameData } = await supabase
    .from("games")
    .select("genre")
    .eq("id", gameId)
    .single();

  const gameGenre = gameData?.genre || "MOBA";

  const { data: tourney, error: tourneyError } = await supabase
    .from("tournaments")
    .insert({
      owner_id: user.id,
      game_id: gameId,
      title: title,
      description: description || "", // Fallback ke empty string untuk DB
      format_type: formatType,
      status: "DRAFT",
      settings: settingsJson,
    })
    .select()
    .single();

  if (tourneyError) return { success: false, error: tourneyError.message };

  const tournamentId = tourney.id;
  let stagesPayload = [];

  const createStage = (name: string, type: string, order: number) => ({
    tournament_id: tournamentId,
    name,
    type,
    sequence_order: order,
  });

  switch (formatType) {
    case "SINGLE_ELIMINATION":
      stagesPayload.push(createStage("Main Event", "SINGLE_ELIMINATION", 1));
      break;
    case "DOUBLE_ELIMINATION":
      stagesPayload.push(createStage("Playoffs", "DOUBLE_ELIMINATION", 1));
      break;
    case "ROUND_ROBIN":
      stagesPayload.push(createStage("League Phase", "ROUND_ROBIN", 1));
      break;
    case "BATTLE_ROYALE":
      stagesPayload.push(createStage("Match Days", "LEADERBOARD", 1));
      break;
    case "HYBRID_UCL":
      stagesPayload.push(createStage("Group Stage", "ROUND_ROBIN", 1));
      if (gameGenre === "SPORTS") {
        stagesPayload.push(
          createStage("Knockout Phase", "SINGLE_ELIMINATION", 2)
        );
      } else {
        stagesPayload.push(
          createStage("Playoffs (MPL)", "DOUBLE_ELIMINATION", 2)
        );
      }
      break;
    default:
      stagesPayload.push(createStage("Main Event", "SINGLE_ELIMINATION", 1));
  }

  const { error: stageError } = await supabase
    .from("stages")
    .insert(stagesPayload);

  if (stageError) {
    await supabase.from("tournaments").delete().eq("id", tournamentId);
    return {
      success: false,
      error: "Gagal membuat format stage: " + stageError.message,
    };
  }

  redirect(`/dashboard/tournaments/${tournamentId}`);
}

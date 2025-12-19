"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Helper
const parseString = (value: FormDataEntryValue | null) => {
  if (!value || value === "") return undefined;
  return value.toString();
};

// Schema
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
    { message: "Format turnamen tidak valid" }
  ),
  description: z.string().optional(),
  settings: z.string().optional(),
});

export async function createTournamentAction(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized: Harap login terlebih dahulu" };
  }

  // Parsing & Validasi
  const rawData = {
    title: formData.get("title")?.toString(),
    gameId: formData.get("gameId")?.toString(),
    formatType: formData.get("formatType")?.toString(),
    description: parseString(formData.get("description")),
    settings: parseString(formData.get("settings")),
  };

  const validatedFields = CreateTournamentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues[0].message };
  }

  const { title, gameId, formatType, description, settings } = validatedFields.data;
  const settingsJson = settings ? JSON.parse(settings) : {};

  // Ambil Genre Game
  const { data: gameData } = await supabase
    .from("games")
    .select("genre")
    .eq("id", gameId)
    .single();

  const gameGenre = gameData?.genre || "MOBA";

  // Insert Turnamen
  const { data: tourney, error: tourneyError } = await supabase
    .from("tournaments")
    .insert({
      owner_id: user.id,
      game_id: gameId,
      title: title,
      description: description || "",
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

  // Generate Stages
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
        stagesPayload.push(createStage("Knockout Phase", "SINGLE_ELIMINATION", 2));
      } else {
        stagesPayload.push(createStage("Playoffs (MPL)", "DOUBLE_ELIMINATION", 2));
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
    return { success: false, error: "Gagal membuat format stage: " + stageError.message };
  }

  // Revalidate Dashboard
  revalidatePath('/dashboard/tournaments');

  // UPDATE: Return ID dan Success true (JANGAN REDIRECT DI SINI)
  return { success: true, id: tournamentId };
}
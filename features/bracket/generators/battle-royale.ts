import { BracketGeneratorParams, MatchPayload } from "./types";
import {
  distributeTeamsToGroups,
  generateGroupPairs,
} from "../utils/bracket-math";

export async function generateBattleRoyale({
  supabase,
  tournamentId,
  stageId,
  participants,
}: BracketGeneratorParams) {
  // CONFIG
  const MAX_TEAMS_PER_MATCH = 16;
  const TOTAL_MATCH_TARGET = 6;

  const totalTeams = participants.length;
  let matchesPayload: MatchPayload[] = [];
  const groupUpdatePromises: Promise<any>[] = [];

  // --- SKENARIO 1: SINGLE LOBBY (ALL TEAMS) ---
  if (totalTeams <= MAX_TEAMS_PER_MATCH + 2) {
    // Set semua ke grup "All"
    const pIds = participants.map((p) => p.id);
    groupUpdatePromises.push(
      supabase.from("participants").update({ group_name: "All" }).in("id", pIds)
    );

    for (let i = 1; i <= TOTAL_MATCH_TARGET; i++) {
      matchesPayload.push({
        tournament_id: tournamentId,
        stage_id: stageId,
        round_number: 1,
        match_number: i,
        participant_a_id: null,
        participant_b_id: null,
        status: "SCHEDULED",
        scores: { groups: ["All"], results: [] },
      });
    }
  }

  // --- SKENARIO 2: MULTI GROUP ROTATION ---
  else {
    const teamsPerGroupTarget = Math.floor(MAX_TEAMS_PER_MATCH / 2); // 8
    let groupCount = Math.ceil(totalTeams / teamsPerGroupTarget);
    if (groupCount < 3) groupCount = 3;

    // 1. Distribusi Tim
    const groupedTeams = distributeTeamsToGroups(participants, groupCount);

    // 2. Simpan Group Name ke DB
    groupedTeams.forEach((teams, idx) => {
      const groupName = String.fromCharCode(65 + idx); // A, B, C...
      const ids = teams.map((t) => t.id);

      if (ids.length > 0) {
        groupUpdatePromises.push(
          supabase
            .from("participants")
            .update({ group_name: groupName })
            .in("id", ids)
        );
      }
    });

    // 3. Generate Rotasi
    const groupNames = Array.from({ length: groupCount }, (_, i) =>
      String.fromCharCode(65 + i)
    );
    const baseRotation = generateGroupPairs(groupNames);

    // 4. Expand Rotasi (Cycle)
    let scheduledPairs: string[][] = [];
    while (scheduledPairs.length < TOTAL_MATCH_TARGET) {
      scheduledPairs = [...scheduledPairs, ...baseRotation];
    }
    scheduledPairs = scheduledPairs.slice(0, TOTAL_MATCH_TARGET);

    // 5. Create Matches
    scheduledPairs.forEach((pair, idx) => {
      matchesPayload.push({
        tournament_id: tournamentId,
        stage_id: stageId,
        round_number: 1,
        match_number: idx + 1,
        participant_a_id: null,
        participant_b_id: null,
        status: "SCHEDULED",
        scores: { groups: pair, results: [] },
      });
    });
  }

  // EKSEKUSI
  await Promise.all(groupUpdatePromises);

  if (matchesPayload.length > 0) {
    const { error } = await supabase.from("matches").insert(matchesPayload);
    if (error)
      throw new Error("Gagal membuat jadwal Battle Royale: " + error.message);
  }
}

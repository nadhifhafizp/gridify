import { BracketGeneratorParams, MatchPayload } from "./types";
import { getNextPowerOfTwo } from "../utils/bracket-math";

export async function generateSingleElimination({
  supabase,
  tournamentId,
  stageId,
  participants,
}: BracketGeneratorParams) {
  const totalParticipants = participants.length;
  const bracketSize = getNextPowerOfTwo(totalParticipants);
  const totalRounds = Math.log2(bracketSize);

  const matchesPayload: MatchPayload[] = [];

  // 1. Generate Placeholder Matches
  for (let round = 1; round <= totalRounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round);
    for (let i = 1; i <= matchCount; i++) {
      matchesPayload.push({
        tournament_id: tournamentId,
        stage_id: stageId,
        round_number: round,
        match_number: i,
        status: "SCHEDULED",
        participant_a_id: null,
        participant_b_id: null,
        scores: { a: 0, b: 0 },
      });
    }
  }

  // 2. Insert DB
  const { data: createdMatches, error } = await supabase
    .from("matches")
    .insert(matchesPayload)
    .select("id, round_number, match_number");

  if (error) throw new Error(error.message);

  // 3. Mapping & Updates
  const idMap: Record<string, string> = {};
  createdMatches.forEach((m: any) => {
    idMap[`${m.round_number}-${m.match_number}`] = m.id;
  });

  const updates = [];

  // Linking
  for (const m of createdMatches) {
    if (m.round_number < totalRounds) {
      const nextRound = m.round_number + 1;
      const nextMatchNum = Math.ceil(m.match_number / 2);
      const parentId = idMap[`${nextRound}-${nextMatchNum}`];

      updates.push(
        supabase
          .from("matches")
          .update({ next_match_id: parentId })
          .eq("id", m.id)
      );
    }
  }

  // Filling Round 1 (with BYE handling)
  const round1Matches = createdMatches
    .filter((m: any) => m.round_number === 1)
    .sort((a: any, b: any) => a.match_number - b.match_number);

  round1Matches.forEach((m: any, index: number) => {
    const pA = participants[index * 2];
    const pB = participants[index * 2 + 1];
    const isBye = pA && !pB;

    updates.push(
      supabase
        .from("matches")
        .update({
          participant_a_id: pA?.id || null,
          participant_b_id: pB?.id || null,
          status: isBye ? "COMPLETED" : "SCHEDULED",
          winner_id: isBye ? pA.id : null,
          scores: isBye ? { a: 1, b: 0, note: "BYE" } : { a: 0, b: 0 },
        })
        .eq("id", m.id)
    );
  });

  await Promise.all(updates);
}

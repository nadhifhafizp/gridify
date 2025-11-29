import { BracketGeneratorParams, MatchPayload } from "./types";
import { getNextPowerOfTwo } from "../utils/bracket-math";

export async function generateDoubleElimination({
  supabase,
  tournamentId,
  stageId,
  participants,
}: BracketGeneratorParams) {
  const totalParticipants = participants.length;
  // Bracket Size harus pangkat 2 (4, 8, 16, 32)
  const bracketSize = getNextPowerOfTwo(totalParticipants);

  if (bracketSize < 4)
    throw new Error("Double Elimination butuh minimal 3-4 peserta.");

  const wbRounds = Math.log2(bracketSize);
  // Rumus standar ronde LB: (WB - 1) * 2
  // Ditambah 1 ronde Grand Final

  const matchesPayload: MatchPayload[] = [];

  // --- 1. GENERATE UPPER BRACKET (WB) ---
  // Round number positif (1, 2, 3...)
  for (let round = 1; round <= wbRounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round);
    for (let i = 1; i <= matchCount; i++) {
      matchesPayload.push({
        tournament_id: tournamentId,
        stage_id: stageId,
        round_number: round,
        match_number: i,
        participant_a_id: null,
        participant_b_id: null,
        status: "SCHEDULED",
        scores: { a: 0, b: 0 },
      });
    }
  }

  // --- 2. GENERATE LOWER BRACKET (LB) ---
  // Round number negatif (-1, -2, -3...)
  // Struktur LB agak tricky, jumlah match per round tidak selalu /2
  // Pola match count LB (untuk 8 tim): 2, 2, 1, 1
  // Pola match count LB (untuk 16 tim): 4, 4, 2, 2, 1, 1

  const lbTotalRounds = (wbRounds - 1) * 2;
  let currentLBMatchCount = bracketSize / 4; // Start match count untuk LB Round 1

  for (let round = 1; round <= lbTotalRounds; round++) {
    // Setiap 2 ronde, match count dibagi 2.
    // Ronde 1 & 2 punya jumlah match sama. Ronde 3 & 4 punya jumlah match sama (setengahnya).
    if (round > 1 && round % 2 !== 0) {
      currentLBMatchCount /= 2;
    }

    for (let i = 1; i <= currentLBMatchCount; i++) {
      matchesPayload.push({
        tournament_id: tournamentId,
        stage_id: stageId,
        round_number: -round, // Negatif untuk LB
        match_number: i,
        participant_a_id: null,
        participant_b_id: null,
        status: "SCHEDULED",
        scores: { a: 0, b: 0 },
      });
    }
  }

  // --- 3. GENERATE GRAND FINAL ---
  // Round 999
  matchesPayload.push({
    tournament_id: tournamentId,
    stage_id: stageId,
    round_number: 999,
    match_number: 1,
    participant_a_id: null,
    participant_b_id: null,
    status: "SCHEDULED",
    scores: { a: 0, b: 0 },
  });

  // --- 4. BULK INSERT ---
  const { data: createdMatches, error } = await supabase
    .from("matches")
    .insert(matchesPayload)
    .select("id, round_number, match_number");

  if (error) throw new Error(error.message);

  // --- 5. LINKING & FILLING ---
  // Mapping UUID
  const idMap: Record<string, string> = {};
  createdMatches.forEach((m: any) => {
    // Key: "Round|MatchNum" -> Value: ID
    idMap[`${m.round_number}|${m.match_number}`] = m.id;
  });

  const updates = [];

  // A. LINKING UPPER BRACKET (Winner Advance)
  const wbMatches = createdMatches.filter(
    (m: any) => m.round_number > 0 && m.round_number < 999
  );
  for (const m of wbMatches) {
    if (m.round_number < wbRounds) {
      // Normal advance ke next round WB
      const nextRound = m.round_number + 1;
      const nextMatchNum = Math.ceil(m.match_number / 2);
      const nextId = idMap[`${nextRound}|${nextMatchNum}`];
      if (nextId) {
        updates.push(
          supabase
            .from("matches")
            .update({ next_match_id: nextId })
            .eq("id", m.id)
        );
      }
    } else {
      // Winner Final WB -> Grand Final
      const gfId = idMap[`999|1`];
      if (gfId) {
        updates.push(
          supabase
            .from("matches")
            .update({ next_match_id: gfId })
            .eq("id", m.id)
        );
      }
    }
  }

  // B. LINKING LOWER BRACKET (Winner Advance)
  const lbMatches = createdMatches.filter((m: any) => m.round_number < 0);
  for (const m of lbMatches) {
    const currentRoundAbs = Math.abs(m.round_number);

    if (currentRoundAbs < lbTotalRounds) {
      const nextRound = -(currentRoundAbs + 1);
      let nextMatchNum;

      // Logic Advance LB:
      // Jika round ganjil (1, 3...), winner ketemu loser dr WB di round genap berikutnya. Match num tetap/mapped.
      // Jika round genap (2, 4...), winner diadu sesama winner LB. Match num / 2.

      if (currentRoundAbs % 2 !== 0) {
        // Ganjil ke Genap (Match count sama)
        nextMatchNum = m.match_number;
      } else {
        // Genap ke Ganjil (Match count reduced)
        nextMatchNum = Math.ceil(m.match_number / 2);
      }

      const nextId = idMap[`${nextRound}|${nextMatchNum}`];
      if (nextId) {
        updates.push(
          supabase
            .from("matches")
            .update({ next_match_id: nextId })
            .eq("id", m.id)
        );
      }
    } else {
      // Winner Final LB -> Grand Final
      const gfId = idMap[`999|1`];
      if (gfId) {
        updates.push(
          supabase
            .from("matches")
            .update({ next_match_id: gfId })
            .eq("id", m.id)
        );
      }
    }
  }

  // C. FILLING ROUND 1 (WB)
  // Handle BYE logic similar to Single Elim
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

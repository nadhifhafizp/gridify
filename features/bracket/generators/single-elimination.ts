import { BracketGeneratorParams, MatchPayload } from "./types";
import { getNextPowerOfTwo } from "../utils/bracket-math";

export async function generateSingleElimination({
  supabase,
  tournamentId,
  stageId,
  participants,
}: BracketGeneratorParams) {
  // 1. Hitung Ukuran Bracket (Power of 2)
  const totalParticipants = participants.length;
  const bracketSize = getNextPowerOfTwo(totalParticipants);
  const totalRounds = Math.log2(bracketSize);

  const matchesPayload: MatchPayload[] = [];

  // 2. Generate Placeholder Matches (Semua Round)
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
        // FIX: Gunakan empty object {} karena tipe MatchPayload scores wajib object
        scores: {}, 
      });
    }
  }

  // 3. Insert ke Database
  const { data: createdMatches, error } = await supabase
    .from("matches")
    .insert(matchesPayload)
    .select("id, round_number, match_number");

  if (error) throw new Error(error.message);

  // 4. Mapping ID
  const idMap: Record<string, string> = {};
  createdMatches.forEach((m: any) => {
    idMap[`${m.round_number}-${m.match_number}`] = m.id;
  });

  const updates = [];

  // 5. Linking & Filling Round 1
  for (const m of createdMatches) {
    let nextMatchId = null;
    let isOddMatch = m.match_number % 2 !== 0;

    // Logic Linking
    if (m.round_number < totalRounds) {
      const nextRound = m.round_number + 1;
      const nextMatchNum = Math.ceil(m.match_number / 2);
      nextMatchId = idMap[`${nextRound}-${nextMatchNum}`];

      updates.push(
        supabase
          .from("matches")
          .update({ next_match_id: nextMatchId })
          .eq("id", m.id)
      );
    }

    // Logic Filling Round 1
    if (m.round_number === 1) {
      const index = m.match_number - 1;
      const pA = participants[index * 2];
      const pB = participants[index * 2 + 1];

      const isBye = pA && !pB; 

      if (isBye) {
        // --- BYE Logic ---
        updates.push(
          supabase
            .from("matches")
            .update({
              participant_a_id: pA.id,
              participant_b_id: null,
              status: "COMPLETED",
              winner_id: pA.id,
              // FIX: Hapus properti 'note' agar sesuai tipe MatchPayload
              scores: { a: 1, b: 0 }, 
            })
            .eq("id", m.id)
        );

        // Auto Advance ke Ronde 2
        if (nextMatchId) {
          const targetColumn = isOddMatch ? "participant_a_id" : "participant_b_id";
          updates.push(
            supabase
              .from("matches")
              .update({ [targetColumn]: pA.id })
              .eq("id", nextMatchId)
          );
        }

      } else {
        // --- Normal Logic ---
        updates.push(
          supabase
            .from("matches")
            .update({
              participant_a_id: pA?.id || null,
              participant_b_id: pB?.id || null,
              status: "SCHEDULED",
              scores: { a: 0, b: 0 },
            })
            .eq("id", m.id)
        );
      }
    }
  }

  await Promise.all(updates);
}
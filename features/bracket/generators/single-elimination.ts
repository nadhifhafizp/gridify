import { BracketGeneratorParams, MatchPayload } from "./types";
import { getNextPowerOfTwo } from "../utils/bracket-math";

/**
 * HELPER: Membuat urutan seeding standar turnamen.
 * Contoh untuk 8 slot: [1, 8, 4, 5, 2, 7, 3, 6]
 * Ini memastikan Seed 1 (Rank 1) vs Seed 8, Seed 2 vs Seed 7, dst.
 */
function getStandardSeedingOrder(size: number): number[] {
  if (size === 0) return [];
  let rounds = Math.log2(size);
  let order = [1, 2]; // Awal: 1 vs 2

  for (let i = 0; i < rounds - 1; i++) {
    let next = [];
    let sum = order.length * 2 + 1; // Magic number untuk pairing
    for (let val of order) {
      next.push(val);
      next.push(sum - val);
    }
    order = next;
  }
  return order;
}

export async function generateSingleElimination({
  supabase,
  tournamentId,
  stageId,
  participants,
  settings,
}: BracketGeneratorParams) {
  // 1. Hitung Ukuran Bracket
  const totalParticipants = participants.length;
  const bracketSize = getNextPowerOfTwo(totalParticipants);
  const totalRounds = Math.log2(bracketSize);

  // --- LOGIKA SEEDING (VALID) ---
  // Kita gunakan urutan standar (1 vs 16, 2 vs 15) agar bracket seimbang.
  // Seed 1 di Match #1 (Atas), Seed 2 di Match #5 (Bawah/Tengah).
  
  const seedingOrder = getStandardSeedingOrder(bracketSize);
  
  // Mapping urutan ranking ke peserta asli
  // Rank 1 = participants[0], Rank 16 = BYE (jika peserta cuma 14)
  const bracketPool = seedingOrder.map((rank) => {
    if (rank <= totalParticipants) {
      return participants[rank - 1];
    }
    return null; // Slot ini kosong (BYE) karena rank > jumlah peserta
  });
  
  // ------------------------------

  const matchesPayload: MatchPayload[] = [];
  const hasThirdPlace = settings?.hasThirdPlace === true;

  // 2. Generate Match Structure (Placeholders)
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

  // 3. Generate Bronze Match (Match #2 di Final Round)
  if (hasThirdPlace) {
    matchesPayload.push({
      tournament_id: tournamentId,
      stage_id: stageId,
      round_number: totalRounds,
      match_number: 2,
      status: "SCHEDULED",
      participant_a_id: null,
      participant_b_id: null,
      scores: { a: 0, b: 0 },
    });
  }

  // 4. Insert ke Database
  const { data: createdMatches, error } = await supabase
    .from("matches")
    .insert(matchesPayload)
    .select("id, round_number, match_number");

  if (error) throw new Error(error.message);

  // 5. Mapping ID untuk Linking
  const idMap: Record<string, string> = {};
  createdMatches.forEach((m: any) => {
    idMap[`${m.round_number}-${m.match_number}`] = m.id;
  });

  const updates = [];

  // 6. Linking & Filling Round 1
  for (const m of createdMatches) {
    let nextMatchId = null;
    const isOddMatch = m.match_number % 2 !== 0;

    // A. Linking Logic (Path Pemenang)
    // Kecuali Final Round (Bronze match logic terpisah/tidak advance)
    if (m.round_number < totalRounds) {
      const nextRound = m.round_number + 1;
      const nextMatchNum = Math.ceil(m.match_number / 2);
      nextMatchId = idMap[`${nextRound}-${nextMatchNum}`];

      if (nextMatchId) {
        updates.push(
          supabase
            .from("matches")
            .update({ next_match_id: nextMatchId })
            .eq("id", m.id)
        );
      }
    }

    // B. Filling Logic (Hanya Round 1)
    if (m.round_number === 1) {
      const index = m.match_number - 1;
      // bracketPool sudah tersusun rapi: [Match1_P1, Match1_P2, Match2_P1...]
      const pA = bracketPool[index * 2];
      const pB = bracketPool[index * 2 + 1];

      // Cek BYE (Jika pA ada tapi pB null)
      // Note: Algoritma seeding menjamin pA selalu seed lebih tinggi dari pB, 
      // jadi jika ada BYE, pasti pB yang null.
      const isBye = pA && !pB;

      if (isBye) {
        // --- BYE (Auto Win & Auto Advance) ---
        updates.push(
          supabase
            .from("matches")
            .update({
              participant_a_id: pA.id,
              participant_b_id: null,
              status: "COMPLETED",
              winner_id: pA.id,
              scores: { a: 1, b: 0, note: "BYE" },
            })
            .eq("id", m.id)
        );

        // Auto Advance ke Round 2
        if (nextMatchId) {
          const targetColumn = isOddMatch
            ? "participant_a_id"
            : "participant_b_id";
            
          updates.push(
            supabase
              .from("matches")
              .update({ [targetColumn]: pA.id })
              .eq("id", nextMatchId)
          );
        }
      } else {
        // --- Normal Match ---
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
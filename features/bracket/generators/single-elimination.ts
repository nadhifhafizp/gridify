import { BracketGeneratorParams, MatchPayload } from "./types";
import { 
  getNextPowerOfTwo, 
  distributeParticipants, 
  getStandardSeedingOrder,
  shuffleArray 
} from "../utils/bracket-math";

export async function generateSingleElimination({
  supabase,
  tournamentId,
  stageId,
  participants,
  settings,
}: BracketGeneratorParams) {
  
  // 1. [SHUFFLE] Acak peserta dulu agar adil (tidak urut ID)
  let processedParticipants = shuffleArray(participants);

  // 2. [DISTRIBUTE] Sebar peserta multi-slot agar tidak Team Kill
  processedParticipants = distributeParticipants(processedParticipants);

  // 3. [CALCULATE] Hitung ukuran bracket
  const totalParticipants = processedParticipants.length;
  const bracketSize = getNextPowerOfTwo(totalParticipants);
  const totalRounds = Math.log2(bracketSize);

  // 4. [SEEDING] Generate urutan seeding standar (1 vs 16, dll)
  // Peserta hasil distribusi dianggap sebagai "Seed 1, Seed 2..." secara berurutan
  const seedingOrder = getStandardSeedingOrder(bracketSize);
  
  // Map urutan seeding ke objek Peserta
  const bracketPool = seedingOrder.map((rank) => {
    // Jika rank <= jumlah peserta, ambil orangnya
    if (rank <= totalParticipants) {
      return processedParticipants[rank - 1];
    }
    // Jika rank > jumlah peserta, berarti slot ini kosong (BYE)
    return null; 
  });
  
  // ---------------------------------------------------------

  const matchesPayload: MatchPayload[] = [];
  const hasThirdPlace = settings?.hasThirdPlace === true;

  // 5. Generate Match Placeholder (Struktur Tree)
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

  // 6. Generate Bronze Match (Opsional)
  // Ditaruh di Round Terakhir (Match ke-2)
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

  // 7. Insert ke Database
  const { data: createdMatches, error } = await supabase
    .from("matches")
    .insert(matchesPayload)
    .select("id, round_number, match_number");

  if (error) throw new Error(error.message);

  // 8. Linking & Filling Round 1
  const idMap: Record<string, string> = {};
  createdMatches.forEach((m: any) => {
    idMap[`${m.round_number}-${m.match_number}`] = m.id;
  });

  const updates = [];

  for (const m of createdMatches) {
    let nextMatchId = null;
    const isOddMatch = m.match_number % 2 !== 0;

    // A. LINKING: Sambungkan ke match berikutnya
    // (Kecuali Final Round, logika Bronze terpisah)
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

    // B. FILLING: Isi peserta Round 1 dari bracketPool
    if (m.round_number === 1) {
      const index = m.match_number - 1;
      
      const pA = bracketPool[index * 2];
      const pB = bracketPool[index * 2 + 1];

      // Cek BYE: Dalam seeding standard, jika ada BYE, pasti pB yang kosong
      const isBye = pA && !pB;

      if (isBye) {
        // --- BYE LOGIC ---
        // 1. Set Status COMPLETED
        // 2. Set Winner = pA
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

        // 3. Auto Advance ke Round 2 (Langsung Update Next Match)
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
        // --- NORMAL MATCH ---
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
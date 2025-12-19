import { BracketGeneratorParams, MatchPayload } from "./types";
import { getNextPowerOfTwo } from "../utils/bracket-math";

export async function generateSingleElimination({
  supabase,
  tournamentId,
  stageId,
  participants,
}: BracketGeneratorParams) {
  // 1. Hitung Ukuran Bracket
  const totalParticipants = participants.length;
  const bracketSize = getNextPowerOfTwo(totalParticipants); // Akan jadi 16 jika peserta 12
  const totalRounds = Math.log2(bracketSize);
  const byeCount = bracketSize - totalParticipants; // 16 - 12 = 4 BYE

  // --- REVISI PAIRING LOGIC (SEEDING) ---
  // Kita harus pasangkan BYE dengan Player agar tidak ada Match kosong vs kosong.
  // Strategi: Berikan BYE ke peserta teratas (Seed 1-4)
  
  const bracketPool: (typeof participants[0] | null)[] = [];
  
  // Ambil peserta yang beruntung dapat BYE
  const byePlayers = participants.slice(0, byeCount);
  
  // Ambil peserta sisanya yang harus bertanding (Fighting)
  const fightingPlayers = participants.slice(byeCount);
  
  // A. Masukkan Match BYE ke Pool (Format: Player, Null)
  byePlayers.forEach(p => {
    bracketPool.push(p);
    bracketPool.push(null); // Lawannya kosong
  });
  
  // B. Masukkan Match Fight ke Pool (Format: Player, Player)
  fightingPlayers.forEach(p => {
    bracketPool.push(p);
  });
  
  // Sekarang bracketPool berisi 16 item yang sudah terurut pair-nya.
  // ----------------------------------------

  const matchesPayload: MatchPayload[] = [];

  // 2. Generate Placeholder Matches
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

    // A. Linking Logic
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

    // B. Filling Logic (Pakai bracketPool yang baru)
    if (m.round_number === 1) {
      const index = m.match_number - 1;
      // Ambil dari pool yang sudah kita susun rapi di atas
      const pA = bracketPool[index * 2];
      const pB = bracketPool[index * 2 + 1];

      const isBye = pA && !pB; 

      if (isBye) {
        // --- BYE (Auto Win) ---
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
          const targetColumn = isOddMatch ? "participant_a_id" : "participant_b_id";
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
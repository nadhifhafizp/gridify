import { BracketGeneratorParams, MatchPayload } from "./types";
import { getNextPowerOfTwo } from "../utils/bracket-math";

export async function generateDoubleElimination({
  supabase,
  tournamentId,
  stageId,
  participants,
}: BracketGeneratorParams) {
  const totalParticipants = participants.length;
  // Esports Standard: Bracket size harus pangkat 2 (4, 8, 16, 32).
  // Sisa slot akan menjadi BYE.
  const bracketSize = getNextPowerOfTwo(totalParticipants);

  if (bracketSize < 4)
    throw new Error("Double Elimination format Esports membutuhkan minimal 4 slot.");

  const wbRounds = Math.log2(bracketSize);
  // Rumus standar Esports: Total round LB = (WB Rounds - 1) * 2
  const lbTotalRounds = (wbRounds - 1) * 2;

  const matchesPayload: MatchPayload[] = [];

  // --- 1. GENERATE UPPER BRACKET (WB) ---
  // Round 1 sampai WB Final
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
  // Format standar: Losers dari WB turun bertahap
  let currentLBMatchCount = bracketSize / 4; 

  for (let round = 1; round <= lbTotalRounds; round++) {
    // Pola Match Count LB: 
    // Round 1 (vs Loser WB R1): N/4
    // Round 2 (Winner LB R1 vs Winner LB R1): N/4
    // Round 3 (vs Loser WB R2): N/8
    // Round 4: N/8
    // dst...
    if (round > 1 && round % 2 !== 0) {
      currentLBMatchCount /= 2;
    }

    for (let i = 1; i <= currentLBMatchCount; i++) {
      matchesPayload.push({
        tournament_id: tournamentId,
        stage_id: stageId,
        round_number: -round, // LB menggunakan angka negatif
        match_number: i,
        participant_a_id: null,
        participant_b_id: null,
        status: "SCHEDULED",
        scores: { a: 0, b: 0 },
      });
    }
  }

  // --- 3. GENERATE GRAND FINAL (Esports Style) ---
  // Round 999: Winner WB Final vs Winner LB Final
  // Hanya 1 match (Tanpa Bracket Reset)
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

  // --- 4. INSERT KE DATABASE ---
  const { data: createdMatches, error } = await supabase
    .from("matches")
    .insert(matchesPayload)
    .select("id, round_number, match_number");

  if (error) throw new Error(error.message);

  // --- 5. LINKING LOGIC (Penyambungan Alur) ---
  const idMap: Record<string, string> = {};
  createdMatches.forEach((m: any) => {
    idMap[`${m.round_number}|${m.match_number}`] = m.id;
  });

  const updates = [];
  const grandFinalId = idMap[`999|1`];

  // A. UPPER BRACKET FLOW (Menang Lanjut, Kalah Turun ke LB)
  const wbMatches = createdMatches.filter((m: any) => m.round_number > 0 && m.round_number < 999);
  
  for (const m of wbMatches) {
    // 1. Logic Pemenang (Advance ke Next WB Round)
    if (m.round_number < wbRounds) {
      const nextRound = m.round_number + 1;
      const nextMatchNum = Math.ceil(m.match_number / 2);
      const nextId = idMap[`${nextRound}|${nextMatchNum}`];
      
      if (nextId) {
        updates.push(
          supabase.from("matches").update({ next_match_id: nextId }).eq("id", m.id)
        );
      }
    } else {
      // Winner WB Final -> Masuk Slot A Grand Final
      if (grandFinalId) {
        updates.push(
          supabase.from("matches").update({ next_match_id: grandFinalId }).eq("id", m.id)
        );
      }
    }

    // 2. Logic Kalah (Drop ke Lower Bracket)
    // Rumus Drop Down Standar:
    // WB Round 1 kalah -> LB Round 1
    // WB Round 2 kalah -> LB Round 3
    // WB Round 3 kalah -> LB Round 5
    // Rumus: LB Round target = (WB Round * 2) - 1
    const lbDropRound = (m.round_number * 2) - 1;
    const lbDropMatchNum = m.match_number; // Mapping sederana (bisa di-cross jika perlu advanced seeding)
    
    // Khusus WB Final (Round terakhir WB), yang kalah masuk ke LB Final (Round terakhir LB)
    let finalLbRound = -lbDropRound;
    
    // Cek apakah LB round tersebut ada (validasi safety)
    // Jika WB Final kalah, dia drop ke LB Final (Round terakhir LB)
    if (m.round_number === wbRounds) {
        finalLbRound = -lbTotalRounds; 
    }

    const loserNextId = idMap[`${finalLbRound}|${Math.ceil(lbDropMatchNum)}`] || idMap[`${finalLbRound}|1`]; // Fallback simple
    
    // Kita butuh field baru di DB 'loser_next_match_id' sebenarnya untuk otomatisasi penuh,
    // tapi karena struktur DB sekarang mungkin belum support, logic ini biasanya
    // di-handle di 'progression-service.ts' saat input skor.
    // DISINI KITA HANYA SIAPKAN JALUR MENANG DULU AGAR VISUALISASI NYAMBUNG.
    // (Penting: Pastikan progression-service menghandle logic 'loser' bracket)
  }

  // B. LOWER BRACKET FLOW
  const lbMatches = createdMatches.filter((m: any) => m.round_number < 0);
  
  for (const m of lbMatches) {
    const currentRoundAbs = Math.abs(m.round_number);
    
    if (currentRoundAbs < lbTotalRounds) {
      const nextRound = -(currentRoundAbs + 1);
      let nextMatchNum;

      // Logic Advance LB:
      if (currentRoundAbs % 2 !== 0) {
        // Ganjil ke Genap (Match count sama, peserta dari WB masuk sini)
        nextMatchNum = m.match_number; 
      } else {
        // Genap ke Ganjil (Match count berkurang, sesama LB bertarung)
        nextMatchNum = Math.ceil(m.match_number / 2); 
      }

      const nextId = idMap[`${nextRound}|${nextMatchNum}`];
      if (nextId) {
        updates.push(supabase.from("matches").update({ next_match_id: nextId }).eq("id", m.id));
      }
    } else {
      // Winner LB Final -> Masuk Slot B Grand Final
      if (grandFinalId) {
        updates.push(supabase.from("matches").update({ next_match_id: grandFinalId }).eq("id", m.id));
      }
    }
  }

  // C. FILLING ROUND 1 (Seeding & BYE)
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
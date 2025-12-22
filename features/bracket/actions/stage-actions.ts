"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
// PENTING: Import generator Double Elimination
import { generateDoubleElimination } from "../generators/double-elimination";

// Tipe data untuk statistik tim di klasemen
type TeamStats = {
  id: string;
  name: string;
  group: string;
  points: number;
  gd: number;
  gf: number;
};

export async function advanceToKnockoutAction(tournamentId: string) {
  const supabase = await createClient();

  // 1. Ambil Stage Grup (Round Robin) saat ini
  const { data: currentStage } = await supabase
    .from("stages")
    .select("id, sequence_order")
    .eq("tournament_id", tournamentId)
    .eq("type", "ROUND_ROBIN")
    .single();

  if (!currentStage)
    return { success: false, error: "Stage grup tidak ditemukan." };

  // 2. Ambil Stage Selanjutnya (Target Knockout)
  const { data: nextStage } = await supabase
    .from("stages")
    .select("id, type")
    .eq("tournament_id", tournamentId)
    .gt("sequence_order", currentStage.sequence_order)
    .order("sequence_order", { ascending: true })
    .limit(1)
    .single();

  if (!nextStage)
    return { success: false, error: "Tidak ada stage playoff selanjutnya." };

  // 3. Ambil Hasil Pertandingan Grup yang sudah selesai
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("stage_id", currentStage.id)
    .eq("status", "COMPLETED");

  if (!matches || matches.length === 0)
    return { success: false, error: "Belum ada pertandingan yang selesai." };

  // 4. Hitung Klasemen (Standings Logic)
  const standings: Record<string, TeamStats> = {};

  // Mapping Peserta ke Grup untuk referensi nama & grup
  const { data: participants } = await supabase
    .from("participants")
    .select("id, name, group_name")
    .eq("tournament_id", tournamentId);

  const pMap: Record<string, { name: string; group: string }> = {};
  participants?.forEach((p) => {
    pMap[p.id] = { name: p.name, group: p.group_name || "League" };
  });

  // Helper update stats
  const update = (id: string, pts: number, gd: number, gf: number) => {
    if (!standings[id]) {
      standings[id] = {
        id,
        name: pMap[id]?.name || "TBD",
        group: pMap[id]?.group || "League",
        points: 0,
        gd: 0,
        gf: 0,
      };
    }
    standings[id].points += pts;
    standings[id].gd += gd;
    standings[id].gf += gf;
  };

  // Iterasi setiap match result untuk hitung poin
  matches.forEach((m) => {
    const sA = m.scores?.a || 0;
    const sB = m.scores?.b || 0;

    // Pastikan kedua peserta ada (bukan BYE)
    if (m.participant_a_id && m.participant_b_id) {
      // Poin: Menang 3, Seri 1, Kalah 0
      const ptsA = sA > sB ? 3 : sA === sB ? 1 : 0;
      const ptsB = sB > sA ? 3 : sB === sA ? 1 : 0;

      update(m.participant_a_id, ptsA, sA - sB, sA);
      update(m.participant_b_id, ptsB, sB - sA, sB);
    }
  });

  // 5. Tentukan Kualifikasi (Top 2 Per Grup)
  const groups: Record<string, TeamStats[]> = {};

  // Kelompokkan standings berdasarkan nama grup
  Object.values(standings).forEach((s) => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  // FIX 1: Tambahkan 'name' ke tipe data qualifiers agar bisa dibaca nanti
  const qualifiers: { id: string; name: string; group: string; rank: number }[] = [];

  // Loop setiap grup untuk mencari juara & runner up
  Object.keys(groups).forEach((gName) => {
    // Sortir Klasemen: Points > GD (Goal Difference) > GF (Goal For)
    const sortedGroup = groups[gName].sort(
      (a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf
    );

    // Ambil Juara (Rank 1)
    if (sortedGroup[0]) qualifiers.push({ ...sortedGroup[0], rank: 1 });
    // Ambil Runner Up (Rank 2)
    if (sortedGroup[1]) qualifiers.push({ ...sortedGroup[1], rank: 2 });
  });

  if (qualifiers.length < 2) {
    return {
      success: false,
      error: "Tidak cukup tim yang lolos kualifikasi untuk membuat bracket.",
    };
  }

  // 6. Generate Bracket Knockout (Stage 2)
  // Bersihkan match lama di stage target (Clean Slate) agar tidak duplikat
  await supabase.from("matches").delete().eq("stage_id", nextStage.id);

  try {
    // SKENARIO 1: SINGLE ELIMINATION (Fitur Lama Tetap Ada)
    if (nextStage.type === "SINGLE_ELIMINATION") {
      const rank1Teams = qualifiers.filter((q) => q.rank === 1);
      const rank2Teams = qualifiers.filter((q) => q.rank === 2);

      // Ambil jumlah match berdasarkan pasangan terkecil
      const matchCount = Math.min(rank1Teams.length, rank2Teams.length);

      // Pairing Manual: Juara Grup vs Runner Up Grup Lain
      for (let i = 0; i < matchCount; i++) {
        const teamA = rank1Teams[i];
        const teamB =
          rank2Teams.find((t) => t.group !== teamA.group) || rank2Teams[i];

        const bIndex = rank2Teams.indexOf(teamB);
        if (bIndex > -1) rank2Teams.splice(bIndex, 1);

        await supabase.from("matches").insert({
          tournament_id: tournamentId,
          stage_id: nextStage.id,
          round_number: 1, // Round 1 Stage Knockout
          match_number: i + 1,
          participant_a_id: teamA.id,
          participant_b_id: teamB.id,
          status: "SCHEDULED",
          scores: { a: 0, b: 0 },
        });
      }
    }

    // SKENARIO 2: DOUBLE ELIMINATION (YANG DIPERBAIKI)
    else if (nextStage.type === "DOUBLE_ELIMINATION") {
      
      // A. SIAPKAN URUTAN PESERTA (SEEDING)
      // Logika: Juara Grup A vs Runner Up Grup B (Cross Seeding)
      const rank1 = qualifiers.filter(q => q.rank === 1);
      const rank2 = qualifiers.filter(q => q.rank === 2);
      
      // FIX 2: Definisi tipe data eksplisit agar TypeScript tidak error (any[])
      const seededParticipants: { id: string; name: string }[] = [];

      for (let i = 0; i < rank1.length; i++) {
        const team1 = rank1[i];
        // Cari lawan Runner Up dari grup yang BERBEDA
        let team2 = rank2.find(t => t.group !== team1.group);
        
        // Fallback: Jika tidak ketemu (misal grup cuma 1), ambil sembarang runner up
        if (!team2) {
             // Pastikan team2 belum masuk seededParticipants
             team2 = rank2.find(t => !seededParticipants.some((p) => p.id === t.id));
        }

        // FIX 3: Masukkan 'name' ke dalam object (sebelumnya hanya id)
        if (team1) seededParticipants.push({ id: team1.id, name: team1.name });
        if (team2) seededParticipants.push({ id: team2.id, name: team2.name });
        
        // Tandai team2 sudah dipakai
        if (team2) {
            const idx = rank2.findIndex(r => r.id === team2?.id);
            if (idx > -1) rank2.splice(idx, 1);
        }
      }

      // Masukkan sisa tim (jika ada ganjil/sisa)
      rank2.forEach(t => seededParticipants.push({ id: t.id, name: t.name }));

      // B. PANGGIL GENERATOR UTAMA
      // Ini bagian penting yang sebelumnya hilang. 
      // Generator akan membuat Upper Bracket, Lower Bracket, dan Finals lengkap.
      await generateDoubleElimination({
        supabase,
        tournamentId,
        stageId: nextStage.id,
        participants: seededParticipants, // Kirim peserta yang sudah diurutkan dengan nama
      });
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);
  return { success: true };
}
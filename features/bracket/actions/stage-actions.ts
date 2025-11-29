"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
    // Default group name 'League' jika null
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

  const qualifiers: { id: string; group: string; rank: number }[] = [];

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
  // Bersihkan match lama di stage target (Clean Slate)
  await supabase.from("matches").delete().eq("stage_id", nextStage.id);

  try {
    // SKENARIO 1: SINGLE ELIMINATION (Standard UCL Knockout)
    if (nextStage.type === "SINGLE_ELIMINATION") {
      const rank1Teams = qualifiers.filter((q) => q.rank === 1);
      const rank2Teams = qualifiers.filter((q) => q.rank === 2);

      // Ambil jumlah match berdasarkan pasangan terkecil
      const matchCount = Math.min(rank1Teams.length, rank2Teams.length);

      // Buat Round 1 Knockout (Misal: Semifinal atau Quarter Final)
      // Kita lakukan pairing manual di sini agar Juara Grup vs Runner Up Grup Lain
      for (let i = 0; i < matchCount; i++) {
        const teamA = rank1Teams[i];

        // Cari lawan: Runner Up dari grup yang BERBEDA
        // Jika tidak ada, terpaksa ambil yang index sama
        const teamB =
          rank2Teams.find((t) => t.group !== teamA.group) || rank2Teams[i];

        // Hapus teamB dari pool agar tidak dipilih dua kali
        const bIndex = rank2Teams.indexOf(teamB);
        if (bIndex > -1) rank2Teams.splice(bIndex, 1);

        // Insert Match
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

      // Note: Untuk membuat full tree bracket sampai final, idealnya kita memanggil
      // generator 'generateSingleElimination' dengan input 'qualifiers' sebagai peserta.
      // Namun untuk MVP Hybrid, pairing manual 1 ronde ini sudah cukup fungsional.
    }

    // SKENARIO 2: DOUBLE ELIMINATION (Playoff MPL)
    else if (nextStage.type === "DOUBLE_ELIMINATION") {
      // Logic serupa, masukkan qualifiers ke Upper Bracket Round 1
      // Implementasi disederhanakan untuk MVP: Pair Rank 1 vs Rank 2
      for (let i = 0; i < qualifiers.length / 2; i++) {
        const p1 = qualifiers[i * 2];
        const p2 = qualifiers[i * 2 + 1];

        if (p1 && p2) {
          await supabase.from("matches").insert({
            tournament_id: tournamentId,
            stage_id: nextStage.id,
            round_number: 1, // Upper Bracket R1
            match_number: i + 1,
            participant_a_id: p1.id,
            participant_b_id: p2.id,
            status: "SCHEDULED",
            scores: { a: 0, b: 0 },
          });
        }
      }
      // Generate sisa struktur bracket kosong (LB & Finals) bisa ditambahkan di sini
      // atau memanggil generator Double Elim
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`);
  return { success: true };
}

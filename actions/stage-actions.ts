'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type TeamStats = { id: string; points: number; gd: number; gf: number; group: string }

export async function advanceToKnockoutAction(tournamentId: string) {
  const supabase = await createClient()

  // 1. Ambil Stage Grup (Round Robin)
  const { data: currentStage } = await supabase
    .from('stages')
    .select('id, sequence_order')
    .eq('tournament_id', tournamentId)
    .eq('type', 'ROUND_ROBIN')
    .single()

  if (!currentStage) return { success: false, error: 'Stage grup tidak ditemukan.' }

  // 2. Ambil Stage Selanjutnya (Target)
  const { data: nextStage } = await supabase
    .from('stages')
    .select('id, type')
    .eq('tournament_id', tournamentId)
    .gt('sequence_order', currentStage.sequence_order)
    .order('sequence_order', { ascending: true })
    .limit(1)
    .single()

  if (!nextStage) return { success: false, error: 'Tidak ada stage playoff.' }

  // 3. Ambil Match Grup Selesai
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('stage_id', currentStage.id)
    .eq('status', 'COMPLETED')

  if (!matches || matches.length === 0) return { success: false, error: 'Belum ada pertandingan selesai.' }

  // 4. HITUNG KLASEMEN
  const standings: Record<string, TeamStats> = {}
  
  // Mapping Participant ke Grup
  const { data: participants } = await supabase.from('participants').select('id, group_name').eq('tournament_id', tournamentId)
  const pMap: Record<string, string> = {}
  participants?.forEach(p => pMap[p.id] = p.group_name || 'League')

  const update = (id: string, group: string, pts: number, gd: number, gf: number) => {
    if (!standings[id]) standings[id] = { id, points: 0, gd: 0, gf: 0, group }
    standings[id].points += pts; standings[id].gd += gd; standings[id].gf += gf
  }

  matches.forEach(m => {
    const sA = m.scores.a; const sB = m.scores.b
    const grp = pMap[m.participant_a_id]
    update(m.participant_a_id, grp, sA > sB ? 3 : sA === sB ? 1 : 0, sA - sB, sA)
    update(m.participant_b_id, grp, sB > sA ? 3 : sB === sA ? 1 : 0, sB - sA, sB)
  })

  // 5. AMBIL QUALIFIERS (Top 2 Per Grup)
  const qualifiers: Record<string, { winner: string, runnerUp: string }> = {}
  const groups: Record<string, TeamStats[]> = {}
  
  Object.values(standings).forEach(s => { 
    if(!groups[s.group]) groups[s.group] = []
    groups[s.group].push(s) 
  })

  Object.keys(groups).forEach(gName => {
    // Sortir: Poin > GD > GF
    groups[gName].sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
    if (groups[gName].length >= 2) {
      qualifiers[gName] = { winner: groups[gName][0].id, runnerUp: groups[gName][1].id }
    }
  })

  // Reset match lama di stage target sebelum generate baru
  await supabase.from('matches').delete().eq('stage_id', nextStage.id)

  const groupNames = Object.keys(qualifiers).sort()
  
  if (!groupNames.includes('A') || !groupNames.includes('B')) {
    return { success: false, error: 'Minimal harus ada Grup A dan Grup B untuk lanjut.' }
  }

  // 6. GENERATE BRACKET DENGAN LINKING (Cross Pairing)
  
  // --- SKENARIO 1: SINGLE ELIMINATION (eFootball) ---
  if (nextStage.type === 'SINGLE_ELIMINATION') {
    // A. Buat FINAL Dulu (Round 2) untuk dapat ID-nya
    const finalMatchId = await createKnockoutMatch(
      supabase, tournamentId, nextStage.id, 2, 1, null, null, null
    )

    // B. Buat SEMIFINAL (Round 1) dan link ke Final
    // Match 1: Juara A vs Runner Up B -> Lari ke Final
    await createKnockoutMatch(
      supabase, tournamentId, nextStage.id, 1, 1, 
      qualifiers['A'].winner, qualifiers['B'].runnerUp, 
      finalMatchId // <-- LINK KE FINAL
    )

    // Match 2: Juara B vs Runner Up A -> Lari ke Final
    await createKnockoutMatch(
      supabase, tournamentId, nextStage.id, 1, 2, 
      qualifiers['B'].winner, qualifiers['A'].runnerUp, 
      finalMatchId // <-- LINK KE FINAL
    )
  } 
  
  // --- SKENARIO 2: DOUBLE ELIMINATION (MLBB/MPL) ---
  else if (nextStage.type === 'DOUBLE_ELIMINATION') {
    // Struktur Sederhana MPL (4 Tim Lolos):
    // R1 Upper (2 Match) -> R2 Upper (Final Upper)
    // R1 Lower (1 Match, kalah dari R1 Upper)
    // R2 Lower (Final Lower: Menang R1 Lower vs Kalah R2 Upper)
    // Grand Final (Menang Upper vs Menang Lower)

    // Note: Untuk Double Elim yang linking-nya kompleks, kita buat struktur dasarnya saja.
    // Logic advance winner/loser nanti ditangani 'updateMatchScoreAction'.
    
    // 1. Upper Bracket (Round 1 & 2)
    await createKnockoutMatch(supabase, tournamentId, nextStage.id, 1, 1, qualifiers['A'].winner, qualifiers['B'].runnerUp, null)
    await createKnockoutMatch(supabase, tournamentId, nextStage.id, 1, 2, qualifiers['B'].winner, qualifiers['A'].runnerUp, null)
    await createKnockoutMatch(supabase, tournamentId, nextStage.id, 2, 1, null, null, null)

    // 2. Lower Bracket (Round Negatif)
    await createKnockoutMatch(supabase, tournamentId, nextStage.id, -1, 1, null, null, null)
    await createKnockoutMatch(supabase, tournamentId, nextStage.id, -2, 1, null, null, null)

    // 3. Grand Final (Round 999)
    await createKnockoutMatch(supabase, tournamentId, nextStage.id, 999, 1, null, null, null)
  }

  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`)
  return { success: true }
}

// --- HELPER CREATE MATCH (DIPERBAIKI) ---
// Sekarang menerima parameter `nextMatchId` agar match bisa tersambung
async function createKnockoutMatch(
  supabase: any, 
  tId: string, 
  sId: string, 
  round: number, 
  matchNum: number, 
  pA: string | null, 
  pB: string | null,
  nextMatchId: string | null // Parameter baru
) {
  const { data, error } = await supabase.from('matches').insert({
    tournament_id: tId, 
    stage_id: sId, 
    round_number: round, 
    match_number: matchNum,
    participant_a_id: pA, 
    participant_b_id: pB, 
    next_match_id: nextMatchId, // Simpan link ke database
    status: 'SCHEDULED'
  }).select('id').single()

  if (error) console.error('Error creating match:', error)
  return data?.id // Return ID agar bisa dipakai oleh match sebelumnya
}
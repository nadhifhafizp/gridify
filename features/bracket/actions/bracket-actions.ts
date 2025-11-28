'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function generateBracketAction(tournamentId: string) {
  const supabase = await createClient()

  // 1. Ambil data peserta yang sah
  const { data: participants } = await supabase
    .from('participants')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('is_verified', true)

  if (!participants || participants.length < 2) {
    return { success: false, error: 'Minimal butuh 2 peserta.' }
  }

  // 2. Cek Info Turnamen (Untuk tahu Format detilnya)
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('format_type')
    .eq('id', tournamentId)
    .single()

  // 3. Cek Stage Aktif
  const { data: stage } = await supabase
    .from('stages')
    .select('id, type')
    .eq('tournament_id', tournamentId)
    .order('sequence_order', { ascending: true })
    .limit(1)
    .single()

  if (!stage) return { success: false, error: 'Stage tidak ditemukan.' }

  // 4. Reset Match Lama di Stage ini (Bersih-bersih sebelum generate ulang)
  await supabase.from('matches').delete().eq('stage_id', stage.id)

  // 5. ROUTING GENERATOR (Pilih mesin generator sesuai jenis stage)
  try {
    if (stage.type === 'SINGLE_ELIMINATION') {
      await generateSingleElimination(supabase, tournamentId, stage.id, participants)
    } 
    else if (stage.type === 'DOUBLE_ELIMINATION') {
      await generateDoubleElimination(supabase, tournamentId, stage.id, participants)
    }
    else if (stage.type === 'ROUND_ROBIN') {
      await generateGroupStage(supabase, tournamentId, stage.id, participants, tournament?.format_type)
    } 
    // 👇 TAMBAHAN BARU: LEADERBOARD (BATTLE ROYALE)
    else if (stage.type === 'LEADERBOARD') {
      await generateBattleRoyale(supabase, tournamentId, stage.id)
    }
    else {
      return { success: false, error: `Format ${stage.type} belum didukung generator.` }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }

  // 6. Update Status Turnamen jadi ONGOING
  await supabase.from('tournaments').update({ status: 'ONGOING' }).eq('id', tournamentId)
  
  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`)
  return { success: true }
}

// ==========================================
// LOGIC 1: SINGLE ELIMINATION (Sistem Gugur)
// ==========================================
async function generateSingleElimination(supabase: any, tournamentId: string, stageId: string, participants: any[]) {
  const shuffled = participants.sort(() => Math.random() - 0.5)
  const totalTeams = shuffled.length
  
  // Validasi Power of Two (4, 8, 16, 32...)
  if ((totalTeams & (totalTeams - 1)) !== 0) {
    throw new Error(`Jumlah peserta (${totalTeams}) harus kelipatan pangkat 2 (4, 8, 16) untuk Bracket.`)
  }

  const totalRounds = Math.ceil(Math.log2(totalTeams))
  let nextRoundMatchIds: string[] = []

  // Loop mundur dari Final ke Round 1
  for (let round = totalRounds; round >= 1; round--) {
    const matchesInThisRound = Math.pow(2, totalRounds - round)
    const currentRoundMatchIds: string[] = []

    for (let i = 0; i < matchesInThisRound; i++) {
      // Tentukan parent (Next Match)
      const parentMatchId = nextRoundMatchIds.length > 0 ? nextRoundMatchIds[Math.floor(i / 2)] : null
      
      let payload: any = {
        tournament_id: tournamentId,
        stage_id: stageId,
        round_number: round,
        match_number: i + 1,
        next_match_id: parentMatchId,
        status: 'SCHEDULED'
      }

      // Jika Round 1, isi pesertanya
      if (round === 1) {
        payload.participant_a_id = shuffled[i * 2].id
        payload.participant_b_id = shuffled[i * 2 + 1].id
      }

      const { data: match } = await supabase.from('matches').insert(payload).select('id').single()
      currentRoundMatchIds.push(match.id)
    }
    nextRoundMatchIds = currentRoundMatchIds
  }
}

// ==========================================
// LOGIC 2: DOUBLE ELIMINATION (Upper & Lower)
// ==========================================
async function generateDoubleElimination(supabase: any, tournamentId: string, stageId: string, participants: any[]) {
  const shuffled = participants.sort(() => Math.random() - 0.5)
  const totalTeams = shuffled.length
  
  if ((totalTeams & (totalTeams - 1)) !== 0) {
    throw new Error(`Double Elim butuh peserta kelipatan 2 (4, 8, 16). Saat ini: ${totalTeams}`)
  }

  // 1. UPPER BRACKET (WB) - Round Positif
  const totalRoundsWB = Math.log2(totalTeams)
  
  for (let round = 1; round <= totalRoundsWB; round++) {
    const matchesCount = totalTeams / Math.pow(2, round)
    
    for (let i = 0; i < matchesCount; i++) {
      let payload: any = {
        tournament_id: tournamentId,
        stage_id: stageId,
        round_number: round, // Positif = Upper
        match_number: i + 1,
        status: 'SCHEDULED'
      }

      // Isi peserta di Round 1 WB
      if (round === 1) {
        payload.participant_a_id = shuffled[i * 2].id
        payload.participant_b_id = shuffled[i * 2 + 1].id
      }

      await supabase.from('matches').insert(payload)
    }
  }

  // 2. LOWER BRACKET (LB) - Round Negatif
  const totalRoundsLB = (totalRoundsWB - 1) * 2
  
  for (let round = 1; round <= totalRoundsLB; round++) {
    // Hitung jumlah match di ronde LB (Simplified logic for visual structure)
    const matchesCount = Math.ceil(totalTeams / Math.pow(2, Math.ceil((round + 1) / 2) + 1))
    
    for (let i = 0; i < matchesCount; i++) {
      await supabase.from('matches').insert({
        tournament_id: tournamentId,
        stage_id: stageId,
        round_number: -round, // Negatif = Lower
        match_number: i + 1,
        status: 'SCHEDULED'
      })
    }
  }

  // 3. GRAND FINAL (Round 999)
  await supabase.from('matches').insert({
    tournament_id: tournamentId,
    stage_id: stageId,
    round_number: 999, 
    match_number: 1,
    status: 'SCHEDULED'
  })
}

// ==========================================
// LOGIC 3: ROUND ROBIN & GROUP STAGE (Liga)
// ==========================================
async function generateGroupStage(supabase: any, tournamentId: string, stageId: string, participants: any[], formatType: string) {
  let groups: any[][] = []
  const shuffled = participants.sort(() => Math.random() - 0.5)

  // A. PEMBAGIAN GRUP
  if (formatType === 'ROUND_ROBIN') {
    // Liga Murni = 1 Grup Besar
    await updateGroupNames(supabase, shuffled, 'League')
    groups.push(shuffled)
  } 
  else {
    // UCL / Hybrid = Bagi Grup A, B, C...
    const teamsPerGroup = 4
    const numGroups = shuffled.length < 6 ? 1 : Math.ceil(shuffled.length / teamsPerGroup)
    
    for (let i = 0; i < numGroups; i++) {
      const groupName = String.fromCharCode(65 + i) // A, B, C...
      const groupTeams = shuffled.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup)
      
      await updateGroupNames(supabase, groupTeams, groupName)
      groups.push(groupTeams)
    }
  }

  // B. GENERATE JADWAL (Algoritma Round Robin Circle Method)
  for (const groupTeams of groups) {
    const teams = [...groupTeams]
    
    // Jika ganjil, tambah dummy BYE
    if (teams.length % 2 !== 0) teams.push({ id: null }) 

    const numRounds = teams.length - 1
    const halfSize = teams.length / 2

    for (let round = 0; round < numRounds; round++) {
      for (let i = 0; i < halfSize; i++) {
        const teamA = teams[i]
        const teamB = teams[teams.length - 1 - i]

        // Jika keduanya bukan BYE, buat match
        if (teamA.id && teamB.id) {
          await supabase.from('matches').insert({
            tournament_id: tournamentId,
            stage_id: stageId,
            round_number: round + 1, // Dianggap sebagai Matchday / Week
            match_number: i + 1,
            participant_a_id: teamA.id,
            participant_b_id: teamB.id,
            status: 'SCHEDULED',
            scores: { a: 0, b: 0 }
          })
        }
      }
      // Rotasi Array (Elemen pertama tetap, sisanya geser)
      const last = teams.pop()
      if (last) teams.splice(1, 0, last)
    }
  }
}

// Helper: Update kolom group_name peserta
async function updateGroupNames(supabase: any, teams: any[], groupName: string) {
  if (teams.length === 0) return
  const ids = teams.map(t => t.id)
  await supabase
    .from('participants')
    .update({ group_name: groupName })
    .in('id', ids)
}

//Logic 4: BATTLE ROYALE (Leaderboard Style)
async function generateBattleRoyale(supabase: any, tournamentId: string, stageId: string) {
  // Battle Royale tidak ada pairing A vs B.
  // Kita buat "Game Session" (Match) dimana semua peserta dianggap main.
  // Default kita buat 5 Match awal.
  const defaultMatchCount = 5;

  for (let i = 1; i <= defaultMatchCount; i++) {
    await supabase.from('matches').insert({
      tournament_id: tournamentId,
      stage_id: stageId,
      round_number: 1, // Round 1 = Day 1 (bisa dikembangkan nanti)
      match_number: i, // Game 1, Game 2, Game 3...
      // Participant dikosongkan karena melibatkan BANYAK tim
      participant_a_id: null, 
      participant_b_id: null,
      status: 'SCHEDULED',
      // Scores akan menyimpan array hasil: [{teamId, rank, kills, pts}, ...]
      scores: {} 
    })
  }
}
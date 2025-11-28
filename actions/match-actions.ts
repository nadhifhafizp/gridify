'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateMatchScoreAction(
  matchId: string, 
  scoreA: number, 
  scoreB: number, 
  tournamentId: string
) {
  const supabase = await createClient()

  // 1. Ambil data match saat ini
  const { data: match } = await supabase
    .from('matches')
    .select('*, stages(id, type, sequence_order)')
    .eq('id', matchId)
    .single()

  if (!match) return { success: false, error: 'Match tidak ditemukan' }

  // 2. Tentukan Pemenang & Pecundang
  let winnerId = null
  let loserId = null
  
  if (scoreA > scoreB) {
    winnerId = match.participant_a_id
    loserId = match.participant_b_id
  } else if (scoreB > scoreA) {
    winnerId = match.participant_b_id
    loserId = match.participant_a_id
  }

  // 3. Update Match Ini
  const { error: updateError } = await supabase
    .from('matches')
    .update({
      scores: { a: scoreA, b: scoreB },
      winner_id: winnerId,
      status: 'COMPLETED'
    })
    .eq('id', matchId)

  if (updateError) return { success: false, error: updateError.message }

  const stageType = match.stages?.type

  // =========================================================
  // 4. AUTO-ADVANCE LOGIC (MAJUKAN PEMENANG)
  // =========================================================
  
  if (winnerId) {
    // A. SINGLE ELIMINATION (eFootball / Knockout)
    if (stageType === 'SINGLE_ELIMINATION' && match.next_match_id) {
      await advanceToNextMatch(supabase, match.next_match_id, match.match_number, winnerId)
    }

    // B. DOUBLE ELIMINATION (MLBB / MPL)
    if (stageType === 'DOUBLE_ELIMINATION') {
      const currentRound = match.round_number

      // Jika UPPER BRACKET (Round Positif)
      if (currentRound > 0 && currentRound < 999) {
        // Pemenang maju ke Next Round di Upper
        await findAndFillSlot(supabase, match.stage_id, currentRound + 1, winnerId)

        // Yang Kalah TURUN ke Lower Bracket (Round Negatif)
        if (loserId) {
          const targetLowerRound = -currentRound 
          await findAndFillSlot(supabase, match.stage_id, targetLowerRound, loserId)
        }
      }

      // Jika LOWER BRACKET (Round Negatif)
      if (currentRound < 0) {
        await findAndFillSlot(supabase, match.stage_id, currentRound - 1, winnerId)
      }
    }
  }

  // =========================================================
  // 5. AUTO-FINISH TOURNAMENT LOGIC (CEK TAMAT)
  // =========================================================
  
  // Cek apakah ini stage terakhir di turnamen?
  const { count: stagesCount } = await supabase
    .from('stages')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .gt('sequence_order', match.stages.sequence_order) // Cari stage setelah ini

  const isLastStage = stagesCount === 0

  if (isLastStage) {
    let shouldFinish = false

    // SKENARIO 1: Double Elim -> Grand Final Selesai (Round 999)
    if (stageType === 'DOUBLE_ELIMINATION' && match.round_number === 999 && winnerId) {
      shouldFinish = true
    }

    // SKENARIO 2: Single Elim -> Final Selesai (Tidak ada next match)
    else if (stageType === 'SINGLE_ELIMINATION' && !match.next_match_id && winnerId) {
      shouldFinish = true
    }

    // SKENARIO 3: League -> Semua match selesai
    else if (stageType === 'ROUND_ROBIN') {
      const { count: pendingMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('stage_id', match.stage_id)
        .neq('status', 'COMPLETED')
      
      // Jika pending 0 (berarti match ini yang terakhir), maka selesai
      if (pendingMatches === 0) shouldFinish = true
    }

    // UPDATE STATUS TURNAMEN
    if (shouldFinish) {
      await supabase
        .from('tournaments')
        .update({ status: 'COMPLETED' })
        .eq('id', tournamentId)
    }
  }

  // 6. Refresh Halaman
  revalidatePath(`/dashboard/tournaments/${tournamentId}`)
  revalidatePath(`/dashboard/tournaments/${tournamentId}/bracket`)
  
  return { success: true }
}

// --- HELPER FUNCTIONS ---

async function advanceToNextMatch(supabase: any, nextMatchId: string, currentMatchNum: number, winnerId: string) {
  const isOdd = currentMatchNum % 2 !== 0
  const targetCol = isOdd ? 'participant_a_id' : 'participant_b_id'
  await supabase.from('matches').update({ [targetCol]: winnerId }).eq('id', nextMatchId)
}

async function findAndFillSlot(supabase: any, stageId: string, roundNum: number, teamId: string) {
  const { data: targetMatches } = await supabase
    .from('matches')
    .select('id, participant_a_id, participant_b_id')
    .eq('stage_id', stageId)
    .eq('round_number', roundNum)
    .order('match_number', { ascending: true })

  if (!targetMatches) return

  for (const target of targetMatches) {
    if (!target.participant_a_id) {
      await supabase.from('matches').update({ participant_a_id: teamId }).eq('id', target.id)
      break
    } else if (!target.participant_b_id) {
      await supabase.from('matches').update({ participant_b_id: teamId }).eq('id', target.id)
      break
    }
  }
}
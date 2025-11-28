'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createTournamentAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const title = formData.get('title') as string
  const gameId = formData.get('gameId') as string
  const formatType = formData.get('formatType') as string
  const description = formData.get('description') as string
  
  const settingsJson = formData.get('settings') as string
  const settings = settingsJson ? JSON.parse(settingsJson) : {}

  // 1. CEK GENRE GAME DULU (PENTING!)
  const { data: gameData } = await supabase
    .from('games')
    .select('genre')
    .eq('id', gameId)
    .single()
  
  const gameGenre = gameData?.genre || 'MOBA' // Default fallback

  // 2. Insert Turnamen
  const { data: tourney, error: tourneyError } = await supabase
    .from('tournaments')
    .insert({
      owner_id: user.id,
      game_id: gameId,
      title: title,
      description: description,
      format_type: formatType,
      status: 'DRAFT',
      settings: settings,
    })
    .select()
    .single()

  if (tourneyError) return { success: false, error: tourneyError.message }

  // 3. Logic Generate Stages (OTOMATIS SESUAI GENRE)
  const tournamentId = tourney.id
  let stagesPayload = []

  switch (formatType) {
    case 'SINGLE_ELIMINATION':
      stagesPayload.push({ tournament_id: tournamentId, name: 'Main Event', type: 'SINGLE_ELIMINATION', sequence_order: 1 })
      break
      
    case 'DOUBLE_ELIMINATION':
      stagesPayload.push({ tournament_id: tournamentId, name: 'Playoffs', type: 'DOUBLE_ELIMINATION', sequence_order: 1 })
      break
      
    case 'HYBRID_UCL':
      // Stage 1 Selalu Grup
      stagesPayload.push({ tournament_id: tournamentId, name: 'Group Stage', type: 'ROUND_ROBIN', sequence_order: 1 })
      
      // Stage 2 TERGANTUNG GENRE
      // SPORTS -> Single Elim (Knockout)
      // MOBA/FPS -> Double Elim (Upper/Lower)
      if (gameGenre === 'SPORTS') {
        stagesPayload.push({ tournament_id: tournamentId, name: 'Knockout Phase', type: 'SINGLE_ELIMINATION', sequence_order: 2 })
      } else {
        stagesPayload.push({ tournament_id: tournamentId, name: 'Playoffs (MPL)', type: 'DOUBLE_ELIMINATION', sequence_order: 2 })
      }
      break
      
    case 'ROUND_ROBIN':
      stagesPayload.push({ tournament_id: tournamentId, name: 'League Phase', type: 'ROUND_ROBIN', sequence_order: 1 })
      break
      
    case 'BATTLE_ROYALE':
      stagesPayload.push({ tournament_id: tournamentId, name: 'Match Days', type: 'LEADERBOARD', sequence_order: 1 })
      break
      
    default:
      stagesPayload.push({ tournament_id: tournamentId, name: 'Main Event', type: 'SINGLE_ELIMINATION', sequence_order: 1 })
  }

  const { error: stageError } = await supabase.from('stages').insert(stagesPayload)
  
  if (stageError) {
    await supabase.from('tournaments').delete().eq('id', tournamentId)
    return { success: false, error: 'Gagal membuat format: ' + stageError.message }
  }

  redirect(`/dashboard/tournaments/${tournamentId}`)
}
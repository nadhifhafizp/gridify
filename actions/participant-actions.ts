'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addParticipantAction(formData: FormData) {
  const supabase = await createClient()

  const tournamentId = formData.get('tournamentId') as string
  const name = formData.get('name') as string
  const contact = formData.get('contact') as string

  if (!name || !tournamentId) {
    return { success: false, error: 'Nama tim wajib diisi' }
  }

  const { error } = await supabase
    .from('participants')
    .insert({
      tournament_id: tournamentId,
      name: name,
      contact_info: contact,
      is_verified: true, // Default verified biar langsung masuk bagan
    })

  if (error) return { success: false, error: error.message }

  // Refresh halaman agar data baru muncul
  revalidatePath(`/dashboard/tournaments/${tournamentId}/participants`)
  return { success: true }
}

export async function deleteParticipantAction(participantId: string, tournamentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', participantId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/dashboard/tournaments/${tournamentId}/participants`)
  return { success: true }
}
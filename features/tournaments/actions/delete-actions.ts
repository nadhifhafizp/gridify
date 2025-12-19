'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteTournament(id: string) {
  const supabase = await createClient()

  // 1. Cek User Session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Unauthorized" }

  // 2. Mulai Penghapusan Bertahap (Cascade Manual)
  const { error: matchError } = await supabase
    .from('matches').delete().eq('tournament_id', id)
  if (matchError) return { success: false, message: `Gagal hapus match: ${matchError.message}` }

  const { error: stageError } = await supabase
    .from('stages').delete().eq('tournament_id', id)
  if (stageError) return { success: false, message: `Gagal hapus stage: ${stageError.message}` }

  const { error: participantError } = await supabase
    .from('participants').delete().eq('tournament_id', id)
  if (participantError) return { success: false, message: `Gagal hapus peserta: ${participantError.message}` }

  const { error: tournamentError } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (tournamentError) {
    return { success: false, message: `Gagal hapus turnamen: ${tournamentError.message}` }
  }

  // 3. Refresh & Return Sukses
  revalidatePath('/dashboard/tournaments')
  return { success: true, message: "Turnamen berhasil dihapus" }
}
'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function deleteTournament(id: string, redirectPath?: string) {
  const supabase = await createClient()

  // 1. Cek User Session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 2. Mulai Penghapusan Bertahap (Manual Cascade)
  // Kita harus menghapus dari yang paling "ujung" (child) ke "induk" (parent)
  
  // A. Hapus semua Match di turnamen ini
  const { error: matchError } = await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', id)
  
  if (matchError) throw new Error(`Gagal hapus match: ${matchError.message}`)

  // B. Hapus semua Stage di turnamen ini
  const { error: stageError } = await supabase
    .from('stages')
    .delete()
    .eq('tournament_id', id)

  if (stageError) throw new Error(`Gagal hapus stage: ${stageError.message}`)

  // C. Hapus semua Peserta di turnamen ini
  const { error: participantError } = await supabase
    .from('participants')
    .delete()
    .eq('tournament_id', id)

  if (participantError) throw new Error(`Gagal hapus peserta: ${participantError.message}`)

  // D. TERAKHIR: Baru hapus Turnamen-nya
  const { error: tournamentError } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id) // Pastikan hanya owner yang bisa hapus

  if (tournamentError) {
    throw new Error(`Gagal hapus turnamen: ${tournamentError.message}`)
  }

  // 3. Refresh Halaman agar data hilang dari list
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tournaments')

  // 4. Redirect jika diminta
  if (redirectPath) {
    redirect(redirectPath)
  }
}
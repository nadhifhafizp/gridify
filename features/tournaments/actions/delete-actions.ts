'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Return type definition agar frontend mudah intellisense
type DeleteResult = {
  success: boolean
  message: string
}

export async function deleteTournament(id: string): Promise<DeleteResult> {
  const supabase = await createClient()

  try {
    // 1. Cek User Session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: "Unauthorized: Harap login" }
    }

    // 2. Mulai Penghapusan Bertahap (Cascade Manual)
    
    // A. Hapus Match
    const { error: matchError } = await supabase
      .from('matches')
      .delete()
      .eq('tournament_id', id)
    if (matchError) throw new Error(`Gagal hapus match: ${matchError.message}`)

    // B. Hapus Stage
    const { error: stageError } = await supabase
      .from('stages')
      .delete()
      .eq('tournament_id', id)
    if (stageError) throw new Error(`Gagal hapus stage: ${stageError.message}`)

    // C. Hapus Peserta
    const { error: participantError } = await supabase
      .from('participants')
      .delete()
      .eq('tournament_id', id)
    if (participantError) throw new Error(`Gagal hapus peserta: ${participantError.message}`)

    // D. Hapus Turnamen
    const { error: tournamentError } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

    if (tournamentError) {
      throw new Error(`Gagal hapus turnamen: ${tournamentError.message}`)
    }

    // 3. Refresh Halaman List
    revalidatePath('/dashboard/tournaments')

    // 4. Return Sukses (TIDAK REDIRECT DI SINI)
    // Biarkan Client Component yang melakukan router.push() agar tidak tertangkap sebagai error.
    return { success: true, message: "Turnamen berhasil dihapus" }

  } catch (error: any) {
    console.error("Delete error:", error)
    return { success: false, message: error.message || "Terjadi kesalahan sistem" }
  }
}
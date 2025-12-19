'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ---------------------------------------------------------
// Action: Tambah Peserta
// ---------------------------------------------------------
export async function addParticipant(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get("name")?.toString()
  const tournamentId = formData.get("tournamentId")?.toString()
  const contactInfo = formData.get("contactInfo")?.toString()

  if (!name || !tournamentId) {
    return { success: false, message: "Nama dan ID Turnamen wajib diisi" }
  }

  const { error } = await supabase
    .from('participants')
    .insert({
      name,
      tournament_id: tournamentId,
      contact_info: contactInfo,
      is_verified: true
    })

  if (error) return { success: false, message: error.message }

  // Revalidate agar list peserta langsung muncul
  revalidatePath(`/dashboard/tournaments/${tournamentId}/participants`)
  return { success: true, message: "Peserta berhasil ditambahkan" }
}

// ---------------------------------------------------------
// Action: Hapus Peserta (FIXED: Handle Foreign Key)
// ---------------------------------------------------------
export async function deleteParticipant(id: string) {
  const supabase = await createClient()

  // 1. Cek Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Unauthorized" }

  // 2. STEP PENTING: Bersihkan dulu peserta dari Bracket/Match
  // Jika tidak dibersihkan, database akan menolak penghapusan karena ID-nya dipakai di tabel matches.
  
  // A. Hapus dari Slot Player A
  const { error: errA } = await supabase
    .from('matches')
    .update({ 
      participant_a_id: null, // Kosongkan slot
      status: 'SCHEDULED',    // Reset status match
      winner_id: null,        // Hapus pemenang jika ada
      scores: null            // Reset skor
    })
    .eq('participant_a_id', id)

  // B. Hapus dari Slot Player B
  const { error: errB } = await supabase
    .from('matches')
    .update({ 
      participant_b_id: null, 
      status: 'SCHEDULED', 
      winner_id: null, 
      scores: null 
    })
    .eq('participant_b_id', id)

  if (errA || errB) {
    console.error("Gagal membersihkan match:", errA, errB)
    return { success: false, message: "Gagal membersihkan data bracket peserta" }
  }

  // 3. Eksekusi Hapus Peserta (Setelah aman dari relasi match)
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id)

  if (error) {
    // Error code 23503: Foreign Key Violation (jika masih ada relasi lain yang terlewat)
    if (error.code === '23503') { 
      return { success: false, message: "Gagal: Peserta masih terkait dengan data lain (Match/Team)." }
    }
    return { success: false, message: "Gagal menghapus: " + error.message }
  }

  // 4. Revalidate Halaman
  revalidatePath('/dashboard/tournaments', 'layout')
  
  return { success: true, message: "Peserta berhasil dihapus" }
}

// ---------------------------------------------------------
// Action: Edit Peserta
// ---------------------------------------------------------
export async function updateParticipant(id: string, name: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('participants')
    .update({ name })
    .eq('id', id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/dashboard/tournaments', 'layout')
  return { success: true, message: "Data peserta diperbarui" }
}
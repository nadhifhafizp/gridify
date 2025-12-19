'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Action: Tambah Peserta
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

  revalidatePath(`/dashboard/tournaments/${tournamentId}/participants`)
  return { success: true, message: "Peserta berhasil ditambahkan" }
}

// Action: Hapus Peserta
export async function deleteParticipant(id: string) {
  const supabase = await createClient()

  // Cek Auth (Opsional: Strict check owner turnamen bisa ditambahkan di sini)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Unauthorized" }

  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, message: "Gagal menghapus: " + error.message }
  }

  // Revalidate semua halaman terkait turnamen agar update
  revalidatePath('/dashboard/tournaments', 'layout')
  
  return { success: true, message: "Peserta berhasil dihapus" }
}

// Action: Edit Peserta (Opsional, jika ingin fitur edit nama)
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
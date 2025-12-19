'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type UpdateTournamentState = {
  success?: boolean
  error?: string
  message?: string
}

export async function updateTournamentSettings(
  id: string,
  prevState: UpdateTournamentState,
  formData: FormData
): Promise<UpdateTournamentState> {
  const supabase = await createClient()

  // 1. Cek User & Owner (Keamanan)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // 2. Ambil Data Form
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const status = formData.get("status") as string
  // const isPublic = formData.get("isPublic") === "on" // Jika nanti ada fitur public/private

  if (!title || title.length < 3) {
    return { error: "Nama turnamen minimal 3 karakter" }
  }

  // 3. Update Database
  const { error } = await supabase
    .from('tournaments')
    .update({
      title,
      description,
      status,
      // is_public: isPublic,
    })
    .eq('id', id)
    .eq('owner_id', user.id) // Pastikan hanya owner yang bisa edit

  if (error) {
    return { error: "Gagal update: " + error.message }
  }

  revalidatePath(`/dashboard/tournaments/${id}`)
  revalidatePath(`/dashboard/tournaments/${id}/settings`)
  
  return { success: true, message: "Pengaturan berhasil disimpan!" }
}
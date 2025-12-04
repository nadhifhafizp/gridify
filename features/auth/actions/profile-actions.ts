'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Update Info Dasar (Nama, HP, Username)
export async function updateBasicInfoAction(formData: FormData) {
  const supabase = await createClient()
  
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const phone = formData.get('phone') as string
  // Username biasanya tidak boleh diganti sembarangan, tapi kalau mau boleh
  // Disini kita fokus ke Nama & HP dulu sesuai request

  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      phone: phone
    }
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/profile')
  return { success: true }
}

// 2. Update Email (Butuh Re-Verifikasi)
export async function updateEmailAction(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ email: email })

  if (error) return { success: false, error: error.message }
  
  return { success: true }
}

// 3. Update Password
export async function updatePasswordAction(password: string, confirm: string) {
  if (password !== confirm) return { success: false, error: 'Password konfirmasi tidak cocok' }
  if (password.length < 6) return { success: false, error: 'Minimal 6 karakter' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: password })

  if (error) return { success: false, error: error.message }

  return { success: true }
}
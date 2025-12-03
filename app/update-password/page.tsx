'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      toast.error('Gagal mengubah password', { description: error.message })
      setLoading(false)
    } else {
      toast.success('Password berhasil diubah!')
      router.push('/dashboard') // Lempar ke dashboard setelah sukses
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Buat Password Baru</h1>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase">Password Baru</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Validasi Kesamaan Password
    if (password !== confirmPassword) {
      toast.error('Password tidak cocok', { 
        description: 'Pastikan password baru dan konfirmasi sama.' 
      })
      return
    }

    // 2. Validasi Panjang
    if (password.length < 6) {
      toast.error('Password terlalu pendek', {
        description: 'Minimal 6 karakter.'
      })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      toast.error('Gagal mengubah password', { description: error.message })
      setLoading(false)
    } else {
      toast.success('Berhasil!', { description: 'Password telah diperbarui.' })
      router.push('/dashboard') 
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden">
      
      {/* Background Decoration (Sama dengan Login/Register) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-purple-600/20 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Hiasan Border Atas */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <Lock className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Set Password Baru</h1>
          <p className="text-slate-400 text-sm">
            Amankan akunmu dengan password yang kuat.
          </p>
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-5">
          
          {/* Input Password Baru */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-indigo-300 uppercase tracking-wider ml-1">Password Baru</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-600"
                placeholder="Minimal 6 karakter"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Input Konfirmasi Password */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-indigo-300 uppercase tracking-wider ml-1">Konfirmasi Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-600"
                placeholder="Ulangi password baru"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  )
}
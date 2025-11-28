'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      alert('Password minimal 6 karakter ya, biar aman!')
      return
    }

    setLoading(true)
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert('Ups, gagal daftar: ' + error.message)
    } else {
      alert('Berhasil! Cek email kamu untuk verifikasi.')
    }
    setLoading(false)
  }

  return (
    // Perbaikan: Hapus underscore di _var
    <div className="flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(circle_at_bottom,var(--tw-gradient-stops))] from-purple-900/40 via-slate-950 to-slate-950 text-white">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-pink-600/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-violet-600/20 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Perbaikan: bg-linear-to-r */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Join Gridify</h1>
          <p className="text-slate-400 text-sm">Mulai perjalanan turnamen esport kamu</p>
        </div>
        
        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-purple-300 uppercase tracking-wider ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-600"
              placeholder="team@esport.com"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-purple-300 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-600"
              placeholder="Minimal 6 karakter"
              required
            />
          </div>

          {/* Perbaikan: bg-linear-to-r */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Mendaftarkan...' : 'Buat Akun Baru'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-8">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
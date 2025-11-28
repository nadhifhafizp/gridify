'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Gagal Login: ' + error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 text-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          {/* Perbaikan: bg-linear-to-r */}
          <h1 className="text-4xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Masuk untuk mengelola turnamenmu</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-indigo-300 uppercase tracking-wider ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-600"
              placeholder="player@gridify.com"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-indigo-300 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-600"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Perbaikan: bg-linear-to-r */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Sedang Memproses...' : 'Login Sekarang'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-8">
          Belum punya akun?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors">
            Daftar Gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
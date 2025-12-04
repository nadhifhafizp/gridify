'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react' // Tambah Import Eye
import { toast } from 'sonner'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // State baru
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let emailToLogin = identifier.trim()
    const isEmail = emailToLogin.includes('@')

    if (!isEmail) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailToLogin)
        .single()

      if (profileError || !profile) {
        toast.error('Username tidak ditemukan.')
        setLoading(false)
        return
      }
      emailToLogin = profile.email
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password,
    })

    if (error) {
      toast.error('Login Gagal', { description: error.message })
      setLoading(false)
    } else {
      toast.success('Berhasil masuk!', { description: 'Mengalihkan ke dashboard...' })
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 text-white p-4">
      
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm">Masuk untuk mengelola turnamenmu</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-indigo-300 uppercase tracking-wider ml-1">Email atau Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-600"
              placeholder="username atau email@domain.com"
              required
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-medium text-indigo-300 uppercase tracking-wider">Password</label>
              <Link 
                href="/forgot-password" 
                className="text-xs text-slate-400 hover:text-white transition-colors hover:underline"
              >
                Lupa Password?
              </Link>
            </div>
            
            {/* UPDATE BAGIAN INPUT PASSWORD */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // Toggle Type
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-600 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            {loading ? 'Memproses...' : 'Login Sekarang'}
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
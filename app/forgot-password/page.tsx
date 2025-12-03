'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Kirim email reset password
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`, // Redirect user ke halaman settings untuk ubah password baru
    })

    setLoading(false)

    if (error) {
      toast.error('Gagal mengirim email', { description: error.message })
    } else {
      setIsSent(true)
      toast.success('Email terkirim!')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 right-0 p-64 bg-indigo-600/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10">
        
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Kembali ke Login
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
            <Mail className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Lupa Password?</h1>
          <p className="text-slate-400 text-sm">
            {isSent 
              ? `Kami telah mengirimkan link reset password ke ${email}.` 
              : 'Masukkan email Anda, kami akan mengirimkan link untuk mereset password.'}
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-indigo-300 uppercase tracking-wider ml-1">Email Terdaftar</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder-slate-600"
                placeholder="nama@email.com"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-white text-slate-900 font-bold hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Kirim Link Reset'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
             <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center">
               Silakan cek kotak masuk (Inbox) atau Spam di email Anda.
             </div>
             <button 
               onClick={() => setIsSent(false)}
               className="w-full py-3 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-all"
             >
               Kirim Ulang
             </button>
          </div>
        )}

      </div>
    </div>
  )
}
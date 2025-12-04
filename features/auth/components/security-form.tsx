'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client' // Kita pakai Client SDK langsung untuk kirim email
import { Lock, Mail, Loader2, ShieldCheck, Send } from 'lucide-react'
import { toast } from 'sonner'

export default function SecurityForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSendResetLink = async () => {
    setLoading(true)

    // Mengirim email reset password ke email user yang sedang login
    // Redirect diarahkan ke halaman /update-password setelah user klik link di email
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })

    setLoading(false)

    if (error) {
      toast.error('Gagal mengirim permintaan', { description: error.message })
    } else {
      toast.success('Link Terkirim!', { 
        description: `Silakan cek inbox email ${user.email} untuk mereset password.` 
      })
    }
  }

  return (
    <div className="bg-[#1a1b26] rounded-2xl border border-white/5 shadow-sm overflow-hidden h-fit">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/2">
        <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Keamanan</h3>
          <p className="text-xs text-slate-400">Pengaturan Password & Email.</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* --- INFO EMAIL (READ ONLY) --- */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Mail size={12} /> Email Terdaftar
          </label>
          
          <div className="flex items-center justify-between bg-[#0f1016] border border-slate-800 rounded-xl px-4 py-3">
            <span className="text-slate-300 text-sm font-medium">{user.email}</span>
            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-wide">
              Verified
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Untuk alasan keamanan, email tidak dapat diubah secara langsung. Hubungi admin jika sangat mendesak.
          </p>
        </div>

        <div className="h-px w-full bg-white/5"></div>

        {/* --- RESET PASSWORD BY EMAIL --- */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Lock size={12} /> Ganti Password
          </label>
          
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
            <p className="text-sm text-blue-200/80 mb-4 leading-relaxed">
              Ingin mengubah kata sandi? Kami akan mengirimkan <strong>Link Verifikasi</strong> ke email Anda untuk melakukan reset password dengan aman.
            </p>

            <button 
              onClick={handleSendResetLink}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Mengirim...
                </>
              ) : (
                <>
                  <Send size={16} className="group-hover:translate-x-1 transition-transform" /> 
                  Kirim Link Reset ke Email
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
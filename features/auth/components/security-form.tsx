'use client'

import { useState } from 'react'
import { updateEmailAction, updatePasswordAction } from '../actions/profile-actions'
import { Lock, Mail, AlertTriangle, Loader2, KeyRound, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function SecurityForm({ user }: { user: any }) {
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)
  
  const [newEmail, setNewEmail] = useState(user.email || '')
  const [pass, setPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('') 

  const handleUpdateEmail = async () => {
    if(newEmail === user.email) return
    if(!window.confirm('Email konfirmasi akan dikirim ke email lama DAN baru. Lanjutkan?')) return

    setLoadingEmail(true)
    const res = await updateEmailAction(newEmail)
    setLoadingEmail(false)

    if(res.success) toast.success('Link verifikasi terkirim ke kedua email.')
    else toast.error(res.error)
  }

  const handleUpdatePass = async () => {
    setLoadingPass(true)
    const res = await updatePasswordAction(pass, confirmPass)
    setLoadingPass(false)

    if(res.success) {
      toast.success('Password berhasil diubah!')
      setPass(''); setConfirmPass('');
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="bg-[#1a1b26] rounded-2xl border border-white/5 shadow-sm overflow-hidden h-fit">
      
      {/* Header (Updated opacity syntax) */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/2">
        <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Keamanan</h3>
          <p className="text-xs text-slate-400">Email & Kata Sandi.</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* --- BAGIAN EMAIL --- */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Mail size={12} /> Ganti Email
          </label>
          
          <div className="flex gap-2">
            <input 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 min-w-0 bg-[#0f1016] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-red-500 outline-none transition-all"
              placeholder="Email baru..."
            />
            <button 
              onClick={handleUpdateEmail}
              disabled={loadingEmail || newEmail === user.email}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all disabled:opacity-50"
            >
              {loadingEmail ? <Loader2 className="animate-spin" size={16} /> : 'Update'}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 flex gap-3 items-start">
            <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200/70 leading-relaxed">
              Mengganti email memerlukan verifikasi ulang demi keamanan akun Anda.
            </p>
          </div>
        </div>

        <div className="h-px w-full bg-white/5"></div>

        {/* --- BAGIAN PASSWORD --- */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <KeyRound size={12} /> Ganti Password
          </label>
          
          <div className="space-y-3">
            <input 
              type="password" 
              placeholder="Password Baru"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-[#0f1016] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500 outline-none transition-all"
            />
            <input 
              type="password" 
              placeholder="Konfirmasi Password"
              value={confirmPass} 
              onChange={(e) => setConfirmPass(e.target.value)} 
              className="w-full bg-[#0f1016] border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500 outline-none transition-all"
            />
          </div>

          <button 
            onClick={handleUpdatePass}
            disabled={loadingPass || !pass}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
          >
            {loadingPass ? 'Menyimpan...' : 'Set Password Baru'}
          </button>
        </div>

      </div>
    </div>
  )
}
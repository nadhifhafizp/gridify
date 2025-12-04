'use client'

import { useState } from 'react'
import { updateEmailAction, updatePasswordAction } from '../actions/profile-actions'
import { Lock, Mail, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SecurityForm({ user }: { user: any }) {
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)
  
  const [newEmail, setNewEmail] = useState(user.email || '')
  const [pass, setPass] = useState('')
  
  // FIX: Ubah nama variabel 'confirm' jadi 'confirmPass' biar tidak bentrok
  const [confirmPass, setConfirmPass] = useState('') 

  const handleUpdateEmail = async () => {
    if(newEmail === user.email) return
    
    // Sekarang fungsi window.confirm() aman dipanggil
    if(!window.confirm('Email konfirmasi akan dikirim ke ALAMAT LAMA dan ALAMAT BARU. Anda harus mengklik keduanya untuk mengganti email.')) return

    setLoadingEmail(true)
    const res = await updateEmailAction(newEmail)
    setLoadingEmail(false)

    if(res.success) toast.success('Cek inbox kedua email Anda untuk verifikasi.')
    else toast.error(res.error)
  }

  const handleUpdatePass = async () => {
    setLoadingPass(true)
    const res = await updatePasswordAction(pass, confirmPass) // Pakai variabel baru
    setLoadingPass(false)

    if(res.success) {
      toast.success('Password berhasil diubah!')
      setPass('')
      setConfirmPass('') // Reset variabel baru
    }
    else toast.error(res.error)
  }

  return (
    <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-8">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
          <Lock size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Keamanan Akun</h3>
          <p className="text-xs text-slate-400">Kelola email dan kata sandi.</p>
        </div>
      </div>

      {/* GANTI EMAIL */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Mail size={16} className="text-slate-400"/> Ubah Email
        </h4>
        <div className="flex gap-3">
          <input 
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-red-500 outline-none"
          />
          <button 
            onClick={handleUpdateEmail}
            disabled={loadingEmail || newEmail === user.email}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-600 disabled:opacity-50"
          >
            {loadingEmail ? <Loader2 className="animate-spin" /> : 'Update'}
          </button>
        </div>
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex gap-3 text-xs text-yellow-200/80">
          <AlertTriangle size={16} className="shrink-0" />
          <p>Demi keamanan, mengganti email memerlukan verifikasi ulang di email lama dan email baru.</p>
        </div>
      </div>

      {/* GANTI PASSWORD */}
      <div className="space-y-4 border-t border-white/5 pt-6">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock size={16} className="text-slate-400"/> Ganti Password
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="password" 
            placeholder="Password Baru"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-red-500 outline-none"
          />
          <input 
            type="password" 
            placeholder="Konfirmasi Password"
            value={confirmPass} // Pakai variabel baru
            onChange={(e) => setConfirmPass(e.target.value)} // Pakai variabel baru
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-red-500 outline-none"
          />
        </div>
        <div className="flex justify-end">
          <button 
            onClick={handleUpdatePass}
            disabled={loadingPass || !pass}
            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all disabled:opacity-50"
          >
            {loadingPass ? 'Menyimpan...' : 'Set Password Baru'}
          </button>
        </div>
      </div>
    </section>
  )
}
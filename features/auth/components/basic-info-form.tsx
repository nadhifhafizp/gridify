'use client'

import { useState } from 'react'
import { updateBasicInfoAction } from '../actions/profile-actions'
import { User, Phone, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function BasicInfoForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
  
  // Ambil data lama dari metadata
  const meta = user.user_metadata || {}

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    const result = await updateBasicInfoAction(formData)
    setLoading(false)

    if (result.success) {
      toast.success('Profil berhasil diperbarui!')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <section className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
          <User size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Informasi Pribadi</h3>
          <p className="text-xs text-slate-400">Data diri yang tampil di publik.</p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase">Nama Depan</label>
            <input 
              name="firstName" 
              defaultValue={meta.first_name}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase">Nama Belakang</label>
            <input 
              name="lastName" 
              defaultValue={meta.last_name}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400 uppercase">Nomor WhatsApp</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              name="phone" 
              defaultValue={meta.phone}
              placeholder="0812..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Simpan Profil
          </button>
        </div>
      </form>
    </section>
  )
}
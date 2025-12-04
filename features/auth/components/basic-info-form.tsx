'use client'

import { useState } from 'react'
import { updateBasicInfoAction } from '../actions/profile-actions'
import { User, Phone, Save, Loader2, Contact } from 'lucide-react'
import { toast } from 'sonner'

export default function BasicInfoForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
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
    <div className="bg-[#1a1b26] rounded-2xl border border-white/5 shadow-sm overflow-hidden">
      {/* Header Form (Updated opacity syntax) */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/2">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
          <Contact size={20} />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Informasi Pribadi</h3>
          <p className="text-xs text-slate-400">Data ini akan tampil di profil turnamen Anda.</p>
        </div>
      </div>

      <form action={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Depan</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                name="firstName" 
                defaultValue={meta.first_name}
                className="w-full bg-[#0f1016] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
                placeholder="Nama Depan"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Belakang</label>
            <input 
              name="lastName" 
              defaultValue={meta.last_name}
              className="w-full bg-[#0f1016] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
              placeholder="Nama Belakang"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor WhatsApp</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              name="phone" 
              defaultValue={meta.phone}
              placeholder="0812..."
              className="w-full bg-[#0f1016] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-white/5 mt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  )
}
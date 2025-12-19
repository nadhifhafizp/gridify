'use client'

import { useRef, useState } from "react"
// PERBAIKAN: Ganti nama import
import { addParticipant } from "@/features/participants/actions/participant-actions"
import { Plus, User, Phone, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AddParticipantForm({ tournamentId }: { tournamentId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    
    const formData = new FormData(e.currentTarget)
    // Pastikan tournamentId terkirim
    formData.append("tournamentId", tournamentId) 

    try {
      // PERBAIKAN: Panggil fungsi yang benar
      const result = await addParticipant(formData)
      
      if (result.success) {
        toast.success(result.message)
        formRef.current?.reset()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-900/50 border border-white/5 space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase">Nama Peserta</label>
        <div className="relative">
          <input 
            name="name"
            required
            placeholder="Nama Team / Player"
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase">Kontak (Opsional)</label>
        <div className="relative">
          <input 
            name="contactInfo"
            placeholder="Email / WhatsApp / ID Game"
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        <span>Tambah Peserta</span>
      </button>
    </form>
  )
}
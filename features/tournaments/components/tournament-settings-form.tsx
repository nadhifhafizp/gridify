'use client'

import { useActionState } from "react" // React 19 / Next.js 15
import { updateTournamentSettings } from "@/features/tournaments/actions/settings-actions"
import { Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useEffect } from "react"
import { toast } from "sonner"

type TournamentData = {
  id: string
  title: string
  description: string | null
  status: string
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft (Persiapan)", color: "bg-slate-500" },
  { value: "ONGOING", label: "Ongoing (Sedang Berjalan)", color: "bg-green-500" },
  { value: "COMPLETED", label: "Completed (Selesai)", color: "bg-indigo-500" },
]

export default function TournamentSettingsForm({ tournament }: { tournament: TournamentData }) {
  // Binding ID ke Server Action
  const updateAction = updateTournamentSettings.bind(null, tournament.id)
  
  // Menggunakan useActionState (standar baru pengganti useFormState)
  // [state, action, isPending]
  const [state, action, isPending] = useActionState(updateAction, {})

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      {/* --- STATUS --- */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-white/10 space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-2">Status Turnamen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="relative cursor-pointer group">
              <input 
                type="radio" 
                name="status" 
                value={opt.value} 
                defaultChecked={tournament.status === opt.value}
                className="peer sr-only" 
              />
              <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 text-center peer-checked:border-indigo-500 peer-checked:bg-indigo-500/20 transition-all hover:bg-slate-800">
                <div className={`w-2 h-2 rounded-full ${opt.color} mx-auto mb-2`} />
                <span className="text-sm font-medium text-slate-300 peer-checked:text-white">{opt.label}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* --- GENERAL INFO --- */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-white/10 space-y-4">
        <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-2">Informasi Umum</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Nama Turnamen</label>
          <input 
            name="title"
            type="text" 
            defaultValue={tournament.title}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-600 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Deskripsi</label>
          <textarea 
            name="description"
            rows={4}
            defaultValue={tournament.description || ""}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
          />
        </div>
      </div>

      {/* --- SUBMIT --- */}
      <div className="flex items-center justify-end pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Simpan Perubahan</span>
        </button>
      </div>
    </form>
  )
}
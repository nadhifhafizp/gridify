'use client'

import { useActionState, useEffect } from "react"
import { updateTournamentSettings } from "@/features/tournaments/actions/settings-actions"
import { Save, Loader2, CheckCircle2, Clock, Globe, Lock } from "lucide-react"
import { toast } from "sonner"

type TournamentData = {
  id: string
  title: string
  description: string | null
  status: string
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", desc: "Turnamen belum dimulai", icon: Clock, color: "text-slate-400", bg: "peer-checked:bg-slate-500/20 peer-checked:border-slate-500" },
  { value: "ONGOING", label: "Ongoing", desc: "Sedang berlangsung", icon: Globe, color: "text-green-400", bg: "peer-checked:bg-green-500/20 peer-checked:border-green-500" },
  { value: "COMPLETED", label: "Finished", desc: "Turnamen selesai", icon: CheckCircle2, color: "text-indigo-400", bg: "peer-checked:bg-indigo-500/20 peer-checked:border-indigo-500" },
]

export default function TournamentSettingsForm({ tournament }: { tournament: TournamentData }) {
  const updateAction = updateTournamentSettings.bind(null, tournament.id)
  const [state, action, isPending] = useActionState(updateAction, {})

  useEffect(() => {
    if (state.success) toast.success(state.message)
    else if (state.error) toast.error(state.error)
  }, [state])

  return (
    <form action={action} className="space-y-6">
      
      {/* CARD 1: STATUS */}
      <section className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" /> Status Turnamen
        </h3>
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
              <div className={`h-full p-4 rounded-xl border border-white/5 bg-slate-800/30 transition-all hover:bg-slate-800/60 ${opt.bg}`}>
                <div className="flex items-center gap-3 mb-1">
                  <opt.icon className={`w-5 h-5 ${opt.color}`} />
                  <span className={`font-semibold text-sm sm:text-base text-slate-300 peer-checked:text-white`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 pl-8">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* CARD 2: INFO */}
      <section className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-sm">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-400" /> Informasi Dasar
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">Nama Turnamen</label>
            <input 
              name="title"
              type="text" 
              defaultValue={tournament.title}
              required
              className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">Deskripsi</label>
            <textarea 
              name="description"
              rows={4}
              defaultValue={tournament.description || ""}
              className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-6">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </section>
    </form>
  )
}
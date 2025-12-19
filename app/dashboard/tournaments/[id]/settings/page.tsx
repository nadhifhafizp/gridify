import { createClient } from "@/lib/supabase/server"
import { Settings, AlertTriangle } from "lucide-react"
import TournamentSettingsForm from "@/features/tournaments/components/tournament-settings-form"
import { DeleteTournamentButton } from "@/features/tournaments/components/delete-tournament-button"

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments').select('id, title, description, status').eq('id', id).single()

  if (!tournament) return <div>Turnamen tidak ditemukan</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="p-3 bg-slate-800 rounded-xl w-fit">
          <Settings className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Pengaturan</h2>
          <p className="text-slate-400 text-sm">Kelola informasi, status, dan privasi turnamen.</p>
        </div>
      </div>

      {/* Main Settings */}
      <TournamentSettingsForm tournament={tournament} />

      {/* Danger Zone */}
      <section className="space-y-4 pt-4">
        <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h3>
        
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-1 overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="block text-white font-medium text-base">Hapus Turnamen</span>
              <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                Tindakan ini akan menghapus permanen turnamen beserta seluruh data pertandingan dan peserta. Tidak bisa dikembalikan.
              </p>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <DeleteTournamentButton 
                id={tournament.id} 
                isIconOnly={false} 
                className="w-full sm:w-auto justify-center bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
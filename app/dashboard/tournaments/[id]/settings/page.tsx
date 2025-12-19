import { createClient } from "@/lib/supabase/server"
import { Settings } from "lucide-react"
import TournamentSettingsForm from "@/features/tournaments/components/tournament-settings-form"
// PERBAIKAN DI SINI: Tambahkan { }
import { DeleteTournamentButton } from "@/features/tournaments/components/delete-tournament-button"

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // Await params (Next.js 15)
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, title, description, status')
    .eq('id', id)
    .single()

  if (!tournament) return <div>Turnamen tidak ditemukan</div>

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-800 rounded-lg">
          <Settings className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <p className="text-slate-400 text-sm">Atur informasi dan status turnamen.</p>
        </div>
      </div>

      {/* Main Settings Form */}
      <TournamentSettingsForm tournament={tournament} />

      {/* Danger Zone */}
      <div className="pt-8 mt-8 border-t border-red-500/20">
        <h3 className="text-red-400 font-bold mb-2">Danger Zone</h3>
        <p className="text-slate-500 text-sm mb-4">
          Tindakan di bawah ini tidak dapat dibatalkan. Menghapus turnamen akan menghapus semua match dan peserta secara permanen.
        </p>
        <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <div>
            <span className="block text-white font-medium">Hapus Turnamen</span>
            <span className="text-xs text-red-400/70">Tindakan ini permanen</span>
          </div>
          <DeleteTournamentButton 
            id={tournament.id} 
            isIconOnly={false} 
          />
        </div>
      </div>
    </div>
  )
}
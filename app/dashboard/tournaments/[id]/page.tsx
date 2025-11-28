import { createClient } from '@/lib/supabase/server'
import { Trophy, Users, Swords } from 'lucide-react'

export default async function TournamentOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Ambil detail turnamen
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*, games(*)')
    .eq('id', id)
    .single()

  // Ambil jumlah peserta
  const { count: participantCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id)

  if (!tournament) return <div>Turnamen tidak ditemukan</div>

  return (
    <div className="space-y-6">
      {/* Banner Info */}
      {/* Perbaikan: bg-gradient-to-br -> bg-linear-to-br */}
      <div className="rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 border border-white/5 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3 inline-block">
                {tournament.games?.name}
              </span>
              <h1 className="text-3xl font-bold text-white mb-2">{tournament.title}</h1>
              <p className="text-slate-400 max-w-2xl">{tournament.description || 'Tidak ada deskripsi.'}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border ${
                tournament.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}>
                {tournament.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Peserta Terdaftar</p>
              <p className="text-2xl font-bold text-white">{participantCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Format</p>
              <p className="text-lg font-bold text-white truncate">{tournament.format_type.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
              <Swords size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Match</p>
              <p className="text-2xl font-bold text-white">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}   
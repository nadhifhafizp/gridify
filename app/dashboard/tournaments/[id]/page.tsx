import { createClient } from '@/lib/supabase/server'
import { Trophy, Users, Swords, Gamepad2, Calendar } from 'lucide-react'
import ShareButton from '@/features/tournaments/components/share-button'

export default async function TournamentOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*, games(*)')
    .eq('id', id)
    .single()

  const { count: participantCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id)

  if (!tournament) return <div className="text-white p-8">Turnamen tidak ditemukan</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- BANNER HEADER (FIXED LAYOUT) --- */}
      <div className="relative rounded-2xl p-8 border border-white/5 bg-slate-900">
        
        {/* Layer 1: Background Decoration (Absolute & Overflow Hidden) */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
           <div className="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-800"></div>
           <div className="absolute top-0 right-0 p-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        </div>
        
        {/* Layer 2: Content (Relative & Z-10 agar muncul di atas background & Popover bisa keluar) */}
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            
            {/* KIRI */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
                <Gamepad2 size={14} />
                {tournament.games?.name || 'Unknown Game'}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                {tournament.title}
              </h1>
              <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
                {tournament.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>

            {/* KANAN */}
            <div className="flex flex-row md:flex-col items-end gap-3 shrink-0">
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border text-center ${
                tournament.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                tournament.status === 'COMPLETED' ? 'bg-slate-700/50 text-slate-400 border-slate-600' :
                'bg-green-500/10 text-green-400 border-green-500/20 animate-pulse'
              }`}>
                {tournament.status === 'COMPLETED' ? 'SELESAI' : 
                 tournament.status === 'DRAFT' ? 'DRAFT' : 'ON GOING'}
              </span>

              {/* Tombol Share */}
              <ShareButton tournamentId={id} />
            </div>

          </div>
        </div>
      </div>

      {/* --- STATISTIK GRID (Tetap Sama) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Peserta</p>
              <p className="text-2xl font-bold text-white mt-1">{participantCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Format</p>
              <p className="text-lg font-bold text-white mt-1 truncate max-w-[150px]" title={tournament.format_type}>
                {tournament.format_type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Dibuat Pada</p>
              <p className="text-lg font-bold text-white mt-1">
                {new Date(tournament.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
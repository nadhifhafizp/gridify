import { createClient } from '@/lib/supabase/server'
import { Trophy, Users, Swords, Gamepad2, Calendar, Clock, ArrowRight, AlertCircle } from 'lucide-react'
import ShareButton from '@/features/tournaments/components/share-button'
import { DeleteTournamentButton } from '@/features/tournaments/components/delete-tournament-button'
import Link from 'next/link'

export default async function TournamentOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Ambil detail turnamen
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*, games(*)')
    .eq('id', id)
    .single()

  // 2. Ambil jumlah peserta
  const { count: participantCount } = await supabase
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id)

  // 3. Ambil Jadwal Mendatang (Upcoming Matches)
  // Mengambil match yang belum 'COMPLETED', limit 5, diurutkan dari id (asumsi urutan buat)
  const { data: upcomingMatches } = await supabase
    .from('matches')
    .select(`
      id,
      round_number,
      match_number,
      status,
      participant_a_id,
      participant_b_id,
      p1:participants!participant_a_id(name),
      p2:participants!participant_b_id(name)
    `)
    .eq('tournament_id', id)
    .neq('status', 'COMPLETED')
    .order('id', { ascending: true })
    .limit(5)

  if (!tournament) return <div className="text-white p-8">Turnamen tidak ditemukan</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* --- BANNER HEADER --- */}
      <div className="relative rounded-2xl p-8 border border-white/5 bg-slate-900 shadow-2xl">
        {/* Background Effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
           <div className="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-800"></div>
           <div className="absolute top-0 right-0 p-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  <Gamepad2 size={14} />
                  {tournament.games?.name || 'Unknown Game'}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                  tournament.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                  tournament.status === 'COMPLETED' ? 'bg-slate-700/50 text-slate-400 border-slate-600' :
                  'bg-green-500/10 text-green-400 border-green-500/20 animate-pulse'
                }`}>
                  {tournament.status === 'COMPLETED' ? 'SELESAI' : 
                   tournament.status === 'DRAFT' ? 'DRAFT MODE' : 'LIVE / ONGOING'}
                </span>
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                  {tournament.title}
                </h1>
                <p className="text-slate-400 max-w-2xl text-sm leading-relaxed line-clamp-2">
                  {tournament.description || 'Tidak ada deskripsi tambahan.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
               <ShareButton tournamentId={id} />
               <DeleteTournamentButton 
                  id={id} 
                  redirectTo="/dashboard/tournaments"
                  className="bg-slate-800 border border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all"
               />
            </div>
          </div>
        </div>
      </div>

      {/* --- STATISTIK GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Peserta */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Peserta</p>
              <p className="text-2xl font-bold text-white mt-1">{participantCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Format */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Format</p>
              <p className="text-lg font-bold text-white mt-1 truncate max-w-37.5" title={tournament.format_type}>
                {tournament.format_type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Tanggal */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors group">
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

      {/* --- UPCOMING SCHEDULE SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Upcoming Matches List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Jadwal Mendatang
            </h3>
            <Link 
              href={`/dashboard/tournaments/${id}/bracket`}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              Lihat Bracket Lengkap <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {!upcomingMatches || upcomingMatches.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/30 border border-dashed border-slate-700 flex flex-col items-center text-center">
                <AlertCircle className="w-8 h-8 text-slate-600 mb-3" />
                <p className="text-slate-500 font-medium">Tidak ada jadwal pertandingan aktif.</p>
                <p className="text-xs text-slate-600 mt-1">Mungkin semua match sudah selesai atau bracket belum digenerate.</p>
              </div>
            ) : (
              upcomingMatches.map((match: any) => (
                <div key={match.id} className="group relative p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:bg-slate-800 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row items-center gap-4">
                  {/* Info Round */}
                  <div className="flex flex-col items-center justify-center w-full sm:w-16 shrink-0 gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Match</span>
                    <span className="text-lg font-black text-white/20 group-hover:text-indigo-500/50 transition-colors">
                      #{match.match_number}
                    </span>
                  </div>

                  {/* Players VS */}
                  <div className="flex-1 w-full flex items-center justify-between sm:justify-center gap-4 text-sm">
                    <div className={`flex-1 text-right truncate font-medium ${match.p1 ? 'text-white' : 'text-slate-500 italic'}`}>
                      {match.p1?.name || 'TBD'}
                    </div>
                    
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-white/10 text-xs font-bold text-slate-400">
                      VS
                    </div>
                    
                    <div className={`flex-1 text-left truncate font-medium ${match.p2 ? 'text-white' : 'text-slate-500 italic'}`}>
                      {match.p2?.name || 'TBD'}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="w-full sm:w-auto mt-2 sm:mt-0">
                    <Link
                      href={`/dashboard/tournaments/${id}/bracket`}
                      className="flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                    >
                      Update
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Quick Actions / Info Lain (Placeholder) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-linear-to-b from-indigo-900/20 to-slate-900/50 border border-indigo-500/20">
            <h4 className="font-bold text-indigo-100 mb-2">Perlu Bantuan?</h4>
            <p className="text-xs text-indigo-300/70 mb-4 leading-relaxed">
              Pastikan bracket sudah digenerate agar jadwal muncul. Jika ada masalah skor, admin bisa mengedit manual.
            </p>
            <Link 
              href={`/dashboard/tournaments/${id}/participants`}
              className="block w-full py-2.5 text-center rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-bold transition-all"
            >
              Kelola Peserta
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
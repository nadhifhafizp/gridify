import { createClient } from '@/lib/supabase/server'
import { Swords, Trophy, LayoutList, GitGraph, Target, Calendar } from 'lucide-react'
import Link from 'next/link'
import BracketVisualizer from '@/components/bracket/bracket-visualizer'
import StandingsTable from '@/components/bracket/standings-table'
import BRLeaderboard from '@/components/bracket/br-leaderboard'

// Halaman publik harus selalu fresh datanya
export const dynamic = 'force-dynamic'

export default async function PublicTournamentPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ stage?: string }>
}) {
  const { id } = await params
  const { stage: stageIdParam } = await searchParams
  const supabase = await createClient()

  // 1. Ambil Data Turnamen
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*, games(*)')
    .eq('id', id)
    .single()

  if (!tournament) return <div className="text-white text-center py-20">Turnamen tidak ditemukan.</div>

  // 2. Ambil Stage
  const { data: stages } = await supabase
    .from('stages')
    .select('*')
    .eq('tournament_id', id)
    .order('sequence_order', { ascending: true })

  const activeStage = stageIdParam 
    ? stages?.find(s => s.id === stageIdParam) 
    : stages?.[0]

  // 3. Ambil Match & Peserta
  const { data: matches } = await supabase
    .from('matches')
    .select(`*, participant_a:participant_a_id(*), participant_b:participant_b_id(*)`)
    .eq('stage_id', activeStage?.id)
    .order('round_number', { ascending: true })
    .order('match_number', { ascending: true })

  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('tournament_id', id)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border-b border-white/5 pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
            {/* Game Icon */}
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 shrink-0">
              <Trophy size={40} className="text-white" />
            </div>
            
            <div className="flex-1">
              <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-indigo-400 text-xs font-bold border border-slate-700 mb-2">
                {tournament.games?.name}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{tournament.title}</h1>
              <p className="text-slate-400 max-w-2xl">{tournament.description || 'Tidak ada deskripsi turnamen.'}</p>
            </div>

            <div className="flex flex-col gap-2">
               <span className={`px-4 py-2 rounded-lg text-sm font-bold border text-center ${
                 tournament.status === 'COMPLETED' 
                   ? 'bg-slate-800 text-slate-400 border-slate-700' 
                   : 'bg-green-500/10 text-green-400 border-green-500/20 animate-pulse'
               }`}>
                 {tournament.status === 'COMPLETED' ? 'SELESAI' : 'SEDANG BERLANGSUNG'}
               </span>
               <div className="text-xs text-slate-500 flex items-center gap-1 justify-center">
                 <Calendar size={12} /> {new Date(tournament.created_at).toLocaleDateString()}
               </div>
            </div>
          </div>

          {/* STAGE TABS */}
          {stages && stages.length > 0 && (
            <div className="flex justify-center md:justify-start mt-8 border-b border-white/5">
              {stages.map((s) => (
                <Link
                  key={s.id}
                  href={`?stage=${s.id}`}
                  className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
                    activeStage?.id === s.id 
                      ? 'border-indigo-500 text-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!activeStage ? (
          <div className="text-center py-20 text-slate-500">Belum ada data pertandingan.</div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* VIEW 1: LIGA */}
            {activeStage.type === 'ROUND_ROBIN' && (
              <StandingsTable 
                matches={matches || []} 
                participants={participants || []} 
                tournamentId={id} 
                isReadOnly={true} // <--- PENTING
              />
            )}

            {/* VIEW 2: BRACKET */}
            {(activeStage.type === 'SINGLE_ELIMINATION' || activeStage.type === 'DOUBLE_ELIMINATION') && (
              <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 overflow-hidden relative min-h-[400px]">
                 <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 bg-black/40 backdrop-blur rounded-full text-xs text-slate-500 border border-white/5">
                       Geser Horizontal 👉
                    </span>
                 </div>
                 <BracketVisualizer matches={matches || []} isReadOnly={true} /> {/* <--- PENTING */}
              </div>
            )}

            {/* VIEW 3: BATTLE ROYALE */}
            {activeStage.type === 'LEADERBOARD' && (
               <BRLeaderboard 
                 matches={matches || []}
                 participants={participants || []}
                 tournamentId={id}
                 isReadOnly={true} // <--- PENTING
               />
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="text-center py-8 text-slate-600 text-sm">
        Powered by <span className="text-indigo-500 font-bold">Gridify</span>
      </div>
    </div>
  )
}
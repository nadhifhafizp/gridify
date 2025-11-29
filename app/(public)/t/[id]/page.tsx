import { createClient } from '@/lib/supabase/server'
import { Swords, Trophy, LayoutList, GitGraph, Target, Calendar } from 'lucide-react'
import Link from 'next/link'
import BracketVisualizer from '@/features/bracket/components/bracket-visualizer'
import StandingsTable from '@/features/bracket/components/standings-table'
import BRLeaderboard from '@/features/bracket/components/br-leaderboard'
import ShareButton from '@/features/tournaments/components/share-button'
import { Metadata, ResolvingMetadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ stage?: string }>
}

const getGameName = (gamesData: any) => {
  if (Array.isArray(gamesData)) return gamesData[0]?.name || 'Unknown Game'
  return gamesData?.name || 'Unknown Game'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: tournament } = await supabase.from('tournaments').select('title, description, games(name)').eq('id', id).single()
  
  if (!tournament) return { title: 'Tournament Not Found' }
  const gameName = getGameName(tournament.games)

  return {
    title: `${tournament.title} | Gridify`,
    description: `Ikuti klasemen dan jadwal ${gameName}.`,
  }
}

export default async function PublicTournamentPage({ params, searchParams }: Props) {
  const { id } = await params
  const { stage: stageIdParam } = await searchParams
  const supabase = await createClient()

  // 1. Ambil Data Turnamen
  const { data: tournament } = await supabase.from('tournaments').select('*, games(*)').eq('id', id).single()
  if (!tournament) return <div className="text-white text-center py-20">Turnamen tidak ditemukan.</div>
  const gameName = getGameName(tournament.games)

  // 2. Ambil Stage & Tentukan Aktif
  const { data: stages } = await supabase.from('stages').select('*').eq('tournament_id', id).order('sequence_order', { ascending: true })
  
  const activeStage = stageIdParam ? stages?.find(s => s.id === stageIdParam) : stages?.[0]

  // 3. Ambil Match
  const { data: matches } = await supabase
    .from('matches')
    .select(`*, participant_a:participant_a_id(*), participant_b:participant_b_id(*)`)
    .eq('stage_id', activeStage?.id)
    .order('round_number', { ascending: true })
    .order('match_number', { ascending: true })

  // 4. Ambil Peserta
  const { data: participants } = await supabase.from('participants').select('*').eq('tournament_id', id)

  // Cek Data
  const hasBracket = matches && matches.length > 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border-b border-white/5 pt-12 pb-0 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left mb-8">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 shrink-0">
              <Trophy size={40} className="text-white" />
            </div>
            <div className="flex-1">
              <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-indigo-400 text-xs font-bold border border-slate-700 mb-2">
                {gameName}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{tournament.title}</h1>
              <p className="text-slate-400 max-w-2xl text-sm">{tournament.description || 'Tidak ada deskripsi.'}</p>
            </div>
            <div className="flex flex-col gap-3 items-center md:items-end">
               <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${tournament.status === 'COMPLETED' ? 'bg-slate-800 border-slate-700' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                 {tournament.status === 'COMPLETED' ? 'SELESAI' : 'SEDANG BERLANGSUNG'}
               </span>
               <ShareButton tournamentId={id} />
            </div>
          </div>

          {/* STAGE TABS (Navigasi Antar Babak) */}
          {stages && stages.length > 0 && (
            <div className="flex overflow-x-auto custom-scrollbar">
              {stages.map((s) => {
                const isActive = activeStage?.id === s.id
                return (
                  <Link
                    key={s.id}
                    href={`?stage=${s.id}`}
                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                      isActive 
                        ? 'border-indigo-500 text-white bg-white/5' 
                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {s.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!activeStage ? (
          <div className="text-center py-20 text-slate-500">Data tidak ditemukan.</div>
        ) : !hasBracket ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Swords size={40} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">Belum Ada Pertandingan</h3>
            <p className="text-slate-500">Jadwal untuk babak ini belum dibuat oleh panitia.</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. TABLE VIEW */}
            {activeStage.type === 'ROUND_ROBIN' && (
              <StandingsTable 
                matches={matches || []} 
                participants={participants || []} 
                tournamentId={id} 
                isReadOnly={true}
              />
            )}

            {/* 2. BRACKET VIEW (FIXED LAYOUT) */}
            {(activeStage.type === 'SINGLE_ELIMINATION' || activeStage.type === 'DOUBLE_ELIMINATION') && (
              // Hapus overflow-hidden dari sini, pindahkan logika scroll ke Visualizer
              <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 min-h-[400px]">
                 <div className="flex justify-end mb-4">
                    <span className="px-3 py-1 bg-black/40 backdrop-blur rounded-full text-xs text-slate-500 border border-white/5">
                       Geser Horizontal 👉
                    </span>
                 </div>
                 {/* Visualizer menangani scrollnya sendiri */}
                 <BracketVisualizer matches={matches || []} isReadOnly={true} />
              </div>
            )}

            {/* 3. LEADERBOARD VIEW */}
            {activeStage.type === 'LEADERBOARD' && (
               <BRLeaderboard 
                 matches={matches || []}
                 participants={participants || []}
                 tournamentId={id}
                 isReadOnly={true}
               />
            )}
          </div>
        )}
      </div>

      <div className="text-center py-8 text-slate-600 text-sm">
        Powered by <span className="text-indigo-500 font-bold">Gridify</span>
      </div>
    </div>
  )
}
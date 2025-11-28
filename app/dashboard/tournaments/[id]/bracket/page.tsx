import { createClient } from '@/lib/supabase/server'
import { Swords, Trophy, LayoutList, GitGraph, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import GenerateBracketButton from './generate-button'
import BracketVisualizer from '@/components/bracket/bracket-visualizer'
import StandingsTable from '@/components/bracket/standings-table'

export const dynamic = 'force-dynamic'

export default async function BracketPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ stage?: string }>
}) {
  const { id } = await params
  const { stage: stageIdParam } = await searchParams
  const supabase = await createClient()

  // 1. Ambil Semua Stage
  const { data: stages } = await supabase
    .from('stages')
    .select('*')
    .eq('tournament_id', id)
    .order('sequence_order', { ascending: true })

  // Tentukan Stage Aktif
  const activeStage = stageIdParam 
    ? stages?.find(s => s.id === stageIdParam) 
    : stages?.[0]

  // Jika belum ada stage sama sekali
  if (!stages || stages.length === 0) {
    const { count: participantCount } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', id)

    return <EmptyState tournamentId={id} participantCount={participantCount || 0} />
  }

  // 2. Ambil Match sesuai Stage yang aktif
  const { data: matches } = await supabase
    .from('matches')
    .select(`*, participant_a:participant_a_id(*), participant_b:participant_b_id(*)`)
    .eq('stage_id', activeStage?.id)
    .order('round_number', { ascending: true })
    .order('match_number', { ascending: true })

  // 3. Ambil Peserta
  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('tournament_id', id)

  // Cek apakah bracket/jadwal SUDAH ADA?
  const hasBracket = matches && matches.length > 0

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* HEADER & STAGE SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {activeStage?.type === 'ROUND_ROBIN' ? (
              <LayoutList className="text-blue-400" /> 
            ) : (
              <GitGraph className="text-orange-400" />
            )}
            {activeStage?.name || 'Pertandingan'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Format: <span className="text-indigo-400 font-medium">{activeStage?.type.replace('_', ' ')}</span>
          </p>
        </div>

        {/* TAB MENU (Jika Hybrid) */}
        {stages.length > 1 && (
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10">
            {stages.map((s) => (
              <Link
                key={s.id}
                href={`?stage=${s.id}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeStage?.id === s.id 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}
        
        {/* Tombol Reset (HANYA MUNCUL JIKA BRACKET SUDAH ADA) */}
        {hasBracket && activeStage?.sequence_order === 1 && (
           <GenerateBracketButton 
             tournamentId={id} 
             participantCount={participants?.length || 0} 
             label="Reset Bracket" 
           />
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 animate-in fade-in duration-500">
        
        {/* STATE 1: BELUM ADA BRACKET -> TAMPILKAN EMPTY STATE */}
        {!hasBracket ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-800/30">
              <Swords size={40} className="text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Arena Belum Siap</h3>
            <p className="text-slate-400 max-w-md mb-8">
              Ada <span className="text-indigo-400 font-bold text-lg">{participants?.length || 0}</span> peserta siap.
              <br/>Klik tombol di bawah untuk menyusun jadwal.
            </p>
            
            {/* LABEL TOMBOL DISESUAIKAN: "Buat Bracket" */}
            <GenerateBracketButton 
              tournamentId={id} 
              participantCount={participants?.length || 0} 
              label="Buat Bracket" 
            />
          </div>
        ) : (
          /* STATE 2: SUDAH ADA BRACKET -> TAMPILKAN VISUALIZER */
          <>
            {/* VIEW 1: TABEL KLASEMEN (Liga / Grup) */}
            {activeStage?.type === 'ROUND_ROBIN' && (
              <StandingsTable 
                matches={matches || []} 
                participants={participants || []} 
                tournamentId={id} 
              />
            )}

            {/* VIEW 2: BAGAN POHON (Knockout / Playoff) */}
            {(activeStage?.type === 'SINGLE_ELIMINATION' || activeStage?.type === 'DOUBLE_ELIMINATION') && (
              <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 overflow-hidden relative min-h-[400px]">
                 <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 bg-black/40 backdrop-blur rounded-full text-xs text-slate-500 border border-white/5">
                       Geser Horizontal 👉
                    </span>
                 </div>
                 <BracketVisualizer matches={matches} />
              </div>
            )}

            {/* VIEW 3: LEADERBOARD (Battle Royale) */}
            {activeStage?.type === 'LEADERBOARD' && (
               <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50">
                 <Trophy size={48} className="mx-auto text-yellow-500 mb-4" />
                 <h3 className="text-xl font-bold text-white">Leaderboard Battle Royale</h3>
                 <p className="text-slate-400">Fitur ini akan segera hadir!</p>
               </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

// Komponen Empty State Fallback (Jika stage corrupt)
function EmptyState({ tournamentId, participantCount }: { tournamentId: string, participantCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 ring-4 ring-slate-800/30">
        <Swords size={40} className="text-slate-500" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Arena Belum Siap</h3>
      <p className="text-slate-400 max-w-md mb-8">
        Silakan generate bracket untuk memulai.
      </p>
      <GenerateBracketButton tournamentId={tournamentId} participantCount={participantCount} label="Buat Bracket" />
    </div>
  )
}
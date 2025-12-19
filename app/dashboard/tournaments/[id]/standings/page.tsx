import { createClient } from "@/lib/supabase/server"
import { Trophy, Medal, AlertCircle, Shield } from "lucide-react"

// Tipe Data
type StandingRow = {
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch Data
  const { data: tournament } = await supabase
    .from('tournaments').select('settings').eq('id', id).single()

  const { data: participants } = await supabase
    .from('participants').select('id, name').eq('tournament_id', id)

  const { data: matches } = await supabase
    .from('matches')
    .select('player1_id, player2_id, player1_score, player2_score, status')
    .eq('tournament_id', id)
    .eq('status', 'COMPLETED')

  if (!participants) return <div className="text-slate-400 p-4">Data peserta tidak ditemukan</div>

  // 2. Logic Hitung Poin
  const settings = tournament?.settings as any || {}
  const winPts = Number(settings.pointsPerWin) || 3
  const drawPts = 1

  const standingsMap = new Map<string, StandingRow>()
  participants.forEach(p => {
    standingsMap.set(p.id, {
      teamId: p.id, teamName: p.name,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0
    })
  })

  matches?.forEach(m => {
    const p1 = standingsMap.get(m.player1_id)
    const p2 = standingsMap.get(m.player2_id)
    if (p1 && p2) {
      const s1 = m.player1_score || 0
      const s2 = m.player2_score || 0
      
      p1.played++; p1.gf += s1; p1.ga += s2; p1.gd = p1.gf - p1.ga
      p2.played++; p2.gf += s2; p2.ga += s1; p2.gd = p2.gf - p2.ga

      if (s1 > s2) { p1.won++; p1.points += winPts; p2.lost++ }
      else if (s2 > s1) { p2.won++; p2.points += winPts; p1.lost++ }
      else { p1.drawn++; p1.points += drawPts; p2.drawn++; p2.points += drawPts }
    }
  })

  // Sorting
  const standings = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    return b.gf - a.gf
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Mobile Friendly */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-linear-to-r from-indigo-900/50 to-purple-900/20 p-6 rounded-2xl border border-white/5">
        <div className="p-3 bg-indigo-500/20 rounded-xl shrink-0">
          <Trophy className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          <p className="text-slate-400 text-sm mt-1">
            Klasemen real-time update otomatis setelah match selesai.
          </p>
        </div>
      </div>

      {standings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-900/30">
          <Shield className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-300">Belum Ada Data</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Klasemen akan muncul setelah peserta ditambahkan dan pertandingan dimulai.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tampilan Desktop (Table) */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-sm">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-bold w-16 text-center">#</th>
                  <th className="px-6 py-4 font-bold">Team / Player</th>
                  <th className="px-4 py-4 text-center w-16" title="Played">MP</th>
                  <th className="px-4 py-4 text-center w-16 text-green-400" title="Won">W</th>
                  <th className="px-4 py-4 text-center w-16 text-slate-400" title="Draw">D</th>
                  <th className="px-4 py-4 text-center w-16 text-red-400" title="Lost">L</th>
                  <th className="px-4 py-4 text-center w-16 text-slate-500">GD</th>
                  <th className="px-6 py-4 text-center font-bold text-yellow-400 text-base w-24 bg-white/5">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {standings.map((row, idx) => (
                  <tr key={row.teamId} className={`transition-colors hover:bg-white/5 ${idx < 3 ? 'bg-indigo-500/5' : ''}`}>
                    <td className="px-6 py-4 text-center">
                      {idx === 0 ? <Medal className="w-5 h-5 text-yellow-400 mx-auto" /> : 
                       idx === 1 ? <Medal className="w-5 h-5 text-slate-300 mx-auto" /> : 
                       idx === 2 ? <Medal className="w-5 h-5 text-amber-600 mx-auto" /> : 
                       <span className="font-mono text-slate-500 font-bold">{idx + 1}</span>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{row.teamName}</td>
                    <td className="px-4 py-4 text-center text-slate-300 font-mono">{row.played}</td>
                    <td className="px-4 py-4 text-center text-green-400 font-mono">{row.won}</td>
                    <td className="px-4 py-4 text-center text-slate-400 font-mono">{row.drawn}</td>
                    <td className="px-4 py-4 text-center text-red-400 font-mono">{row.lost}</td>
                    <td className="px-4 py-4 text-center text-slate-500 font-mono">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                    <td className="px-6 py-4 text-center font-bold text-yellow-400 text-lg bg-white/5 shadow-[inset_4px_0_0_0_rgba(255,255,255,0.02)]">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tampilan Mobile (Card List) */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {standings.map((row, idx) => (
              <div key={row.teamId} className="relative p-4 rounded-xl bg-slate-800/50 border border-white/5 flex items-center gap-4 shadow-sm">
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                  idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-600' : 'bg-transparent'
                }`} />
                
                <div className="flex flex-col items-center justify-center w-10 shrink-0">
                   <span className={`text-lg font-bold ${
                     idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                   }`}>#{idx + 1}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate">{row.teamName}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                    <span>MP: {row.played}</span>
                    <span className="text-green-400">W: {row.won}</span>
                    <span className="text-red-400">L: {row.lost}</span>
                    <span>GD: {row.gd > 0 ? `+${row.gd}` : row.gd}</span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center bg-slate-900/50 rounded-lg px-3 py-2 border border-white/5">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Pts</span>
                  <span className="text-xl font-bold text-yellow-400">{row.points}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
import { createClient } from "@/lib/supabase/server"
import { Trophy, AlertCircle } from "lucide-react"

// Tipe Data untuk Klasemen
type StandingRow = {
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number // Gol Memasukkan
  ga: number // Gol Kemasukan
  gd: number // Selisih Gol
  points: number
}

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Ambil Data Turnamen, Peserta, dan Match
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('settings')
    .eq('id', id)
    .single()

  const { data: participants } = await supabase
    .from('participants')
    .select('id, name')
    .eq('tournament_id', id)

  const { data: matches } = await supabase
    .from('matches')
    .select('player1_id, player2_id, player1_score, player2_score, status')
    .eq('tournament_id', id)
    .eq('status', 'COMPLETED') // Hanya hitung match yang selesai

  if (!participants) return <div>Data peserta tidak ditemukan</div>

  // 2. Konfigurasi Poin (Default: Win=3, Draw=1)
  const settings = tournament?.settings as any || {}
  const winPts = Number(settings.pointsPerWin) || 3
  const drawPts = 1

  // 3. Logic Penghitungan Klasemen
  const standingsMap = new Map<string, StandingRow>()

  // Init semua peserta dengan 0
  participants.forEach(p => {
    standingsMap.set(p.id, {
      teamId: p.id,
      teamName: p.name,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0
    })
  })

  // Loop semua match selesai
  matches?.forEach(m => {
    const p1 = standingsMap.get(m.player1_id)
    const p2 = standingsMap.get(m.player2_id)

    if (p1 && p2) {
      const s1 = m.player1_score || 0
      const s2 = m.player2_score || 0

      // Update Played & Goals
      p1.played++; p1.gf += s1; p1.ga += s2; p1.gd = p1.gf - p1.ga
      p2.played++; p2.gf += s2; p2.ga += s1; p2.gd = p2.gf - p2.ga

      // Update Result
      if (s1 > s2) {
        p1.won++; p1.points += winPts
        p2.lost++
      } else if (s2 > s1) {
        p2.won++; p2.points += winPts
        p1.lost++
      } else {
        p1.drawn++; p1.points += drawPts
        p2.drawn++; p2.points += drawPts
      }
    }
  })

  // Konversi ke Array & Sorting (Poin > GD > GF)
  const standings = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    return b.gf - a.gf
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <Trophy className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Standings</h2>
          <p className="text-slate-400 text-sm">Klasemen terkini berdasarkan hasil pertandingan.</p>
        </div>
      </div>

      {standings.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">Belum ada peserta atau pertandingan selesai.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 font-bold">#</th>
                  <th className="px-6 py-4 font-bold">Team</th>
                  <th className="px-4 py-4 text-center">MP</th>
                  <th className="px-4 py-4 text-center">W</th>
                  <th className="px-4 py-4 text-center">D</th>
                  <th className="px-4 py-4 text-center">L</th>
                  <th className="px-4 py-4 text-center hidden sm:table-cell">GF</th>
                  <th className="px-4 py-4 text-center hidden sm:table-cell">GA</th>
                  <th className="px-4 py-4 text-center font-bold text-slate-300">GD</th>
                  <th className="px-6 py-4 text-center font-bold text-yellow-400 text-base">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {standings.map((row, index) => (
                  <tr key={row.teamId} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-white">{row.teamName}</td>
                    <td className="px-4 py-4 text-center text-slate-300">{row.played}</td>
                    <td className="px-4 py-4 text-center text-green-400">{row.won}</td>
                    <td className="px-4 py-4 text-center text-slate-400">{row.drawn}</td>
                    <td className="px-4 py-4 text-center text-red-400">{row.lost}</td>
                    <td className="px-4 py-4 text-center text-slate-500 hidden sm:table-cell">{row.gf}</td>
                    <td className="px-4 py-4 text-center text-slate-500 hidden sm:table-cell">{row.ga}</td>
                    <td className="px-4 py-4 text-center font-bold text-slate-300">
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-yellow-400 text-base shadow-[inset_4px_0_0_0_rgba(250,204,21,0.1)]">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
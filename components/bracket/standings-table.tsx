import { Shield, Swords, Medal } from 'lucide-react'
import LeagueMatchCard from './league-match-card' // Komponen kartu jadwal interaktif
import AdvanceButton from './advance-button' // Tombol lanjut babak

// Tipe data Stat
type Stat = {
  id: string
  name: string
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

export default function StandingsTable({ 
  matches, 
  participants, 
  tournamentId 
}: { 
  matches: any[], 
  participants: any[], 
  tournamentId: string 
}) {
  
  // 1. Grouping Data Peserta berdasarkan Grup (A, B, C...)
  const groups: Record<string, Stat[]> = {}
  
  // Inisialisasi map standings untuk akses cepat
  const standingsMap: Record<string, Stat> = {}

  participants.forEach(p => {
    // Default ke 'League' jika tidak ada grup
    const groupName = p.group_name || 'League'
    
    // Inisialisasi object stat awal (0 semua)
    const stat = {
      id: p.id,
      name: p.name,
      group: groupName,
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0
    }
    
    standingsMap[p.id] = stat

    // Masukkan ke grouping
    if (!groups[groupName]) groups[groupName] = []
    groups[groupName].push(stat) 
  })

  // 2. Hitung Poin dari Data Match
  matches.forEach(m => {
    // Hanya hitung jika status COMPLETED atau skornya sudah terisi
    if (m.status === 'COMPLETED' || (m.scores && (m.scores.a > 0 || m.scores.b > 0))) {
      const pA = standingsMap[m.participant_a_id]
      const pB = standingsMap[m.participant_b_id]
      const sA = parseInt(m.scores?.a || 0)
      const sB = parseInt(m.scores?.b || 0)

      // Pastikan kedua tim ada di map (validasi)
      if (pA && pB) {
        // Update Statistik Tim A
        pA.played++; 
        pA.gf += sA; 
        pA.ga += sB; 
        pA.gd += (sA - sB);

        // Update Statistik Tim B
        pB.played++; 
        pB.gf += sB; 
        pB.ga += sA; 
        pB.gd += (sB - sA);

        // Logika Poin (Menang 3, Seri 1, Kalah 0)
        if (sA > sB) { 
          pA.won++; 
          pA.points += 3; 
          pB.lost++; 
        }
        else if (sA < sB) { 
          pB.won++; 
          pB.points += 3; 
          pA.lost++; 
        }
        else { 
          pA.drawn++; 
          pA.points += 1; 
          pB.drawn++; 
          pB.points += 1; 
        }
      }
    }
  })

  // 3. Cek Apakah Liga Sudah Selesai?
  const totalMatches = matches.length
  const completedMatches = matches.filter(m => m.status === 'COMPLETED').length
  
  // Liga dianggap selesai jika match > 0 DAN semua match statusnya COMPLETED
  const isLeagueFinished = totalMatches > 0 && totalMatches === completedMatches

  // 4. Render Tabel per Grup
  const groupNames = Object.keys(groups).sort()

  return (
    <div className="space-y-12">
      {/* Loop setiap grup (Misal: Grup A, Grup B) */}
      {groupNames.map((groupName) => {
        // Sortir Klasemen: Poin Tertinggi -> Selisih Gol (GD)
        const groupStandings = groups[groupName].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          return b.gd - a.gd
        })

        return (
          <div key={groupName} className="space-y-4">
            {/* Header Grup */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/30">
                {groupName.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-white">
                {groupName === 'League' ? 'Klasemen Liga' : `Grup ${groupName}`}
              </h3>
            </div>

            {/* Tabel Klasemen */}
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 shadow-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-center w-12">#</th>
                    <th className="px-6 py-4 w-full">Tim</th>
                    <th className="px-3 py-4 text-center">MP</th>
                    <th className="px-3 py-4 text-center text-green-400">W</th>
                    <th className="px-3 py-4 text-center text-slate-400">D</th>
                    <th className="px-3 py-4 text-center text-red-400">L</th>
                    <th className="px-3 py-4 text-center font-bold text-slate-300">GD</th>
                    <th className="px-6 py-4 text-center font-black text-white text-base">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {groupStandings.map((team, index) => (
                    <tr key={team.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-center font-mono text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                        {team.name}
                        {/* Label Q (Qualified) untuk 2 teratas di fase grup */}
                        {index < 2 && groupName !== 'League' && (
                          <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30">
                            Q
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-center text-slate-300">{team.played}</td>
                      <td className="px-3 py-4 text-center text-green-400/80">{team.won}</td>
                      <td className="px-3 py-4 text-center text-slate-500">{team.drawn}</td>
                      <td className="px-3 py-4 text-center text-red-400/80">{team.lost}</td>
                      <td className="px-3 py-4 text-center font-mono text-slate-400">
                        {team.gd > 0 ? `+${team.gd}` : team.gd}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-base text-indigo-400">
                        {team.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Bagian Jadwal Pertandingan */}
      <div className="pt-8 border-t border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Swords size={20} className="text-orange-400"/> Jadwal Pertandingan
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            // Menggunakan Komponen Interaktif agar bisa diklik
            <LeagueMatchCard key={match.id} match={match} />
          ))}
        </div>

        {/* State Kosong jika belum ada jadwal */}
        {matches.length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
            Belum ada jadwal pertandingan.
          </div>
        )}
      </div>

      {/* Tombol Lanjut ke Knockout (Hanya jika semua match selesai) */}
      {isLeagueFinished && (
        <div className="pt-4 pb-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <AdvanceButton tournamentId={tournamentId} />
        </div>
      )}

    </div>
  )
}
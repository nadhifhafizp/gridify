'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trophy } from 'lucide-react'
import { updateBRMatchScoreAction } from '@/actions/match-actions'

// Standard Point System
const PLACEMENT_POINTS: Record<number, number> = {
  1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1
}
const KILL_POINT = 1

type ResultRow = {
  teamId: string
  rank: number | ''
  kills: number | ''
  total: number
}

export default function BRScoreModal({ 
  match, 
  participants, 
  tournamentId, 
  onClose 
}: { 
  match: any
  participants: any[]
  tournamentId: string
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ResultRow[]>([])

  // Inisialisasi Data
  useEffect(() => {
    // Cek apakah sudah ada data skor sebelumnya di database?
    const existingResults = match.scores?.results as ResultRow[]

    if (existingResults && existingResults.length > 0) {
      // Jika ada, gabungkan dengan peserta (untuk cover kasus penambahan tim baru)
      const mapped: ResultRow[] = participants.map(p => {
        const found = existingResults.find((r) => r.teamId === p.id)
        // PERBAIKAN: Definisikan tipe object fallback secara eksplisit
        const emptyRow: ResultRow = { teamId: p.id, rank: '', kills: '', total: 0 }
        return found || emptyRow
      })
      // Sortir berdasarkan rank
      setRows(mapped.sort((a, b) => (Number(a.rank) || 99) - (Number(b.rank) || 99)))
    } else {
      // Jika belum ada, buat form kosong
      const initialRows: ResultRow[] = participants.map(p => ({
        teamId: p.id,
        rank: '',
        kills: '',
        total: 0
      }))
      setRows(initialRows)
    }
  }, [match, participants])

  // Hitung ulang total saat Rank/Kill berubah
  const handleChange = (idx: number, field: 'rank' | 'kills', value: string) => {
    const newRows = [...rows]
    const val = parseInt(value) || 0
    
    // Update value (jika string kosong tetap string kosong, jika angka jadi number)
    // TypeScript butuh casting manual di sini agar tidak error saat assign
    if (field === 'rank') {
      newRows[idx].rank = value === '' ? '' : val
    } else {
      newRows[idx].kills = value === '' ? '' : val
    }

    // Hitung Total Otomatis
    const rank = Number(newRows[idx].rank)
    const kills = Number(newRows[idx].kills)
    const placementPts = PLACEMENT_POINTS[rank] || 0
    
    newRows[idx].total = placementPts + (kills * KILL_POINT)

    setRows(newRows)
  }

  const handleSave = async () => {
    setLoading(true)
    
    // Bersihkan data sebelum kirim (convert ke number murni untuk DB)
    const cleanResults = rows.map(r => ({
      teamId: r.teamId,
      rank: Number(r.rank) || 0,
      kills: Number(r.kills) || 0,
      total: r.total
    }))

    const result = await updateBRMatchScoreAction(match.id, cleanResults, tournamentId)
    setLoading(false)

    if (result.success) {
      onClose()
    } else {
      alert('Gagal update skor: ' + result.error)
    }
  }

  const getTeamName = (id: string) => participants.find(p => p.id === id)?.name || 'Unknown'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-white">Input Hasil Match {match.match_number}</h3>
            <p className="text-xs text-slate-400">Masukkan Rank & Total Kill. Poin dihitung otomatis.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-slate-400 font-bold text-xs uppercase sticky top-0 z-10 shadow-lg">
              <tr>
                <th className="px-4 py-3 w-1/2">Tim</th>
                <th className="px-2 py-3 text-center w-20">Rank #</th>
                <th className="px-2 py-3 text-center w-20">Kills</th>
                <th className="px-4 py-3 text-center w-24">Total Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((row, idx) => (
                <tr key={row.teamId} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium text-white">
                    {getTeamName(row.teamId)}
                  </td>
                  <td className="px-2 py-3">
                    <div className="relative">
                      <input 
                        type="number" 
                        value={row.rank}
                        onChange={(e) => handleChange(idx, 'rank', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none"
                        placeholder="-"
                      />
                      {Number(row.rank) === 1 && (
                        <Trophy size={14} className="absolute top-2 right-2 text-yellow-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="relative">
                      <input 
                        type="number" 
                        value={row.kills}
                        onChange={(e) => handleChange(idx, 'kills', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-400 text-lg">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3 shrink-0 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-white text-black font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : <><Save size={16} /> Simpan Hasil</>}
          </button>
        </div>

      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import ScoreModal from './score-modal'

export default function LeagueMatchCard({ match }: { match: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const p1 = match.participant_a
  const p2 = match.participant_b
  const score = match.scores || { a: 0, b: 0 }
  
  // Menang/Kalah styling
  const isAWin = score.a > score.b && match.status === 'COMPLETED'
  const isBWin = score.b > score.a && match.status === 'COMPLETED'

  // Cek kesiapan
  const isReady = p1 && p2

  return (
    <>
      <div 
        onClick={() => isReady && setIsModalOpen(true)}
        className={`relative group bg-slate-900 border p-4 rounded-xl flex justify-between items-center transition-all ${
          isReady 
            ? 'border-slate-800 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-indigo-500/10' 
            : 'border-slate-800/50 opacity-60 cursor-not-allowed'
        }`}
      >
        {/* Tombol Edit Melayang (Hanya muncul saat hover) */}
        {isReady && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm">
              <Edit2 size={12} />
            </div>
          </div>
        )}

        {/* Tim Kiri (Home) */}
        <div className={`flex-1 text-right truncate pr-4 font-medium transition-colors ${isAWin ? 'text-green-400 font-bold' : 'text-slate-300'}`}>
          {p1?.name || 'TBD'}
        </div>

        {/* Skor Tengah */}
        <div className={`px-4 py-1.5 rounded-lg font-mono font-bold text-sm min-w-[70px] text-center border transition-colors ${
          match.status === 'COMPLETED' 
            ? 'bg-slate-950 text-white border-slate-700' 
            : 'bg-slate-800 text-slate-500 border-transparent'
        }`}>
          {match.status === 'COMPLETED' ? (
            `${score.a} - ${score.b}`
          ) : (
            <span className="text-xs">VS</span>
          )}
        </div>

        {/* Tim Kanan (Away) */}
        <div className={`flex-1 text-left truncate pl-4 font-medium transition-colors ${isBWin ? 'text-green-400 font-bold' : 'text-slate-300'}`}>
          {p2?.name || 'TBD'}
        </div>
      </div>

      {/* Modal Input Skor */}
      {isReady && (
        <ScoreModal 
          match={match} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  )
}
'use client' // Tambahkan ini karena kita pakai state untuk modal

import { useState } from 'react'
import { Trophy, Edit2 } from 'lucide-react'
import ScoreModal from './score-modal' // Import modal yang baru dibuat

export default function MatchCard({ match }: { match: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const p1 = match.participant_a
  const p2 = match.participant_b
  const score = match.scores || { a: 0, b: 0 }
  const winnerId = match.winner_id

  // Cek apakah match sudah siap dimainkan (kedua peserta sudah ada)
  const isReady = p1 && p2

  return (
    <>
      <div 
        className="w-64 shrink-0 relative group"
        onClick={() => isReady && setIsModalOpen(true)} // Buka modal saat diklik
      >
        {/* Connector Lines */}
        <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-slate-800 hidden group-last:hidden md:block"></div>
        
        <div className={`border rounded-lg overflow-hidden shadow-lg transition-all relative ${
          isReady 
            ? 'border-slate-700 bg-slate-900/80 cursor-pointer hover:border-indigo-500/50 hover:shadow-indigo-500/10' 
            : 'border-slate-800 bg-slate-950/50 opacity-70 cursor-not-allowed'
        }`}>
          
          {/* Overlay Edit Icon saat Hover (Hanya jika ready) */}
          {isReady && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
              <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <Edit2 size={12} /> Update Skor
              </div>
            </div>
          )}

          {/* Header Match ID */}
          <div className="bg-slate-950 px-3 py-1.5 flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold tracking-wider border-b border-slate-800">
            <span>Match #{match.match_number}</span>
            <span className={match.status === 'COMPLETED' ? 'text-green-500' : ''}>{match.status}</span>
          </div>

          {/* Team A */}
          <div className={`flex justify-between items-center px-4 py-2 border-b border-slate-800 ${winnerId === p1?.id ? 'bg-indigo-900/20' : ''}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`w-2 h-2 rounded-full ${winnerId === p1?.id ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
              <span className={`text-sm font-medium truncate ${winnerId === p1?.id ? 'text-white' : 'text-slate-400'}`}>
                {p1?.name || 'TBD'}
              </span>
            </div>
            <span className="text-sm font-bold font-mono text-slate-300">{score.a ?? 0}</span>
          </div>

          {/* Team B */}
          <div className={`flex justify-between items-center px-4 py-2 ${winnerId === p2?.id ? 'bg-indigo-900/20' : ''}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`w-2 h-2 rounded-full ${winnerId === p2?.id ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
              <span className={`text-sm font-medium truncate ${winnerId === p2?.id ? 'text-white' : 'text-slate-400'}`}>
                {p2?.name || 'TBD'}
              </span>
            </div>
            <span className="text-sm font-bold font-mono text-slate-300">{score.b ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Render Modal */}
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
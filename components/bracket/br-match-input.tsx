'use client'

import { useState } from 'react'
import { Edit2, CheckCircle2 } from 'lucide-react'
import BRScoreModal from './br-score-modal'

export default function BRMatchInput({ match, participants, tournamentId, isReadOnly = false }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const isCompleted = match.status === 'COMPLETED'
  const canEdit = !isReadOnly

  return (
    <>
      <div 
        onClick={() => canEdit && setIsOpen(true)}
        className={`relative p-4 rounded-xl border transition-all group ${
          canEdit ? 'cursor-pointer hover:bg-slate-900' : 'cursor-default'
        } ${
          isCompleted 
            ? 'bg-slate-900 border-slate-700' 
            : 'bg-slate-900/50 border-slate-800'
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-white">Game {match.match_number}</span>
          {isCompleted ? (
            <span className="text-green-400 text-xs flex items-center gap-1 font-bold">
              <CheckCircle2 size={12} /> Selesai
            </span>
          ) : (
            <span className="text-slate-500 text-xs bg-slate-800 px-2 py-0.5 rounded">
              Belum Main
            </span>
          )}
        </div>
        
        {/* Teks Instruksi hanya untuk Admin */}
        {!isReadOnly && (
          <div className="text-xs text-slate-400">
            Klik untuk input Placement & Kills
          </div>
        )}

        {/* Hover Icon hanya untuk Admin */}
        {canEdit && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 size={16} className="text-indigo-400" />
          </div>
        )}
      </div>

      {canEdit && isOpen && (
        <BRScoreModal 
          match={match} 
          participants={participants} 
          tournamentId={tournamentId}
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  )
}
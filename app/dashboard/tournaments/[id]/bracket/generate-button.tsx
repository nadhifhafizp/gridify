'use client'

import { useState } from 'react'
import { generateBracketAction } from '@/actions/bracket-actions'
import { Shuffle } from 'lucide-react'

export default function GenerateBracketButton({ 
  tournamentId, 
  participantCount,
  label = "Generate Bracket Sekarang"
}: { 
  tournamentId: string, 
  participantCount: number,
  label?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    // Validasi Client Side biar gak buang request
    if (participantCount < 2) {
      alert("Minimal butuh 2 peserta!")
      return
    }
    
    // Cek Power of Two (4, 8, 16)
    const isPowerOfTwo = (n: number) => (n & (n - 1)) === 0
    if (!isPowerOfTwo(participantCount)) {
      if(!confirm(`Jumlah peserta ${participantCount} bukan kelipatan 4/8/16. Sistem mungkin error atau butuh BYE. Lanjut paksa?`)) {
        return
      }
    }

    setLoading(true)
    const result = await generateBracketAction(tournamentId)
    setLoading(false)

    if (result?.error) {
      alert("Gagal: " + result.error)
    } else {
      alert("Berhasil! Bracket telah disusun.")
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Shuffle size={20} className={loading ? "animate-spin" : ""} />
      {loading ? "Sedang Mengacak..." : label}
    </button>
  )
}
'use client'

import { useState } from 'react'
import { advanceToKnockoutAction } from '@/actions/stage-actions'
import { ArrowRightCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdvanceButton({ tournamentId }: { tournamentId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAdvance = async () => {
    if(!confirm("Yakin ingin memproses klasemen akhir? Pemenang akan otomatis masuk ke bracket playoff.")) return

    setLoading(true)
    const result = await advanceToKnockoutAction(tournamentId)
    setLoading(false)

    if (result.success) {
      alert("Berhasil! Babak Knockout telah dibuat.")
      // Pindah tab ke Playoffs (Stage selanjutnya) - Opsional, refresh dulu
      router.refresh()
    } else {
      alert("Gagal: " + result.error)
    }
  }

  return (
    <button 
      onClick={handleAdvance}
      disabled={loading}
      className="w-full py-4 mt-6 rounded-xl bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
    >
      {loading ? 'Memproses...' : (
        <>
          Lanjut ke Babak Knockout <ArrowRightCircle />
        </>
      )}
    </button>
  )
}
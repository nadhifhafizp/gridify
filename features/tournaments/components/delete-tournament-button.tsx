'use client'

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { deleteTournament } from "@/features/tournaments/actions/delete-actions" // Pastikan path import ini sesuai

interface DeleteButtonProps {
  id: string
  className?: string
  isIconOnly?: boolean
  redirectTo?: string
}

export function DeleteTournamentButton({ id, className = "", isIconOnly = true, redirectTo }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    // PENTING: Mencegah klik tombol memicu Link di parent card
    e.preventDefault() 
    e.stopPropagation()

    const confirmed = window.confirm("Apakah anda yakin ingin menghapus turnamen ini? Data yang dihapus tidak bisa dikembalikan.")
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteTournament(id)
      // Tidak perlu alert sukses, otomatis hilang karena revalidatePath
    } catch (error) {
      alert("Gagal menghapus turnamen")
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`z-50 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg ${
        isIconOnly ? "p-2" : "px-4 py-2 flex items-center gap-2"
      } ${className}`}
      title="Hapus Turnamen"
    >
      {isDeleting ? (
        <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <Trash2 size={18} />
          {!isIconOnly && <span className="font-medium text-sm">Hapus Turnamen</span>}
        </>
      )}
    </button>
  )
}
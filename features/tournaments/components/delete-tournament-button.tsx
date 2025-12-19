'use client'

import { useState } from "react"
import { useRouter } from "next/navigation" // Import useRouter
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner" // Gunakan Sonner agar seragam
import { deleteTournament } from "@/features/tournaments/actions/delete-actions"

interface DeleteButtonProps {
  id: string
  className?: string
  isIconOnly?: boolean
}

export function DeleteTournamentButton({ id, className = "", isIconOnly = true }: DeleteButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Konfirmasi Native Browser
    const confirmed = window.confirm("Apakah anda yakin ingin menghapus turnamen ini? Data yang dihapus tidak bisa dikembalikan.")
    if (!confirmed) return

    setIsDeleting(true)
    
    try {
      // Panggil Server Action
      const result = await deleteTournament(id)

      if (result.success) {
        toast.success(result.message)
        // Redirect Manual di Client
        router.push('/dashboard/tournaments')
      } else {
        toast.error(result.message || "Gagal menghapus turnamen")
        setIsDeleting(false)
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem")
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`z-50 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg border border-transparent hover:border-red-500/20 ${
        isIconOnly ? "p-2" : "px-4 py-2 flex items-center gap-2"
      } ${className}`}
      title="Hapus Turnamen"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Trash2 size={18} />
          {!isIconOnly && <span className="font-medium text-sm">Hapus Turnamen</span>}
        </>
      )}
    </button>
  )
}
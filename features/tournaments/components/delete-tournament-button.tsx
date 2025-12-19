'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
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

    if (!window.confirm("Yakin hapus turnamen ini permanen?")) return

    setIsDeleting(true)
    try {
      const result = await deleteTournament(id)
      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/tournaments')
      } else {
        toast.error(result.message)
        setIsDeleting(false)
      }
    } catch {
      toast.error("Terjadi kesalahan sistem")
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`transition-all rounded-lg font-medium flex items-center gap-2 ${className} ${
        // Default styling jika className kosong
        !className ? "text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-2" : ""
      }`}
      title="Hapus Turnamen"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Trash2 size={18} />
          {!isIconOnly && <span>Hapus Turnamen</span>}
        </>
      )}
    </button>
  )
}
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
  redirectTo?: string // Tambahkan definisi prop ini
}

export function DeleteTournamentButton({ 
  id, 
  className = "", 
  isIconOnly = true, 
  redirectTo 
}: DeleteButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm("Yakin hapus turnamen ini permanen? Data tidak bisa kembali.")) return

    setIsDeleting(true)
    
    try {
      const result = await deleteTournament(id)

      if (result.success) {
        toast.success(result.message)
        
        // Logic Redirect Fleksibel
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          // Jika tidak ada redirect, refresh halaman saja (cocok untuk list view)
          router.refresh()
        }
      } else {
        toast.error(result.message)
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
      className={`transition-all rounded-lg font-medium flex items-center gap-2 ${className} ${
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
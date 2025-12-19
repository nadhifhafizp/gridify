'use client'

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { deleteParticipant } from "@/features/participants/actions/participant-actions"
import { toast } from "sonner"

export function DeleteParticipantButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    // Konfirmasi sederhana
    if (!confirm("Hapus peserta ini?")) return

    setIsDeleting(true)
    try {
      const result = await deleteParticipant(id)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
      title="Hapus Peserta"
    >
      {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  )
}
"use client";

import { deleteParticipantAction } from "@/features/participants/actions/participant-actions";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function DeleteParticipantButton({
  id,
  tournamentId,
}: {
  id: string;
  tournamentId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus peserta ini?")) return;

    setLoading(true);
    await deleteParticipantAction(id, tournamentId);
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      title="Hapus Peserta"
    >
      <Trash2 size={18} />
    </button>
  );
}

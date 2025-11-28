"use client";

import { useRef, useState } from "react";
import { addParticipantAction } from "@/features/participants/actions/participant-actions";
import { Plus, User, Phone } from "lucide-react";

export default function AddParticipantForm({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    const result = await addParticipantAction(formData);
    setLoading(false);

    if (result?.error) {
      alert("Gagal: " + result.error);
    } else {
      // Reset form kalau sukses
      formRef.current?.reset();
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-sm mb-8">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Plus className="text-indigo-400" size={20} />
        Tambah Peserta Baru
      </h3>

      <form
        ref={formRef}
        action={handleSubmit}
        className="flex flex-col md:flex-row gap-4 items-end"
      >
        <input type="hidden" name="tournamentId" value={tournamentId} />

        <div className="w-full md:flex-1 space-y-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Nama Tim / Pemain
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="name"
              type="text"
              placeholder="Contoh: RRQ Hoshi"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
            />
          </div>
        </div>

        <div className="w-full md:w-1/3 space-y-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Info Kontak (Opsional)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="contact"
              type="text"
              placeholder="WhatsApp / Email"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-[46px]"
        >
          {loading ? "Menyimpan..." : "Tambah"}
        </button>
      </form>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server"
import { Users, UserPlus, Info } from "lucide-react"
import AddParticipantForm from "@/features/participants/components/add-participant-form"
import { DeleteParticipantButton } from "@/features/participants/components/delete-button"

export default async function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Ambil detail turnamen untuk cek status (opsional)
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('status')
    .eq('id', id)
    .single()

  // Ambil data peserta
  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('tournament_id', id)
    .order('created_at', { ascending: true })

  const isLocked = tournament?.status !== 'DRAFT'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Participants</h2>
            <p className="text-slate-400 text-sm">Kelola daftar peserta turnamen.</p>
          </div>
        </div>
        <div className="text-sm font-mono text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-white/5">
          Total: <span className="text-white font-bold">{participants?.length || 0}</span>
        </div>
      </div>

      {isLocked && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
          <Info size={16} />
          <span>Turnamen sedang berjalan atau selesai. Menambah/menghapus peserta mungkin akan mengacaukan bracket.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Form Tambah */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus size={16} /> Tambah Peserta
            </h3>
            <AddParticipantForm tournamentId={id} />
          </div>
        </div>

        {/* Kolom Kanan: List Peserta */}
        <div className="lg:col-span-2 space-y-3">
          {!participants || participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/30">
              <Users className="w-10 h-10 text-slate-600 mb-3" />
              <h4 className="text-slate-300 font-medium">Belum ada peserta</h4>
              <p className="text-slate-500 text-sm">Tambahkan peserta di kolom sebelah kiri.</p>
            </div>
          ) : (
            participants.map((p, idx) => (
              <div key={p.id} className="group flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:bg-slate-800 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-sm font-bold text-slate-300 font-mono border border-white/5">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">{p.name}</p>
                    {p.contact_info ? (
                      <p className="text-xs text-slate-400">{p.contact_info}</p>
                    ) : (
                      <p className="text-xs text-slate-600 italic">Tidak ada info kontak</p>
                    )}
                  </div>
                </div>
                
                {/* Tombol Delete Component */}
                <div className="flex items-center gap-2">
                   <DeleteParticipantButton id={p.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
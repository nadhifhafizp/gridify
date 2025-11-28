import { createClient } from '@/lib/supabase/server'
import AddParticipantForm from '@/components/participants/add-participant-form'
import DeleteParticipantButton from '@/components/participants/delete-button'
import { Users, UserCircle } from 'lucide-react'

export default async function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Ambil data peserta
  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('tournament_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="text-indigo-400" />
          Daftar Peserta
        </h2>
        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-sm border border-slate-700">
          Total: <span className="text-white font-bold">{participants?.length || 0}</span> Tim
        </span>
      </div>

      {/* Form Tambah */}
      <AddParticipantForm tournamentId={id} />

      {/* List Peserta */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants?.map((participant, index) => (
          <div 
            key={participant.id} 
            className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 font-bold">
                {index + 1}
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-medium truncate">{participant.name}</h4>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                  <UserCircle size={12} />
                  {participant.contact_info || 'Tanpa Kontak'}
                </p>
              </div>
            </div>
            
            <DeleteParticipantButton id={participant.id} tournamentId={id} />
          </div>
        ))}

        {(!participants || participants.length === 0) && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <p className="text-slate-500">Belum ada peserta yang terdaftar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
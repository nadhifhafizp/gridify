import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trophy, Users, Calendar, ArrowRight, Gamepad2 } from 'lucide-react'

// Helper untuk format tanggal
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Fetch Real Data: Ambil turnamen milik user ini, join dengan tabel games
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, games(*)') // Join ke tabel games untuk ambil nama game/icon
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  // Hitung stats sederhana
  const totalTournaments = tournaments?.length || 0
  const activeTournaments = tournaments?.filter(t => t.status === 'ONGOING').length || 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Halo, <span className="text-indigo-400 font-medium">{user.email?.split('@')[0]}</span>! Siap kompetisi hari ini?
          </p>
        </div>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          Buat Turnamen
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard label="Total Turnamen" value={totalTournaments} icon={Trophy} color="text-yellow-400" bg="bg-yellow-400/10" />
        <StatsCard label="Turnamen Aktif" value={activeTournaments} icon={Calendar} color="text-green-400" bg="bg-green-400/10" />
        <StatsCard label="Total Peserta" value="-" icon={Users} color="text-blue-400" bg="bg-blue-400/10" />
      </div>

      {/* List Turnamen */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Gamepad2 size={20} className="text-purple-400" />
          Turnamen Saya
        </h2>
        
        {!tournaments || tournaments.length === 0 ? (
          // EMPTY STATE
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Trophy size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-white">Belum ada turnamen</h3>
            <p className="text-slate-400 mt-2">Mulai buat turnamen pertamamu sekarang!</p>
          </div>
        ) : (
          // REAL LIST
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t: any) => (
              <Link 
                key={t.id} 
                href={`/dashboard/tournaments/${t.id}`}
                className="group relative p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    t.status === 'ONGOING' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    t.status === 'COMPLETED' ? 'bg-slate-700/30 text-slate-400 border-slate-700' :
                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {t.status}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(t.created_at)}</span>
                </div>
                
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                  {t.title}
                </h3>
                
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                  <Gamepad2 size={16} />
                  <span>{t.games?.name || 'Unknown Game'}</span>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">{t.format_type.replace('_', ' ')}</span>
                  <ArrowRight size={18} className="text-indigo-500 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatsCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
    </div>
  )
}
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteTournamentButton } from "@/features/tournaments/components/delete-tournament-button";
import {
  Plus,
  Trophy,
  Calendar,
  ArrowRight,
  Gamepad2,
  Activity
} from "lucide-react";

// Helper format tanggal
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Fetch Stats: Ambil angka total saja (Count only) agar ringan
  const { count: totalTournaments } = await supabase
    .from("tournaments")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { count: activeTournaments } = await supabase
    .from("tournaments")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("status", "ONGOING");

  // 2. Fetch Recent Data: Ambil HANYA 4 turnamen terbaru
  // Logic: Urutkan dari yang paling baru dibuat.
  // Otomatis menampilkan yang "Baru Dibuat" dan kemungkinan besar yang "Ongoing".
  const { data: recentTournaments } = await supabase
    .from("tournaments")
    .select("*, games(*)")
    .eq("owner_id", user.id)
    // .neq('status', 'COMPLETED') // <-- Aktifkan ini jika ingin menyembunyikan turnamen selesai dari dashboard
    .order("created_at", { ascending: false })
    .limit(4); // Batasi cuma 4 items

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Halo, <span className="text-indigo-400 font-medium">{user.email?.split("@")[0]}</span>!
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

      {/* Stats Cards (Ringkasan Angka) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          label="Total Turnamen"
          value={totalTournaments || 0}
          icon={Trophy}
          color="text-yellow-400"
          bg="bg-yellow-400/10"
        />
        <StatsCard
          label="Sedang Berlangsung"
          value={activeTournaments || 0}
          icon={Activity}
          color="text-green-400"
          bg="bg-green-400/10"
        />
        <StatsCard
          label="Jadwal Mendatang"
          value={0} // Bisa di-query nanti jika ada fitur 'scheduled'
          icon={Calendar}
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
      </div>

      {/* Section: Recent / Ongoing Tournaments */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Gamepad2 size={20} className="text-purple-400" />
            Aktivitas Terbaru
          </h2>
          
          {/* Link "Lihat Semua" hanya muncul jika ada data */}
          {recentTournaments && recentTournaments.length > 0 && (
            <Link 
              href="/dashboard/tournaments" 
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-medium"
            >
              Lihat Semua <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {!recentTournaments || recentTournaments.length === 0 ? (
          // EMPTY STATE (Jika user belum punya data sama sekali)
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center">
            <div className="mx-auto w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Trophy size={28} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-white">Belum ada turnamen</h3>
            <p className="text-slate-400 mt-2 text-sm">
              Mulai kelola turnamen pertamamu sekarang.
            </p>
          </div>
        ) : (
          // CARD LIST (Grid responsif: 1 kolom di HP, 2 di Tablet, 4 di Desktop)
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
  {recentTournaments.map((t: any) => (
    // UBAH: Link diganti Div relative agar bisa menampung tombol delete
    <div
      key={t.id}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300"
    >
      {/* TOMBOL DELETE (Absolute Position di pojok kanan atas) */}
      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <DeleteTournamentButton id={t.id} />
      </div>

      {/* LINK NAVIGASI (Absolute Full Cover) */}
      <Link href={`/dashboard/tournaments/${t.id}`} className="absolute inset-0 z-10" />

      {/* KONTEN KARTU (Pointer Events None supaya klik tembus ke Link, kecuali elemen interaktif) */}
      <div className="pointer-events-none">
        {/* Status Badge & Date */}
        <div className="flex justify-between items-start mb-3">
          <StatusBadge status={t.status} />
          {/* Tanggal agak digeser kiri supaya tidak ketabrak tombol delete */}
          <span className="text-[10px] text-slate-500 font-mono pr-6">
            {formatDate(t.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">
          {t.title}
        </h3>
        
        {/* Game Info */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Gamepad2 size={14} />
          <span className="truncate">{t.games?.name || "Unknown Game"}</span>
        </div>
      </div>

      {/* Footer Card */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          {t.format_type?.replace(/_/g, " ")}
        </span>
        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
          <ArrowRight size={12} className="text-white" />
        </div>
      </div>
    </div>
  ))}
</div>
        )}
      </div>
    </div>
  );
}

// -- Komponen Kecil (Helpers) --

function StatsCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ONGOING: "bg-green-500/10 text-green-400 border-green-500/20",
    COMPLETED: "bg-slate-700/30 text-slate-400 border-slate-700",
    DRAFT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  
  const defaultStyle = "bg-slate-500/10 text-slate-400 border-slate-500/20";

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${styles[status] || defaultStyle}`}>
      {status}
    </span>
  );
}
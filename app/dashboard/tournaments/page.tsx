import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DeleteTournamentButton } from "@/features/tournaments/components/delete-tournament-button";
import Link from "next/link";
import {
  Search,
  Filter,
  Trophy,
  Calendar,
  Gamepad2,
  MoreVertical,
  Plus,
  ArrowRight
} from "lucide-react";

// Helper format tanggal
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// PERBAIKAN DI SINI: Tipe Props disesuaikan untuk Next.js 15
type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function TournamentsPage(props: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. PERBAIKAN UTAMA: Await searchParams sebelum digunakan
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const statusFilter = searchParams.status || "ALL";

  // 2. Build Query Supabase
  let dbQuery = supabase
    .from("tournaments")
    .select("*, games(*)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  // Apply Filter Search (jika ada input search)
  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }

  // Apply Filter Status (jika bukan ALL)
  if (statusFilter !== "ALL") {
    dbQuery = dbQuery.eq("status", statusFilter);
  }

  const { data: tournaments, error } = await dbQuery;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER & ACTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Tournaments</h1>
          <p className="text-slate-400 mt-1">
            Kelola semua kompetisi yang kamu buat di sini.
          </p>
        </div>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus size={20} />
          Turnamen Baru
        </Link>
      </div>

      {/* TOOLBAR: SEARCH & FILTER */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-2 rounded-2xl border border-white/5">
        
        {/* Search Bar (Form Sederhana) */}
        <form className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Cari nama turnamen..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          {/* Hidden input untuk menjaga status saat searching */}
          {statusFilter !== "ALL" && <input type="hidden" name="status" value={statusFilter} />}
        </form>

        {/* Filter Tabs */}
        <div className="flex bg-slate-950/50 p-1 rounded-xl border border-white/10 overflow-x-auto">
          {["ALL", "ONGOING", "DRAFT", "COMPLETED"].map((tab) => {
            const isActive = statusFilter === tab;
            return (
              <Link
                key={tab}
                href={`/dashboard/tournaments?status=${tab}${query ? `&q=${query}` : ""}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                {tab === "ALL" ? "Semua" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Link>
            );
          })}
        </div>
      </div>

      {/* LIST CONTENT */}
      {!tournaments || tournaments.length === 0 ? (
        // EMPTY STATE
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-700 rounded-3xl bg-slate-900/20">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white">Tidak ditemukan</h3>
          <p className="text-slate-400 mt-2 text-center max-w-md">
            {query 
              ? `Tidak ada turnamen dengan nama "${query}". Coba kata kunci lain.` 
              : "Belum ada turnamen di kategori ini."}
          </p>
          {query && (
            <Link href="/dashboard/tournaments" className="mt-4 text-indigo-400 hover:text-indigo-300">
              Reset Pencarian
            </Link>
          )}
        </div>
      ) : (
        // CARD GRID
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tournaments.map((t) => (
                <div
                key={t.id}
                className="group relative flex flex-col justify-between h-full bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300 overflow-hidden"
                >
                    {/* Link Navigasi Full */}
                    <Link href={`/dashboard/tournaments/${t.id}`} className="absolute inset-0 z-10" />

                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none" />

                <div className="pointer-events-none">
                    <div className="flex justify-between items-start mb-4 relative z-20">
                        <StatusBadge status={t.status} />
                        
                        {/* TOMBOL DELETE DIGANTI DARI PLACEHOLDER SEBELUMNYA */}
                        {/* Kita set pointer-events-auto supaya bisa diklik */}
                        <div className="pointer-events-auto">
                        <DeleteTournamentButton id={t.id} className="text-slate-600 hover:bg-red-500/10 hover:text-red-500" />
                        </div>
                    </div>

                    {/* Title & Icon */}
                    <div className="relative z-10 mb-4">
                        <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                            <Calendar size={12} />
                            {formatDate(t.created_at)}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {t.title}
                        </h3>
                    </div>
                </div>

                {/* Footer Card */}
                <div className="relative z-10 pt-4 mt-2 border-t border-white/5 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    <Gamepad2 size={16} />
                    <span className="truncate max-w-[100px]">{t.games?.name || "Game"}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        Manage <ArrowRight size={16} />
                    </div>
                </div>
            </div>
            ))}
            </div>
      )}
    </div>
  );
}

// Komponen Badge Status
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ONGOING: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    COMPLETED: "bg-slate-700/30 text-slate-400 border-slate-700",
    DRAFT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${styles[status] || "bg-slate-800 text-slate-400"}`}>
      {status}
    </span>
  );
}
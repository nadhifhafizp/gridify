import { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RealtimeListener from "@/components/providers/tournament/realtime-listener";
import {
  Trophy,
  Users,
  Settings,
  LayoutGrid,
  Share2,
  ChevronLeft,
} from "lucide-react";

type Props = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export default async function TournamentLayout({ children, params }: Props) {
  // 1. Ambil ID dari params (Next.js 15: params harus di-await)
  const { id } = await params;
  const supabase = await createClient();

  // 2. Validasi User Session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 3. Fetch Data Turnamen (Sekalian validasi ownership)
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (!tournament) {
    notFound();
  }

  // 4. Cek apakah user adalah pemilik turnamen
  if (tournament.owner_id !== user.id) {
    // Jika bukan owner, redirect ke dashboard utama (atau halaman 403)
    redirect("/dashboard");
  }

  // Menu Navigasi Tab
  const navItems = [
    {
      label: "Overview",
      href: `/dashboard/tournaments/${id}`,
      icon: LayoutGrid,
    },
    {
      label: "Bracket & Matches",
      href: `/dashboard/tournaments/${id}/bracket`,
      icon: Trophy,
    },
    {
      label: "Participants",
      href: `/dashboard/tournaments/${id}/participants`,
      icon: Users,
    },
    {
      label: "Settings",
      href: `/dashboard/tournaments/${id}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* --- REALTIME LISTENER --- */}
      {/* Dipasang di sini agar aktif di semua sub-halaman turnamen */}
      <RealtimeListener tournamentId={id} />

      {/* HEADER TURNAMEN */}
      <header className="bg-slate-900 border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto w-full">
          {/* Breadcrumb / Back */}
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="text-indigo-500" />
                {tournament.title}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {
                  tournament.game_id /* Anda bisa fetch nama game jika perlu join */
                }
                •{" "}
                <span className="uppercase text-xs font-bold bg-slate-800 px-2 py-0.5 rounded">
                  {tournament.format_type.replace("_", " ")}
                </span>
              </p>
            </div>

            {/* Tombol Share (Opsional) */}
            <div className="flex items-center gap-3">
              <Link
                href={`/t/${id}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-all border border-white/5"
              >
                <Share2 size={16} /> Public Page
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="border-b border-white/5 bg-slate-900/50 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <nav className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative px-4 py-3 flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors whitespace-nowrap"
              >
                <item.icon
                  size={16}
                  className="group-hover:text-indigo-400 transition-colors"
                />
                {item.label}
                {/* Indikator Active State bisa ditambahkan dengan logic usePathname jika ingin lebih detail */}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">{children}</main>
    </div>
  );
}

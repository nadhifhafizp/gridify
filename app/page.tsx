import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Swords,
  Users,
  Zap,
  LayoutGrid,
  ArrowRight,
  CheckCircle2,
  Share2,
  Crown,
} from "lucide-react";

// --- KOMPONEN UI KECIL (Bisa dipisah ke file komponen nanti) ---

const FeatureCard = ({ icon: Icon, title, desc, className = "" }: any) => (
  <div
    className={`p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 hover:bg-slate-900/80 transition-all group ${className}`}
  >
    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
      <Icon className="text-indigo-400" size={24} />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

const StepCard = ({ number, title, desc }: any) => (
  <div className="relative flex flex-col items-center text-center p-4">
    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-black text-white mb-4 z-10 relative">
      {number}
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-lg -z-10"></div>
    </div>
    <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
    <p className="text-slate-400 text-sm">{desc}</p>
  </div>
);

// --- HALAMAN UTAMA ---

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white text-lg">G</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">
              Gridify
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">
              Fitur
            </a>
            <a href="#formats" className="hover:text-white transition-colors">
              Format
            </a>
            <a
              href="#how-it-works"
              className="hover:text-white transition-colors"
            >
              Cara Kerja
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-white text-slate-950 text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-white/5"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] opacity-30 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-[128px]"></div>
          <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-500 rounded-full blur-[128px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-white/10 text-indigo-400 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            v1.0 Now Available for Everyone
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Manage Tournaments.
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient">
              Visualize Victory.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Platform pembuat bracket paling modern untuk esports dan komunitas.
            Mendukung Single Elimination, Liga, hingga Battle Royale dalam satu
            tempat.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link
              href="/dashboard/create"
              className="px-8 py-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] flex items-center gap-2"
            >
              <Trophy size={20} />
              Buat Turnamen
            </Link>
            <Link
              href="#demo"
              className="px-8 py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-lg hover:bg-slate-800 hover:text-white transition-all hover:border-slate-600"
            >
              Lihat Demo
            </Link>
          </div>
        </div>

        {/* HERO VISUAL MOCKUP (Abstract Bracket) */}
        <div className="mt-20 max-w-6xl mx-auto relative animate-in fade-in zoom-in-95 duration-1000 delay-500">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-4 md:p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            {/* Mockup UI: Header */}
            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Trophy className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Grand Championship Season 1
                </h3>
                <p className="text-slate-500 text-xs">
                  Mobile Legends • Double Elimination
                </p>
              </div>
              <div className="ml-auto px-3 py-1 bg-green-500/10 text-green-400 rounded text-xs font-bold border border-green-500/20">
                ONGOING
              </div>
            </div>

            {/* Mockup UI: Bracket Skeleton */}
            <div className="grid grid-cols-4 gap-8 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
              {/* Round 1 */}
              <div className="space-y-8 mt-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-slate-800 rounded-lg border border-slate-700"
                  ></div>
                ))}
              </div>
              {/* Round 2 */}
              <div className="space-y-20 mt-20">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-slate-800 rounded-lg border border-slate-700 relative"
                  >
                    <div className="absolute -left-8 top-1/2 w-8 h-0.5 bg-slate-700"></div>
                  </div>
                ))}
              </div>
              {/* Semifinal */}
              <div className="space-y-0 mt-44">
                <div className="h-20 bg-slate-800 rounded-lg border border-slate-700 relative shadow-[0_0_30px_rgba(99,102,241,0.2)] border-indigo-500/50">
                  <div className="absolute -left-8 top-1/2 w-8 h-0.5 bg-slate-700"></div>
                </div>
              </div>
              {/* Winner */}
              <div className="space-y-0 mt-44 flex items-center">
                <div className="h-24 w-full bg-linear-to-br from-yellow-500/20 to-amber-900/10 rounded-xl border border-yellow-500/30 flex flex-col items-center justify-center">
                  <Crown className="text-yellow-500 mb-2" size={24} />
                  <span className="text-yellow-500 font-bold text-sm">
                    CHAMPION
                  </span>
                </div>
              </div>
            </div>

            {/* Overlay Gradient Bottom */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-slate-950 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* 3. TRUSTED BY / GAMES */}
      <section className="py-10 border-y border-white/5 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">
            Optimized for Competitive Games
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {[
              "Mobile Legends",
              "Valorant",
              "PUBG Mobile",
              "Free Fire",
              "E-Football",
            ].map((game) => (
              <span
                key={game}
                className="text-xl font-black text-slate-300 hover:text-white cursor-default"
              >
                {game}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITION (Bento Grid) */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Everything You Need to <br /> Run the Show.
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Fitur lengkap untuk organizer amatir hingga profesional. Gridify
              mengurus teknisnya, kamu fokus pada pertandingannya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Besar Kiri */}
            <div className="md:col-span-2 p-8 rounded-3xl bg-slate-900 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-all"></div>
              <Swords className="text-indigo-400 mb-6" size={40} />
              <h3 className="text-2xl font-bold text-white mb-3">
                Multi-Format Support
              </h3>
              <p className="text-slate-400 max-w-md">
                Tidak hanya Single Elimination. Gridify mendukung Double
                Elimination (Lower Bracket), Round Robin (Liga), hingga format
                Battle Royale dengan sistem poin otomatis.
              </p>
              <div className="mt-8 flex gap-2">
                {["Knockout", "League", "UCL Hybrid", "Battle Royale"].map(
                  (t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300 border border-slate-700"
                    >
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Card Kanan Atas */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-white/5 group hover:border-indigo-500/30 transition-colors">
              <Zap className="text-yellow-400 mb-6" size={40} />
              <h3 className="text-xl font-bold text-white mb-3">
                Automated Advancement
              </h3>
              <p className="text-slate-400 text-sm">
                Input skor, dan sistem otomatis memindahkan pemenang ke ronde
                berikutnya. Tidak perlu gambar manual di kertas atau Excel.
              </p>
            </div>

            {/* Card Kanan Bawah */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-white/5 group hover:border-green-500/30 transition-colors">
              <Share2 className="text-green-400 mb-6" size={40} />
              <h3 className="text-xl font-bold text-white mb-3">
                Public Share Link
              </h3>
              <p className="text-slate-400 text-sm">
                Bagikan link unik ke peserta. Mereka bisa melihat jadwal,
                klasemen, dan bracket secara realtime dari HP mereka.
              </p>
            </div>

            {/* Card Panjang Bawah */}
            <div className="md:col-span-3 p-8 rounded-3xl bg-linear-to-r from-slate-900 to-slate-800 border border-white/5 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Battle Royale Leaderboard
                </h3>
                <p className="text-slate-400">
                  Sistem khusus untuk game seperti PUBG/FF. Input Rank & Kills,
                  poin total dihitung otomatis oleh sistem Gridify.
                </p>
              </div>
              <div className="flex-1 w-full bg-slate-950/50 rounded-xl border border-white/10 p-4">
                {/* Mini Table Mockup */}
                <div className="flex justify-between text-xs text-slate-500 mb-2 border-b border-white/5 pb-2">
                  <span>TEAM</span> <span>PTS</span>
                </div>
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="flex justify-between items-center py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                          n === 1
                            ? "bg-yellow-500 text-black"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        {n}
                      </span>
                      <span className="text-white font-bold text-sm">
                        Team {String.fromCharCode(64 + n)}
                      </span>
                    </div>
                    <span className="text-indigo-400 font-bold">
                      {100 - n * 15}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-900/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white mb-4">
              As Easy as 1-2-3
            </h2>
            <p className="text-slate-400">
              Tidak perlu skill teknis. Siapapun bisa jadi organizer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-10 left-0 w-full h-0.5 bg-slate-800 -z-10"></div>

            <StepCard
              number="1"
              title="Create"
              desc="Isi nama turnamen, pilih game, dan tentukan format (Knockout/League)."
            />
            <StepCard
              number="2"
              title="Add Participants"
              desc="Masukkan nama tim atau peserta. Sistem akan mengacak bracket secara otomatis."
            />
            <StepCard
              number="3"
              title="Manage"
              desc="Update skor saat pertandingan selesai. Bracket terupdate otomatis."
            />
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/10"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px]"></div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Organize?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Bergabunglah dengan ratusan komunitas game lainnya. Buat turnamen
            pertamamu sekarang, gratis!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition-all shadow-lg shadow-white/10"
            >
              Daftar Gratis
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-xl bg-slate-800 text-white font-bold text-lg hover:bg-slate-700 transition-all border border-slate-700"
            >
              Masuk Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 border-t border-white/5 bg-slate-950 text-center md:text-left">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="font-bold text-white text-xs">G</span>
              </div>
              <span className="text-lg font-bold text-white">Gridify</span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs mx-auto md:mx-0">
              Platform manajemen turnamen esport modern yang dibuat untuk
              komunitas.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#" className="hover:text-indigo-400">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400">
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#" className="hover:text-indigo-400">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-indigo-400">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-slate-600">
          © 2024 Gridify. All rights reserved. Built with ❤️ for Gamers.
        </div>
      </footer>
    </div>
  );
}

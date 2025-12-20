"use client";

import Link from "next/link";
import { Gamepad2, User, LayoutDashboard, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Terima prop user (bisa null)
export default function Navbar({ user }: { user: SupabaseUser | null }) {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-110">
            <Gamepad2 className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400">
            Gridify
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link href="#features" className="hover:text-white transition-colors">
            Fitur
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-white transition-colors"
          >
            Cara Kerja
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Komunitas
          </Link>
        </div>

        {/* Auth Buttons / User Profile */}
        <div className="flex items-center gap-4">
          {user ? (
            // STATE: SUDAH LOGIN
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs text-slate-400 font-medium">
                  Welcome back,
                </span>
                <span className="text-sm font-bold text-white max-w-[120px] truncate">
                  {user.email?.split("@")[0]}
                </span>
              </div>

              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-500/5"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            </div>
          ) : (
            // STATE: BELUM LOGIN
            <>
              <Link
                href="/login"
                className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-white text-slate-950 text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-white/5"
              >
                Daftar Gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

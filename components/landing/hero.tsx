"use client";

import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] opacity-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-[128px]" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-500 rounded-full blur-[128px]" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-white/10 text-indigo-400 text-xs font-bold mb-6"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          New: Battle Royale Mode Supported 🚀
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight"
        >
          Kelola Turnamen Esport <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-purple-400 to-indigo-400">
            Tanpa Ribet.
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Platform pembuat bracket paling modern. Dukung format Single
          Elimination, Double Elimination, Liga, hingga Battle Royale dengan
          Realtime Updates.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/dashboard/create"
            className="px-8 py-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] flex items-center gap-2"
          >
            <Trophy size={20} />
            Buat Turnamen Sekarang
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-lg hover:bg-slate-800 hover:text-white transition-all hover:border-slate-600 flex items-center gap-2 group"
          >
            Masuk Dashboard
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

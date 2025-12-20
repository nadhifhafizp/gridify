"use client";

import {
  Zap,
  Swords,
  Users,
  ShieldCheck,
  Share2,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Zap,
    title: "Realtime Updates",
    desc: "Skor terupdate secara instan di layar penonton tanpa perlu refresh halaman. Didukung oleh Supabase Realtime.",
    color: "text-yellow-400",
  },
  {
    icon: Swords,
    title: "Multi-Format Support",
    desc: "Satu platform untuk semua. Single Elimination, Double Elimination, Round Robin (Liga), hingga Battle Royale.",
    color: "text-indigo-400",
  },
  {
    icon: Users,
    title: "Smart Grouping",
    desc: "Algoritma otomatis untuk membagi tim ke dalam grup secara adil (Snake Draft) dan rotasi match yang seimbang.",
    color: "text-green-400",
  },
  {
    icon: BarChart3,
    title: "Leaderboard Otomatis",
    desc: "Input placement & kills, sistem kami yang menghitung total poin dan menyusun klasemen secara otomatis.",
    color: "text-blue-400",
  },
  {
    icon: ShieldCheck,
    title: "Type-Safe System",
    desc: "Dibangun dengan TypeScript & Zod untuk menjamin data turnamen Anda aman, valid, dan konsisten.",
    color: "text-emerald-400",
  },
  {
    icon: Share2,
    title: "Public Page",
    desc: "Halaman khusus untuk penonton dengan tampilan bracket visual yang interaktif dan responsif di mobile.",
    color: "text-pink-400",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-24 px-6 relative bg-slate-900/30 border-y border-white/5"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Fitur Kelas Profesional.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Gridify dirancang untuk menangani kompleksitas turnamen, dari skala
            komunitas hingga major event.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-slate-950 border border-slate-800 hover:border-indigo-500/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className={feature.color} size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

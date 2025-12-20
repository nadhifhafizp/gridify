"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Buat Turnamen",
    desc: "Isi detail turnamen, pilih game, dan tentukan format (Knockout/League/BR).",
  },
  {
    num: "02",
    title: "Tambah Peserta",
    desc: "Input tim secara manual. Sistem akan mengacak seeding/grouping secara otomatis.",
  },
  {
    num: "03",
    title: "Jalankan Match",
    desc: "Update skor pertandingan. Bracket dan klasemen akan terupdate secara realtime.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-white mb-4">Semudah 1-2-3</h2>
          <p className="text-slate-400">
            Tidak perlu skill teknis. Siapapun bisa jadi organizer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-slate-700 to-transparent -z-10" />

          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="relative flex flex-col items-center text-center p-4 bg-slate-950/50 md:bg-transparent rounded-xl"
            >
              <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center text-2xl font-black text-white mb-6 z-10 shadow-xl relative">
                {step.num}
                <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full -z-10" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                {step.title}
              </h4>
              <p className="text-slate-400 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

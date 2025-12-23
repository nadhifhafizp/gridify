"use client";

import { Trophy } from "lucide-react";
import { Match, Participant, Tournament } from "@/types/database";

interface ChampionsViewProps {
  tournament: Tournament;
  matches: Match[];
  participants: Participant[];
  standings?: any[]; // Data klasemen untuk Round Robin / Battle Royale
}

export default function ChampionsView({
  tournament,
  matches,
  participants,
  standings,
}: ChampionsViewProps) {
  // Ambil format_type dan settings dari object tournament
  const { format_type: type, settings } = tournament;
  
  // State untuk menyimpan data juara
  let champions: { 
    first?: Participant; 
    second?: Participant; 
    third?: Participant 
  } = {};

  // --- LOGIC 1: SINGLE / DOUBLE ELIMINATION ---
  if (type === "SINGLE_ELIMINATION" || type === "DOUBLE_ELIMINATION") {
    // Filter match yang sudah selesai (COMPLETED)
    const completedMatches = matches.filter((m) => m.status === "COMPLETED");
    
    // Jika belum ada match selesai, return null (belum ada juara)
    if (completedMatches.length === 0) return null; 

    // Cari Grand Final: Match yang tidak punya 'next_match_id' (ujung bracket)
    // Atau bisa juga cari match dengan round_number tertinggi (999 dsb)
    const finalMatch = completedMatches.find(m => !m.next_match_id);

    if (finalMatch && finalMatch.winner_id) {
      // JUARA 1: Pemenang Final
      champions.first = participants.find(p => p.id === finalMatch.winner_id);
      
      // JUARA 2: Yang kalah di Final
      const loserId = finalMatch.winner_id === finalMatch.participant_a_id 
        ? finalMatch.participant_b_id 
        : finalMatch.participant_a_id;
      champions.second = participants.find(p => p.id === loserId);

      // JUARA 3: Cek setting 'hasThirdPlace'
      if (settings?.hasThirdPlace) {
        // Logic mencari juara 3:
        // Biasanya adalah pemenang dari match tipe "Bronze Match".
        // Karena struktur database match anda dinamis, kita perlu logic spesifik.
        // OPSI: Cari match yang winner-nya BUKAN peserta final, tapi statusnya COMPLETED di round akhir.
        // Untuk saat ini kita fokus ke Juara 1 & 2 agar aman.
      }
    }
  } 
  // --- LOGIC 2: ROUND ROBIN / BATTLE ROYALE ---
  else if (type === "ROUND_ROBIN" || type === "BATTLE_ROYALE") {
    // Ambil dari data klasemen (standings) yang sudah diurutkan
    if (standings && standings.length > 0) {
      // Asumsi standings berisi object { participant: ... } atau langsung participant
      champions.first = standings[0]?.participant || standings[0];
      champions.second = standings[1]?.participant || standings[1];
      champions.third = standings[2]?.participant || standings[2];
    }
  }

  // --- LOGIC TAMPILAN KHUSUS ---
  // Sembunyikan Juara 2 & 3 jika Single Elimination tanpa Bronze Match
  const showOnlyWinner = 
    (type === "SINGLE_ELIMINATION" && !settings?.hasThirdPlace);

  // Jika belum ada Juara 1, jangan tampilkan apapun
  if (!champions.first) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 mb-10 bg-slate-900/40 rounded-2xl border border-slate-800/60 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-white mb-10 tracking-widest uppercase flex items-center gap-3">
        <Trophy className="text-yellow-500 w-6 h-6" /> 
        Tournament Champions
      </h2>

      <div className="flex items-end justify-center gap-4 md:gap-16">
        
        {/* --- JUARA 2 (SILVER) --- */}
        {!showOnlyWinner && champions.second && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 order-1">
            <div className="relative group">
              <Trophy 
                size={64} 
                className="text-slate-400 drop-shadow-[0_0_15px_rgba(148,163,184,0.4)] transition-transform group-hover:scale-110 duration-300" 
                strokeWidth={1.5} 
              />
              <div className="absolute -bottom-3 -right-3 bg-slate-800 text-slate-200 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-600 shadow-sm">
                #2
              </div>
            </div>
            <div className="mt-5 text-center">
              <p className="text-lg font-bold text-slate-300 max-w-30 truncate">
                {champions.second.name}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                Runner Up
              </p>
            </div>
          </div>
        )}

        {/* --- JUARA 1 (GOLD) - CENTER & LARGEST --- */}
        {champions.first && (
          <div className="flex flex-col items-center z-10 -mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700 order-2">
            <div className="relative group">
              {/* Efek Glow */}
              <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
              
              <Trophy 
                size={100} 
                className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)] relative z-10 transition-transform group-hover:scale-105 duration-300" 
                strokeWidth={1.5} 
                fill="currentColor" 
                fillOpacity={0.15}
              />
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-linear-to-r from-yellow-600 to-yellow-500 text-white text-sm font-bold px-4 py-1 rounded-full border border-yellow-400 shadow-lg z-20">
                #1
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-3xl font-black max-w-60 truncate bg-linear-to-r from-yellow-100 via-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
                {champions.first.name}
              </p>
              <p className="text-xs text-yellow-500/90 uppercase font-black tracking-[0.25em] mt-2">
                Grand Champion
              </p>
            </div>
          </div>
        )}

        {/* --- JUARA 3 (BRONZE) --- */}
        {!showOnlyWinner && champions.third && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 order-3">
            <div className="relative group">
              <Trophy 
                size={52} 
                className="text-amber-700 drop-shadow-[0_0_15px_rgba(180,83,9,0.4)] transition-transform group-hover:scale-110 duration-300" 
                strokeWidth={1.5} 
              />
              <div className="absolute -bottom-3 -right-3 bg-amber-900 text-amber-100 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-800 shadow-sm">
                #3
              </div>
            </div>
            <div className="mt-5 text-center">
              <p className="text-base font-bold text-amber-600 max-w-25 truncate">
                {champions.third.name}
              </p>
              <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest mt-1">
                3rd Place
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
"use client";

import MatchCard from "./match-card";
import { Trophy } from "lucide-react";
import { MatchWithParticipants } from "../types";

export default function BracketVisualizer({
  matches,
  isReadOnly = false,
}: {
  matches: MatchWithParticipants[];
  isReadOnly?: boolean;
}) {
  // --- 1. Separasi Data Bracket ---
  const upperBracket = matches.filter(
    (m) => m.round_number > 0 && m.round_number < 999
  );
  const lowerBracket = matches.filter((m) => m.round_number < 0);
  const grandFinal = matches.filter((m) => m.round_number === 999);
  
  const hasLowerBracket = lowerBracket.length > 0;

  // Helper: Grouping Matches per Round
  const groupRounds = (matchList: MatchWithParticipants[]) => {
    const rounds = matchList.reduce<Record<number, MatchWithParticipants[]>>(
      (acc, match) => {
        const round = Math.abs(match.round_number);
        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
      },
      {}
    );
    return Object.keys(rounds)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((k) => rounds[parseInt(k)]);
  };

  const ubRounds = groupRounds(upperBracket);
  const lbRounds = groupRounds(lowerBracket);

  // Helper: Determine Champion
  const finalMatch = grandFinal[0] || null;
  const championId = finalMatch?.winner_id;
  const championName = championId
    ? championId === finalMatch?.participant_a_id
      ? finalMatch?.participant_a?.name
      : finalMatch?.participant_b?.name
    : null;

  // Helper: Connector Type Logic
  const getConnectorType = (matchIndex: number) => {
    return matchIndex % 2 === 0 ? "top" : "bottom";
  };

  // --- Helper untuk Penamaan Ronde Esports Style ---
  const getRoundLabel = (roundIdx: number, totalRounds: number, type: "UB" | "LB") => {
    const isFinal = roundIdx === totalRounds - 1;
    const isSemi = roundIdx === totalRounds - 2;
    const isQuarter = roundIdx === totalRounds - 3;

    if (type === "UB") {
        if (isFinal) return "Upper Bracket Final";
        if (isSemi && totalRounds >= 3) return "UB Semifinals";
        if (isQuarter && totalRounds >= 4) return "UB Quarterfinals";
        return `Round ${roundIdx + 1}`;
    } else {
        if (isFinal) return "Lower Bracket Final";
        if (isSemi && totalRounds >= 4) return "LB Semifinals";
        return `LB Round ${roundIdx + 1}`;
    }
  };

  return (
    // FIXED: min-h-[600px] -> min-h-150
    <div className="w-full overflow-x-auto pb-12 pt-8 px-4 custom-scrollbar bg-slate-950 min-h-150 flex items-center">
      {/* WRAPPER UTAMA */}
      <div className="flex gap-20">
        
        {/* --- KOLOM KIRI: UPPER & LOWER BRACKET --- */}
        <div className="flex flex-col gap-24">
          
          {/* A. UPPER BRACKET SECTION */}
          <div className="relative">
             <div className="absolute -top-10 left-0 bg-slate-900/50 text-indigo-400 px-3 py-1 rounded border border-indigo-500/20 text-[10px] font-bold tracking-widest uppercase">
                Upper Bracket
             </div>
             
             <div className="flex gap-16">
               {ubRounds.map((roundMatches, roundIdx) => {
                  const isLastUbRound = roundIdx === ubRounds.length - 1;
                  const roundLabel = getRoundLabel(roundIdx, ubRounds.length, "UB");
                  
                  // Dynamic Gap
                  const gapStyle = { gap: `${Math.pow(2, roundIdx) * 1.5}rem` };

                  return (
                    <div
                      key={`ub-${roundIdx}`}
                      className="flex flex-col justify-center"
                      style={gapStyle}
                    >
                      <div className="text-center mb-3">
                        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest bg-slate-900/80 px-2 py-1 rounded">
                          {roundLabel}
                        </span>
                      </div>
                      
                      {roundMatches
                        .sort((a, b) => a.match_number - b.match_number)
                        .map((m, idx) => (
                          <MatchCard
                            key={m.id}
                            match={m}
                            isReadOnly={isReadOnly}
                            connectorType={isLastUbRound ? "ub-final" : getConnectorType(idx)}
                          />
                        ))}
                    </div>
                  );
               })}
             </div>
          </div>

          {/* B. LOWER BRACKET SECTION */}
          {hasLowerBracket && (
            <div className="relative pt-4 border-t border-slate-800/30">
               <div className="absolute -top-3 left-0 bg-slate-900/50 text-rose-400 px-3 py-1 rounded border border-rose-500/20 text-[10px] font-bold tracking-widest uppercase">
                  Lower Bracket
               </div>

               <div className="flex gap-16 mt-10">
                 {lbRounds.map((roundMatches, roundIdx) => {
                    const isLastLbRound = roundIdx === lbRounds.length - 1;
                    const roundLabel = getRoundLabel(roundIdx, lbRounds.length, "LB");

                    return (
                      <div
                        key={`lb-${roundIdx}`}
                        className="flex flex-col justify-center gap-6"
                      >
                         <div className="text-center mb-3">
                          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest bg-slate-900/80 px-2 py-1 rounded">
                            {roundLabel}
                          </span>
                        </div>

                        {roundMatches
                          .sort((a, b) => a.match_number - b.match_number)
                          .map((m) => (
                            <MatchCard
                              key={m.id}
                              match={m}
                              isReadOnly={isReadOnly}
                              connectorType={isLastLbRound ? "lb-final" : "straight"}
                            />
                          ))}
                      </div>
                    );
                 })}
               </div>
            </div>
          )}
        </div>

        {/* --- KOLOM KANAN: GRAND FINAL --- */}
        {grandFinal.length > 0 && (
           <div className="flex flex-col justify-center relative pl-8">
              
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-0.5 bg-slate-600"></div>

              <div className="flex flex-col items-center gap-6">
                 <div className="text-center">
                    <span className="text-[10px] text-yellow-500 font-black tracking-[0.2em] bg-yellow-500/10 px-4 py-1.5 rounded-full border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                       GRAND FINAL
                    </span>
                 </div>
                 
                 {grandFinal.map(m => (
                    <MatchCard key={m.id} match={m} isReadOnly={isReadOnly} connectorType={null} />
                 ))}

                 {/* CHAMPION DISPLAY */}
                 {finalMatch?.status === "COMPLETED" && championName && (
                    <div className="mt-8 animate-in fade-in zoom-in duration-500">
                      <div className="relative p-6 rounded-2xl bg-linear-to-b from-slate-900 to-slate-950 border border-yellow-500/30 text-center shadow-[0_0_40px_rgba(234,179,8,0.15)]">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-950 p-3 rounded-full border border-yellow-500/30 shadow-lg">
                          <Trophy
                            size={32}
                            className="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                          />
                        </div>
                        <div className="mt-4">
                          <span className="text-[10px] font-bold text-yellow-600 tracking-[0.3em] uppercase block mb-1">
                            CHAMPION
                          </span>
                          <h1 className="text-2xl font-black whitespace-nowrap text-white">
                            {championName}
                          </h1>
                        </div>
                      </div>
                    </div>
                 )}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
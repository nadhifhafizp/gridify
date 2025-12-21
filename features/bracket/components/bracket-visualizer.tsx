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
  // Filter Match
  const upperBracket = matches.filter(
    (m) => m.round_number > 0 && m.round_number < 999
  );
  const lowerBracket = matches.filter((m) => m.round_number < 0);
  const grandFinal = matches.filter((m) => m.round_number === 999);

  const hasLowerBracket = lowerBracket.length > 0;

  // Helper Group Rounds
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

  // Logic Champion
  let finalMatch: MatchWithParticipants | null = null;
  if (grandFinal.length > 0) {
    finalMatch = grandFinal[0];
  } else if (ubRounds.length > 0) {
    const lastRound = ubRounds[ubRounds.length - 1];
    if (lastRound && lastRound.length === 1) {
      finalMatch = lastRound[0];
    }
  }

  const championId = finalMatch?.winner_id;
  const championName = championId
    ? championId === finalMatch?.participant_a_id
      ? finalMatch?.participant_a?.name
      : finalMatch?.participant_b?.name
    : null;

  // Helper untuk menentukan tipe connector (Top/Bottom pair)
  const getConnectorType = (matchIndex: number, isFinalRound: boolean) => {
    if (isFinalRound) return "straight";
    return matchIndex % 2 === 0 ? "top" : "bottom";
  };

  return (
    // FIXED: min-h-[500px] -> min-h-125
    <div className="w-full overflow-x-auto pb-12 pt-8 custom-scrollbar flex flex-col gap-16 bg-slate-950 min-h-125">
      {/* UPPER BRACKET */}
      <div>
        {hasLowerBracket && (
          <h3 className="text-indigo-400 font-bold mb-6 sticky left-0 px-8 bg-slate-950/90 backdrop-blur-sm w-fit rounded-r-lg">
            Upper Bracket
          </h3>
        )}

        <div className="flex gap-16 min-w-max px-8 items-stretch">
          {ubRounds.map((roundMatches, roundIdx) => {
             const isLastRound = roundIdx === ubRounds.length - 1;
             
             // Dynamic style untuk gap vertikal (Manual style diperlukan untuk kalkulasi pangkat)
             const gapStyle = {
                gap: `${Math.pow(2, roundIdx) * 2}rem`
             };

            return (
              <div
                key={roundIdx}
                className="flex flex-col justify-center self-stretch relative"
                style={gapStyle} 
              >
                <div className="absolute -top-10 left-0 right-0 text-center">
                  <span className="text-xs text-slate-500 font-mono font-bold tracking-widest uppercase bg-slate-900 px-2 py-1 rounded">
                    Round {roundIdx + 1}
                  </span>
                </div>
                
                {roundMatches
                  .sort((a, b) => a.match_number - b.match_number)
                  .map((m, idx) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      isReadOnly={isReadOnly}
                      connectorType={
                        isLastRound && grandFinal.length === 0
                          ? null
                          : getConnectorType(idx, isLastRound)
                      }
                    />
                  ))}
              </div>
            );
          })}

          {/* GRAND FINAL COLUMN */}
          {grandFinal.length > 0 && (
            <div className="flex flex-col justify-center self-stretch gap-8 ml-8">
              <div className="text-center mb-2">
                <span className="text-xs text-yellow-500 font-mono font-bold tracking-widest">
                  GRAND FINAL
                </span>
              </div>
              {grandFinal.map((m) => (
                <div key={m.id} className="flex items-center">
                   {/* Garis Masuk ke Grand Final */}
                   {/* FIXED: h-[2px] -> h-0.5, mr-[-1px] -> -mr-px */}
                   <div className="w-8 h-0.5 bg-slate-500 -mr-px"></div>
                   <MatchCard key={m.id} match={m} isReadOnly={isReadOnly} connectorType={null} />
                </div>
              ))}
            </div>
          )}

          {/* CHAMPION DISPLAY */}
          {finalMatch?.status === "COMPLETED" && championName && (
             <div className="flex flex-col justify-center ml-4">
                <div className="flex items-center animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
                  {/* FIXED: h-[2px] -> h-0.5, bg-gradient-to-r -> bg-linear-to-r */}
                  <div className="h-0.5 w-16 bg-linear-to-r from-slate-500 to-yellow-500/50"></div>
                  
                  {/* FIXED: bg-gradient-to-b -> bg-linear-to-b, ml-[-2px] -> -ml-0.5 */}
                  <div className="relative p-6 rounded-2xl bg-linear-to-b from-slate-900 to-slate-900/50 border border-yellow-500/30 text-center shadow-[0_0_50px_rgba(234,179,8,0.15)] -ml-0.5">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-950 p-2 rounded-full border border-yellow-500/30 shadow-lg shadow-yellow-900/20">
                      <Trophy
                        size={28}
                        className="text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]"
                      />
                    </div>
                    {/* FIXED: min-w-[140px] -> min-w-35 */}
                    <div className="mt-4 min-w-35">
                      <span className="text-[10px] font-bold text-yellow-600 tracking-[0.3em] uppercase block mb-1">
                        WINNER
                      </span>
                      {/* FIXED: bg-gradient-to-r -> bg-linear-to-r */}
                      <h1 className="text-xl font-black whitespace-nowrap bg-linear-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                        {championName}
                      </h1>
                    </div>
                  </div>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* LOWER BRACKET */}
      {hasLowerBracket && (
        <div className="border-t border-slate-800/50 pt-12 mt-8">
          <h3 className="text-red-400 font-bold mb-6 sticky left-0 px-8 bg-slate-950/90 backdrop-blur-sm w-fit rounded-r-lg">
            Lower Bracket
          </h3>
          <div className="flex gap-16 min-w-max px-8">
            {lbRounds.map((roundMatches, roundIdx) => (
              <div
                key={roundIdx}
                className="flex flex-col justify-center gap-8 self-stretch relative"
              >
                 <div className="text-center mb-6">
                  <span className="text-xs text-slate-600 font-mono font-bold">
                    LB Round {roundIdx + 1}
                  </span>
                </div>
                {roundMatches
                  .sort((a, b) => a.match_number - b.match_number)
                  .map((m) => (
                    <MatchCard key={m.id} match={m} isReadOnly={isReadOnly} connectorType="straight" />
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
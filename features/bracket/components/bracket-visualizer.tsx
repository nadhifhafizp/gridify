import MatchCard from "./match-card";
import { Trophy } from "lucide-react";
import { Match, Participant } from "@/types/database";

// Tipe gabungan yang dibutuhkan komponen MatchCard
type MatchWithParticipants = Match & {
  participant_a: Participant | null;
  participant_b: Participant | null;
};

export default function BracketVisualizer({
  matches,
  isReadOnly = false,
}: {
  matches: any[]; // Data dari Supabase seringkali raw, jadi any/unknown lalu cast di map
  isReadOnly?: boolean;
}) {
  const upperBracket = matches.filter(
    (m) => m.round_number > 0 && m.round_number < 999
  );
  const lowerBracket = matches.filter((m) => m.round_number < 0);
  const grandFinal = matches.filter((m) => m.round_number === 999);

  const hasLowerBracket = lowerBracket.length > 0;

  const groupRounds = (matchList: any[]) => {
    const rounds = matchList.reduce((acc: any, match) => {
      const round = Math.abs(match.round_number);
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {});
    return Object.keys(rounds)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((k) => rounds[k]);
  };

  const ubRounds = groupRounds(upperBracket);
  const lbRounds = groupRounds(lowerBracket);

  let finalMatch = null;
  if (grandFinal.length > 0) finalMatch = grandFinal[0];
  // Logic fallback untuk final bracket biasa
  else if (ubRounds.length > 0) {
    const lastRound = ubRounds[ubRounds.length - 1];
    if (lastRound && lastRound.length === 1) finalMatch = lastRound[0];
  }

  const championId = finalMatch?.winner_id;
  const championName = championId
    ? championId === finalMatch?.participant_a_id
      ? finalMatch?.participant_a?.name
      : finalMatch?.participant_b?.name
    : null;

  return (
    <div className="w-full overflow-x-auto pb-12 pt-4 custom-scrollbar flex flex-col gap-12">
      {/* UPPER BRACKET */}
      <div>
        {hasLowerBracket && (
          <h3 className="text-indigo-400 font-bold mb-4 sticky left-0">
            Upper Bracket
          </h3>
        )}

        <div className="flex gap-12 min-w-max px-4 items-center">
          {ubRounds.map((roundMatches: any[], idx) => (
            <div
              key={idx}
              className="flex flex-col justify-around gap-8 self-stretch"
            >
              <div className="text-center mb-2">
                <span className="text-xs text-slate-500 font-mono">
                  Round {idx + 1}
                </span>
              </div>
              <div className="flex flex-col justify-center gap-8 h-full">
                {roundMatches
                  .sort((a: any, b: any) => a.match_number - b.match_number)
                  .map((m: MatchWithParticipants) => (
                    <MatchCard key={m.id} match={m} isReadOnly={isReadOnly} />
                  ))}
              </div>
            </div>
          ))}

          {grandFinal.length > 0 && (
            <div className="flex flex-col justify-center gap-8 self-stretch">
              <div className="text-center mb-2">
                <span className="text-xs text-yellow-500 font-mono font-bold">
                  GRAND FINAL
                </span>
              </div>
              {grandFinal.map((m: MatchWithParticipants) => (
                <MatchCard key={m.id} match={m} isReadOnly={isReadOnly} />
              ))}
            </div>
          )}

          {/* WINNER CARD */}
          {finalMatch?.status === "COMPLETED" && championName && (
            <div className="flex items-center animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="h-0.5 w-12 bg-linear-to-r from-slate-700 to-yellow-500/50"></div>
              <div className="relative p-6 rounded-2xl bg-linear-to-b from-yellow-500/20 to-amber-600/10 border border-yellow-500/50 text-center shadow-[0_0_40px_rgba(234,179,8,0.2)] ml-2">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 p-3 rounded-full border border-yellow-500/50 shadow-lg shadow-yellow-500/20">
                  <Trophy
                    size={32}
                    className="text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]"
                  />
                </div>
                <div className="mt-4 min-w-[120px]">
                  <span className="text-[10px] font-bold text-yellow-500 tracking-[0.2em] uppercase block mb-1">
                    CHAMPION
                  </span>
                  <h1 className="text-2xl font-black whitespace-nowrap bg-linear-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
                    {championName}
                  </h1>
                </div>
                <div className="absolute inset-0 bg-yellow-400/5 blur-xl rounded-2xl -z-10 animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOWER BRACKET */}
      {hasLowerBracket && (
        <div className="border-t border-slate-800 pt-8">
          <h3 className="text-red-400 font-bold mb-4 sticky left-0">
            Lower Bracket
          </h3>
          <div className="flex gap-12 min-w-max px-4">
            {lbRounds.map((roundMatches: any[], idx) => (
              <div
                key={idx}
                className="flex flex-col justify-around gap-8 self-stretch"
              >
                <div className="text-center mb-2">
                  <span className="text-xs text-slate-500 font-mono">
                    LB Round {idx + 1}
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-8 h-full">
                  {roundMatches
                    .sort((a: any, b: any) => a.match_number - b.match_number)
                    .map((m: MatchWithParticipants) => (
                      <MatchCard key={m.id} match={m} isReadOnly={isReadOnly} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

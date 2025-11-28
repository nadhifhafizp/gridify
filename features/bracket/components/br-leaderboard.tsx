import { Trophy, Target } from "lucide-react";
import BRMatchInput from "./br-match-input";

type BRResult = { teamId: string; rank: number; kills: number; total: number };

export default function BRLeaderboard({
  matches,
  participants,
  tournamentId,
  isReadOnly = false, // FIX: Default false
}: {
  matches: any[];
  participants: any[];
  tournamentId: string;
  isReadOnly?: boolean; // FIX: Definisi tipe
}) {
  const leaderboard: Record<
    string,
    {
      id: string;
      name: string;
      wwcd: number;
      kills: number;
      total: number;
      matchesPlayed: number;
    }
  > = {};

  participants.forEach((p) => {
    leaderboard[p.id] = {
      id: p.id,
      name: p.name,
      wwcd: 0,
      kills: 0,
      total: 0,
      matchesPlayed: 0,
    };
  });

  matches.forEach((match) => {
    const results = match.scores?.results as BRResult[];
    if (results && Array.isArray(results)) {
      results.forEach((res) => {
        if (leaderboard[res.teamId]) {
          leaderboard[res.teamId].matchesPlayed += 1;
          leaderboard[res.teamId].kills += res.kills || 0;
          leaderboard[res.teamId].total += res.total || 0;
          if (res.rank === 1) leaderboard[res.teamId].wwcd += 1;
        }
      });
    }
  });

  const sortedLeaderboard = Object.values(leaderboard).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
    return b.kills - a.kills;
  });

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          <h3 className="font-bold text-white">Overall Leaderboard</h3>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400 font-bold text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-center w-12">#</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3 text-center">WWCD</th>
              <th className="px-4 py-3 text-center text-red-400">Kills</th>
              <th className="px-4 py-3 text-center text-slate-400">Matches</th>
              <th className="px-6 py-3 text-center text-white font-black text-base bg-white/5">
                PTS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedLeaderboard.map((team, idx) => (
              <tr
                key={team.id}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-4 py-3 text-center font-mono text-slate-500">
                  {idx + 1}
                </td>
                <td className="px-4 py-3 font-bold text-white">{team.name}</td>
                <td className="px-4 py-3 text-center text-yellow-500 font-bold">
                  {team.wwcd > 0 ? team.wwcd : "-"}
                </td>
                <td className="px-4 py-3 text-center text-red-400">
                  {team.kills}
                </td>
                <td className="px-4 py-3 text-center text-slate-500">
                  {team.matchesPlayed}
                </td>
                <td className="px-6 py-3 text-center font-black text-white text-lg bg-white/5">
                  {team.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Target size={20} className="text-orange-400" /> Hasil Pertandingan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            // FIX: Teruskan isReadOnly ke komponen
            <BRMatchInput
              key={match.id}
              match={match}
              participants={participants}
              tournamentId={tournamentId}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

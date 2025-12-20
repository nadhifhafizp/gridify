"use client";

import { useMemo } from "react";
import { Trophy, Medal, Skull, Target } from "lucide-react";
import { Match, Participant } from "@/types/database";
import { BattleRoyaleResult } from "../types";

// Standard PUBG Mobile Point System (Placeholder logic)
const PLACEMENT_POINTS: Record<number, number> = {
  1: 10,
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 1,
};
const KILL_POINT = 1;

type LeaderboardRow = {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wwcd: number; // Wins
  totalKills: number;
  placementPoints: number;
  totalPoints: number;
};

export default function BRLeaderboard({
  matches,
  participants,
  tournamentId,
  isReadOnly = false,
}: {
  matches: Match[];
  participants: Participant[];
  tournamentId: string;
  isReadOnly?: boolean;
}) {
  // Kalkulasi Leaderboard dari Data Match
  const leaderboard = useMemo(() => {
    const stats: Record<string, LeaderboardRow> = {};

    // 1. Init Stats untuk semua peserta
    participants.forEach((p) => {
      stats[p.id] = {
        teamId: p.id,
        teamName: p.name,
        matchesPlayed: 0,
        wwcd: 0,
        totalKills: 0,
        placementPoints: 0,
        totalPoints: 0,
      };
    });

    // 2. Loop semua match yang sudah COMPLETED
    matches.forEach((match) => {
      if (match.status !== "COMPLETED" || !match.scores?.results) return;

      const results = match.scores.results as BattleRoyaleResult[];

      results.forEach((res) => {
        const team = stats[res.teamId];
        if (!team) return;

        // Pastikan nilai number aman (tidak empty string)
        const rank = typeof res.rank === "number" ? res.rank : 99;
        const kills = typeof res.kills === "number" ? res.kills : 0;

        team.matchesPlayed += 1;
        team.totalKills += kills;
        if (rank === 1) team.wwcd += 1;

        // Hitung poin (Bisa disesuaikan jika poin sudah dihitung di backend)
        const pPts = PLACEMENT_POINTS[rank] || 0;
        const kPts = kills * KILL_POINT;

        team.placementPoints += pPts;
        team.totalPoints += pPts + kPts;
      });
    });

    // 3. Ubah ke Array & Sortir (Total Points > WWCD > Kills)
    return Object.values(stats).sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.wwcd - a.wwcd ||
        b.totalKills - a.totalKills
    );
  }, [matches, participants]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} />
          <h3 className="font-bold text-white">Global Leaderboard</h3>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          System: Points + Kills
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400 font-bold text-xs uppercase">
            <tr>
              <th className="px-6 py-3 w-12 text-center">#</th>
              <th className="px-6 py-3">Team Name</th>
              <th className="px-4 py-3 text-center">Matches</th>
              <th className="px-4 py-3 text-center text-yellow-500">WWCD</th>
              <th className="px-4 py-3 text-center text-red-400">Kills</th>
              <th className="px-6 py-3 text-right">Total PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {leaderboard.map((row, idx) => (
              <tr
                key={row.teamId}
                className={`hover:bg-slate-800/30 transition-colors ${
                  idx < 3 ? "bg-indigo-500/5" : ""
                }`}
              >
                <td className="px-6 py-4 text-center font-bold text-slate-500">
                  {idx === 0 && (
                    <Medal size={18} className="text-yellow-400 mx-auto" />
                  )}
                  {idx === 1 && (
                    <Medal size={18} className="text-slate-300 mx-auto" />
                  )}
                  {idx === 2 && (
                    <Medal size={18} className="text-amber-600 mx-auto" />
                  )}
                  {idx > 2 && idx + 1}
                </td>
                <td className="px-6 py-4 font-bold text-white">
                  {row.teamName}
                </td>
                <td className="px-4 py-4 text-center text-slate-400">
                  {row.matchesPlayed}
                </td>
                <td className="px-4 py-4 text-center font-bold text-yellow-500">
                  {row.wwcd}
                </td>
                <td className="px-4 py-4 text-center font-bold text-red-400">
                  {row.totalKills}
                </td>
                <td className="px-6 py-4 text-right font-black text-lg text-indigo-400">
                  {row.totalPoints}
                </td>
              </tr>
            ))}

            {leaderboard.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  Belum ada data pertandingan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

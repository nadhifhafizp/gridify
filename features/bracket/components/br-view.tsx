"use client";

import { useMemo } from "react";
import { Match, Participant } from "@/types/database";
import BRGroupList from "./br-group-list";
import BRLeaderboard from "./br-leaderboard";
import BRMatchInput from "./br-match-input";
import {
  transformParticipantsToGroups,
  isMultiGroupSystem,
} from "../utils/br-helpers";
import { Trophy, Target } from "lucide-react";

type Props = {
  matches: Match[];
  participants: Participant[];
  tournamentId: string;
  isReadOnly?: boolean;
};

export default function BattleRoyaleView({
  matches,
  participants,
  tournamentId,
  isReadOnly = false,
}: Props) {
  // 1. Transform Data Peserta menjadi Group Structure
  const groups = useMemo(
    () => transformParticipantsToGroups(participants),
    [participants]
  );
  const showGrouping = isMultiGroupSystem(groups);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* SECTION 1: GROUP DISTRIBUTION (Hanya muncul jika Multi-Group) */}
      {showGrouping && (
        <section>
          <BRGroupList groups={groups} />
        </section>
      )}

      {/* SECTION 2: LEADERBOARD (Klasemen Utama) */}
      <section>
        <BRLeaderboard
          matches={matches}
          participants={participants}
          tournamentId={tournamentId}
          isReadOnly={isReadOnly}
        />
      </section>

      {/* SECTION 3: MATCH SCHEDULE (Jadwal & Input) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-orange-400" />
          <h3 className="text-lg font-bold text-white">
            Match Schedule & Results
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <BRMatchInput
              key={match.id}
              match={match}
              participants={participants}
              tournamentId={tournamentId}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>

        {matches.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
            Belum ada jadwal pertandingan.
          </div>
        )}
      </section>
    </div>
  );
}

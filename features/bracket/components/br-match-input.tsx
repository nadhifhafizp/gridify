"use client";

import { useState } from "react";
import { Edit2, CheckCircle2, Users } from "lucide-react";
import BRScoreModal from "./br-score-modal";
import { Match } from "@/types/database";

// Definisikan props secara spesifik
type Props = {
  match: Match;
  participants: any[];
  tournamentId: string;
  isReadOnly?: boolean;
};

export default function BRMatchInput({
  match,
  participants,
  tournamentId,
  isReadOnly = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const isCompleted = match.status === "COMPLETED";
  const canEdit = !isReadOnly;

  // Ambil info grup dari scores (fitur baru)
  const playingGroups = match.scores?.groups;

  return (
    <>
      <div
        onClick={() => canEdit && setIsOpen(true)}
        className={`relative p-4 rounded-xl border transition-all group flex flex-col justify-between h-full ${
          canEdit ? "cursor-pointer hover:bg-slate-900" : "cursor-default"
        } ${
          isCompleted
            ? "bg-slate-900 border-slate-700"
            : "bg-slate-900/50 border-slate-800"
        }`}
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-white">
              Game {match.match_number}
            </span>
            {isCompleted ? (
              <span className="text-green-400 text-xs flex items-center gap-1 font-bold">
                <CheckCircle2 size={12} /> Selesai
              </span>
            ) : (
              <span className="text-slate-500 text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Belum Main
              </span>
            )}
          </div>

          {/* Menampilkan Grup yang bermain (Jika ada) */}
          {playingGroups && playingGroups.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <Users size={12} className="text-slate-500" />
              <span className="text-xs text-indigo-300 font-medium">
                Group: {playingGroups.join(" & ")}
              </span>
            </div>
          )}
        </div>

        {/* Teks Instruksi */}
        {!isReadOnly && (
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-800/50">
            {isCompleted
              ? "Klik untuk edit hasil"
              : "Klik untuk input Placement & Kills"}
          </div>
        )}

        {/* Hover Icon */}
        {canEdit && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 size={16} className="text-indigo-400" />
          </div>
        )}
      </div>

      {canEdit && isOpen && (
        <BRScoreModal
          match={match}
          participants={participants}
          tournamentId={tournamentId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

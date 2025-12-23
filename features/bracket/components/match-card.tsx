"use client";

import { useState } from "react";
import { Edit2, Trophy } from "lucide-react";
import ScoreModal from "./score-modal";
import { MatchWithParticipants } from "../types";
import { Participant } from "@/types/database";

// --- Visual Connector (Garis Bracket) ---
const BracketConnector = ({ type }: { type: "top" | "bottom" | "straight" | "ub-final" | "lb-final" | null }) => {
  if (!type) return null;

  return (
    <div className="absolute -right-8 top-1/2 w-8 h-full pointer-events-none z-0">
      <div className={`absolute left-0 top-0 w-full h-0.5 bg-slate-600 ${type === 'bottom' || type === 'lb-final' ? '-translate-y-0.5' : ''}`}></div>
      {type === "top" && <div className="absolute right-0 top-0 w-0.5 h-[calc(100%+2rem)] bg-slate-600 rounded-br-lg translate-y-0"></div>}
      {type === "bottom" && <div className="absolute right-0 bottom-1/2 w-0.5 h-[calc(100%+2rem)] bg-slate-600 rounded-tr-lg -translate-y-0.5"></div>}
      {type === "straight" && <div className="absolute right-0 top-0 w-4 h-0.5 bg-slate-600"></div>}
      {type === "ub-final" && (
        <div className="absolute right-0 top-0 w-0.5 h-30 bg-slate-600 rounded-br-lg translate-y-0 border-b-0">
           <div className="absolute bottom-0 -right-4 w-4 h-0.5 bg-slate-600"></div>
        </div>
      )}
      {type === "lb-final" && (
        <div className="absolute right-0 bottom-1/2 w-0.5 h-30 bg-slate-600 rounded-tr-lg -translate-y-0.5 border-t-0">
           <div className="absolute top-0 -right-4 w-4 h-0.5 bg-slate-600"></div>
        </div>
      )}
    </div>
  );
};

export default function MatchCard({
  match,
  allParticipants,
  isReadOnly = false,
  connectorType = null,
}: {
  match: MatchWithParticipants;
  allParticipants: Participant[];
  isReadOnly?: boolean;
  connectorType?: "top" | "bottom" | "straight" | "ub-final" | "lb-final" | null;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const p1 = match.participant_a;
  const p2 = match.participant_b;
  const score = match.scores || { a: 0, b: 0 };
  const winnerId = match.winner_id;

  // LOGIC: Match hanya bisa diedit jika Admin (!isReadOnly) DAN kedua peserta SUDAH ADA
  const isMatchReady = !!(p1 && p2);
  const canEdit = !isReadOnly && isMatchReady;

  return (
    <>
      <div
        className="w-64 shrink-0 relative group"
        onClick={() => canEdit && setIsModalOpen(true)}
      >
        <BracketConnector type={connectorType} />

        <div
          className={`border rounded-lg overflow-hidden shadow-lg transition-all relative z-10 ${
            canEdit
              ? "border-slate-600 bg-slate-900/95 cursor-pointer hover:border-indigo-400 hover:shadow-indigo-500/20"
              : "border-slate-700 bg-slate-900/60 cursor-default"
          }`}
        >
          {/* Edit Overlay: Hanya muncul jika bisa diedit */}
          {canEdit && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
              <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <Edit2 size={12} /> Update Match
              </div>
            </div>
          )}

          {/* Header Match */}
          <div className="bg-slate-950 px-3 py-1.5 flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-700">
            <span>Match #{match.match_number}</span>
            <span className={match.status === "COMPLETED" ? "text-emerald-400" : "text-slate-500"}>
              {match.status === "COMPLETED" ? "FINAL" : match.status}
            </span>
          </div>

          {/* Team A */}
          <div className={`flex justify-between items-center px-4 py-2 border-b border-slate-700/50 ${winnerId && winnerId === p1?.id ? "bg-indigo-900/30" : ""}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`w-2 h-2 rounded-full shrink-0 ${winnerId && winnerId === p1?.id ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" : "bg-slate-600"}`}></div>
              <span className={`text-sm font-medium truncate ${winnerId && winnerId === p1?.id ? "text-white" : "text-slate-400"} ${!p1 ? "text-slate-600 italic" : ""}`}>
                {p1?.name || "Waiting..."}
              </span>
              {/* Trophy Visual */}
              {winnerId && winnerId === p1?.id && <Trophy size={14} className="text-yellow-400 ml-1 shrink-0" />}
            </div>
            <span className={`text-sm font-bold font-mono ${winnerId === p1?.id ? 'text-indigo-300' : 'text-slate-600'}`}>
              {score.a ?? 0}
            </span>
          </div>

          {/* Team B */}
          <div className={`flex justify-between items-center px-4 py-2 ${winnerId && winnerId === p2?.id ? "bg-indigo-900/30" : ""}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`w-2 h-2 rounded-full shrink-0 ${winnerId && winnerId === p2?.id ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" : "bg-slate-600"}`}></div>
              <span className={`text-sm font-medium truncate ${winnerId && winnerId === p2?.id ? "text-white" : "text-slate-400"} ${!p2 ? "text-slate-600 italic" : ""}`}>
                {p2?.name || "Waiting..."}
              </span>
              {/* Trophy Visual */}
              {winnerId && winnerId === p2?.id && <Trophy size={14} className="text-yellow-400 ml-1 shrink-0" />}
            </div>
            <span className={`text-sm font-bold font-mono ${winnerId === p2?.id ? 'text-indigo-300' : 'text-slate-600'}`}>
              {score.b ?? 0}
            </span>
          </div>
        </div>
      </div>

      {canEdit && (
        <ScoreModal
          match={match}
          allParticipants={allParticipants}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
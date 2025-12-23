"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { MatchWithParticipants } from "../types";
import { Participant } from "@/types/database";
import { updateMatchDetails } from "../actions/match-actions"; // Import Server Action
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Opsional: jika pakai sonner

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchWithParticipants;
  allParticipants: Participant[];
}

export default function ScoreModal({ 
  isOpen, 
  onClose, 
  match, 
  allParticipants 
}: ScoreModalProps) {
  
  const [scoreA, setScoreA] = useState(match.scores?.a || 0);
  const [scoreB, setScoreB] = useState(match.scores?.b || 0);
  
  // State untuk edit nama
  const [nameA, setNameA] = useState(match.participant_a?.name || "");
  const [nameB, setNameB] = useState(match.participant_b?.name || "");

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Siapkan data peserta yang diedit namanya
      const participantsToUpdate = [];
      if (match.participant_a?.id) {
        participantsToUpdate.push({ id: match.participant_a.id, name: nameA });
      }
      if (match.participant_b?.id) {
        participantsToUpdate.push({ id: match.participant_b.id, name: nameB });
      }

      // Panggil Server Action
      const result = await updateMatchDetails(
        match.id,
        { a: scoreA, b: scoreB },
        participantsToUpdate,
        match.tournament_id // Kirim ID turnamen untuk revalidate path
      );

      if (result.success) {
        toast.success("Match updated successfully");
        onClose(); 
      } else {
        toast.error("Gagal mengupdate match: " + result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => !isLoading && onClose()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white mb-6">
                  Update Match Details
                </Dialog.Title>

                <div className="space-y-6">
                  {/* --- TEAM A INPUT --- */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Team A (Top)
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={nameA}
                        onChange={(e) => setNameA(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-500 disabled:opacity-50"
                        placeholder="Nama Tim A"
                      />
                      <input
                        type="number"
                        min="0"
                        value={scoreA}
                        onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
                        disabled={isLoading}
                        className="w-20 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* VS DIVIDER */}
                  <div className="flex items-center gap-4">
                    <div className="h-px bg-slate-700 flex-1"></div>
                    <span className="text-slate-500 text-xs font-bold">VS</span>
                    <div className="h-px bg-slate-700 flex-1"></div>
                  </div>

                  {/* --- TEAM B INPUT --- */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Team B (Bottom)
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={nameB}
                        onChange={(e) => setNameB(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-500 disabled:opacity-50"
                        placeholder="Nama Tim B"
                      />
                      <input
                        type="number"
                        min="0"
                        value={scoreB}
                        onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
                        disabled={isLoading}
                        className="w-20 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-center font-mono focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 focus:outline-none disabled:opacity-50"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-800"
                  >
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
import { Match, Participant } from "@/types/database";

/**
 * Tipe Data Match yang sudah di-join dengan tabel Participants.
 * Digunakan karena UI sering butuh nama tim, bukan cuma ID-nya.
 */
export type MatchWithParticipants = Match & {
  participant_a: Participant | null;
  participant_b: Participant | null;
};

/**
 * Tipe untuk struktur Score Battle Royale di JSONB
 */
export type BattleRoyaleResult = {
  teamId: string;
  rank: number | "";
  kills: number | "";
  total: number;
};

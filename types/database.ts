export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Tournament {
  id: string;
  created_at: string;
  owner_id: string;
  game_id: string;
  title: string;
  description: string | null;
  format_type:
    | "SINGLE_ELIMINATION"
    | "DOUBLE_ELIMINATION"
    | "ROUND_ROBIN"
    | "HYBRID_UCL"
    | "BATTLE_ROYALE";
  status: "DRAFT" | "ONGOING" | "COMPLETED";
  // Update definisi settings agar kita ingat strukturnya
  settings: {
    bestOf?: string;
    homeAway?: boolean;
    pointsPerWin?: number;
    hasThirdPlace?: boolean; // <-- BARU
  } & Json;
}

export interface Participant {
  id: string;
  created_at: string;
  tournament_id: string;
  name: string;
  contact_info: string | null;
  is_verified: boolean;
  group_name?: string | null;
}

export interface Stage {
  id: string;
  created_at: string;
  tournament_id: string;
  name: string;
  type: Tournament["format_type"] | "LEADERBOARD";
  sequence_order: number;
}

export interface Match {
  id: string;
  created_at: string;
  tournament_id: string;
  stage_id: string;
  round_number: number;
  match_number: number;
  participant_a_id: string | null;
  participant_b_id: string | null;
  winner_id: string | null;
  next_match_id: string | null;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED";
  // --- UPDATE BAGIAN INI ---
  scores: {
    a?: number;
    b?: number;
    // Tambahan untuk Battle Royale
    groups?: string[]; // Array grup, misal ["A", "B"]
    map?: string;
    results?: Array<{
      teamId: string;
      rank: number;
      kills: number;
      total: number;
    }>;
  } | null;
  // -------------------------
}

export interface Game {
  id: string;
  name: string;
  genre: string;
  platform: string;
}

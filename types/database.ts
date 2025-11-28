export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Tipe Data Tabel Database (Sesuai Skema Supabase Anda)
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
  settings: Json; // Menyimpan config seperti { bestOf: "3", homeAway: false }
}

export interface Participant {
  id: string;
  created_at: string;
  tournament_id: string;
  name: string;
  contact_info: string | null;
  is_verified: boolean;
  group_name?: string | null; // Untuk fase grup/liga
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
  scores: {
    a?: number;
    b?: number;
    results?: Array<{
      teamId: string;
      rank: number;
      kills: number;
      total: number;
    }>;
  } | null; // JSONB
}

export interface Game {
  id: string;
  name: string;
  genre: string;
  platform: string;
}

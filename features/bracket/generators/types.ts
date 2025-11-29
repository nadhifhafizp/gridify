export type BracketGeneratorParams = {
  supabase: any;
  tournamentId: string;
  stageId: string;
  participants: { id: string; name: string }[]; // Added name for easier debug
};

// Struktur Data untuk UI Grouping
export type GroupData = {
  name: string; // "A", "B", "All"
  teams: {
    id: string;
    name: string;
    avatar?: string;
  }[];
};

export type MatchPayload = {
  tournament_id: string;
  stage_id: string;
  round_number: number;
  match_number: number;
  participant_a_id: string | null;
  participant_b_id: string | null;
  status: "SCHEDULED" | "COMPLETED";
  winner_id?: string | null;
  next_match_id?: string | null;
  scores: {
    a?: number;
    b?: number;
    // Core Data untuk Battle Royale
    groups?: string[]; // ["A", "B"]
    map?: string;
    results?: Array<{
      teamId: string;
      rank: number;
      kills: number;
      total: number;
    }>;
  };
};

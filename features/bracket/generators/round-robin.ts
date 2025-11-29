import { BracketGeneratorParams, MatchPayload } from "./types";
import { chunkArray } from "../utils/bracket-math";

export async function generateRoundRobin({
  supabase,
  tournamentId,
  stageId,
  participants,
}: BracketGeneratorParams) {
  // 1. Tentukan apakah ini Liga Murni atau Group Stage (Hybrid)
  // Logic: Jika > 8 peserta dan format turnamen HYBRID/UCL, pecah jadi grup.
  // Jika ROUND_ROBIN biasa, jadikan 1 grup besar.

  // Kita cek format turnamen dari DB untuk memastikan
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("format_type")
    .eq("id", tournamentId)
    .single();

  const isHybrid = tournament?.format_type === "HYBRID_UCL";
  let groups: { id: string }[][] = [];

  if (isHybrid && participants.length >= 6) {
    // Bagi menjadi grup berisi 4 (standar UCL/World Cup)
    // Sisa tim masuk ke grup terakhir
    // Clone participants karena splice memutasi array di chunkArray
    groups = chunkArray([...participants], 4);
  } else {
    // 1 Grup Besar
    groups = [[...participants]];
  }

  const matchesPayload: MatchPayload[] = [];
  const groupUpdatePromises: Promise<any>[] = [];

  // 2. Generate Jadwal untuk Setiap Grup
  for (let gIndex = 0; gIndex < groups.length; gIndex++) {
    const groupParticipants = groups[gIndex];

    // Nama Grup: A, B, C, ... atau 'League' jika cuma 1
    const groupName =
      groups.length > 1 ? String.fromCharCode(65 + gIndex) : "League";

    // Update group_name di tabel participants
    const pIds = groupParticipants.map((p) => p.id);
    groupUpdatePromises.push(
      supabase
        .from("participants")
        .update({ group_name: groupName })
        .in("id", pIds)
    );

    // Algoritma Circle Method
    const teams = [...groupParticipants];
    // Jika ganjil, tambah dummy (BYE)
    if (teams.length % 2 !== 0) {
      teams.push({ id: "BYE" }); // Marker string 'BYE'
    }

    const n = teams.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;

    for (let round = 0; round < rounds; round++) {
      for (let matchIdx = 0; matchIdx < matchesPerRound; matchIdx++) {
        const home = teams[matchIdx];
        const away = teams[n - 1 - matchIdx];

        // Jika salah satu adalah 'BYE', jangan buat match
        if (home.id !== "BYE" && away.id !== "BYE") {
          matchesPayload.push({
            tournament_id: tournamentId,
            stage_id: stageId,
            round_number: round + 1, // Round disini dianggap Matchday
            match_number: gIndex * 100 + round * matchesPerRound + matchIdx + 1, // Unique number visual
            participant_a_id: home.id,
            participant_b_id: away.id,
            status: "SCHEDULED",
            scores: { a: 0, b: 0 },
          });
        }
      }

      // Rotasi Array (Elemen index 1 pindah ke akhir, elemen terakhir geser, index 0 tetap)
      // [0, 1, 2, 3] -> [0, 2, 3, 1] -> [0, 3, 1, 2]
      const movingTeam = teams.splice(1, 1)[0];
      teams.push(movingTeam);
    }
  }

  // 3. Eksekusi Database
  await Promise.all(groupUpdatePromises); // Update nama grup

  if (matchesPayload.length > 0) {
    const { error } = await supabase.from("matches").insert(matchesPayload);
    if (error)
      throw new Error("Gagal membuat jadwal Round Robin: " + error.message);
  }
}

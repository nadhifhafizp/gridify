import { GroupData } from "../generators/types";
import { Participant } from "@/types/database";

/**
 * Mengubah array peserta yang rata (flat) menjadi struktur Group Hierarkis.
 * Digunakan untuk menampilkan kartu grup di UI.
 */
export function transformParticipantsToGroups(
  participants: Participant[]
): GroupData[] {
  const groupsMap: Record<string, GroupData> = {};

  participants.forEach((p) => {
    // Default ke "No Group" jika null, atau "All" jika skenario single lobby
    const gName = p.group_name || "Unassigned";

    if (!groupsMap[gName]) {
      groupsMap[gName] = {
        name: gName,
        teams: [],
      };
    }

    groupsMap[gName].teams.push({
      id: p.id,
      name: p.name,
      // Avatar bisa ditambahkan jika ada field tersebut nanti
    });
  });

  // Urutkan grup secara alfabetis (A, B, C, All, Unassigned)
  return Object.values(groupsMap).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Mengecek apakah turnamen menggunakan sistem Multi-Group atau Single Lobby
 */
export function isMultiGroupSystem(groups: GroupData[]): boolean {
  // Jika hanya ada 1 grup bernama 'All' atau 'Unassigned', berarti Single Lobby
  if (
    groups.length === 1 &&
    (groups[0].name === "All" || groups[0].name === "Unassigned")
  ) {
    return false;
  }
  return groups.length > 1;
}

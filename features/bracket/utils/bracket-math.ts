// Mencari pangkat 2 terdekat (untuk Single/Double Elim)
export const getNextPowerOfTwo = (n: number) => {
  if (n === 0) return 0;
  return Math.pow(2, Math.ceil(Math.log2(n)));
};

// Fisher-Yates Shuffle (Mengacak Array)
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Membagi array menjadi chunk
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const results = [];
  const arrClone = [...array];
  while (arrClone.length) {
    results.push(arrClone.splice(0, size));
  }
  return results;
};

// GENERATE GROUP PAIRS (Round Robin antar Grup)
export const generateGroupPairs = (groups: string[]): string[][] => {
  const pairs: string[][] = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      pairs.push([groups[i], groups[j]]);
    }
  }
  return pairs;
};

// DISTRIBUTE TEAMS TO GROUPS (Snake Draft Style)
export const distributeTeamsToGroups = <T>(
  teams: T[],
  groupCount: number
): T[][] => {
  const groups: T[][] = Array.from({ length: groupCount }, () => []);

  teams.forEach((team, index) => {
    const groupIndex = index % groupCount;
    groups[groupIndex].push(team);
  });

  return groups;
};

/**
 * [BARU] Smart Distribution untuk Multi-Slot
 * - Mengelompokkan tim berdasarkan nama (Case Insensitive).
 * - Menyebar mereka agar satu clan tidak menumpuk di satu pool.
 * - Contoh: Input [Team A, Team A, Team B] -> Output [Team A, Team B, Team A]
 */
export function distributeParticipants<T extends { name: string }>(participants: T[]): T[] {
  const groups: Record<string, T[]> = {};

  // 1. Grouping (Case Insensitive & Trim)
  participants.forEach((p) => {
    // " Team A " -> "team a"
    const key = p.name.trim().toLowerCase(); 
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(p);
  });

  // 2. Interleave (Sebar kartu)
  const result: T[] = [];
  const keys = Object.keys(groups);
  let maxCount = 0;

  // Cari tim dengan jumlah slot terbanyak
  keys.forEach((k) => {
    maxCount = Math.max(maxCount, groups[k].length);
  });

  // Ambil satu per satu dari setiap grup secara memutar
  for (let i = 0; i < maxCount; i++) {
    keys.forEach((key) => {
      if (groups[key][i]) {
        result.push(groups[key][i]);
      }
    });
  }

  return result;
}

/**
 * [BARU] Standard Seeding Algorithm
 * - Membuat urutan [1, 16, 8, 9, 4, 13...] untuk bracket seimbang.
 */
export function getStandardSeedingOrder(size: number): number[] {
  if (size === 0) return [];
  let rounds = Math.log2(size);
  let order = [1, 2]; // Base case: 1 vs 2

  for (let i = 0; i < rounds - 1; i++) {
    let next = [];
    let sum = order.length * 2 + 1; // Rumus: Seed A + Seed B = Total + 1
    for (let val of order) {
      next.push(val);
      next.push(sum - val);
    }
    order = next;
  }
  return order;
}
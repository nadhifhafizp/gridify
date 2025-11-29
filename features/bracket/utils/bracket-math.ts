// Mencari pangkat 2 terdekat (untuk Single/Double Elim)
export const getNextPowerOfTwo = (n: number) => {
  if (n === 0) return 0;
  return Math.pow(2, Math.ceil(Math.log2(n)));
};

// Fisher-Yates Shuffle
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
// Input: ['A', 'B', 'C'] -> Output: [['A', 'B'], ['A', 'C'], ['B', 'C']]
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
// Membagi tim ke dalam N grup secara merata
export const distributeTeamsToGroups = <T>(
  teams: T[],
  groupCount: number
): T[][] => {
  const groups: T[][] = Array.from({ length: groupCount }, () => []);

  teams.forEach((team, index) => {
    // Pola: 0, 1, 2, 0, 1, 2... (Simple Round Robin Distribution)
    // Bisa diubah ke Snake Draft jika perlu, tapi ini cukup untuk MVP
    const groupIndex = index % groupCount;
    groups[groupIndex].push(team);
  });

  return groups;
};

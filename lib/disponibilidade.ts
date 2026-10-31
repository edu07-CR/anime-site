// lib/disponibilidade.ts
//['crunchyroll','prime','disney','netflix','max']
export const disponibilidade: Record<number, string[]> = {
  // Exemplo: ID 207191 (Você tem certeza que está nesses 4?)
  // A linha precisa ficar assim:
  207191: ['prime'],
  204011: ['crunchyroll', 'prime'],
  209219: ['prime'],
  207329: ['prime'],
  209502: ['prime'],
  198727: ['crunchyroll','prime'],
  159042: ['netflix'],
  172192: ['crunchyroll','prime',],
  152677: ['crunchyroll','prime'],
  211778: ['crunchyroll','prime'],
  176314: ['crunchyroll','prime',],
  180136: ['crunchyroll','prime'],
  213805: ['netflix'],
  212503: ['crunchyroll','prime'],
  206401: ['crunchyroll','prime'],
  195516: ['crunchyroll','prime'],
  210482: ['netflix'],
  205909: ['crunchyroll','prime'],
  178083: ['disney'],
  158871: ['netflix'],
  204650: ['crunchyroll','prime'],
  186742: ['crunchyroll','prime'],
  203490: ['crunchyroll','prime'],
  195604: ['crunchyroll','prime'],
  235: ['crunchyroll','prime'],
  169581: ['crunchyroll','prime'],
  204389: ['crunchyroll','prime'],
  202250: ['crunchyroll','prime'],
  187402: ['crunchyroll','prime','disney','netflix','max']
  // Exemplo: ID 212503 (The Iceblade Sorcerer)
  // 212503: ['crunchyroll'],
};
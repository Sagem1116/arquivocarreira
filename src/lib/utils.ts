import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Season, ID } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parse a season label (e.g. "2024", "2023/2024", "2023/24", "2023-2024")
// into the list of calendar years it spans.
function yearsOf(yearStr: string): number[] {
  if (!yearStr) return [];
  const parts = yearStr
    .split(/[\/\-–]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const nums = parts
    .map((p) => parseInt(p.replace(/[^\d]/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return [];
  if (nums.length === 1) return [nums[0]];
  let a = nums[0];
  let b = nums[1];
  // expand short form like "2023/24" -> 2024
  if (b < 100) {
    b = Math.floor(a / 100) * 100 + b;
    if (b < a) b += 100;
  }
  if (b < a) [a, b] = [b, a];
  const out: number[] = [];
  for (let y = a; y <= b; y++) out.push(y);
  return out;
}

// Count season periods, collapsing entries that share any calendar year
// (e.g. "2023/2024" + "2024" → 1 época).
function countSeasonPeriods(seasons: Season[]): number {
  const n = seasons.length;
  if (n === 0) return 0;
  const sets = seasons.map((s) => new Set(yearsOf(s.year)));
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let shares = false;
      for (const y of sets[i]) {
        if (sets[j].has(y)) {
          shares = true;
          break;
        }
      }
      if (shares) union(i, j);
    }
  }
  const roots = new Set<number>();
  for (let i = 0; i < n; i++) roots.add(find(i));
  // seasons with no parseable years still count as their own period
  return roots.size;
}

export function uniqueSeasonYears(seasons: Season[]) {
  return countSeasonPeriods(seasons);
}

export function uniqueSeasonYearsByClub(seasons: Season[], clubId: ID) {
  return countSeasonPeriods(seasons.filter((s) => s.clubId === clubId));
}

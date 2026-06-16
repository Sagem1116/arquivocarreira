import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Season, ID } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uniqueSeasonYears(seasons: Season[]) {
  return new Set(seasons.map((s) => s.year)).size;
}

export function uniqueSeasonYearsByClub(seasons: Season[], clubId: ID) {
  return new Set(seasons.filter((s) => s.clubId === clubId).map((s) => s.year)).size;
}

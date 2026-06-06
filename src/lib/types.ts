export type ID = string;

export interface CoachProfile {
  name: string;
  photo?: string; // base64
  nationality?: string;
  birthDate?: string;
  favoriteStyle?: string;
  bio?: string;
}

export interface Club {
  id: ID;
  name: string;
  logo?: string;
  stadium?: string;
  stadiumPhoto?: string;
  banner?: string;
  country?: string;
  color: string; // hex e.g. #FF7A1A
  startDate?: string;
  endDate?: string;
  notes?: string;
  isNationalTeam?: boolean;
}

export interface SeasonGalleryImage {
  id: ID;
  src: string;
  caption?: string;
  category?: "tactic" | "objectives" | "squad" | "transfers" | "screenshot" | "other";
}

export interface SeasonCompetition {
  id: ID;
  name: string;
  position?: string; // e.g. "1st", "Winner", "Final", "Promoted"
  won?: boolean;
  finalReached?: boolean;
  notes?: string;
}

export interface SeasonMoment {
  id: ID;
  title: string;
  description?: string;
  image?: string;
}

export interface SeasonFile {
  id: ID;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // base64 data URL for persistence in IndexedDB
  addedAt: number;
}

export interface Season {
  id: ID;
  year: string; // e.g. 2025/26
  clubId: ID;
  isPartial?: boolean;
  finalPosition?: string;
  matches?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  notes?: string;
  competitions: SeasonCompetition[];
  gallery: SeasonGalleryImage[];
  moments: SeasonMoment[];
  files?: SeasonFile[];
  createdAt: number;
}

export interface Trophy {
  id: ID;
  competition: string;
  year: string;
  clubId: ID;
  country?: string;
  image?: string;
  summary?: string;
}

export interface Award {
  id: ID;
  title: string;
  type: "weekly" | "monthly" | "yearly" | "nomination" | "hof" | "record";
  date?: string;
  clubId?: ID;
  description?: string;
  image?: string;
}

export interface Mention {
  id: ID;
  title: string;
  description?: string;
  images: string[];
  tags?: string[];
  date?: string;
}

export interface ArchiveData {
  profile: CoachProfile;
  clubs: Club[];
  seasons: Season[];
  trophies: Trophy[];
  awards: Award[];
  mentions: Mention[];
  favorites: ID[];
  version: 1;
}

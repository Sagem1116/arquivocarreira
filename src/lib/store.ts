import { create } from "zustand";
import { get as idbGet, set as idbSet } from "idb-keyval";
import type {
  ArchiveData,
  Award,
  Club,
  CoachProfile,
  ID,
  Mention,
  Season,
  Trophy,
} from "./types";

const KEY = "fm-career-archive-v1";

const initial: ArchiveData = {
  profile: { name: "Treinador" },
  clubs: [],
  seasons: [],
  trophies: [],
  awards: [],
  mentions: [],
  favorites: [],
  fileMeta: {},
  version: 1,
};


export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

type Store = {
  data: ArchiveData;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;

  setProfile: (p: Partial<CoachProfile>) => void;

  addClub: (c: Omit<Club, "id">) => Club;
  updateClub: (id: ID, c: Partial<Club>) => void;
  deleteClub: (id: ID) => void;

  addSeason: (s: Omit<Season, "id" | "createdAt">) => Season;
  updateSeason: (id: ID, s: Partial<Season>) => void;
  deleteSeason: (id: ID) => void;

  addTrophy: (t: Omit<Trophy, "id">) => Trophy;
  updateTrophy: (id: ID, t: Partial<Trophy>) => void;
  deleteTrophy: (id: ID) => void;

  addAward: (a: Omit<Award, "id">) => Award;
  updateAward: (id: ID, a: Partial<Award>) => void;
  deleteAward: (id: ID) => void;

  addMention: (m: Omit<Mention, "id">) => Mention;
  updateMention: (id: ID, m: Partial<Mention>) => void;
  deleteMention: (id: ID) => void;

  toggleFavorite: (id: ID) => void;

  setFileMeta: (id: string, meta: import("./types").CloudFileMeta) => void;
  removeFileMeta: (id: string) => void;

  importJSON: (data: ArchiveData) => void;
  reset: () => void;
};


let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useArchive = create<Store>((set, get) => {
  const persistSoon = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void idbSet(KEY, get().data);
    }, 250);
  };

  const update = (mut: (d: ArchiveData) => ArchiveData | void) => {
    set((s) => {
      const draft = structuredClone(s.data);
      const out = mut(draft) ?? draft;
      return { data: out };
    });
    persistSoon();
  };

  return {
    data: initial,
    hydrated: false,
    hydrate: async () => {
      try {
        const stored = (await idbGet<ArchiveData>(KEY)) ?? null;
        if (stored) set({ data: { ...initial, ...stored }, hydrated: true });
        else set({ hydrated: true });
      } catch {
        set({ hydrated: true });
      }
    },
    persist: async () => {
      await idbSet(KEY, get().data);
    },

    setProfile: (p) =>
      update((d) => {
        d.profile = { ...d.profile, ...p };
      }),

    addClub: (c) => {
      const club = { ...c, id: uid() };
      update((d) => {
        d.clubs.push(club);
      });
      return club;
    },
    updateClub: (id, c) =>
      update((d) => {
        const i = d.clubs.findIndex((x) => x.id === id);
        if (i >= 0) d.clubs[i] = { ...d.clubs[i], ...c };
      }),
    deleteClub: (id) =>
      update((d) => {
        d.clubs = d.clubs.filter((x) => x.id !== id);
        d.seasons = d.seasons.filter((x) => x.clubId !== id);
        d.trophies = d.trophies.filter((x) => x.clubId !== id);
      }),

    addSeason: (s) => {
      const season = { ...s, id: uid(), createdAt: Date.now() };
      update((d) => {
        d.seasons.push(season);
      });
      return season;
    },
    updateSeason: (id, s) =>
      update((d) => {
        const i = d.seasons.findIndex((x) => x.id === id);
        if (i >= 0) d.seasons[i] = { ...d.seasons[i], ...s };
      }),
    deleteSeason: (id) =>
      update((d) => {
        d.seasons = d.seasons.filter((x) => x.id !== id);
      }),

    addTrophy: (t) => {
      const trophy = { ...t, id: uid() };
      update((d) => {
        d.trophies.push(trophy);
      });
      return trophy;
    },
    updateTrophy: (id, t) =>
      update((d) => {
        const i = d.trophies.findIndex((x) => x.id === id);
        if (i >= 0) d.trophies[i] = { ...d.trophies[i], ...t };
      }),
    deleteTrophy: (id) =>
      update((d) => {
        d.trophies = d.trophies.filter((x) => x.id !== id);
      }),

    addAward: (a) => {
      const aw = { ...a, id: uid() };
      update((d) => {
        d.awards.push(aw);
      });
      return aw;
    },
    updateAward: (id, a) =>
      update((d) => {
        const i = d.awards.findIndex((x) => x.id === id);
        if (i >= 0) d.awards[i] = { ...d.awards[i], ...a };
      }),
    deleteAward: (id) =>
      update((d) => {
        d.awards = d.awards.filter((x) => x.id !== id);
      }),

    addMention: (m) => {
      const mn = { ...m, id: uid() };
      update((d) => {
        d.mentions.push(mn);
      });
      return mn;
    },
    updateMention: (id, m) =>
      update((d) => {
        const i = d.mentions.findIndex((x) => x.id === id);
        if (i >= 0) d.mentions[i] = { ...d.mentions[i], ...m };
      }),
    deleteMention: (id) =>
      update((d) => {
        d.mentions = d.mentions.filter((x) => x.id !== id);
      }),

    toggleFavorite: (id) =>
      update((d) => {
        d.favorites = d.favorites.includes(id)
          ? d.favorites.filter((x) => x !== id)
          : [...d.favorites, id];
      }),

    setFileMeta: (id, meta) =>
      update((d) => {
        d.fileMeta = { ...(d.fileMeta || {}), [id]: meta };
      }),
    removeFileMeta: (id) =>
      update((d) => {
        if (!d.fileMeta) return;
        const next = { ...d.fileMeta };
        delete next[id];
        d.fileMeta = next;
      }),



    importJSON: (data) => {
      set({ data: { ...initial, ...data } });
      void idbSet(KEY, data);
    },
    reset: () => {
      set({ data: initial });
      void idbSet(KEY, initial);
    },
  };
});

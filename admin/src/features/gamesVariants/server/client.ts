import { http } from "@/lib/http";

export type Game = {
  GameID: number;
  gameCode: string;
  gameName: string;
};

export type GamesVariant = {
  ID: number;
  GameID: number;
  name: string;
  createdAt?: string;
  IsActive: 0 | 1;
  variantDescription?: string;
  Levels?: number;
  GameType?: string;
  instructions?: string;
  MaxIterations?: number;
  MaxIterationTime?: number;
  MaxLevel?: number;
  ReductionTimeEachLevel?: number;
  introAudio?: string;
  introAudioText?: string;
};

export async function fetchGames(): Promise<Game[]> {
  const res = await http.get("/game/findAll");
  return res.data ?? [];
}

export async function fetchGamesVariants(): Promise<GamesVariant[]> {
  const res = await http.get("/gamesVariant/findAll");
  return res.data ?? [];
}

export async function createGamesVariant(payload: Partial<GamesVariant>) {
  const res = await http.post("/gamesVariant/create", payload);
  return res.data as GamesVariant;
}

export async function updateGamesVariant(
  id: number,
  payload: Partial<GamesVariant>
) {
  const res = await http.put(`/gamesVariant/${id}`, payload);
  return res.data as GamesVariant;
}

export async function deleteGamesVariant(id: number) {
  await http.delete(`/gamesVariant/${id}`);
}

/** optional analytics */
export async function fetchVariantAnalytics(variantId: number) {
  const res = await http.get(`/stats/game-variant/${variantId}/analytics`, {
    withCredentials: true,
  });
  return res.data ?? null;
}

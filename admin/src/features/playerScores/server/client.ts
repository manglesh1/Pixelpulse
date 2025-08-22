import { http } from "@/lib/http";

export type PlayerLite = {
  FirstName?: string;
  LastName?: string;
  email?: string;
};

export type GameLite = {
  GameID: number;
  gameName: string;
};

export type GamesVariantLite = {
  ID: number;
  name: string;
};

export type PlayerScoreRow = {
  ScoreID: number;
  PlayerID?: number;
  GameID?: number;
  GamesVariantId?: number;

  LevelPlayed?: number | null;
  Points: number;
  StartTime: string; // ISO
  EndTime: string; // ISO

  player?: PlayerLite | null;
  game?: GameLite | null;
  GamesVariant?: GamesVariantLite | null;
};

export type PagedPlayerScoresResponse = {
  data: PlayerScoreRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type FetchPagedPlayerScoresParams = {
  page: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  gamesVariantId?: string | number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export async function fetchPagedPlayerScores(
  params: FetchPagedPlayerScoresParams
): Promise<PagedPlayerScoresResponse> {
  try {
    const res = await http.get("/playerScore/findPaged", { params });
    return res.data as PagedPlayerScoresResponse;
  } catch {
    return {
      data: [],
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: 0,
        totalPages: 0,
      },
    };
  }
}

export type GamesVariant = {
  ID: number;
  GameId: number;
  name: string;
};

export async function fetchGamesVariants(): Promise<GamesVariant[]> {
  const res = await http.get("/gamesVariant/findAll");
  return (res.data as GamesVariant[]) ?? [];
}

export async function deletePlayerScore(id: number) {
  await http.delete(`/playerScore/${id}`);
}

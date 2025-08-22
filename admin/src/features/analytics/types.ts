export type GameStatsSummary = {
  playersInFacilityNow?: number;
  playersInFacilityToday?: number;
  todayPlays?: number;
  weekPlays?: number;
  monthPlays?: number;
  mostPopularToday?: { id?: number; name?: string } | null;
};

export type DashboardDaily = { date: string; totalPlays: number };

export type HourlyRow = { hour: number; totalPlays: number };
export type HourlyPlaysResp = { date: string; hourly: HourlyRow[] };

export type TopVariant = { name: string; plays: number };
export type TopVariantsResp = { top: TopVariant[] };

export type GameShareRow = { name: string; plays: number };
export type GameShareResp = { share: GameShareRow[] };

export type HeatmapCell = { weekday: number; hour: number; total: number };
export type HeatmapResp = { matrix: HeatmapCell[] };

export type AvgOverall = {
  avgSeconds: number | null;
  avgMinutes: number | null;
  plays: number;
};
export type AvgByVariant = {
  gamesVariantId: number;
  variantName: string;
  avgSeconds: number | null;
  avgMinutes: number | null;
  plays: number;
};

export type ShareLike = Partial<{
  name: string;
  variantName: string;
  room: string;
  plays: number;
  totalPlays: number;
  total: number;
  count: number;
}>;

export type AvgByGame = {
  GameID: number;
  gameName: string;
  avgSeconds: number | null;
  avgMinutes: number | null;
  plays: number;
};
export type GameLengthAveragesResp = {
  startUtc: string;
  endUtc: string;
  minSeconds: number;
  maxSeconds: number;
  overall: AvgOverall | null;
  byGame: AvgByGame[];
  byVariant: AvgByVariant[];
};

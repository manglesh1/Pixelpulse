import { http } from "@/lib/http";
import { GameStatsSummary } from "@/features/analytics/types";

export async function fetchGameStats(): Promise<GameStatsSummary> {
  const res = await http.get("/stats/game-stats");
  return res.data ?? {};
}

export async function fetchDailyPlays(
  params: { days?: number; end?: string } = {}
) {
  const res = await http.get("/stats/plays/daily", { params });
  return res.data ?? { plays: [] };
}

export async function fetchHourlyPlays(params: { date?: string } = {}) {
  const res = await http.get("/stats/plays/hourly", { params });
  return res.data ?? { hourly: [] };
}

export async function fetchTopVariants(
  params: { days?: number; end?: string; limit?: number } = {}
) {
  const res = await http.get("/stats/variants/top", { params });
  return res.data ?? { top: [] };
}

export async function fetchGameShareForDay(params: {
  date?: string;
  startDate?: string;
  endDate?: string;
  startUtc?: string;
  endUtc?: string;
}) {
  const res = await http.get("/stats/game/share", { params });
  return res.data ?? { share: [] };
}

export async function fetchWeekdayHourHeatmap(params: { weeks?: number } = {}) {
  const res = await http.get("/stats/heatmap/weekday-hour", { params });
  return res.data ?? { matrix: [] };
}

export async function fetchGameLengthAverages(
  params: {
    minSeconds?: number;
    maxSeconds?: number;
    startUtc?: string;
    endUtc?: string;
    startDate?: string;
    endDate?: string;
  } = {}
) {
  const res = await http.get("/stats/game-length/averages", { params });
  return res.data ?? { overall: null, byGame: [], byVariant: [] };
}

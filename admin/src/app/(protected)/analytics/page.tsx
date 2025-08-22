"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  fetchDailyPlays,
  fetchGameStats,
  fetchHourlyPlays,
  fetchTopVariants,
  fetchGameShareForDay,
  fetchWeekdayHourHeatmap,
  fetchGameLengthAverages,
} from "@/features/analytics/server/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,  
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  Activity,
  BarChart3,
  CalendarDays,
  Crown,
  RefreshCcw,
} from "lucide-react";

// charts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line, Bar, Pie, Bubble } from "react-chartjs-2";
import type { ChartData } from "chart.js";
import type {
  GameStatsSummary,
  DashboardDaily,
  HourlyRow,
  TopVariant,
  GameShareRow,
  HeatmapCell,
  ShareLike,
  GameLengthAveragesResp,
} from "@/features/analytics/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

// ===== Toronto-local helpers =====
function torontoTodayYYYYMMDD(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}
function addDaysYYYYMMDD(yyyyMMdd: string, days: number): string {
  const [y, m, d] = (yyyyMMdd || "").split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "180d", days: 180 },
];

// Narrow response shapes so we don't use `any`
type DailyResp = { plays: { date: string; plays: number }[] };
type HourlyResp = { hourly: HourlyRow[] };
type TopResp = { top: TopVariant[] };
type ShareResp = { share: GameShareRow[] };
type HeatmapResp = { matrix: HeatmapCell[] };

export default function AnalyticsPage() {
  // Filters
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [endDate, setEndDate] = useState<string>("");
  const [hourlyDate, setHourlyDate] = useState<string>("");
  const [topLimit, setTopLimit] = useState<number>(10);

  // Summary
  const [summary, setSummary] = useState<GameStatsSummary | null>(null);

  // Data
  const [dailyDash, setDailyDash] = useState<DashboardDaily[]>([]);
  const [hourly, setHourly] = useState<HourlyRow[]>([]);
  const [topVariants, setTopVariants] = useState<TopVariant[]>([]);
  const [gameShare, setGameShare] = useState<GameShareRow[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [avgLenOverall, setAvgLenOverall] = useState<
    GameLengthAveragesResp["overall"] | null
  >(null);
  const [avgLenByVariant, setAvgLenByVariant] = useState<
    GameLengthAveragesResp["byVariant"]
  >([]);
  const [avgLenByGame, setAvgLenByGame] = useState<
    GameLengthAveragesResp["byGame"]
  >([]);

  // UI toggles
  const [avgLenView, setAvgLenView] = useState<"variant" | "game">("variant");
  const [expandAvgLen, setExpandAvgLen] = useState(false);
  const INITIAL_COUNT = 10;

  const avgLenTotal = (
    avgLenView === "variant" ? avgLenByVariant : avgLenByGame
  ).length;
  const avgLenVisible = expandAvgLen
    ? avgLenTotal
    : Math.min(INITIAL_COUNT, avgLenTotal);

  // Sizing for avg-length bar list
  const BAR_HEIGHT = 26;
  const EXTRA_PAD = 90;
  const MIN_HEIGHT = 220;
  const avgLenChartHeight = Math.max(
    MIN_HEIGHT,
    avgLenVisible * BAR_HEIGHT + EXTRA_PAD
  );

  // Derived date range
  const effectiveEndDate = endDate || torontoTodayYYYYMMDD();
  const effectiveStartDate = addDaysYYYYMMDD(
    effectiveEndDate,
    -(rangeDays - 1)
  );

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ----- Data Loader (parallel) -----
  const load = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [s, daily, h, t, p, hm, gl] = await Promise.all([
        fetchGameStats(), // GameStatsSummary
        fetchDailyPlays({ days: rangeDays, end: endDate || undefined }), // DailyResp
        fetchHourlyPlays({ date: hourlyDate }), // HourlyResp
        fetchTopVariants({ days: rangeDays, end: endDate, limit: topLimit }), // TopResp
        fetchGameShareForDay({
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
        }), // ShareResp
        fetchWeekdayHourHeatmap({ weeks: 12 }), // HeatmapResp
        fetchGameLengthAverages({
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
          minSeconds: 10,
          maxSeconds: 3600,
        }), // GameLengthAveragesResp
      ]);

      setSummary(s);

      // DAILY
      const day = daily as DailyResp;
      const rawDaily: DashboardDaily[] = Array.isArray(day?.plays)
        ? day.plays.map((d) => ({
            date: d.date,
            totalPlays: Number(d.plays) || 0,
          }))
        : [];
      const sliced = rawDaily.slice(-rangeDays);
      setDailyDash(sliced);

      // HOURLY
      const hr = (h as HourlyResp)?.hourly ?? [];
      setHourly(hr);

      // TOP VARIANTS
      const tv = (t as TopResp)?.top ?? [];
      setTopVariants(tv);

      // GAME SHARE
      const gs = (p as ShareResp)?.share ?? [];
      setGameShare(gs);

      // HEATMAP
      const mat = (hm as HeatmapResp)?.matrix ?? [];
      setHeatmap(mat);

      // GAME LENGTHS
      const glTyped = gl as GameLengthAveragesResp;
      setAvgLenOverall(glTyped?.overall ?? null);
      setAvgLenByVariant(
        Array.isArray(glTyped?.byVariant) ? glTyped.byVariant : []
      );
      setAvgLenByGame(Array.isArray(glTyped?.byGame) ? glTyped.byGame : []);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [
    rangeDays,
    endDate,
    hourlyDate,
    topLimit,
    effectiveStartDate,
    effectiveEndDate,
  ]);

  // ----- Single effect -----
  useEffect(() => {
    load();
  }, [load]);

  // === Charts ===
  const dailyLine = useMemo<ChartData<"line">>(() => {
    if (!dailyDash.length) return { labels: [], datasets: [] };

    // labels as "MM-DD" to avoid tick callback + TZ issues
    const labels = dailyDash.map((d) => {
      const dt = new Date(d.date);
      dt.setDate(dt.getDate() + 1); // guard for TZ shift
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${mm}-${dd}`;
    });

    const data = dailyDash.map((d) => Number(d.totalPlays) || 0);

    return {
      labels,
      datasets: [
        {
          label: `Games / day (last ${rangeDays})`,
          data,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.15)",
          pointRadius: 2,
          pointHoverRadius: 4,
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [dailyDash, rangeDays]);

  const hourlyLine = useMemo<ChartData<"line">>(() => {
    if (!hourly.length) return { labels: [], datasets: [] };
    return {
      labels: hourly.map((h) => `${h.hour}:00`),
      datasets: [
        {
          label: `Hourly plays (${hourlyDate || "Today"})`,
          data: hourly.map((h) => Number(h.totalPlays || 0)),
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,0.15)",
          pointRadius: 2,
          pointHoverRadius: 4,
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [hourly, hourlyDate]);

  const topVariantsBar = useMemo<ChartData<"bar">>(() => {
    if (!topVariants.length) return { labels: [], datasets: [] };
    return {
      labels: topVariants.map((v) => String(v.name ?? "—")),
      datasets: [
        {
          label: `Top variants (last ${rangeDays}d)`,
          data: topVariants.map((v) => Number(v.plays || 0)),
          backgroundColor: "#4F46E5",
          borderRadius: 6,
          barThickness: "flex" as const,
          maxBarThickness: 28,
        },
      ],
    };
  }, [topVariants, rangeDays]);

  const gameSharePie = useMemo<ChartData<"pie">>(() => {
    if (!gameShare.length) return { labels: [], datasets: [] };

    const baseColors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#C9CBCF",
      "#B39CD0",
      "#FFB6C1",
      "#00CED1",
    ];

    const toLabel = (g: ShareLike) => g.name ?? g.variantName ?? g.room ?? "—";
    const toValue = (g: ShareLike) =>
      Number(g.plays ?? g.totalPlays ?? g.total ?? g.count ?? 0) || 0;

    const labels = gameShare.map((g) => toLabel(g as ShareLike));
    const data = gameShare.map((g) => toValue(g as ShareLike));
    const colors = gameShare.map((_, i) => baseColors[i % baseColors.length]);

    return {
      labels,
      datasets: [
        {
          label:
            effectiveStartDate === effectiveEndDate
              ? effectiveEndDate
              : `${effectiveStartDate} → ${effectiveEndDate}`,
          data,
          backgroundColor: colors,
          borderWidth: 1,
        },
      ],
    };
  }, [gameShare, effectiveStartDate, effectiveEndDate]);

  const heatmapBubble = useMemo<ChartData<"bubble">>(() => {
    if (!heatmap.length) return { labels: [], datasets: [] };
    const totals = heatmap.map((r) => Number(r.total || 0));
    const max = Math.max(1, ...totals);
    const bubbles = heatmap.map((row) => ({
      x: Number(row.hour) || 0,
      y: Number(row.weekday) || 0,
      r: 3 + 12 * (Number(row.total || 0) / max),
    }));
    return {
      labels: [],
      datasets: [{ label: "Traffic heatmap (12w)", data: bubbles }],
    };
  }, [heatmap]);

  const avgLenByVariantBar = useMemo<ChartData<"bar">>(() => {
    if (!avgLenByVariant.length) return { labels: [], datasets: [] };

    const list = expandAvgLen
      ? avgLenByVariant
      : avgLenByVariant.slice(0, INITIAL_COUNT);

    const labels = list.map((v) =>
      String(v?.variantName ?? `Variant ${v?.gamesVariantId ?? "—"}`)
    );

    const data = list.map((v) => {
      const secs =
        typeof v?.avgSeconds === "number"
          ? v.avgSeconds
          : Number(v?.avgSeconds);
      const mins =
        typeof v?.avgMinutes === "number"
          ? v.avgMinutes
          : Number(v?.avgMinutes);
      return Number.isFinite(mins)
        ? mins
        : Number.isFinite(secs)
        ? secs / 60
        : 0;
    });

    return {
      labels,
      datasets: [
        {
          label:
            effectiveStartDate === effectiveEndDate
              ? `Avg game length (min) — ${effectiveEndDate}`
              : `Avg game length (min) — ${effectiveStartDate} → ${effectiveEndDate}`,
          data,
          backgroundColor: "#8E44AD",
          borderRadius: 6,
          barThickness: "flex" as const,
          maxBarThickness: 28,
        },
      ],
    };
  }, [
    avgLenByVariant,
    expandAvgLen,
    effectiveStartDate,
    effectiveEndDate,
    INITIAL_COUNT,
  ]);

  const avgLenByGameBar = useMemo<ChartData<"bar">>(() => {
    if (!avgLenByGame.length) return { labels: [], datasets: [] };

    const list = expandAvgLen
      ? avgLenByGame
      : avgLenByGame.slice(0, INITIAL_COUNT);

    const labels = list.map((g) =>
      String(g?.gameName ?? `Game ${g?.GameID ?? "—"}`)
    );

    const data = list.map((g) => {
      const secs =
        typeof g?.avgSeconds === "number"
          ? g.avgSeconds
          : Number(g?.avgSeconds);
      const mins =
        typeof g?.avgMinutes === "number"
          ? g.avgMinutes
          : Number(g?.avgMinutes);
      return Number.isFinite(mins)
        ? mins
        : Number.isFinite(secs)
        ? secs / 60
        : 0;
    });

    return {
      labels,
      datasets: [
        {
          label:
            effectiveStartDate === effectiveEndDate
              ? `Avg game length (min) — ${effectiveEndDate}`
              : `Avg game length (min) — ${effectiveStartDate} → ${effectiveEndDate}`,
          data,
          backgroundColor: "#8E44AD",
          borderRadius: 6,
          barThickness: "flex" as const,
          maxBarThickness: 28,
        },
      ],
    };
  }, [
    avgLenByGame,
    expandAvgLen,
    effectiveStartDate,
    effectiveEndDate,
    INITIAL_COUNT,
  ]);

  // Shared chart options (typed, no `any`)
  const lineOpts: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 6, right: 8, bottom: 6, left: 8 } },
    plugins: { legend: { position: "top" }, title: { display: false } },
    scales: { y: { beginAtZero: true, grace: "5%" } },
  };

  const barOpts: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    scales: {
      x: { beginAtZero: true, grace: "5%" },
      y: { ticks: { autoSkip: false, maxTicksLimit: 12 } },
    },
    layout: { padding: { top: 6, right: 8, bottom: 6, left: 8 } },
  };

  const pieOpts: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
  };

  const bubbleOpts: ChartOptions<"bubble"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: "Hour (0-23)" },
        min: 0,
        max: 23,
        ticks: { stepSize: 1 },
      },
      y: {
        title: { display: true, text: "Weekday (1=Sun..7=Sat)" },
        min: 1,
        max: 7,
        ticks: { stepSize: 1 },
      },
    },
  };

  // ===== Reusable UI =====
  const StatCard = ({
    title,
    value,
    icon,
    hint,
  }: {
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    hint?: React.ReactNode;
  }) => {
    const valueTitle =
      typeof value === "string" || typeof value === "number"
        ? String(value)
        : undefined;

    return (
      <Card className="flex-1 min-w-0 sm:min-w-[220px] overflow-hidden">
        <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </CardTitle>
          <div className="opacity-70 shrink-0">{icon}</div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-semibold truncate" title={valueTitle}>
            {value}
          </div>
          {hint && (
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          )}
        </CardContent>
      </Card>
    );
  };

  const Empty = ({ children }: { children: React.ReactNode }) => (
    <div className="h-[200px] sm:h-[260px] md:h-[380px] flex flex-col gap-2 items-center justify-center border border-dashed rounded-lg text-muted-foreground bg-muted/20">
      <BarChart3 className="w-6 h-6 opacity-60" />
      {children}
    </div>
  );

  const Block = ({
    title,
    subtitle,
    action,
    children,
    loading,
  }: {
    title: string;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
  }) => (
    <Card>
      <CardHeader className="py-3 sm:py-4 flex flex-row items-center justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base truncate">{title}</CardTitle>
          {subtitle ? (
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {subtitle}
            </div>
          ) : null}
        </div>
        {action}
      </CardHeader>
      {/* Responsive heights */}
      <CardContent className="h-[220px] sm:h-[260px] md:h-[380px]">
        {loading ? (
          <div className="h-full flex flex-col gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-full w-full rounded-md" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 touch-pan-y">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Analytics
          </h1>
        </div>
        {/* Wrap preset buttons on small screens */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              size="sm"
              variant={rangeDays === p.days ? "default" : "outline"}
              onClick={() => setRangeDays(p.days)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date line (moved here for readability on mobile) */}
      <p className="text-xs sm:text-sm text-muted-foreground">
        Toronto timezone · {effectiveStartDate} → {effectiveEndDate}
      </p>

      {/* Sticky Controls */}
      <Card
        className="
    z-10
    border-muted
    bg-background/70 backdrop-blur
    supports-[backdrop-filter]:bg-background/60
  "
      >
        <CardHeader className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Controls</CardTitle>
            <Badge variant="secondary" className="font-normal">
              {isRefreshing ? "Refreshing…" : "Up to date"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Range (days)</Label>
            <Select
              value={String(rangeDays)}
              onValueChange={(v) => setRangeDays(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="90">90</SelectItem>
                <SelectItem value="180">180</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>End date (Toronto)</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Hourly date (Toronto)</Label>
            <Input
              type="date"
              value={hourlyDate}
              onChange={(e) => setHourlyDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Top limit</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={topLimit}
              onChange={(e) => setTopLimit(Number(e.target.value || 1))}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={load}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEndDate("");
                setHourlyDate("");
                setRangeDays(30);
                setTopLimit(10);
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-lg" />
          ))
        ) : (
          <>
            <StatCard
              title="Players In Facility (Now)"
              value={summary?.playersInFacilityNow ?? 0}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              title="Players In Facility (Today)"
              value={summary?.playersInFacilityToday ?? 0}
              icon={<UserCheck className="w-5 h-5" />}
            />
            <StatCard
              title="Today's Plays"
              value={summary?.todayPlays ?? 0}
              icon={<Activity className="w-5 h-5" />}
            />
            <StatCard
              title="This Week"
              value={summary?.weekPlays ?? 0}
              icon={<CalendarDays className="w-5 h-5" />}
            />
            <StatCard
              title="This Month"
              value={summary?.monthPlays ?? 0}
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <StatCard
              title="Most Popular Today"
              value={summary?.mostPopularToday?.name || "—"}
              icon={<Crown className="w-5 h-5" />}
            />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Plays */}
        <Block
          title="Daily Plays"
          loading={isLoading}
          action={
            <Badge variant="outline" className="rounded-sm">
              last {rangeDays}d
            </Badge>
          }
        >
          {dailyDash.length ? (
            <Line data={dailyLine} options={lineOpts} />
          ) : (
            <Empty>No daily data</Empty>
          )}
        </Block>

        {/* Hourly Plays */}
        <Block
          title={`Hourly Plays (${hourlyDate || "Today"})`}
          loading={isLoading}
        >
          {hourly.length ? (
            <Line data={hourlyLine} options={lineOpts} />
          ) : (
            <Empty>No hourly data</Empty>
          )}
        </Block>

        {/* Top Variants */}
        <Block
          title="Top Variants"
          subtitle={`Last ${rangeDays} days`}
          loading={isLoading}
        >
          {topVariants.length ? (
            <Bar data={topVariantsBar} options={barOpts} />
          ) : (
            <Empty>No top variants</Empty>
          )}
        </Block>

        {/* Game Share */}
        <Block
          title="Game Share (Rooms)"
          subtitle={
            effectiveStartDate === effectiveEndDate
              ? `(${effectiveEndDate})`
              : `(${effectiveStartDate} → ${effectiveEndDate})`
          }
          loading={isLoading}
        >
          {gameShare.length ? (
            <Pie data={gameSharePie} options={pieOpts} />
          ) : (
            <Empty>No game share data</Empty>
          )}
        </Block>

        {/* Heatmap */}
        <Block title="Traffic Heatmap (Weekday × Hour)" loading={isLoading}>
          {heatmap.length ? (
            <Bubble data={heatmapBubble} options={bubbleOpts} />
          ) : (
            <Empty>No heatmap data</Empty>
          )}
        </Block>

        {/* Avg Game Length */}
        <Card>
          <CardHeader className="py-3 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base truncate">
                  Average Game Length
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {effectiveStartDate === effectiveEndDate
                    ? effectiveEndDate
                    : `${effectiveStartDate} → ${effectiveEndDate}`}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant={avgLenView === "variant" ? "default" : "outline"}
                  onClick={() => setAvgLenView("variant")}
                >
                  By Variant
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={avgLenView === "game" ? "default" : "outline"}
                  onClick={() => setAvgLenView("game")}
                >
                  By Game
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
              <Card className="col-span-1">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">
                    Overall Avg
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">
                    {avgLenOverall?.avgMinutes != null
                      ? `${Number(avgLenOverall.avgMinutes).toFixed(1)} min`
                      : "—"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div style={{ height: avgLenChartHeight }}>
              {isLoading ? (
                <div className="h-full flex flex-col gap-3">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-full w-full rounded-md" />
                </div>
              ) : avgLenView === "variant" ? (
                avgLenByVariant.length ? (
                  <Bar data={avgLenByVariantBar} options={barOpts} />
                ) : (
                  <Empty>No game length data (variants)</Empty>
                )
              ) : avgLenByGame.length ? (
                <Bar data={avgLenByGameBar} options={barOpts} />
              ) : (
                <Empty>No game length data (games)</Empty>
              )}
            </div>

            {(avgLenView === "variant"
              ? avgLenByVariant.length
              : avgLenByGame.length) > INITIAL_COUNT && (
              <div className="mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExpandAvgLen((v) => !v)}
                >
                  {expandAvgLen
                    ? "Show less"
                    : `Show more (${
                        (avgLenView === "variant"
                          ? avgLenByVariant.length
                          : avgLenByGame.length) - INITIAL_COUNT
                      } more)`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { http } from "@/lib/http";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), {
  ssr: false,
});
const Bar = dynamic(() => import("react-chartjs-2").then((m) => m.Bar), {
  ssr: false,
});

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  type ChartOptions,
} from "chart.js";
import type { ChartData } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

type DailyPlay = { date: string; totalPlays: number };
type HourlyPlay = { hour: number; totalPlays: number };
type VariantPlays = { name: string; plays: number };
type Summary = {
  todayPlays: number;
  weekPlays: number;
  monthPlays: number;
  mostPopularToday: { name: string } | null;
  playersInFacilityToday: number;
  playersInFacilityNow: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyPlay[]>([]);
  const [hourlyTodayStats, setHourlyTodayStats] = useState<HourlyPlay[]>([]);
  const [topVariants, setTopVariants] = useState<VariantPlays[]>([]);
  const [topVariantsToday, setTopVariantsToday] = useState<VariantPlays[]>([]);
  const [summary, setSummary] = useState<Summary>({
    todayPlays: 0,
    weekPlays: 0,
    monthPlays: 0,
    mostPopularToday: null,
    playersInFacilityToday: 0,
    playersInFacilityNow: 0,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const stats = (await http.get("/stats/game-stats")).data ?? {};
        if (!mounted) return;

        setDailyStats((stats.dailyPlays ?? []) as DailyPlay[]);
        setHourlyTodayStats((stats.hourlyTodayPlays ?? []) as HourlyPlay[]);
        setTopVariants((stats.topVariants ?? []) as VariantPlays[]);
        setTopVariantsToday((stats.topVariantsToday ?? []) as VariantPlays[]);
        setSummary({
          todayPlays: stats.todayPlays ?? 0,
          weekPlays: stats.weekPlays ?? 0,
          monthPlays: stats.monthPlays ?? 0,
          mostPopularToday: stats.mostPopularToday ?? null,
          playersInFacilityToday: stats.playersInFacilityToday ?? 0,
          playersInFacilityNow: stats.playersInFacilityNow ?? 0,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Charts ---
  const dailyLast30 = useMemo<ChartData<"line">>(() => {
    const slice = dailyStats.slice(-30);
    if (!slice.length) return { labels: [], datasets: [] };

    // Pre-format labels as MM-DD to avoid tick callbacks
    const labels = slice.map((d) => {
      const dt = new Date(d.date);
      dt.setDate(dt.getDate() + 1);
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${mm}-${dd}`;
    });

    return {
      labels,
      datasets: [
        {
          label: "Games / day (30d)",
          data: slice.map((d) => d.totalPlays),
          borderColor: "#6366f1",
          backgroundColor: "rgba(99,102,241,0.15)",
          tension: 0.3,
          pointRadius: 0,
          fill: true,
        },
      ],
    };
  }, [dailyStats]);

  const hourlyToday = useMemo<ChartData<"line">>(() => {
    if (!hourlyTodayStats.length) return { labels: [], datasets: [] };
    return {
      labels: hourlyTodayStats.map((h) => `${h.hour}:00`),
      datasets: [
        {
          label: "Games today (hourly)",
          data: hourlyTodayStats.map((h) => h.totalPlays),
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.15)",
          tension: 0.3,
          pointRadius: 0,
          fill: true,
        },
      ],
    };
  }, [hourlyTodayStats]);

  const variantsBar30d = useMemo<ChartData<"bar">>(() => {
    if (!topVariants.length) return { labels: [], datasets: [] };
    return {
      labels: topVariants.map((v) => v.name),
      datasets: [
        {
          label: "Plays (30d)",
          data: topVariants.map((v) => v.plays),
          backgroundColor: "#93c5fd",
          borderWidth: 0,
          borderRadius: 6,
          barThickness: "flex",
          maxBarThickness: 28,
        },
      ],
    };
  }, [topVariants]);

  const compactLineOpts = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.06)" } },
      },
      interaction: { mode: "index", intersect: false },
    }),
    []
  );

  const compactBarOpts = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: {
        x: { grid: { color: "rgba(0,0,0,0.06)" }, beginAtZero: true },
        y: { grid: { display: false } },
      },
    }),
    []
  );

  return (
    <div
      className="
        mx-auto
        max-w-7xl
        px-4 sm:px-6 lg:px-8
        pt-6
        pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-6
      "
    >
      {/* KPIs */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          title="In Facility (Now)"
          loading={loading}
          value={summary.playersInFacilityNow}
        />
        <Kpi
          title="In Facility (Today)"
          loading={loading}
          value={summary.playersInFacilityToday}
        />
        <Kpi
          title="Today's Plays"
          loading={loading}
          value={summary.todayPlays}
        />
        <Kpi title="This Week" loading={loading} value={summary.weekPlays} />
        <Kpi title="This Month" loading={loading} value={summary.monthPlays} />
        <Kpi
          title="Most Popular Today"
          loading={loading}
          value={summary.mostPopularToday?.name ?? "—"}
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="w-full xl:col-span-8 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle>Performance</CardTitle>
            <CardDescription>Activity overview</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-3 sm:px-6">
            <Tabs defaultValue="daily">
              <div className="flex items-center justify-between">
                <TabsList className="w-full overflow-x-auto no-scrollbar">
                  <TabsTrigger value="daily" className="whitespace-nowrap">
                    Daily (30d)
                  </TabsTrigger>
                  <TabsTrigger value="today" className="whitespace-nowrap">
                    Today (hourly)
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="daily" className="mt-3">
                <ChartSlot loading={loading}>
                  <Line data={dailyLast30} options={compactLineOpts} />
                </ChartSlot>
              </TabsContent>

              <TabsContent value="today" className="mt-3">
                <ChartSlot loading={loading}>
                  <Line data={hourlyToday} options={compactLineOpts} />
                </ChartSlot>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="w-full xl:col-span-4 shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle>Top Variants</CardTitle>
            <CardDescription>Engagement spotlight</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-3 sm:px-6">
            <Tabs defaultValue="bar">
              <TabsList className="w-full overflow-x-auto no-scrollbar">
                <TabsTrigger value="bar" className="whitespace-nowrap">
                  30d
                </TabsTrigger>
                <TabsTrigger value="today" className="whitespace-nowrap">
                  Today
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bar" className="mt-3">
                <ChartSlot loading={loading}>
                  <Bar data={variantsBar30d} options={compactBarOpts} />
                </ChartSlot>
              </TabsContent>

              <TabsContent value="today" className="mt-3">
                {loading ? (
                  <div className="flex h-64 sm:h-[288px] items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading…
                  </div>
                ) : topVariantsToday.length === 0 ? (
                  <p className="h-64 sm:h-[288px] grid place-items-center text-sm text-muted-foreground">
                    No games played yet today.
                  </p>
                ) : (
                  <div className="h-64 sm:h-[288px] overflow-auto rounded-md border">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-muted/60 sticky top-0 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 text-left">#</th>
                          <th className="px-2 sm:px-3 py-2 text-left">
                            Game Variant
                          </th>
                          <th className="px-2 sm:px-3 py-2 text-left">Plays</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topVariantsToday.map((v, i) => (
                          <tr key={v.name} className="odd:bg-muted/30">
                            <td className="px-2 sm:px-3 py-2">{i + 1}</td>
                            <td className="px-2 sm:px-3 py-2">{v.name}</td>
                            <td className="px-2 sm:px-3 py-2">{v.plays}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** KPI card */
function Kpi({
  title,
  value,
  loading,
  children,
}: {
  title: string;
  value: React.ReactNode;
  loading: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className="w-full min-h-[108px] sm:min-h-[124px] lg:min-h-[132px] shadow-sm ring-1 ring-border/50">
      <div className="flex h-full flex-col justify-between p-4">
        <div className="text-xs sm:text-[13px] leading-5 text-muted-foreground truncate">
          {title}
        </div>

        {loading ? (
          <div className="mt-1 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <div className="mt-1 text-2xl sm:text-3xl font-semibold leading-tight tracking-tight truncate">
            {value}
          </div>
        )}

        <div className="pt-2">{children ? children : null}</div>
      </div>
    </Card>
  );
}

function ChartSlot({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="h-56 sm:h-64 xl:h-72">
      {loading ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading chart…
        </div>
      ) : (
        children
      )}
    </div>
  );
}

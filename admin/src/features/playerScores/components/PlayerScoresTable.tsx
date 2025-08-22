"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchPagedPlayerScores,
  fetchGamesVariants,
  deletePlayerScore,
  type PlayerScoreRow,
  type GamesVariant,
} from "../server/client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, RotateCw, Trash2 } from "lucide-react";
import PaginationBar from "@/components/pagination/PaginationBar";

/* ---------- Types for local UI state ---------- */
type FiltersState = {
  startDate: string;
  endDate: string;
  gamesVariantId: string;
  searchTerm: string;
};

type SortState = {
  sortBy: string;
  sortDir: "asc" | "desc";
};

type PlayerScoresTableProps = {
  role?: string;
};

export default function PlayerScoresTable({ role }: PlayerScoresTableProps) {
  const isAdmin = role === "admin";

  const [rows, setRows] = useState<PlayerScoreRow[]>([]);
  const [variantsMap, setVariantsMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  // filters / sort
  const [filters, setFilters] = useState<FiltersState>({
    startDate: "",
    endDate: "",
    gamesVariantId: "",
    searchTerm: "",
  });
  const [sort, setSort] = useState<SortState>({
    sortBy: "scoreid",
    sortDir: "desc",
  });

  // paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // variants lookup
  useEffect(() => {
    (async () => {
      const all: GamesVariant[] = await fetchGamesVariants();
      const map: Record<number, string> = {};
      all.forEach((v) => (map[v.ID] = v.name ?? `Variant ${v.ID}`));
      setVariantsMap(map);
    })();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchPagedPlayerScores({
        page,
        pageSize,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        gamesVariantId: filters.gamesVariantId || undefined,
        search: filters.searchTerm || undefined,
        sortBy: sort.sortBy,
        sortDir: sort.sortDir,
      });

      setRows(res?.data ?? []);

      const p = res?.pagination ?? {};
      const total = typeof p.totalItems === "number" ? p.totalItems : 0;
      const ps = typeof p.pageSize === "number" ? p.pageSize : pageSize;
      const tp =
        typeof p.totalPages === "number" && p.totalPages > 0
          ? p.totalPages
          : Math.max(1, Math.ceil((total || 0) / (ps || 10)));

      setTotalPages(tp);
      setTotalCount(total);
      if (typeof p.pageSize === "number" && p.pageSize !== pageSize) {
        setPageSize(p.pageSize);
      }
      if (typeof p.page === "number" && p.page !== page) {
        setPage(p.page);
      }
    } finally {
      setLoading(false);
    }
  }

  // reload whenever filters/sort/page/pageSize change
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, page, pageSize]);

  // reset to page 1 on filter/sort changes
  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  async function handleDelete(id: number) {
    if (!isAdmin) return;
    if (!confirm("Delete this score?")) return;
    await deletePlayerScore(id);
    await load();
    setPage((prev) => Math.max(1, Math.min(totalPages, prev)));
  }

  const hasFilters = useMemo(
    () =>
      !!(
        filters.startDate ||
        filters.endDate ||
        filters.gamesVariantId ||
        filters.searchTerm
      ),
    [filters]
  );

  function toggleSort(field: string) {
    setSort((prev) =>
      prev.sortBy === field
        ? { sortBy: field, sortDir: prev.sortDir === "asc" ? "desc" : "asc" }
        : { sortBy: field, sortDir: "asc" }
    );
  }

  // small helpers
  const fmtDateTime = (iso?: string | Date) =>
    iso ? new Date(iso).toLocaleString() : "—";

  const playerName = (s: PlayerScoreRow) =>
    s.player
      ? `${s.player.FirstName ?? ""} ${s.player.LastName ?? ""}`.trim() ||
        s.player.email
      : String(s.PlayerID);

  const variantName = (s: PlayerScoreRow) =>
    s.GamesVariant?.name ??
    variantsMap[s.GamesVariantId ?? -1] ??
    String(s.GamesVariantId ?? "—");

  return (
    <Card>
      <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Player Scores</CardTitle>
          <CardDescription>
            Browse, filter, and manage scores across games & variants.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RotateCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 mb-4">
          <label className="text-sm">
            <div className="mb-1">Start Date</div>
            <input
              type="date"
              className="w-full rounded border px-3 py-2"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, startDate: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            <div className="mb-1">End Date</div>
            <input
              type="date"
              className="w-full rounded border px-3 py-2"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            <div className="mb-1">Game Variant</div>
            <select
              className="w-full rounded border px-3 py-2"
              value={filters.gamesVariantId}
              onChange={(e) => {
                setFilters((f) => ({ ...f, gamesVariantId: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All</option>
              {Object.entries(variantsMap).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <div className="mb-1">Player Name / Email</div>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Search"
              value={filters.searchTerm}
              onChange={(e) => {
                setFilters((f) => ({ ...f, searchTerm: e.target.value }));
                setPage(1);
              }}
            />
          </label>
        </div>

        {hasFilters && <Separator className="my-4" />}

        {/* Data */}
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="grid gap-3 sm:hidden">
              {rows.length === 0 ? (
                <div className="rounded-md border p-6 text-center text-muted-foreground">
                  No results
                </div>
              ) : (
                rows.map((s) => (
                  <div
                    key={s.ScoreID}
                    className="rounded-md border p-3 bg-background"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">
                        #{s.ScoreID} • {playerName(s)}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                        onClick={() => handleDelete(s.ScoreID)}
                        title={isAdmin ? "Delete score" : "Admins only"}
                        disabled={!isAdmin}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Game
                        </div>
                        <div className="truncate">
                          {s.game?.gameName ?? s.GameID}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Variant
                        </div>
                        <div className="truncate">{variantName(s)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Level
                        </div>
                        <div>{s.LevelPlayed ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Points
                        </div>
                        <div className="font-medium">{s.Points}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground">
                          Start
                        </div>
                        <div>{fmtDateTime(s.StartTime)}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground">End</div>
                        <div>{fmtDateTime(s.EndTime)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="overflow-x-auto rounded-md border hidden sm:block">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-background">
                  <tr>
                    <Th
                      label="Score ID"
                      field="scoreid"
                      sort={sort}
                      onSort={toggleSort}
                      className="w-[90px]"
                    />
                    <Th
                      label="Player"
                      field="firstname"
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <Th
                      label="Game"
                      field="gamename"
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <Th
                      label="Variant"
                      field="variant"
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <Th label="Level" />
                    <Th
                      label="Points"
                      field="points"
                      sort={sort}
                      onSort={toggleSort}
                      className="w-[90px]"
                    />
                    <Th
                      label="Start"
                      field="starttime"
                      sort={sort}
                      onSort={toggleSort}
                      className="w-[170px]"
                    />
                    <Th label="End" className="w-[170px]" />
                    <th className="px-3 py-2 text-left w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s, i) => (
                    <tr key={`${s.ScoreID}-${i}`} className="odd:bg-muted/30">
                      <td className="px-3 py-2">{s.ScoreID}</td>
                      <td className="px-3 py-2">{playerName(s)}</td>
                      <td className="px-3 py-2">
                        {s.game?.gameName ?? s.GameID}
                      </td>
                      <td className="px-3 py-2">{variantName(s)}</td>
                      <td className="px-3 py-2">{s.LevelPlayed ?? "—"}</td>
                      <td className="px-3 py-2">{s.Points}</td>
                      <td className="px-3 py-2">{fmtDateTime(s.StartTime)}</td>
                      <td className="px-3 py-2">{fmtDateTime(s.EndTime)}</td>
                      <td className="px-3 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                          onClick={() => handleDelete(s.ScoreID)}
                          title={isAdmin ? "Delete score" : "Admins only"}
                          disabled={!isAdmin}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-6 text-center text-muted-foreground"
                      >
                        No results
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination (with bottom margin) */}
        <div className="mt-4 mb-6">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onPageChange={(next) =>
              setPage(Math.max(1, Math.min(totalPages, next)))
            }
            pageSize={pageSize}
            onPageSizeChange={(n) => {
              setPage(1);
              setPageSize(n);
            }}
            totalCount={totalCount}
            showPageInput
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Small header component with sortable caret ---------- */
function Th({
  label,
  field,
  sort,
  onSort,
  className,
}: {
  label: string;
  field?: string;
  sort?: { sortBy: string; sortDir: "asc" | "desc" };
  onSort?: (f: string) => void;
  className?: string;
}) {
  const active = !!field && !!sort && sort.sortBy === field;
  const caret = active ? (sort!.sortDir === "asc" ? "▲" : "▼") : "";
  const clickable = !!field && !!onSort;

  return (
    <th
      className={`px-3 py-2 text-left ${className ?? ""} ${
        clickable ? "cursor-pointer select-none" : ""
      }`}
      onClick={clickable ? () => onSort!(field!) : undefined}
      title={clickable ? "Sort" : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label} {caret}
      </span>
    </th>
  );
}

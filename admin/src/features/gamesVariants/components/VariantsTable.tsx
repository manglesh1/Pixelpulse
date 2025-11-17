"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchGames,
  fetchGamesVariants,
  createGamesVariant,
  updateGamesVariant,
  deleteGamesVariant,
  fetchVariantAnalytics,
  type GamesVariant,
  type Game,
} from "../server/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  X,
  ChevronUp,
  ChevronDown,
  Search,
} from "lucide-react";
import PaginationBar from "@/components/pagination/PaginationBar";

type SortKey = "ID" | "name" | "GameID" | "createdAt";
type SortDir = "asc" | "desc";

type VariantsTableProps = { role?: string };

/** Analytics payload from server */
type VariantAnalyticsOk = {
  todayPlays: number;
  last7DaysPlays: number;
  totalPlaysAllTime: number;
  playsPerDay: { date: string; count: number }[];
};
type VariantAnalytics = VariantAnalyticsOk | { error: string } | null;

const DEFAULT_FORM: Partial<GamesVariant> = {
  name: "",
  variantDescription: "",
  Levels: 1,
  GameType: "",
  instructions: "",
  MaxIterations: 5,
  MaxIterationTime: 30,
  MaxLevel: 10,
  ReductionTimeEachLevel: 5,
  introAudio: "",
  introAudioText: "",
  IsActive: 1,
  GameID: undefined,
};

export default function VariantsTable({ role }: VariantsTableProps) {
  const isAdmin = role === "admin";

  // data
  const [variants, setVariants] = useState<GamesVariant[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // filters/sort/page
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("ID");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // create/edit
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GamesVariant | null>(null);
  const [form, setForm] = useState<Partial<GamesVariant>>(DEFAULT_FORM);

  // delete
  const [delOpen, setDelOpen] = useState(false);
  const [toDelete, setToDelete] = useState<GamesVariant | null>(null);

  // toggle confirm
  const [toggleOpen, setToggleOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<GamesVariant | null>(null);

  // analytics
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<VariantAnalytics>(null);
  const [analyticsVariant, setAnalyticsVariant] = useState<GamesVariant | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [v, g] = await Promise.all([fetchGamesVariants(), fetchGames()]);
        if (!mounted) return;
        setVariants(v);
        setGames(g);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    console.log("Games loaded:", games);
  }, [games]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // sorting helpers (remove any)
  function getSortableValue(
    v: GamesVariant,
    key: SortKey
  ): string | number | Date | undefined {
    if (key === "ID") return v.ID;
    if (key === "name") return v.name ?? "";
    if (key === "GameID") return v.GameID ?? Number.MAX_SAFE_INTEGER;
    if (key === "createdAt") {
      if (!v.createdAt) return undefined;
      const d = new Date(v.createdAt as unknown as string);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  }

  const filteredSorted = useMemo(() => {
    const filtered = variants.filter((v) => {
      const term = debounced;
      const nameMatch = (v.name ?? "").toLowerCase().includes(term);
      const levelMatch = String(v.Levels ?? "").includes(term);
      const gameMatch = (
        games.find((g) => g.GameID === v.GameID)?.gameName ?? ""
      )
        .toLowerCase()
        .includes(term);
      const matchesGame =
        !gameFilter || gameFilter === "all"
          ? true
          : String(v.GameID ?? "") === gameFilter;
      return matchesGame && (nameMatch || levelMatch || gameMatch);
    });

    const sorted = [...filtered].sort((a, b) => {
      const av = getSortableValue(a, sortKey);
      const bv = getSortableValue(b, sortKey);

      if (av == null && bv != null) return 1;
      if (bv == null && av != null) return -1;
      if (av == null && bv == null) return 0;

      if (av instanceof Date && bv instanceof Date) {
        return sortDir === "asc"
          ? av.getTime() - bv.getTime()
          : bv.getTime() - av.getTime();
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const diff = Number(av) - Number(bv);
      return sortDir === "asc" ? diff : -diff;
    });

    return sorted;
  }, [variants, games, debounced, gameFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const current = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function gameName(id: number | undefined) {
    if (id == null) return "—";
    const match = games.find((g) => Number(g.GameID) === Number(id));
    if (!match) {
      console.warn("No game match for GameID:", id, "in games:", games);
    }
    return match?.gameName ?? "—";
  }

  // form helpers
  function openCreate() {
    if (!isAdmin) return;
    setEditing(null);
    setForm(DEFAULT_FORM);
    setFormOpen(true);
  }

  function openEdit(v: GamesVariant) {
    setEditing(v);
    setForm({
      name: v.name ?? "",
      variantDescription: v.variantDescription ?? "",
      Levels: v.Levels,
      GameType: v.GameType ?? "",
      instructions: v.instructions ?? "",
      MaxIterations: v.MaxIterations,
      MaxIterationTime: v.MaxIterationTime,
      MaxLevel: v.MaxLevel,
      ReductionTimeEachLevel: v.ReductionTimeEachLevel,
      introAudio: v.introAudio ?? "",
      introAudioText: v.introAudioText ?? "",
      IsActive: v.IsActive,
      GameID: v.GameID,
    });
    setFormOpen(true);
  }

  function onFormChange<K extends keyof GamesVariant>(
    key: K,
    val: GamesVariant[K]
  ) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    if (!form.name || !form.GameID) return;

    if (editing) {
      const updated = await updateGamesVariant(editing.ID, form);
      setVariants((prev) =>
        prev.map((v) => (v.ID === editing.ID ? updated : v))
      );
    } else {
      const created = await createGamesVariant(form);
      setVariants((prev) => [...prev, created]);
    }
    setFormOpen(false);
    setEditing(null);
  }

  // delete
  async function confirmDelete() {
    if (!toDelete || !isAdmin) return;
    await deleteGamesVariant(toDelete.ID);
    setVariants((prev) => prev.filter((v) => v.ID !== toDelete.ID));
    setDelOpen(false);
    setToDelete(null);
  }

  // toggle active
  function askToggle(v: GamesVariant) {
    setToggleTarget(v);
    setToggleOpen(true);
  }

  async function doToggle() {
    if (!toggleTarget) return;
    const updated: GamesVariant = {
      ...toggleTarget,
      IsActive: toggleTarget.IsActive === 1 ? 0 : 1,
    };
    await updateGamesVariant(updated.ID, updated);
    setVariants((prev) => prev.map((v) => (v.ID === updated.ID ? updated : v)));
    setToggleOpen(false);
    setToggleTarget(null);
  }

  // analytics
  async function viewAnalytics(v: GamesVariant) {
    setAnalyticsOpen(true);
    setAnalyticsVariant(v);
    setAnalyticsLoading(true);
    setAnalyticsData(null);
    try {
      const data = await fetchVariantAnalytics(v.ID);
      // Trusting server shape; narrow to our VariantAnalyticsOk
      const normalized: VariantAnalyticsOk = {
        todayPlays: Number(data.todayPlays ?? 0),
        last7DaysPlays: Number(data.last7DaysPlays ?? 0),
        totalPlaysAllTime: Number(data.totalPlaysAllTime ?? 0),
        playsPerDay: Array.isArray(data.playsPerDay)
          ? data.playsPerDay.map((d: { date: string; count: number }) => ({
              date: String(d.date),
              count: Number(d.count ?? 0),
            }))
          : [],
      };
      setAnalyticsData(normalized);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Failed to load analytics";
      setAnalyticsData({ error: msg });
    } finally {
      setAnalyticsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Game Variants</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Search, filter, and manage variants for each game.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search variants…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-[240px] pl-8"
            />
          </div>

          <Select
            value={gameFilter}
            onValueChange={(v) => {
              setGameFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All games</SelectItem>
              {games.map((g) => (
                <SelectItem key={g.GameID} value={String(g.GameID)}>
                  {g.gameCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> Create Variant
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="grid place-items-center rounded-md border py-14 text-center">
            <div className="text-4xl">🧩</div>
            <p className="mt-2 text-sm text-muted-foreground">
              No variants found
              {debounced ? ` for “${debounced}”` : ""}{" "}
              {gameFilter !== "all" ? "in the selected game" : ""}.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
              {isAdmin && (
                <Button onClick={openCreate}>
                  <Plus className="mr-1 h-4 w-4" /> Create Variant
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile list (cards) */}
            <div className="grid gap-3 lg:hidden">
              {current.map((v) => (
                <div key={v.ID} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="text-sm font-semibold truncate"
                        title={v.name ?? ""}
                      >
                        {v.name}
                      </div>
                      <div
                        className="mt-0.5 text-xs text-muted-foreground truncate"
                        title={gameName(v.GameID)}
                      >
                        {gameName(v.GameID)} · ID {v.ID}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {v.createdAt
                          ? new Date(
                              v.createdAt as unknown as string
                            ).toLocaleDateString()
                          : "—"}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-2 text-sm">
                        <Switch
                          checked={v.IsActive === 1}
                          onCheckedChange={() => askToggle(v)}
                        />
                        <span className="text-muted-foreground">
                          {v.IsActive === 1 ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Actions (compact) */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="inline-flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => viewAnalytics(v)}
                          title="Analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        {isAdmin ? (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEdit(v)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                              onClick={() => {
                                setToDelete(v);
                                setDelOpen(true);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(v)}
                            title="View details"
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto rounded-md border bg-background">
              <Table className="table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <SortableHead
                      label="ID"
                      active={sortKey === "ID"}
                      dir={sortDir}
                      onClick={() => toggleSort("ID")}
                      className="w-16"
                    />
                    <SortableHead
                      label="Name"
                      active={sortKey === "name"}
                      dir={sortDir}
                      onClick={() => toggleSort("name")}
                      className="w-[260px]"
                    />
                    <SortableHead
                      label="Game"
                      active={sortKey === "GameID"}
                      dir={sortDir}
                      onClick={() => toggleSort("GameID")}
                      className="w-[200px]"
                    />
                    <SortableHead
                      label="Created"
                      active={sortKey === "createdAt"}
                      dir={sortDir}
                      onClick={() => toggleSort("createdAt")}
                      className="w-[130px]"
                    />
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[300px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {current.map((v) => {
                    console.log(
                      "Variant row:",
                      v.ID,
                      "v.GameID=",
                      v.GameID,
                      "type=",
                      typeof v.GameID,
                      "Lookup result=",
                      gameName(v.GameID)
                    );

                    return (
                      <TableRow key={v.ID} className="odd:bg-muted/30">
                        <TableCell className="w-16">{v.ID}</TableCell>

                        <TableCell className="w-[260px] max-w-[260px]">
                          <button
                            title={v.name ?? ""}
                            className="block w-full truncate text-left text-sm font-medium text-foreground hover:text-indigo-600 transition-colors"
                            onClick={() => openEdit(v)}
                          >
                            {v.name}
                          </button>
                        </TableCell>

                        <TableCell
                          className="w-[200px] max-w-[200px] truncate"
                          title={gameName(v.GameID)}
                        >
                          {gameName(v.GameID)}
                        </TableCell>

                        <TableCell className="w-[130px]">
                          {v.createdAt
                            ? new Date(
                                v.createdAt as unknown as string
                              ).toLocaleDateString()
                            : "—"}
                        </TableCell>

                        <TableCell className="w-[140px]">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={v.IsActive === 1}
                              onCheckedChange={() => askToggle(v)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {v.IsActive === 1 ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="w-[300px] whitespace-nowrap">
                          <div className="flex flex-nowrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewAnalytics(v)}
                            >
                              <BarChart3 className="h-4 w-4" />
                              <span className="ml-1">Analytics</span>
                            </Button>

                            {isAdmin ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEdit(v)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="ml-1">Edit</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                  onClick={() => {
                                    setToDelete(v);
                                    setDelOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="ml-1">Delete</span>
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(v)}
                                title="View details"
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination with margins */}
            <div className="mb-6">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalCount={filteredSorted.length}
                showPageInput
              />
            </div>
          </>
        )}
      </CardContent>

      {/* Create/Edit dialog (read-only for non-admins) */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden bg-background text-foreground rounded-xl shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle className="text-xl font-semibold">
              {editing ? "Edit Game Variant" : "Create Game Variant"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Manage game configuration, timing, and behavior.
            </p>
          </DialogHeader>

          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-10">
            {/* Basic Info */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Basic Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Variant Name</Label>
                  <Input
                    id="name"
                    required
                    value={form.name ?? ""}
                    onChange={(e) =>
                      onFormChange("name", e.target.value as never)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="variantDescription">Description</Label>
                  <Textarea
                    id="variantDescription"
                    rows={3}
                    value={form.variantDescription ?? ""}
                    onChange={(e) =>
                      onFormChange(
                        "variantDescription",
                        e.target.value as never
                      )
                    }
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="GameType">Game Type</Label>
                  <Select
                    value={form.GameType ?? ""}
                    onValueChange={(v) => onFormChange("GameType", v as never)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comp">Competitive</SelectItem>
                      <SelectItem value="multi">Multiplayer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="GameID">Game</Label>
                  <Select
                    value={form.GameID ? String(form.GameID) : ""}
                    onValueChange={(v) =>
                      onFormChange("GameID", Number(v) as never)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select game" />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map((g) => (
                        <SelectItem key={g.GameID} value={String(g.GameID)}>
                          {g.gameName} ({g.gameCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Gameplay Settings */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Gameplay Settings</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormNumber
                  id="Levels"
                  label="Levels"
                  value={form.Levels}
                  onChange={onFormChange}
                />
                <FormNumber
                  id="MaxLevel"
                  label="Max Level"
                  value={form.MaxLevel}
                  onChange={onFormChange}
                />
                <FormNumber
                  id="MaxIterations"
                  label="Max Iterations"
                  value={form.MaxIterations}
                  onChange={onFormChange}
                />
                <FormNumber
                  id="MaxIterationTime"
                  label="Max Iteration Time (sec)"
                  value={form.MaxIterationTime}
                  onChange={onFormChange}
                />
                <FormNumber
                  id="ReductionTimeEachLevel"
                  label="Time Reduction / Level (sec)"
                  value={form.ReductionTimeEachLevel}
                  onChange={onFormChange}
                />
              </div>
            </section>

            {/* Instructions */}
            <section>
              <h3 className="text-lg font-semibold mb-3">
                Instructions (HTML)
              </h3>
              <div className="rounded-md border bg-muted/20 p-3 h-[300px] overflow-y-auto">
                <Textarea
                  id="instructions"
                  value={form.instructions ?? ""}
                  onChange={(e) =>
                    onFormChange("instructions", e.target.value as never)
                  }
                  className="h-full w-full font-mono text-sm bg-transparent border-0 resize-none focus-visible:ring-0 focus:outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You can use HTML markup here. This field scrolls independently
                for long content.
              </p>
            </section>

            {/* Audio */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Audio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  id="introAudio"
                  label="Intro Audio URL"
                  value={form.introAudio}
                  onChange={onFormChange}
                />
                <FormTextArea
                  id="introAudioText"
                  label="Intro Audio Text"
                  value={form.introAudioText}
                  onChange={onFormChange}
                />
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Switch
                checked={(form.IsActive ?? 1) === 1}
                onCheckedChange={(checked) =>
                  onFormChange("IsActive", (checked ? 1 : 0) as never)
                }
              />
              <span className="text-sm text-muted-foreground">
                {(form.IsActive ?? 1) === 1 ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormOpen(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" onClick={submitForm}>
                {editing ? "Save Changes" : "Create Variant"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Delete variant <strong>{toDelete?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={!isAdmin}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle confirmation */}
      <AlertDialog open={toggleOpen} onOpenChange={setToggleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.IsActive === 1
                ? "Inactivate Variant?"
                : "Activate Variant?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {toggleTarget?.IsActive === 1 ? "inactivate" : "activate"}{" "}
              <strong>{toggleTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToggleTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={doToggle}>
              {toggleTarget?.IsActive === 1 ? "Inactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Analytics */}
      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="w-[92vw] max-w-3xl p-0">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 sticky top-0 bg-background z-10">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle>
                Analytics —{" "}
                <span className="font-normal">{analyticsVariant?.name}</span>
              </DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="-mr-1">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {analyticsLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : analyticsData && "error" in analyticsData ? (
              <div className="text-sm text-red-600">{analyticsData.error}</div>
            ) : analyticsData ? (
              <div className="space-y-4">
                {/* KPIs */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Today's Plays", analyticsData.todayPlays],
                    ["Last 7 Days", analyticsData.last7DaysPlays],
                    ["Total Plays", analyticsData.totalPlaysAllTime],
                  ].map(([label, val]) => (
                    <div
                      key={String(label)}
                      className="rounded-md border p-3 text-center"
                    >
                      <div className="text-xs text-muted-foreground">
                        {label}
                      </div>
                      <div className="text-xl font-semibold">
                        {typeof val === "number" ? val : "—"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Plays by day list
                {Array.isArray(analyticsData.playsPerDay) &&
                analyticsData.playsPerDay.length ? (
                  <div className="rounded-md border overflow-hidden">
                    <div className="px-3 py-2 text-sm font-medium">
                      Plays by Day
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Play Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.playsPerDay.map((d) => (
                          <tr key={d.date} className="odd:bg-muted/30">
                            <td className="px-3 py-2">{d.date}</td>
                            <td className="px-3 py-2">{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null} */}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No analytics available.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

type FormProps<T> = {
  id: keyof T & string;
  label: string;
  value?: string | number | null;
  onChange: (id: keyof T & string, value: never) => void;
};

function FormInput<T>({ id, label, value, onChange }: FormProps<T>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(id, e.target.value as never)}
      />
    </div>
  );
}

function FormTextArea<T>({ id, label, value, onChange }: FormProps<T>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={2}
        value={value ?? ""}
        onChange={(e) => onChange(id, e.target.value as never)}
      />
    </div>
  );
}

function FormNumber<T>({ id, label, value, onChange }: FormProps<T>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(id, Number(e.target.value) as never)}
      />
    </div>
  );
}

/* ---------- helpers ---------- */

function SortableHead({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active?: boolean;
  dir?: "asc" | "desc";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <TableHead
      onClick={onClick}
      className={`cursor-pointer select-none ${className ?? ""}`}
      title="Sort"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          dir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : null}
      </span>
    </TableHead>
  );
}

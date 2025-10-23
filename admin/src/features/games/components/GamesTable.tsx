"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchGames,
  fetchGamesVariants,
  fetchLocations,
  createGame,
  updateGame,
  deleteGame,
  type Game,
} from "../server/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import PaginationBar from "@/components/pagination/PaginationBar";

type SortKey =
  | "GameID"
  | "gameCode"
  | "gameName"
  | "createdAt"
  | "numberOfVariants"
  | "LocationID";
type SortDir = "asc" | "desc";

const DEFAULT_NEW: Partial<Game> = {
  gameCode: "",
  gameName: "",
  MaxPlayers: 5,
  IpAddress: "127.0.0.1",
  LocalPort: 21,
  RemotePort: 7113,
  SocketBReceiverPort: 20105,
  NoOfControllers: 1,
  NoofLedPerdevice: 1,
  columns: 14,
  introAudio: "",
  LocationID: 0,
};

type GamesTableProps = {
  role?: string;
};

type GameWithLocation = Game & {
  location?: {
    LocationID: number;
    Name: string;
  };
};

export default function GamesTable({ role }: GamesTableProps) {
  // data
  const [games, setGames] = useState<GameWithLocation[]>([]);
  const [variantCount, setVariantCount] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  // ui state
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("GameID");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // modals
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [form, setForm] = useState<Partial<Game>>(DEFAULT_NEW);

  const [openDelete, setOpenDelete] = useState(false);
  const [toDelete, setToDelete] = useState<Game | null>(null);

  const isAdmin = role === "admin";

  const [locations, setLocations] = useState<
    { LocationID: number; Name: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      const locs = await fetchLocations();
      setLocations(locs);
    })();
  }, []);

  // load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [g, gv] = await Promise.all([fetchGames(), fetchGamesVariants()]);
        if (!mounted) return;
        setGames(g);

        // build counts without storing full variants in state
        const counts: Record<number, number> = {};
        gv.forEach((v) => {
          counts[v.GameId] = (counts[v.GameId] ?? 0) + 1;
        });
        setVariantCount(counts);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [search]);

  function getSortableValue(
    g: Game,
    key: SortKey,
    counts: Record<number, number>
  ): string | number | Date | null | undefined {
    if (key === "numberOfVariants") return counts[g.GameID] ?? 0;

    if (key === "createdAt") {
      if (!g.createdAt) return undefined;
      const d = new Date(g.createdAt);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }

    if (key === "GameID") return g.GameID;
    if (key === "gameCode") return g.gameCode;
    if (key === "gameName") return g.gameName;
    if (key === "LocationID") return g.LocationID;
    return undefined;
  }

  // search + sort
  const filteredSorted = useMemo(() => {
    const filtered = games.filter(
      (g) =>
        g.gameName?.toLowerCase().includes(debounced) ||
        g.gameCode?.toLowerCase().includes(debounced)
    );

    return [...filtered].sort((a, b) => {
      const av = getSortableValue(a, sortKey, variantCount);
      const bv = getSortableValue(b, sortKey, variantCount);

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
  }, [games, debounced, sortKey, sortDir, variantCount]);
  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const current = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  // robust 2-way sort toggle
  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  // form helpers
  function openCreate() {
    if (!isAdmin) return; // read-only guard
    setEditing(null);
    setForm(DEFAULT_NEW);
    setOpenForm(true);
  }

  function openEdit(g: Game) {
    setEditing(g);
    setForm({
      gameCode: g.gameCode ?? "",
      gameName: g.gameName ?? "",
      MaxPlayers: g.MaxPlayers,
      IpAddress: g.IpAddress,
      LocalPort: g.LocalPort,
      RemotePort: g.RemotePort,
      SocketBReceiverPort: g.SocketBReceiverPort,
      NoOfControllers: g.NoOfControllers,
      NoofLedPerdevice: g.NoofLedPerdevice,
      columns: g.columns,
      introAudio: g.introAudio ?? "",
    });
    setOpenForm(true);
  }

  function onChange<K extends keyof Game>(key: K, value: Game[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return; // read-only guard

    if (editing) {
      const updated = await updateGame(editing.GameID, form);
      setGames((prev) =>
        prev.map((g) => (g.GameID === editing.GameID ? updated : g))
      );
    } else {
      const created = await createGame(form);
      setGames((prev) => [...prev, created]);
    }
    setOpenForm(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!toDelete || !isAdmin) return; // read-only guard
    await deleteGame(toDelete.GameID);
    setGames((prev) => prev.filter((g) => g.GameID !== toDelete.GameID));
    setToDelete(null);
    setOpenDelete(false);
  }

  return (
    <Card>
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Games</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage base game definitions and network settings.
          </p>
        </div>

        {/* Header actions */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>

          {isAdmin && (
            <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
              <Plus className="mr-1 h-4 w-4" /> Create Game
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
            <div className="text-4xl">🎮</div>
            <p className="mt-2 text-sm text-muted-foreground">
              No games found {debounced ? `for “${debounced}”` : ""}.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
              {isAdmin && (
                <Button onClick={openCreate}>
                  <Plus className="mr-1 h-4 w-4" /> Create Game
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden space-y-3">
              {current.map((g) => (
                <MobileGameCard
                  key={g.GameID}
                  g={g}
                  count={variantCount[g.GameID] ?? 0}
                  onEdit={() => openEdit(g)}
                  onDelete={() => {
                    setToDelete(g);
                    setOpenDelete(true);
                  }}
                  isAdmin={isAdmin}
                />
              ))}

              {/* Pagination (mobile) with margin bottom */}
              <div className="mb-6">
                <PaginationBar
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalCount={filteredSorted.length}
                  showPageInput
                />
              </div>
            </div>

            {/* md+: table */}
            <div className="hidden md:block overflow-x-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <SortableHead
                      label="ID"
                      active={sortKey === "GameID"}
                      dir={sortDir}
                      onClick={() => toggleSort("GameID")}
                      className="w-[96px]"
                    />
                    <SortableHead
                      label="Code"
                      active={sortKey === "gameCode"}
                      dir={sortDir}
                      onClick={() => toggleSort("gameCode")}
                    />
                    <SortableHead
                      label="Location"
                      active={sortKey === "LocationID"}
                      dir={sortDir}
                      onClick={() => toggleSort("LocationID")}
                    />
                    <SortableHead
                      label="Created"
                      active={sortKey === "createdAt"}
                      dir={sortDir}
                      onClick={() => toggleSort("createdAt")}
                      className="hidden sm:table-cell"
                    />
                    <SortableHead
                      label="# Variants"
                      active={sortKey === "numberOfVariants"}
                      dir={sortDir}
                      onClick={() => toggleSort("numberOfVariants")}
                      className="w-[120px]"
                    />
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {current.map((g) => (
                    <TableRow key={g.GameID} className="odd:bg-muted/30">
                      <TableCell className="w-[96px]">{g.GameID}</TableCell>
                      <TableCell className="font-medium">
                        <button
                          className={`text-sm font-medium ${
                            isAdmin
                              ? "text-foreground hover:text-indigo-600 transition-colors"
                              : "text-muted-foreground cursor-not-allowed"
                          }`}
                          onClick={() => isAdmin && openEdit(g)}
                          disabled={!isAdmin}
                          title={isAdmin ? "Edit game" : "Read-only"}
                        >
                          {g.gameCode}
                        </button>
                      </TableCell>
                      <TableCell>{g.location?.Name ?? "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {g.createdAt
                          ? new Date(g.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="w-[120px]">
                        <span className="inline-flex min-w-[2ch] items-center justify-center rounded-md bg-muted px-2 py-1 text-xs">
                          {variantCount[g.GameID] ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="w-[160px]">
                        <div className="flex items-center gap-2">
                          {isAdmin ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(g)}
                              >
                                <Pencil className="mr-1 h-4 w-4" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setToDelete(g);
                                  setOpenDelete(true);
                                }}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(g)}
                              title="View details"
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination (desktop) with margin bottom */}
            <div className="hidden md:block">
              <PaginationBar
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalCount={filteredSorted.length}
                showPageInput
                className="mb-6"
              />
            </div>
          </>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="w-[92vw] max-w-3xl p-0">
          {/* Header with X */}
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 sticky top-0 bg-background z-10">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle>{editing ? "Edit Game" : "Create Game"}</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="-mr-1">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          {/* Form sections */}
          <form
            className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-6 max-h-[80vh] overflow-y-auto"
            onSubmit={submitForm}
          >
            {/* Basic */}
            <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Legend>Basic</Legend>

              <Field id="gameCode" label="Game Code" required>
                <Input
                  id="gameCode"
                  value={form.gameCode ?? ""}
                  onChange={(e) => onChange("gameCode", e.target.value)}
                  required
                  disabled={!isAdmin}
                />
              </Field>

              <Field id="gameName" label="Game Name" required>
                <Input
                  id="gameName"
                  value={form.gameName ?? ""}
                  onChange={(e) => onChange("gameName", e.target.value)}
                  required
                  disabled={!isAdmin}
                />
              </Field>

              <Field id="MaxPlayers" label="Max Players">
                <Input
                  id="MaxPlayers"
                  type="number"
                  value={form.MaxPlayers ?? 0}
                  onChange={(e) =>
                    onChange("MaxPlayers", Number(e.target.value || 0))
                  }
                  disabled={!isAdmin}
                />
              </Field>

              <Field id="columns" label="Columns">
                <Input
                  id="columns"
                  type="number"
                  value={form.columns ?? 0}
                  onChange={(e) =>
                    onChange("columns", Number(e.target.value || 0))
                  }
                  disabled={!isAdmin}
                />
              </Field>

              <Field id="introAudio" label="Intro Audio">
                <Input
                  id="introAudio"
                  value={form.introAudio ?? ""}
                  onChange={(e) => onChange("introAudio", e.target.value)}
                  disabled={!isAdmin}
                />
              </Field>
              <Field id="LocationID" label="Location" required>
                <select
                  id="LocationID"
                  value={form.LocationID ?? ""}
                  onChange={(e) =>
                    onChange("LocationID", Number(e.target.value))
                  }
                  disabled={!isAdmin}
                  className="border rounded-md p-2"
                  required
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc.LocationID} value={loc.LocationID}>
                      {loc.Name}
                    </option>
                  ))}
                </select>
              </Field>
            </fieldset>

            {/* Network */}
            <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Legend>Network</Legend>

              <Field id="IpAddress" label="IP Address">
                <Input
                  id="IpAddress"
                  value={form.IpAddress ?? ""}
                  onChange={(e) => onChange("IpAddress", e.target.value)}
                  disabled={!isAdmin}
                />
              </Field>

              <Field id="LocalPort" label="Local Port">
                <Input
                  id="LocalPort"
                  type="number"
                  value={form.LocalPort ?? 0}
                  onChange={(e) =>
                    onChange("LocalPort", Number(e.target.value || 0))
                  }
                  disabled={!isAdmin}
                />
              </Field>

              <Field id="RemotePort" label="Remote Port">
                <Input
                  id="RemotePort"
                  type="number"
                  value={form.RemotePort ?? 0}
                  onChange={(e) =>
                    onChange("RemotePort", Number(e.target.value || 0))
                  }
                  disabled={!isAdmin}
                />
              </Field>

              <Field id="SocketBReceiverPort" label="Socket B Receiver Port">
                <Input
                  id="SocketBReceiverPort"
                  type="number"
                  value={form.SocketBReceiverPort ?? 0}
                  onChange={(e) =>
                    onChange("SocketBReceiverPort", Number(e.target.value || 0))
                  }
                  disabled={!isAdmin}
                />
              </Field>

              <Field id="NoOfControllers" label="Number of Controllers">
                <Input
                  id="NoOfControllers"
                  type="number"
                  value={form.NoOfControllers ?? 0}
                  onChange={(e) =>
                    onChange("NoOfControllers", Number(e.target.value || 0))
                  }
                  disabled={!isAdmin}
                />
              </Field>

              <Field id="NoofLedPerdevice" label="LEDs per Device">
                <Input
                  id="NoofLedPerdevice"
                  type="number"
                  value={form.NoofLedPerdevice ?? 0}
                  onChange={(e) =>
                    onChange("NoofLedPerdevice", Number(e.target.value || 0))
                  }
                  disabled={!isAdmin}
                />
              </Field>
            </fieldset>

            {/* Form actions */}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenForm(false);
                  setEditing(null);
                }}
                className="w-full sm:w-auto"
              >
                Close
              </Button>

              {isAdmin && (
                <Button type="submit" className="w-full sm:w-auto">
                  {editing ? "Save" : "Create"}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this game?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting <strong>{toDelete?.gameName}</strong> may also remove its
              variants. This action cannot be undone.
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
    </Card>
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

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  children,
  required,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label} {required ? <span className="text-red-500">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

/* ---------- mobile card ---------- */

function MobileGameCard({
  g,
  count,
  onEdit,
  onDelete,
  isAdmin,
}: {
  g: Game;
  count: number;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            #{g.GameID} <span className="font-normal">•</span>{" "}
            <span className="truncate inline-block max-w-[60vw]">
              {g.gameCode}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "—"}
          </div>

          <div className="mt-2 inline-flex items-center gap-2 text-xs">
            <span className="inline-flex min-w-[2ch] items-center justify-center rounded-md bg-muted px-2 py-1">
              {count}
            </span>
            variants
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {isAdmin ? (
            <>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onEdit}>
              View
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

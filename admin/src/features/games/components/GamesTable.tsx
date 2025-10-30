"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchGames,
  fetchGamesVariants,
  fetchGameLocations,
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
  ChevronUp,
  ChevronDown,
  Search,
  MoreHorizontal,
} from "lucide-react";
import PaginationBar from "@/components/pagination/PaginationBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import ManageGameLocationsDialog from "./ManageGameLocationsDialog";

type SortKey =
  | "GameID"
  | "gameCode"
  | "gameName"
  | "createdAt"
  | "numberOfVariants"
  | "locationsCount";
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
};

type GamesTableProps = {
  role?: string;
};

export default function GamesTable({ role }: GamesTableProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [variantCount, setVariantCount] = useState<Record<number, number>>({});
  const [locationsCount, setLocationsCount] = useState<Record<number, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("gameName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [form, setForm] = useState<Partial<Game>>(DEFAULT_NEW);
  const [openDelete, setOpenDelete] = useState(false);
  const [toDelete, setToDelete] = useState<Game | null>(null);

  const [selectedGameName, setSelectedGameName] =
    useState<string>("Unknown Game");

  const isAdmin = role === "admin";

  // Manage locations dialog
  const [manageLocOpen, setManageLocOpen] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  // Load games + variants + location counts
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [g, gv] = await Promise.all([fetchGames(), fetchGamesVariants()]);
        if (!mounted) return;

        const sorted = [...g].sort((a, b) =>
          (a.gameName || "").localeCompare(b.gameName || "")
        );
        setGames(sorted);

        const vCounts: Record<number, number> = {};
        gv.forEach((v) => {
          vCounts[v.GameID] = (vCounts[v.GameID] ?? 0) + 1;
        });
        setVariantCount(vCounts);

        const countsEntries = await Promise.all(
          sorted.map(async (game) => {
            try {
              const rows = await fetchGameLocations(game.GameID);
              return [game.GameID, rows.length] as const;
            } catch {
              return [game.GameID, 0] as const;
            }
          })
        );
        setLocationsCount(Object.fromEntries(countsEntries));
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
    counts: Record<number, number>,
    locCounts: Record<number, number>
  ): string | number | Date | null | undefined {
    if (key === "numberOfVariants") return counts[g.GameID] ?? 0;
    if (key === "locationsCount") return locCounts[g.GameID] ?? 0;
    if (key === "createdAt") {
      if (!g.createdAt) return undefined;
      const d = new Date(g.createdAt);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    if (key === "GameID") return g.GameID;
    if (key === "gameCode") return g.gameCode;
    if (key === "gameName") return g.gameName;
    return undefined;
  }

  const filteredSorted = useMemo(() => {
    const filtered = games.filter(
      (g) =>
        (g.gameName || "").toLowerCase().includes(debounced) ||
        (g.gameCode || "").toLowerCase().includes(debounced)
    );

    return [...filtered].sort((a, b) => {
      const av = getSortableValue(a, sortKey, variantCount, locationsCount);
      const bv = getSortableValue(b, sortKey, variantCount, locationsCount);
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
  }, [games, debounced, sortKey, sortDir, variantCount, locationsCount]);

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

  // Create / Edit helpers
  function openCreate() {
    if (!isAdmin) return;
    setEditing(null);
    setForm(DEFAULT_NEW);
    setOpenForm(true);
  }

  function openEdit(g: Game) {
    setEditing(g);
    setForm({ ...g });
    setOpenForm(true);
  }

  function onChange<K extends keyof Game>(key: K, value: Game[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    if (editing) {
      const updated = await updateGame(editing.GameID, form);
      setGames((prev) =>
        prev.map((g) => (g.GameID === editing.GameID ? updated : g))
      );
    } else {
      const created = await createGame(form);
      setGames((prev) =>
        [...prev, created].sort((a, b) =>
          (a.gameName || "").localeCompare(b.gameName || "")
        )
      );
      setVariantCount((prev) => ({ ...prev, [created.GameID]: 0 }));
      setLocationsCount((prev) => ({ ...prev, [created.GameID]: 0 }));
    }
    setOpenForm(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!toDelete || !isAdmin) return;
    await deleteGame(toDelete.GameID);
    setGames((prev) => prev.filter((g) => g.GameID !== toDelete.GameID));
    setToDelete(null);
    setOpenDelete(false);
  }

  function openManageLocations(game: Game) {
    setActiveGameId(game.GameID);
    setSelectedGameName(game.gameName || "Unknown Game");
    setManageLocOpen(true);
  }

  useEffect(() => {
    (async () => {
      if (!manageLocOpen && activeGameId != null) {
        const rows = await fetchGameLocations(activeGameId);
        setLocationsCount((prev) => ({
          ...prev,
          [activeGameId]: rows.length,
        }));
      }
    })();
  }, [manageLocOpen, activeGameId]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between border-b">
        <div>
          <CardTitle className="text-lg">Games</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage games, assign to locations, and control variants.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-[280px]">
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

      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading games…
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <div className="text-4xl">🎮</div>
            <p className="mt-2 text-sm text-muted-foreground">
              No games found {debounced ? `for “${debounced}”` : ""}.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table className="[&_th]:h-11">
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                  <TableRow>
                    <SortableHead
                      label="Game"
                      active={sortKey === "gameName"}
                      dir={sortDir}
                      onClick={() => toggleSort("gameName")}
                    />
                    <SortableHead
                      label="Code"
                      active={sortKey === "gameCode"}
                      dir={sortDir}
                      onClick={() => toggleSort("gameCode")}
                    />
                    <SortableHead
                      label="Created"
                      active={sortKey === "createdAt"}
                      dir={sortDir}
                      onClick={() => toggleSort("createdAt")}
                      className="w-[120px] text-center"
                    />
                    <SortableHead
                      label="Variants"
                      active={sortKey === "numberOfVariants"}
                      dir={sortDir}
                      onClick={() => toggleSort("numberOfVariants")}
                      className="w-[100px] text-center"
                    />
                    <SortableHead
                      label="Locations"
                      active={sortKey === "locationsCount"}
                      dir={sortDir}
                      onClick={() => toggleSort("locationsCount")}
                      className="w-[100px] text-center"
                    />
                    <TableHead className="w-[120px] text-right pr-6">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.map((g) => (
                    <TableRow key={g.GameID}>
                      <TableCell className="text-left">{g.gameName}</TableCell>
                      <TableCell className="text-left">{g.gameCode}</TableCell>
                      <TableCell className="text-center">
                        {g.createdAt
                          ? new Date(g.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {variantCount[g.GameID] ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {locationsCount[g.GameID] ?? 0}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <RowActions
                          isAdmin={isAdmin}
                          onManage={() => openManageLocations(g)}
                          onEdit={() => openEdit(g)}
                          onDelete={() => {
                            setToDelete(g);
                            setOpenDelete(true);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="px-4 pb-4">
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

      {/* Manage Locations Dialog */}
      {activeGameId != null && (
        <ManageGameLocationsDialog
          open={manageLocOpen}
          onClose={() => setManageLocOpen(false)}
          gameId={activeGameId}
          gameName={selectedGameName}
        />
      )}

      {/* Create / Edit Game Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Game" : "Create Game"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid gap-3">
              <div>
                <Label>Game Name</Label>
                <Input
                  value={form.gameName ?? ""}
                  onChange={(e) => onChange("gameName", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Game Code</Label>
                <Input
                  value={form.gameCode ?? ""}
                  onChange={(e) => onChange("gameCode", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Max Players</Label>
                  <Input
                    type="number"
                    value={form.MaxPlayers ?? ""}
                    onChange={(e) =>
                      onChange("MaxPlayers", Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>Columns</Label>
                  <Input
                    type="number"
                    value={form.columns ?? ""}
                    onChange={(e) =>
                      onChange("columns", Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Controllers</Label>
                  <Input
                    type="number"
                    value={form.NoOfControllers ?? ""}
                    onChange={(e) =>
                      onChange("NoOfControllers", Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>LEDs per Device</Label>
                  <Input
                    type="number"
                    value={form.NoofLedPerdevice ?? ""}
                    onChange={(e) =>
                      onChange("NoofLedPerdevice", Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Local Port</Label>
                  <Input
                    type="number"
                    value={form.LocalPort ?? ""}
                    onChange={(e) =>
                      onChange("LocalPort", Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>Remote Port</Label>
                  <Input
                    type="number"
                    value={form.RemotePort ?? ""}
                    onChange={(e) =>
                      onChange("RemotePort", Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Socket B Receiver Port</Label>
                  <Input
                    type="number"
                    value={form.SocketBReceiverPort ?? ""}
                    onChange={(e) =>
                      onChange(
                        "SocketBReceiverPort",
                        Number(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div>
                  <Label>IP Address</Label>
                  <Input
                    value={form.IpAddress ?? ""}
                    onChange={(e) => onChange("IpAddress", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Intro Audio (file path or URL)</Label>
                <Input
                  value={form.introAudio ?? ""}
                  onChange={(e) => onChange("introAudio", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                {editing ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Game {toDelete?.gameName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the game and its location
              assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function SortableHead({
  label,
  active,
  dir,
  onClick,
  className = "",
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
      className={`cursor-pointer select-none ${className}`}
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

function RowActions({
  isAdmin,
  onManage,
  onEdit,
  onDelete,
}: {
  isAdmin: boolean;
  onManage: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onManage}>Manage Locations</DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchPagedPlayers,
  type PagedPlayersResponse,
  type Player,
} from "../server/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginationBar from "@/components/pagination/PaginationBar";
import { Loader2, Eye, Trash2 } from "lucide-react";

import PlayerDetailsDialog from "./PlayerDetailsDialog";

type SortKey = "playerid" | "firstname" | "email" | "signeeid";
type SortDir = "asc" | "desc";

type PageData = {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
};

type PlayersTableProps = {
  role?: string;
};

export default function PlayersTable({ role }: PlayersTableProps) {
  const isAdmin = role === "admin";

  // filters/search/sort
  const [searchTerm, setSearchTerm] = useState("");
  const [validOnly, setValidOnly] = useState(false);
  const [masterOnly, setMasterOnly] = useState(false);
  const [playingNow, setPlayingNow] = useState(false);

  const [sortBy, setSortBy] = useState<SortKey>("playerid");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<Player | null>(null);
  const [dialogEditable, setDialogEditable] = useState(false);
  const [dialogAllowDelete, setDialogAllowDelete] = useState(false);

  // paging + data
  const [data, setData] = useState<PageData>({
    players: [],
    total: 0,
    page: 1,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(true);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 1))),
    [data.total, data.pageSize]
  );

  async function load() {
    setLoading(true);
    try {
      const res: PagedPlayersResponse = await fetchPagedPlayers({
        page: data.page,
        pageSize: data.pageSize,
        search: searchTerm || undefined,
        validOnly,
        masterOnly,
        playingNow,
        sortBy,
        sortDir,
      });
      setData({
        players: res.players ?? [],
        total: res.total ?? 0,
        page: res.page ?? 1,
        pageSize: res.pageSize ?? data.pageSize,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data.page,
    data.pageSize,
    searchTerm,
    validOnly,
    masterOnly,
    playingNow,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    setData((d) => ({ ...d, page: 1 }));
  }, [searchTerm, validOnly, masterOnly, playingNow]);

  function toggleSort(field: SortKey) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  }

  const Th = ({
    label,
    field,
    className,
  }: {
    label: string;
    field?: SortKey;
    className?: string;
  }) => {
    const active = field && sortBy === field;
    const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "";
    return field ? (
      <TableHead
        role="button"
        title="Sort"
        onClick={() => toggleSort(field)}
        className={["select-none cursor-pointer", className]
          .filter(Boolean)
          .join(" ")}
      >
        {label} {arrow}
      </TableHead>
    ) : (
      <TableHead className={className}>{label}</TableHead>
    );
  };

  function isMasterPlayer(p: Player) {
    return p.SigneeID != null && p.SigneeID === p.PlayerID;
  }

  function openDetails(p: Player) {
    setSelected(p);
    setDialogEditable(true);
    setDialogAllowDelete(isAdmin);
    setDetailsOpen(true);
  }

  const playerName = (p: Player) =>
    `${p.FirstName ?? ""} ${p.LastName ?? ""}`.trim() || "—";

  return (
    <>
      <Card className="max-w-[1200px]">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Players</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse, filter, and manage player accounts.
            </p>
          </div>

          {/* Filters compact + wrapping on mobile */}
          <div className="flex w-full max-w-[880px] flex-wrap items-center gap-3">
            {/* Search grows, never shrinks below 240px */}
            <div className="min-w-[240px] flex-1">
              <Input
                placeholder="Search players…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Toggles don't shrink into the search */}
            <div className="flex items-center gap-2 shrink-0">
              <Switch id="flt-valid" checked={validOnly} onCheckedChange={setValidOnly} />
              <Label htmlFor="flt-valid" className="text-sm">Valid only</Label>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Switch id="flt-master" checked={masterOnly} onCheckedChange={setMasterOnly}/>
              <Label htmlFor="flt-master" className="text-sm">Master only</Label>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Switch id="flt-playing" checked={playingNow} onCheckedChange={setPlayingNow}/>
              <Label htmlFor="flt-playing" className="text-sm">Playing now</Label>
            </div>
          </div>

        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex h-[520px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="grid gap-3 sm:hidden">
                {data.players.length === 0 ? (
                  <div className="rounded-md border p-6 text-center text-muted-foreground">
                    No players found.
                  </div>
                ) : (
                  data.players.map((p) => (
                    <div
                      key={p.PlayerID}
                      className="rounded-md border p-3 bg-background"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {playerName(p)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID #{p.PlayerID}
                            {isMasterPlayer(p) ? " • Master" : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            title="Edit player"
                            onClick={() => openDetails(p)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                            disabled={!isAdmin}
                            title={isAdmin ? "Delete player" : "Admins only"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="col-span-2">
                          <div className="text-xs text-muted-foreground">
                            Email
                          </div>
                          <div className="truncate">{p.email ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Signee
                          </div>
                          <div>{p.SigneeID ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Status
                          </div>
                          <div>
                            {isMasterPlayer(p)
                              ? "Parent record"
                              : "Child record"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="rounded-md border overflow-hidden hidden sm:block">
                <div className="overflow-x-auto">
                  <div className="min-h-[520px] max-h-[520px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background">
                        <TableRow className="bg-muted/50">
                          <Th
                            label="ID"
                            field="playerid"
                            className="w-[96px]"
                          />
                          <Th label="Name" field="firstname" />
                          <Th label="Email" field="email" />
                          <Th
                            label="Signee"
                            field="signeeid"
                            className="w-[120px]"
                          />
                          <Th label="Actions" className="w-[200px]" />
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {data.players.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="h-[460px] text-center text-muted-foreground"
                            >
                              No players found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.players.map((p) => {
                            return (
                              <TableRow key={p.PlayerID}>
                                <TableCell className="w-[96px]">
                                  {p.PlayerID}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {playerName(p)}
                                </TableCell>
                                <TableCell className="truncate max-w-[280px]">
                                  {p.email ?? "—"}
                                </TableCell>
                                <TableCell className="w-[120px]">
                                  {p.SigneeID ?? "—"}
                                </TableCell>
                                <TableCell className="w-[200px]">
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDetails(p)}
                                      title="Edit player"
                                    >
                                      <Eye className="mr-1 h-4 w-4" />
                                      Edit
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                      disabled={!isAdmin}
                                      title={
                                        isAdmin
                                          ? "Delete player"
                                          : "Admins only"
                                      }
                                    >
                                      <Trash2 className="mr-1 h-4 w-4" />
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Pagination with bottom margin for mobile breathing room */}
              <div className="mt-4 mb-6">
                <PaginationBar
                  page={data.page}
                  totalPages={totalPages}
                  onPageChange={(next) =>
                    setData((d) => ({
                      ...d,
                      page: Math.max(1, Math.min(totalPages, next)),
                    }))
                  }
                  pageSize={data.pageSize}
                  onPageSizeChange={(n) =>
                    setData((d) => ({ ...d, page: 1, pageSize: n }))
                  }
                  totalCount={data.total}
                  showPageInput
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details dialog */}
      <PlayerDetailsDialog
        open={detailsOpen}
        onOpenChange={(v) => {
          setDetailsOpen(v);
          if (!v) setSelected(null);
        }}
        player={selected}
        editable={dialogEditable}
        allowDelete={dialogAllowDelete}
        onSaved={load}
      />
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import JsonEditorPanel from "@/components/lib/JsonEditorPanel";
import {
  fetchGameLocations,
  updateGameLocationConfig,
  type GameLocationConfigRow,
} from "../server/client";

type Props = { role?: string };

const PAGE_SIZE = 10;

export default function GameLocationsConfigTable({ role }: Props) {
  const [rows, setRows] = useState<GameLocationConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [configuredOnly, setConfiguredOnly] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedGame, setSelectedGame] = useState("all");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<GameLocationConfigRow | null>(null);

  const isAdmin = role === "admin";

  async function loadRows() {
    setLoading(true);
    try {
      const data = await fetchGameLocations();
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.location?.Name).filter(Boolean) as string[]),
      ).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const gameOptions = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.game?.gameName).filter(Boolean) as string[]),
      ).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const locName = row.location?.Name ?? "";
      const gameName = row.game?.gameName ?? "";

      if (selectedLocation !== "all" && locName !== selectedLocation) return false;
      if (selectedGame !== "all" && gameName !== selectedGame) return false;
      if (configuredOnly && (row.config === null || row.config === undefined)) return false;

      if (!q) return true;
      const haystack = [
        row.id,
        row.GameID,
        row.LocationID,
        row.game?.gameCode,
        gameName,
        locName,
        row.alias,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, selectedLocation, selectedGame, configuredOnly]);

  useEffect(() => setPage(1), [search, configuredOnly, selectedLocation, selectedGame]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const current = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-3 border-b">
        <div>
          <CardTitle className="text-lg">Game Location Configs</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit per-game-per-location JSON config. Keys here (like{" "}
            <code>laserTransport</code> or <code>comPorts</code>) are merged into{" "}
            <code>effectiveConfig</code> on top of{" "}
            <code>Location.config</code> and below{" "}
            <code>LocationVariant.customConfigJson</code>.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center">
          <div className="relative w-full xl:w-[280px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by game, location, code, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full xl:w-[200px]">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locationOptions.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger className="w-full xl:w-[220px]">
              <SelectValue placeholder="All games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All games</SelectItem>
              {gameOptions.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex h-10 items-center gap-2 rounded-md border px-3">
            <Checkbox
              checked={configuredOnly}
              onCheckedChange={(c) => setConfiguredOnly(Boolean(c))}
            />
            <span className="text-sm">Configured only</span>
          </label>

          <Button variant="secondary" onClick={loadRows} className="w-full xl:w-auto">
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No rows match.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table className="[&_th]:h-11">
                <TableHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <TableRow>
                    <TableHead className="text-left">Game</TableHead>
                    <TableHead className="text-left">Code</TableHead>
                    <TableHead className="text-left">Location</TableHead>
                    <TableHead className="text-center">Enabled</TableHead>
                    <TableHead className="text-center">Config</TableHead>
                    <TableHead className="text-center">IDs</TableHead>
                    <TableHead className="w-[140px] text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.map((row) => {
                    const hasConfig = row.config !== null && row.config !== undefined;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.game?.gameName ?? `Game #${row.GameID}`}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.game?.gameCode ?? "—"}
                        </TableCell>
                        <TableCell>{row.location?.Name ?? "—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={row.isEnabled ? "default" : "secondary"}>
                            {row.isEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={hasConfig ? "default" : "outline"}>
                            {hasConfig ? "Configured" : "No Config"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          <div>ID: {row.id}</div>
                          <div>Loc: {row.LocationID}</div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            size="sm"
                            onClick={() => setSelected(row)}
                            disabled={!isAdmin}
                          >
                            {hasConfig ? "Edit" : "Add Config"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="block md:hidden p-4 space-y-3">
              {current.map((row) => {
                const hasConfig = row.config !== null && row.config !== undefined;
                return (
                  <Card key={row.id} className="p-4 shadow-sm">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold">
                            {row.game?.gameName ?? `Game #${row.GameID}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {row.location?.Name ?? "—"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setSelected(row)}
                          disabled={!isAdmin}
                        >
                          {hasConfig ? "Edit" : "Add"}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={row.isEnabled ? "default" : "secondary"}>
                          {row.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge variant={hasConfig ? "default" : "outline"}>
                          {hasConfig ? "Configured" : "No Config"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Code: {row.game?.gameCode ?? "—"}</p>
                        <p>ID: {row.id}</p>
                        <p>Loc: {row.LocationID}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {selected && (
        <JsonEditorPanel
          initialValue={selected.config ?? {}}
          title={`Edit GameLocation Config (id: ${selected.id})`}
          subtitle={`${selected.game?.gameName ?? `Game #${selected.GameID}`} / ${selected.location?.Name ?? `Loc #${selected.LocationID}`}`}
          headerBadges={
            <>
              <Badge variant={selected.isEnabled ? "default" : "secondary"}>
                {selected.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Badge variant={selected.config ? "default" : "outline"}>
                {selected.config ? "Configured" : "No Config"}
              </Badge>
            </>
          }
          onClose={() => setSelected(null)}
          onSave={async (parsed) => {
            const updated = await updateGameLocationConfig(selected.id, parsed);
            setRows((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
            );
            // Keep the panel open showing the freshly-saved value.
            setSelected({ ...selected, ...updated });
            return updated.config ?? null;
          }}
        />
      )}
    </Card>
  );
}

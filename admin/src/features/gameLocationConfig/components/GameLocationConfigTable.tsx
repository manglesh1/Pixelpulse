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
import {
  fetchGameLocationConfigs,
  updateGameLocationConfigJson,
  type GameLocationConfigRow,
} from "../server/client";
import dynamic from "next/dynamic";

type Props = {
  role?: string;
};

const PAGE_SIZE = 10;

export default function GameLocationConfigTable({ role }: Props) {
  const [rows, setRows] = useState<GameLocationConfigRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [configuredOnly, setConfiguredOnly] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedGame, setSelectedGame] = useState("all");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<GameLocationConfigRow | null>(null);

  async function loadRows() {
    setLoading(true);
    try {
      const data = await fetchGameLocationConfigs({
        configured: configuredOnly ? "true" : undefined,
      });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [configuredOnly]);

  const locationOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => r.location?.Name).filter(Boolean) as string[]),
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const gameOptions = useMemo(() => {
    return Array.from(
      new Set(
        rows.map((r) => r.variant?.Game?.gameName).filter(Boolean) as string[],
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const gameName =
        row.variant?.Game?.gameName ?? `Game #${row.room?.GameID ?? "?"}`;
      const locationName = row.location?.Name ?? "";

      if (selectedLocation !== "all" && locationName !== selectedLocation) {
        return false;
      }

      if (selectedGame !== "all" && gameName !== selectedGame) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        row.id,
        row.LocationID,
        row.GameLocationID,
        row.GamesVariantId,
        locationName,
        row.variant?.name,
        row.variant?.Game?.gameName,
        row.variant?.Game?.gameCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [rows, search, selectedLocation, selectedGame]);

  useEffect(() => {
    setPage(1);
  }, [search, configuredOnly, selectedLocation, selectedGame]);

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
            Add or edit per-location config JSON for game variants.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center">
          <div className="relative w-full xl:w-[280px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by game, variant, code, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>

          <Select
            value={selectedLocation}
            onValueChange={(value) => {
              setSelectedLocation(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full xl:w-[200px]">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locationOptions.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedGame}
            onValueChange={(value) => {
              setSelectedGame(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full xl:w-[220px]">
              <SelectValue placeholder="All games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All games</SelectItem>
              {gameOptions.map((game) => (
                <SelectItem key={game} value={game}>
                  {game}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex h-10 items-center gap-2 rounded-md border px-3">
            <Checkbox
              checked={configuredOnly}
              onCheckedChange={(c) => {
                setConfiguredOnly(Boolean(c));
                setPage(1);
              }}
            />
            <span className="text-sm">Configured only</span>
          </label>

          <Button
            variant="secondary"
            onClick={loadRows}
            className="w-full xl:w-auto"
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading configs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No config rows found.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="[&_th]:h-11">
                <TableHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <TableRow>
                    <TableHead className="text-left">Game</TableHead>
                    <TableHead className="text-left">Variant</TableHead>
                    <TableHead className="text-left">Location</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Config</TableHead>
                    <TableHead className="text-center">IDs</TableHead>
                    <TableHead className="w-[140px] text-right pr-6">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {current.map((row) => {
                    const hasConfig =
                      row.customConfigJson !== null &&
                      row.customConfigJson !== undefined;

                    const gameName =
                      row.variant?.Game?.gameName ??
                      `Game #${row.room?.GameID ?? "?"}`;

                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {gameName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>
                              {row.variant?.name ??
                                `Variant ${row.GamesVariantId}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {row.variant?.Game?.gameCode ?? "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{row.location?.Name ?? "—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={row.isActive ? "default" : "secondary"}
                          >
                            {row.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={hasConfig ? "default" : "outline"}>
                            {hasConfig ? "Configured" : "No Config"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          <div>ID: {row.id}</div>
                          <div>VarID: {row.GamesVariantId}</div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button size="sm" onClick={() => setSelected(row)}>
                            {hasConfig ? "Edit" : "Add Config"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="block md:hidden p-4 space-y-3">
              {current.map((row) => {
                const hasConfig =
                  row.customConfigJson !== null &&
                  row.customConfigJson !== undefined;

                return (
                  <Card key={row.id} className="p-4 shadow-sm">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold">
                            {row.variant?.Game?.gameName ??
                              `Game #${row.room?.GameID ?? "?"}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {row.variant?.name ??
                              `Variant ${row.GamesVariantId}`}
                          </p>
                        </div>

                        <Button size="sm" onClick={() => setSelected(row)}>
                          {hasConfig ? "Edit" : "Add"}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant={row.isActive ? "default" : "secondary"}>
                          {row.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant={hasConfig ? "default" : "outline"}>
                          {hasConfig ? "Configured" : "No Config"}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Location: {row.location?.Name ?? "—"}</p>
                        <p>Code: {row.variant?.Game?.gameCode ?? "—"}</p>
                        <p>ID: {row.id}</p>
                        <p>VarID: {row.GamesVariantId}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
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
        <Editor
          row={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setRows((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r)),
            );
            setSelected(null);
          }}
        />
      )}
    </Card>
  );
}

function safeJsonParse(text: string): unknown | null {
  return JSON.parse(text.trim() || "null");
}

function formatPretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

// Keeps arrays of numbers on one line, especially useful for pattern matrices.
function stringifyCompactArrays(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const nextPad = "  ".repeat(indent + 1);

  if (Array.isArray(value)) {
    const isFlatNumberArray = value.every(
      (item) => typeof item === "number" || item === null,
    );

    if (isFlatNumberArray) {
      return `[ ${value.join(", ")} ]`;
    }

    if (value.length === 0) {
      return "[]";
    }

    return `[\n${value
      .map((item) => `${nextPad}${stringifyCompactArrays(item, indent + 1)}`)
      .join(",\n")}\n${pad}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return "{}";
    }

    return `{\n${entries
      .map(
        ([key, val]) =>
          `${nextPad}${JSON.stringify(key)}: ${stringifyCompactArrays(
            val,
            indent + 1,
          )}`,
      )
      .join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(value);
}

function Editor({
  row,
  onClose,
  onSaved,
}: {
  row: GameLocationConfigRow;
  onClose: () => void;
  onSaved: (row: GameLocationConfigRow) => void;
}) {
  const initialText = row.customConfigJson
    ? JSON.stringify(row.customConfigJson, null, 2)
    : "{}";

  const [text, setText] = useState(initialText);
  const [originalText, setOriginalText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isValidJson, setIsValidJson] = useState(true);

  const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
      <div className="flex h-[70vh] items-center justify-center text-sm text-muted-foreground">
        Loading editor...
      </div>
    ),
  });

  useEffect(() => {
    try {
      safeJsonParse(text);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  }, [text]);

  const hasChanges = text !== originalText;

  const handleFormat = () => {
    try {
      const parsed = safeJsonParse(text);
      setText(formatPretty(parsed));
      setMessage("Formatted JSON.");
      setError("");
    } catch {
      setError("Invalid JSON. Cannot format.");
      setMessage("");
    }
  };

  const handleCompactPatterns = () => {
    try {
      const parsed = safeJsonParse(text);
      setText(stringifyCompactArrays(parsed));
      setMessage("Compacted numeric arrays for readability.");
      setError("");
    } catch {
      setError("Invalid JSON. Cannot compact.");
      setMessage("");
    }
  };

  const handleMinify = () => {
    try {
      const parsed = safeJsonParse(text);
      setText(JSON.stringify(parsed));
      setMessage("Minified JSON.");
      setError("");
    } catch {
      setError("Invalid JSON. Cannot minify.");
      setMessage("");
    }
  };

  const handleCopy = async () => {
    try {
      // Modern clipboard (works on localhost / HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setMessage("Copied to clipboard.");
        setError("");
        return;
      }

      // Fallback for HTTP / restricted environments
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "-9999px";
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, textArea.value.length);

      const ok = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (!ok) {
        throw new Error("execCommand failed");
      }

      setMessage("Copied to clipboard.");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Clipboard blocked — copy manually.");
      setMessage("");
    }
  };

  const handleReset = () => {
    setText(originalText);
    setMessage("Reset changes.");
    setError("");
  };

  const handleSave = async () => {
    setError("");
    setMessage("");

    let parsed: unknown;

    try {
      parsed = text.trim() ? JSON.parse(text) : null;
    } catch {
      setError("Invalid JSON.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateGameLocationConfigJson(row.id, parsed);
      const formatted =
        updated.customConfigJson != null
          ? JSON.stringify(updated.customConfigJson, null, 2)
          : "{}";

      setText(formatted);
      setOriginalText(formatted);
      setMessage("Saved.");
      onSaved(updated);
    } catch {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden bg-background shadow-xl">
        <div className="border-b px-6 py-5">
          <h2 className="text-2xl font-semibold">Edit Config (ID: {row.id})</h2>
          <div className="mt-1 text-sm text-muted-foreground">
            {row.variant?.Game?.gameName} / {row.variant?.name} /{" "}
            {row.location?.Name}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={row.isActive ? "default" : "secondary"}>
              {row.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge
              variant={row.customConfigJson != null ? "default" : "outline"}
            >
              {row.customConfigJson != null ? "Configured" : "No Config"}
            </Badge>
            <Badge variant={isValidJson ? "default" : "destructive"}>
              {isValidJson ? "Valid JSON" : "Invalid JSON"}
            </Badge>
            {hasChanges ? (
              <Badge variant="secondary">Unsaved Changes</Badge>
            ) : null}
          </div>
        </div>

        <div className="border-b px-6 py-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleFormat}>
              Pretty
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCompactPatterns}
            >
              Compact JSON
            </Button>
            <Button type="button" variant="outline" onClick={handleMinify}>
              Minify
            </Button>
            <Button type="button" variant="outline" onClick={handleCopy}>
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-6 py-5">
          <div className="h-full overflow-hidden rounded-lg border bg-[#1e1e1e]">
            <MonacoEditor
              height="100%"
              defaultLanguage="json"
              value={text}
              onChange={(value) => setText(value ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                lineHeight: 24,
                fontFamily:
                  'Consolas, "Cascadia Code", "Fira Code", Menlo, monospace',
                fontLigatures: false,
                wordWrap: "off",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: true,
                lineNumbers: "on",
                folding: true,
                glyphMargin: false,
                bracketPairColorization: { enabled: true },
                guides: {
                  indentation: true,
                  bracketPairs: true,
                  highlightActiveIndentation: true,
                },
                renderWhitespace: "boundary",
                renderLineHighlight: "gutter",
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                overviewRulerBorder: false,
                occurrencesHighlight: "off",
                selectionHighlight: false,
                stickyScroll: { enabled: true },
                padding: { top: 16, bottom: 16 },
                scrollbar: {
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                  useShadows: false,
                },
              }}
            />
          </div>
        </div>

        <div className="border-t px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <span className="text-muted-foreground">
                  {message ||
                    "Pretty = normal JSON. Compact = easier matrix view."}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !isValidJson}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

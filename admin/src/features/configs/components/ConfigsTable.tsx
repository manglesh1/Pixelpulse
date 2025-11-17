"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  fetchConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
  fetchGamesVariants,
  type ConfigRow,
  type GamesVariant,
} from "@/features/configs/server/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
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
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PaginationBar from "@/components/pagination/PaginationBar";

type SortKey =
  | "id"
  | "configKey"
  | "configValue"
  | "GamesVariantId"
  | "isActive";
type SortDir = "asc" | "desc";

type ConfigsTableProps = { role?: string };

const DEFAULT_FORM = {
  configKey: "",
  configValue: "",
  GamesVariantId: "",
  isActive: true,
};

export default function ConfigsTable({ role }: ConfigsTableProps) {
  const isAdmin = role === "admin";

  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [variants, setVariants] = useState<GamesVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState(DEFAULT_FORM);
  const [editing, setEditing] = useState<ConfigRow | null>(null);
  const [openForm, setOpenForm] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [toDelete, setToDelete] = useState<ConfigRow | null>(null);

  // Fetch configs + variants
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [cfgs, vars] = await Promise.all([
          fetchConfigs(),
          fetchGamesVariants(),
        ]);
        if (!mounted) return;
        setRows(cfgs);
        setVariants(vars);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const variantName = useCallback(
    (id?: number | "" | null) => {
      if (!id) return "";
      return variants.find((v) => v.ID === Number(id))?.name ?? "";
    },
    [variants]
  );

  const filteredSorted = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = rows.filter(
      (r) =>
        r.configKey.toLowerCase().includes(term) ||
        (r.configValue ?? "").toLowerCase().includes(term) ||
        variantName(r.GamesVariantId).toLowerCase().includes(term)
    );

    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      if (sortKey === "isActive") {
        const an = a.isActive ? 1 : 0;
        const bn = b.isActive ? 1 : 0;
        return sortDir === "asc" ? an - bn : bn - an;
      }
      if (sortKey === "GamesVariantId") {
        const an = variantName(a.GamesVariantId);
        const bn = variantName(b.GamesVariantId);
        return sortDir === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const diff = Number(av ?? 0) - Number(bv ?? 0);
      return sortDir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [rows, search, sortKey, sortDir, variantName]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const current = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Form logic
  function openCreate() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setOpenForm(true);
  }

  function openEdit(row: ConfigRow) {
    setEditing(row);
    setForm({
      configKey: row.configKey,
      configValue: row.configValue,
      GamesVariantId:
        row.GamesVariantId == null ? "" : String(row.GamesVariantId),
      isActive: !!row.isActive,
    });
    setOpenForm(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    if (editing) {
      const saved = await updateConfig(editing.id, {
        ...form,
        GamesVariantId:
          form.GamesVariantId === "" ? null : Number(form.GamesVariantId),
      });
      setRows((prev) => prev.map((r) => (r.id === editing.id ? saved : r)));
    } else {
      const created = await createConfig({
        ...form,
        GamesVariantId:
          form.GamesVariantId === "" ? null : Number(form.GamesVariantId),
      });
      setRows((prev) => [...prev, created]);
    }
    setOpenForm(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!isAdmin || !toDelete) return;
    await deleteConfig(toDelete.id);
    setRows((prev) => prev.filter((r) => r.id !== toDelete.id));
    setOpenDelete(false);
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between border-b">
        <div>
          <CardTitle className="text-lg">Configurations</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Key/value pairs for game variants and system overrides.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search key/value/variant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {isAdmin && (
            <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
              <Plus className="mr-1 h-4 w-4" /> Create Configuration
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <div className="text-4xl">⚙️</div>
            <p className="mt-2 text-sm text-muted-foreground">
              No configurations found.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="[&_th]:h-11">
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                  <TableRow>
                    <SortableHead
                      label="Key"
                      active={sortKey === "configKey"}
                      dir={sortDir}
                      onClick={() => toggleSort("configKey")}
                    />
                    <SortableHead
                      label="Value"
                      active={sortKey === "configValue"}
                      dir={sortDir}
                      onClick={() => toggleSort("configValue")}
                    />
                    <SortableHead
                      label="Variant"
                      active={sortKey === "GamesVariantId"}
                      dir={sortDir}
                      onClick={() => toggleSort("GamesVariantId")}
                    />
                    <SortableHead
                      label="Active"
                      active={sortKey === "isActive"}
                      dir={sortDir}
                      onClick={() => toggleSort("isActive")}
                      className="w-[100px] text-center"
                    />
                    <TableHead className="w-[160px] text-right pr-6">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {current.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.configKey}</TableCell>
                      <TableCell>{r.configValue}</TableCell>
                      <TableCell>
                        {variantName(r.GamesVariantId) || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.isActive ? "default" : "secondary"}>
                          {r.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-6 space-x-2">
                        {isAdmin ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(r)}
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/30 bg-destructive/10 hover:bg-destructive/20 hover:text-destructive"
                              onClick={() => {
                                setToDelete(r);
                                setOpenDelete(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(r)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List Cards */}
            <div className="md:hidden space-y-3 p-3">
              {current.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border p-4 bg-card shadow-sm space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold">{r.configKey}</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {r.configValue || "—"}
                      </p>
                    </div>

                    <Badge variant={r.isActive ? "default" : "secondary"}>
                      {r.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">
                      Variant:{" "}
                    </span>
                    {variantName(r.GamesVariantId) || "—"}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    {isAdmin ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30"
                          onClick={() => {
                            setToDelete(r);
                            setOpenDelete(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(r)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
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

      {/* Create / Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Configuration" : "Create Configuration"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium">Key</label>
                <Input
                  value={form.configKey}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, configKey: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Value</label>
                <Input
                  value={form.configValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, configValue: e.target.value }))
                  }
                />
              </div>

              {/* Game Variant and Status side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Game Variant</label>
                  <Select
                    value={
                      form.GamesVariantId === ""
                        ? "none"
                        : String(form.GamesVariantId)
                    }
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        GamesVariantId: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select variant (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {variants.map((v) => (
                        <SelectItem key={v.ID} value={String(v.ID)}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={form.isActive ? "active" : "inactive"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        isActive: v === "active",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              Delete configuration "{toDelete?.configKey}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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

/* --- Helpers --- */
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
      className={cn("cursor-pointer select-none", className)}
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

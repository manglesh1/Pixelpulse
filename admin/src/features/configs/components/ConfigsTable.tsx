"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import ConfigFormModal, {
  type ConfigForm,
} from "@/features/configs/components/ConfigFormModal";
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

type ConfigsTableProps = {
  role?: string;
};

const DEFAULT_CREATE: ConfigForm = {
  configKey: "",
  configValue: "",
  GamesVariantId: "",
  isActive: true,
};

const DEFAULT_EDIT: ConfigForm = {
  configKey: "",
  configValue: "",
  GamesVariantId: "",
  isActive: true,
};

export default function ConfigsTable({ role }: ConfigsTableProps) {
  const isAdmin = role === "admin";

  // data
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [variants, setVariants] = useState<GamesVariant[]>([]);
  const [loading, setLoading] = useState(true);

  // filters/sort/page
  const [search, setSearch] = useState("");
  const [variantFilter, setVariantFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // create/edit
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ConfigForm>(DEFAULT_CREATE);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ConfigForm>(DEFAULT_EDIT);
  const [editReadOnly, setEditReadOnly] = useState(false);

  // delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // load
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

  // helpers
  const variantName = useCallback(
    (id?: number | "" | null) => {
      if (id == null || id === "") return "";
      return variants.find((v) => v.ID === Number(id))?.name ?? String(id);
    },
    [variants]
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filteredSorted = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const matchesText =
        r.configKey.toLowerCase().includes(term) ||
        (r.configValue ?? "").toLowerCase().includes(term) ||
        variantName(r.GamesVariantId).toLowerCase().includes(term);
      const matchesVariant =
        variantFilter === "all"
          ? true
          : String(r.GamesVariantId ?? "") === variantFilter;
      return matchesText && matchesVariant;
    });

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
  }, [rows, search, variantFilter, sortKey, sortDir, variantName]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const current = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  // actions: create/edit/delete
  async function onCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin) return;
    const created = await createConfig({
      configKey: createForm.configKey,
      configValue: createForm.configValue,
      GamesVariantId:
        createForm.GamesVariantId === ""
          ? null
          : Number(createForm.GamesVariantId),
      isActive: !!createForm.isActive,
    });
    setRows((r) => [...r, created]);
    setCreateOpen(false);
    setCreateForm(DEFAULT_CREATE);
    setPage(1);
  }

  function onEditClick(row: ConfigRow) {
    setEditId(row.id);
    setEditForm({
      configKey: row.configKey,
      configValue: row.configValue,
      GamesVariantId:
        row.GamesVariantId == null ? "" : Number(row.GamesVariantId),
      isActive: !!row.isActive,
    });
    setEditReadOnly(!isAdmin);
    setEditOpen(true);
  }

  async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin) return;
    if (editId == null) return;
    const saved = await updateConfig(editId, {
      configKey: editForm.configKey,
      configValue: editForm.configValue,
      GamesVariantId:
        editForm.GamesVariantId === "" ? null : Number(editForm.GamesVariantId),
      isActive: !!editForm.isActive,
    });
    setRows((r) => r.map((x) => (x.id === editId ? saved : x)));
    setEditOpen(false);
    setEditId(null);
  }

  async function confirmDelete() {
    if (!isAdmin) return;
    if (deleteId == null) return;
    await deleteConfig(deleteId);
    setRows((r) => r.filter((x) => x.id !== deleteId));
    setDeleteOpen(false);
    setDeleteId(null);
    setPage((p) =>
      Math.min(p, Math.max(1, Math.ceil((rows.length - 1) / pageSize)))
    );
  }

  return (
    <Card>
      {/* Responsive header controls */}
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Configurations</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Key/value overrides (optionally scoped to a game variant).
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search key/value/variant…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>

          {/* Variant filter */}
          <Select
            value={variantFilter}
            onValueChange={(v) => {
              setVariantFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Filter by variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All variants</SelectItem>
              {variants.map((v) => (
                <SelectItem key={v.ID} value={String(v.ID)}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin ? (
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                setCreateOpen(true);
                setCreateForm(DEFAULT_CREATE);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Create Configuration
            </Button>
          ) : null}
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
            <div className="text-4xl">⚙️</div>
            <p className="mt-2 text-sm text-muted-foreground">
              No configurations found.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
              {current.map((row) => (
                <MobileConfigCard
                  key={row.id}
                  row={row}
                  isAdmin={isAdmin}
                  onEditClick={() => onEditClick(row)}
                  onDeleteClick={() => {
                    setDeleteId(row.id);
                    setDeleteOpen(true);
                  }}
                />
              ))}

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
                      active={sortKey === "id"}
                      dir={sortDir}
                      onClick={() => toggleSort("id")}
                      className="w-[96px]"
                    />
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
                      className="hidden lg:table-cell"
                    />
                    <SortableHead
                      label="Active"
                      active={sortKey === "isActive"}
                      dir={sortDir}
                      onClick={() => toggleSort("isActive")}
                      className="w-[120px]"
                    />
                    <TableHead className="w-[220px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {current.map((row) => (
                    <TableRow key={row.id} className="odd:bg-muted/30">
                      <TableCell className="w-[96px]">{row.id}</TableCell>

                      <TableCell className="font-medium">
                        <span
                          className="truncate inline-block max-w-[220px]"
                          title={row.configKey}
                        >
                          {row.configKey}
                        </span>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        <span
                          className="truncate inline-block max-w-[420px]"
                          title={row.configValue}
                        >
                          {row.configValue}
                        </span>
                      </TableCell>

                      <TableCell className="w-[120px]">
                        {row.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>

                      <TableCell className="w-[220px]">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {isAdmin ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditClick(row)}
                              >
                                <Pencil className="mr-1 h-4 w-4" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                onClick={() => {
                                  setDeleteId(row.id);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditClick(row)}
                              title="View configuration"
                            >
                              <Eye className="mr-1 h-4 w-4" /> View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="hidden md:block">
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

      {/* Create (admins only) */}
      <ConfigFormModal
        title="Create Configuration"
        open={createOpen}
        values={createForm}
        variants={variants}
        readOnly={!isAdmin}
        onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreateSubmit}
      />

      {/* Edit / View */}
      <ConfigFormModal
        title={editReadOnly ? "View Configuration" : "Edit Configuration"}
        open={editOpen}
        values={editForm}
        variants={variants}
        readOnly={editReadOnly}
        onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
        onClose={() => setEditOpen(false)}
        onSubmit={onEditSubmit}
      />

      {/* Delete confirm (admins only) */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
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

/* ---------- small helpers ---------- */

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

function MobileConfigCard({
  row,
  isAdmin,
  onEditClick,
  onDeleteClick,
}: {
  row: ConfigRow;
  isAdmin: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            #{row.id} <span className="font-normal">•</span>{" "}
            <span
              className="truncate inline-block max-w-[65vw]"
              title={row.configKey}
            >
              {row.configKey}
            </span>
          </div>

          {/* Value (line-clamped to keep cards compact) */}
          {row.configValue ? (
            <div className="mt-1 text-sm text-foreground/90 line-clamp-2">
              {row.configValue}
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={row.isActive ? "default" : "secondary"}>
              {row.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          {isAdmin ? (
            <>
              <Button variant="outline" size="sm" onClick={onEditClick}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={onDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onEditClick}>
              <Eye className="mr-1 h-4 w-4" />
              View
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

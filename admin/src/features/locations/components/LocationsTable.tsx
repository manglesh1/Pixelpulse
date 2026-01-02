"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  disableLocation,
  enableLocation,
  type Location,
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
  AlertDialogHeader,
  AlertDialogFooter,
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
  Power,
} from "lucide-react";
import PaginationBar from "@/components/pagination/PaginationBar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey =
  | "LocationID"
  | "Name"
  | "Address"
  | "City"
  | "Province"
  | "Postal"
  | "Country"
  | "Timezone";
type SortDir = "asc" | "desc";

const DEFAULT_NEW: Partial<Location> = {
  Name: "",
  Address: "",
  City: "",
  Province: "",
  Postal: "",
  Country: "",
  Timezone: "",
};

type LocationsTableProps = {
  role?: string;
};

export default function LocationsTable({ role }: LocationsTableProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("LocationID");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("active");
  const pageSize = 10;

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState<Partial<Location>>(DEFAULT_NEW);

  const [openDelete, setOpenDelete] = useState(false);
  const [toDelete, setToDelete] = useState<Location | null>(null);

  const [openDisable, setOpenDisable] = useState(false);
  const [toDisable, setToDisable] = useState<Location | null>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const locs = await fetchLocations();
        if (mounted) setLocations(locs);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [search]);

  function getSortableValue(l: Location, key: SortKey) {
    return (l[key] ?? "") as string | number;
  }

  const filteredSorted = useMemo(() => {
    const filtered = locations.filter((l) => {
      const matchesSearch =
        l.Name.toLowerCase().includes(debounced) ||
        l.City?.toLowerCase().includes(debounced) ||
        l.Country?.toLowerCase().includes(debounced);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? l.isActive !== false
          : l.isActive === false;

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const av = getSortableValue(a, sortKey);
      const bv = getSortableValue(b, sortKey);

      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const diff = Number(av) - Number(bv);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [locations, debounced, sortKey, sortDir, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const current = filteredSorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function openCreate() {
    if (!isAdmin) return;
    setEditing(null);
    setForm(DEFAULT_NEW);
    setOpenForm(true);
  }

  function openEdit(l: Location) {
    setEditing(l);
    setForm(l);
    setOpenForm(true);
  }

  function onChange<K extends keyof Location>(key: K, value: Location[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;

    if (editing) {
      const updated = await updateLocation(editing.LocationID, form);
      setLocations((prev) =>
        prev.map((l) => (l.LocationID === editing.LocationID ? updated : l))
      );
    } else {
      const created = await createLocation(form);
      setLocations((prev) => [...prev, created]);
    }
    setOpenForm(false);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!toDelete || !isAdmin) return;
    await deleteLocation(toDelete.LocationID);
    setLocations((prev) =>
      prev.filter((l) => l.LocationID !== toDelete.LocationID)
    );
    setToDelete(null);
    setOpenDelete(false);
  }

  async function confirmDisable() {
    if (!toDisable || !isAdmin) return;
    const updated = toDisable.isActive
      ? await disableLocation(toDisable.LocationID)
      : await enableLocation(toDisable.LocationID);

    setLocations((prev) =>
      prev.map((l) =>
        l.LocationID === toDisable.LocationID
          ? { ...l, isActive: !toDisable.isActive }
          : l
      )
    );
    setToDisable(null);
    setOpenDisable(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle>Locations</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage game room and site locations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or city…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v: "all" | "active" | "disabled") =>
              setStatusFilter(v)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>

          {isAdmin && (
            <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
              <Plus className="mr-1 h-4 w-4" /> Create Location
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
            <div className="text-4xl">📍</div>
            <p className="mt-2 text-sm text-muted-foreground">
              No locations found {debounced ? `for “${debounced}”` : ""}.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
              {isAdmin && (
                <Button onClick={openCreate}>
                  <Plus className="mr-1 h-4 w-4" /> Create Location
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile list (cards) */}
            <div className="grid gap-3 lg:hidden">
              {current.map((l) => (
                <div
                  key={l.LocationID}
                  className="rounded-md border p-3 bg-background"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left side */}
                    <div className="min-w-0">
                      <div
                        className="text-sm font-semibold truncate"
                        title={l.Name}
                      >
                        {l.Name}
                      </div>

                      <div className="mt-0.5 text-xs text-muted-foreground truncate">
                        {l.City ? `${l.City}, ${l.Country ?? ""}` : "—"}
                      </div>

                      <div className="mt-2">
                        <Badge variant={l.isActive ? "default" : "secondary"}>
                          {l.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {isAdmin ? (
                        <div className="inline-flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEdit(l)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            className={`${
                              l.isActive
                                ? "text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                                : "text-green-700 border-green-300 hover:bg-green-50"
                            }`}
                            onClick={() => {
                              setToDisable(l);
                              setOpenDisable(true);
                            }}
                            title={l.isActive ? "Disable" : "Enable"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                            onClick={() => {
                              setToDelete(l);
                              setOpenDelete(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(l)}
                          title="View details"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead
                      label="ID"
                      active={sortKey === "LocationID"}
                      dir={sortDir}
                      onClick={() => toggleSort("LocationID")}
                    />
                    <SortableHead
                      label="Name"
                      active={sortKey === "Name"}
                      dir={sortDir}
                      onClick={() => toggleSort("Name")}
                    />
                    <SortableHead
                      label="City"
                      active={sortKey === "City"}
                      dir={sortDir}
                      onClick={() => toggleSort("City")}
                    />
                    <SortableHead
                      label="Country"
                      active={sortKey === "Country"}
                      dir={sortDir}
                      onClick={() => toggleSort("Country")}
                    />
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {current.map((l) => (
                    <TableRow key={l.LocationID}>
                      <TableCell>{l.LocationID}</TableCell>
                      <TableCell>{l.Name}</TableCell>
                      <TableCell>{l.City ?? "—"}</TableCell>
                      <TableCell>{l.Country ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={l.isActive ? "default" : "secondary"}>
                          {l.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isAdmin ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(l)}
                              >
                                <Pencil className="mr-1 h-4 w-4" /> Edit
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className={`${
                                  l.isActive
                                    ? "text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                                    : "text-green-700 border-green-300 hover:bg-green-50"
                                }`}
                                onClick={() => {
                                  setToDisable(l);
                                  setOpenDisable(true);
                                }}
                              >
                                <Power className="h-4 w-4 mr-1" />
                                {l.isActive ? "Disable" : "Enable"}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                onClick={() => {
                                  setToDelete(l);
                                  setOpenDelete(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(l)}
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

            {/* Pagination */}
            <PaginationBar
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalCount={filteredSorted.length}
              showPageInput
              className="mt-4"
            />
          </>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="w-[92vw] max-w-2xl p-0">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 sticky top-0 bg-background z-10">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle>
                {editing ? "Edit Location" : "Create Location"}
              </DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="-mr-1">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <form
            className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onSubmit={submitForm}
          >
            {[
              "Name",
              "Address",
              "City",
              "Province",
              "Postal",
              "Country",
              "Timezone",
            ].map((f) => (
              <Field key={f} id={f} label={f}>
                <Input
                  id={f}
                  value={String(form[f as keyof Location] ?? "")}
                  onChange={(e) =>
                    onChange(f as keyof Location, e.target.value)
                  }
                />
              </Field>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenForm(false)}
              >
                Close
              </Button>
              {isAdmin && (
                <Button type="submit">{editing ? "Save" : "Create"}</Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{toDelete?.Name}</strong> and
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable/Enable Confirmation */}
      <AlertDialog open={openDisable} onOpenChange={setOpenDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toDisable?.isActive
                ? "Disable this location?"
                : "Re-enable this location?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toDisable?.isActive
                ? "This will disable the location — it will no longer appear in active lists."
                : "This will re-enable the location and make it active again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDisable(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>
              {toDisable?.isActive ? "Disable" : "Enable"}
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

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

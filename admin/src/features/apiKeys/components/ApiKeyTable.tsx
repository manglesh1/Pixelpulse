"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchApiKeys,
  createApiKey,
  deactivateApiKey,
  fetchLocations,
  ApiKey,
} from "../server/clientApiKeys";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
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
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Eye,
} from "lucide-react";
import PaginationBar from "@/components/pagination/PaginationBar";

type SortKey = "id" | "name" | "locationId" | "createdAt";
type SortDir = "asc" | "desc";

const DEFAULT_NEW = { name: "", locationId: 0 };

export default function ApiKeysTable({ role }: { role?: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [locations, setLocations] = useState<
    { LocationID: number; Name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [hideInactive, setHideInactive] = useState(true);

  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<typeof DEFAULT_NEW>(DEFAULT_NEW);
  const [openDelete, setOpenDelete] = useState(false);
  const [toDelete, setToDelete] = useState<ApiKey | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);

  const isAdmin = role === "admin" || true; // dev override

  // Fetch data
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [keysData, locData] = await Promise.all([
        fetchApiKeys(),
        fetchLocations(),
      ]);
      setKeys(keysData);
      setLocations(locData);
      setLoading(false);
    })();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Filter & sort
  const filteredSorted = useMemo(() => {
    const filtered = keys.filter((k) => {
      if (hideInactive && !k.isActive) return false;
      return (
        k.name.toLowerCase().includes(debounced) ||
        k.location?.Name?.toLowerCase().includes(debounced)
      );
    });

    return [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof ApiKey];
      const bv = b[sortKey as keyof ApiKey];
      if (av == null && bv != null) return 1;
      if (bv == null && av != null) return -1;
      if (av == null && bv == null) return 0;

      if (sortKey === "createdAt") {
        const aDate = new Date(a.createdAt);
        const bDate = new Date(b.createdAt);
        return sortDir === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }

      const diff = Number(av) - Number(bv);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [keys, debounced, sortKey, sortDir, hideInactive]);

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

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    const { apiKey } = await createApiKey(form);
    alert(`New API Key: ${apiKey}`);
    setOpenForm(false);
    const updated = await fetchApiKeys();
    setKeys(updated);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await deactivateApiKey(toDelete.id);
    setKeys(await fetchApiKeys());
    setOpenDelete(false);
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>API Keys Management</CardTitle>
        {isAdmin && (
          <Button onClick={() => setOpenForm(true)}>
            <Plus className="mr-1 h-4 w-4" /> Create Key
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4 gap-4">
          <Input
            placeholder="Search keys or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="hideInactive">Hide Inactive</Label>
            <Switch
              id="hideInactive"
              checked={hideInactive}
              onCheckedChange={setHideInactive}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <Loader2 className="animate-spin inline mr-2" /> Loading...
          </div>
        ) : filteredSorted.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No API keys found.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => toggleSort("id")}>ID</TableHead>
                  <TableHead onClick={() => toggleSort("name")}>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead onClick={() => toggleSort("createdAt")}>
                    Created At{" "}
                    {sortKey === "createdAt" &&
                      (sortDir === "asc" ? <ChevronUp /> : <ChevronDown />)}
                  </TableHead>
                  <TableHead>Key</TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>{key.id}</TableCell>
                    <TableCell>{key.name}</TableCell>
                    <TableCell>{key.location?.Name || "-"}</TableCell>
                    <TableCell>
                      {key.isActive ? (
                        <span className="text-green-600 font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-gray-500">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(key.createdAt)}</TableCell>

                    {/* Key snippet + actions */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Key snippet */}
                        <code
                          className="
        rounded 
        px-2 py-1 
        text-sm 
        bg-muted 
        text-foreground 
        dark:bg-muted/60 
        dark:text-muted-foreground
      "
                        >
                          {key.key ? `${key.key.slice(0, 8)}••••••` : "N/A"}
                        </code>

                        {/* View full key */}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="View full key"
                          className="
        hover:bg-accent 
        hover:text-accent-foreground 
        dark:hover:bg-accent/30
      "
                          onClick={() => key.key && setShowKey(key.key)}
                        >
                          <Eye size={16} />
                        </Button>

                        {/* Copy key */}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Copy key"
                          className="
        hover:bg-accent 
        hover:text-accent-foreground 
        dark:hover:bg-accent/30
      "
                          onClick={async () => {
                            if (!key.key) return;
                            try {
                              await navigator.clipboard.writeText(key.key);
                              console.info("✅ Copied:", key.key);
                              alert("API key copied to clipboard");
                            } catch (err) {
                              console.error(err);
                              alert(
                                "❌ Clipboard not supported — copy manually"
                              );
                            }
                          }}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Admin actions */}
                    {isAdmin && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant={key.isActive ? "destructive" : "outline"}
                          disabled={!key.isActive}
                          className={`
        flex items-center gap-1 transition-colors
        ${
          !key.isActive
            ? "opacity-50 cursor-not-allowed"
            : `
            bg-destructive/10 text-destructive hover:bg-destructive/20
            dark:bg-destructive/20 dark:hover:bg-destructive/30
            border border-destructive/30
          `
        }
      `}
                          onClick={() => {
                            if (!key.isActive) return;
                            setToDelete(key);
                            setOpenDelete(true);
                          }}
                        >
                          <Trash2 size={16} />
                          Deactivate
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <PaginationBar
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </CardContent>

      {/* Create Modal */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 dark:text-neutral-100">
              Create API Key
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={submitForm} className="space-y-4">
            <div>
              <Label className="text-neutral-700 dark:text-neutral-300">
                Name
              </Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <Label className="text-neutral-700 dark:text-neutral-300">
                Location
              </Label>
              <select
                required
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-md w-full p-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.locationId || ""}
                onChange={(e) =>
                  setForm({ ...form, locationId: Number(e.target.value) })
                }
              >
                <option value="">Select location...</option>
                {locations.map((loc) => (
                  <option key={loc.LocationID} value={loc.LocationID}>
                    {loc.Name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
            >
              Create Key
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Show Full Key Modal */}
      <Dialog open={!!showKey} onOpenChange={() => setShowKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Full API Key</DialogTitle>
          </DialogHeader>

          <div
            className="
        font-mono 
        p-3 
        rounded 
        text-sm 
        break-all 
        bg-muted 
        text-foreground 
        dark:bg-muted/60 
        dark:text-muted-foreground
      "
          >
            {showKey}
          </div>

          <DialogClose asChild>
            <Button
              variant="outline"
              className="
          mt-3 w-full 
          border-border 
          hover:bg-accent 
          hover:text-accent-foreground 
          dark:hover:bg-accent/30
        "
            >
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this key?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

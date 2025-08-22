"use client";

import { useEffect, useState } from "react";
import {
  fetchPlayerById,
  fetchPlayersBySigneeId,
  fetchWristbandsByPlayerID,
  fetchGamesVariants,
  fetchPlayerScoreById,
  updatePlayer,
  deletePlayer,
  updateWristband,
  deleteWristband,
  type Player,
  type WristbandUpdatePayload,
} from "../server/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, X } from "lucide-react";
import { GamesVariant } from "@/features/gamesVariants/server/client";

/* --- local types to mirror old data shapes --- */
type Wristband = {
  WristbandTranID: number;
  wristbandCode: string;
  wristbandStatusFlag: string; // 'R' | 'I'
  playerStartTime: string;
  playerEndTime: string;
};

type ScoreRow = {
  ScoreID: number;
  GamesVariantId: number;
  Points: number;
  updatedAt?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  player: Player | null;
  editable?: boolean; // can modify records
  allowDelete?: boolean; // can delete records
  onSaved?: () => void;
};

export default function PlayerDetailsDialog({
  open,
  onOpenChange,
  player,
  editable = false,
  allowDelete = false,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);

  // base + relations
  const [base, setBase] = useState<Player | null>(null);
  const [parent, setParent] = useState<Player | null>(null);
  const [children, setChildren] = useState<Player[]>([]);
  const [wristbands, setWristbands] = useState<Wristband[]>([]);
  const [childrenWb, setChildrenWb] = useState<Record<number, Wristband[]>>({});

  // lookups / computed
  const [variantMap, setVariantMap] = useState<Record<number, string>>({});
  const [topScores, setTopScores] = useState<ScoreRow[]>([]);

  // UI flags
  const [showValidOnlyBands, setShowValidOnlyBands] = useState(true);
  const [showAllScores, setShowAllScores] = useState(false);

  // inline edit (player)
  const [editPlayer, setEditPlayer] = useState<Partial<Player> | null>(null);

  // inline edit (child)
  const [editingChildId, setEditingChildId] = useState<number | null>(null);
  const [childEdit, setChildEdit] = useState<Partial<Player>>({});
  const [showAllChildren, setShowAllChildren] = useState(false);
  const CHILD_PREVIEW_COUNT = 5;

  // inline edit (wristband)
  const [editingWbId, setEditingWbId] = useState<number | null>(null);

  /* ---------- helpers ---------- */
  const isValidWb = (wb: Wristband) => {
    if (!wb?.playerStartTime || !wb?.playerEndTime) return false;
    const now = Date.now();
    const s = new Date(wb.playerStartTime).getTime();
    const e = new Date(wb.playerEndTime).getTime();
    return wb.wristbandStatusFlag === "R" && now >= s && now <= e;
    // (Registered + within interval)
  };

  const fmtShort = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);

  const toLocalInput = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const fromLocalInput = (local: string) => {
    if (!local) return "";
    const d = new Date(local);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return d.toISOString();
  };

  function childDisplay(c: Player) {
    const list = childrenWb[c.PlayerID] ?? [];
    const valid = list.find(isValidWb);
    const chosen = valid ?? list[0];
    const full = chosen?.wristbandCode ?? "";
    const short =
      full.length > 12 ? `${full.slice(0, 8)}…${full.slice(-4)}` : full;
    return {
      hasValid: !!valid,
      code: short,
      status: chosen?.wristbandStatusFlag ?? "",
    };
  }

  /* ---------- load everything ---------- */
  async function loadAll(playerId: number) {
    setLoading(true);
    try {
      const me = await fetchPlayerById(playerId);
      setBase(me);
      setEditPlayer(me);

      const [wbs, kidsMaybe, parentMaybe, allScores, variants] =
        await Promise.all([
          fetchWristbandsByPlayerID(me.PlayerID),
          me.PlayerID === me.SigneeID
            ? fetchPlayersBySigneeId(me.PlayerID)
            : Promise.resolve([]),
          me.SigneeID && me.SigneeID !== me.PlayerID
            ? fetchPlayerById(me.SigneeID)
            : Promise.resolve(null),
          fetchPlayerScoreById(me.PlayerID).catch(() => []),
          fetchGamesVariants(),
        ]);

      setWristbands(wbs ?? []);
      setChildren(
        (kidsMaybe ?? []).filter((c: Player) => c.PlayerID !== me.PlayerID)
      );
      setParent(parentMaybe ?? null);

      const vm: Record<number, string> = {};
      (variants ?? []).forEach((v: GamesVariant) => {
        vm[v.ID] = v.name ?? String(v.ID);
      });
      setVariantMap(vm);

      const best = Object.values(
        (allScores ?? []).reduce(
          (acc: Record<number, ScoreRow>, s: ScoreRow) => {
            const gv = s.GamesVariantId;
            if (!acc[gv] || s.Points > acc[gv].Points) acc[gv] = s;
            return acc;
          },
          {} as Record<number, ScoreRow>
        )
      ) as ScoreRow[];
      setTopScores(best);

      const map: Record<number, Wristband[]> = {};
      await Promise.all(
        (kidsMaybe ?? []).map(async (c: Player) => {
          const cw = await fetchWristbandsByPlayerID(c.PlayerID);
          map[c.PlayerID] = cw ?? [];
        })
      );
      setChildrenWb(map);

      setEditingChildId(null);
      setEditingWbId(null);
      setShowAllScores(false);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    if (open && player?.PlayerID) loadAll(player.PlayerID);
    if (!open) {
      setEditPlayer(null);
      setEditingChildId(null);
      setEditingWbId(null);
      setShowAllScores(false);
    }
  }, [open, player?.PlayerID]);

  useEffect(() => {
    if (editingChildId) setShowAllChildren(true);
  }, [editingChildId]);

  /* ---------- actions ---------- */
  async function savePlayer() {
    if (!editable) return;
    if (!editPlayer?.PlayerID) return;
    await updatePlayer(editPlayer.PlayerID, {
      FirstName: editPlayer.FirstName ?? "",
      LastName: editPlayer.LastName ?? "",
      email: editPlayer.email ?? "",
    });
    await loadAll(editPlayer.PlayerID);
    onSaved?.();
  }

  async function removePlayer() {
    if (!allowDelete) return;
    if (!base) return;
    if (!confirm("Delete this player?")) return;
    await deletePlayer(base.PlayerID);
    onOpenChange(false);
    onSaved?.();
  }

  async function saveChild() {
    if (!editable) return;
    if (!editingChildId) return;
    await updatePlayer(editingChildId, {
      FirstName: childEdit.FirstName ?? "",
      LastName: childEdit.LastName ?? "",
      email: childEdit.email ?? undefined,
    });
    await loadAll(base!.PlayerID);
    setEditingChildId(null);
    setChildEdit({});
    onSaved?.();
  }

  async function removeChild(id: number) {
    if (!allowDelete) return;
    if (!confirm("Delete this child?")) return;
    await deletePlayer(id);
    await loadAll(base!.PlayerID);
    onSaved?.();
  }

  async function saveWb(wb: Wristband) {
    if (!editable) return;
    const payload: WristbandUpdatePayload = {
      uid: wb.wristbandCode,
      currentstatus: wb.wristbandStatusFlag,
      status: wb.wristbandStatusFlag,
      playerStartTime: wb.playerStartTime,
      playerEndTime: wb.playerEndTime,
    };
    await updateWristband(payload);
    await loadAll(base!.PlayerID);
    setEditingWbId(null);
    onSaved?.();
  }

  async function removeWb(id: number) {
    if (!allowDelete) return;
    if (!confirm("Delete this wristband?")) return;
    await deleteWristband(id);
    await loadAll(base!.PlayerID);
    onSaved?.();
  }

  /* ---------- render ---------- */
  const headerTitle =
    base && parent && base.SigneeID !== base.PlayerID
      ? `Child of ${parent.FirstName} ${parent.LastName}`
      : "Player Details";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-4xl max-h-[92vh] flex flex-col bg-background text-foreground p-0">
        {/* Sticky header + Close */}
        <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle>{headerTitle}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="-mr-1">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
          {!base || loading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic / Editable */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="ID">
                  <Input value={String(base.PlayerID)} disabled />
                </Field>
                <Field label="Signee ID">
                  <Input value={String(base.SigneeID ?? "—")} disabled />
                </Field>

                <Field label="First Name">
                  <Input
                    value={editPlayer?.FirstName ?? ""}
                    onChange={(e) =>
                      setEditPlayer((p) => ({
                        ...(p ?? {}),
                        FirstName: e.target.value,
                      }))
                    }
                    disabled={!editable}
                  />
                </Field>
                <Field label="Last Name">
                  <Input
                    value={editPlayer?.LastName ?? ""}
                    onChange={(e) =>
                      setEditPlayer((p) => ({
                        ...(p ?? {}),
                        LastName: e.target.value,
                      }))
                    }
                    disabled={!editable}
                  />
                </Field>

                <Field label="Email" className="sm:col-span-2">
                  <Input
                    type="email"
                    value={editPlayer?.email ?? ""}
                    onChange={(e) =>
                      setEditPlayer((p) => ({
                        ...(p ?? {}),
                        email: e.target.value,
                      }))
                    }
                    disabled={!editable}
                  />
                </Field>

                {parent && base.SigneeID !== base.PlayerID && (
                  <div className="sm:col-span-2">
                    <Button
                      variant="outline"
                      onClick={() => loadAll(parent.PlayerID!)}
                    >
                      View Parent
                    </Button>
                  </div>
                )}
              </section>

              <div className="flex flex-wrap gap-2">
                <Button onClick={savePlayer} disabled={!editable}>
                  Save Player
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:border-red-400/40 dark:hover:bg-red-500/10"
                  onClick={removePlayer}
                  disabled={!allowDelete}
                  title={allowDelete ? "Delete Player" : "Admins only"}
                >
                  Delete Player
                </Button>
              </div>

              <Separator />

              {/* Top Scores */}
              <section>
                <div className="mb-2 text-sm font-semibold">Top Scores</div>

                {/* Mobile cards */}
                <div className="grid gap-2 sm:hidden">
                  {(showAllScores ? topScores : topScores.slice(0, 5)).map(
                    (s) => (
                      <div
                        key={s.ScoreID}
                        className="rounded-md border p-3 bg-background"
                      >
                        <div className="text-sm font-medium">
                          {variantMap[s.GamesVariantId] ?? s.GamesVariantId}
                        </div>
                        <div className="mt-1 text-sm">
                          <span className="text-muted-foreground">Score: </span>
                          <span className="font-medium">{s.Points}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.updatedAt
                            ? new Date(s.updatedAt).toLocaleString()
                            : "—"}
                        </div>
                      </div>
                    )
                  )}
                  {topScores.length === 0 && (
                    <div className="rounded-md border p-3 text-sm text-muted-foreground">
                      No scores.
                    </div>
                  )}
                </div>

                {/* Desktop table */}
                <div className="rounded-md border overflow-x-auto hidden sm:block">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left">Variant</th>
                        <th className="px-3 py-2 text-left">Score</th>
                        <th className="px-3 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAllScores ? topScores : topScores.slice(0, 5)).map(
                        (s) => (
                          <tr key={s.ScoreID} className="odd:bg-muted/30">
                            <td className="px-3 py-2">
                              {variantMap[s.GamesVariantId] ?? s.GamesVariantId}
                            </td>
                            <td className="px-3 py-2">{s.Points}</td>
                            <td className="px-3 py-2">
                              {s.updatedAt
                                ? new Date(s.updatedAt).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        )
                      )}
                      {topScores.length === 0 && (
                        <tr>
                          <td className="px-3 py-3" colSpan={3}>
                            No scores.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {topScores.length > 5 && (
                  <div className="mt-2">
                    <Button
                      variant="link"
                      className="px-0"
                      onClick={() => setShowAllScores((v) => !v)}
                    >
                      {showAllScores
                        ? "Show less"
                        : `View all ${topScores.length}`}
                    </Button>
                  </div>
                )}
              </section>

              {/* Children (owner = master) */}
              {base.SigneeID === base.PlayerID && (
                <section>
                  <div className="mb-2 text-sm font-semibold">Children</div>

                  {/* Mobile cards */}
                  <div className="grid gap-2 sm:hidden">
                    {(showAllChildren
                      ? children
                      : children.slice(0, CHILD_PREVIEW_COUNT)
                    ).map((c) => {
                      const info = childDisplay(c);
                      const editing = editingChildId === c.PlayerID;
                      return (
                        <div
                          key={c.PlayerID}
                          className="rounded-md border p-3 bg-background"
                        >
                          {editing ? (
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex gap-2">
                                <Input
                                  className="h-8"
                                  value={childEdit.FirstName ?? c.FirstName}
                                  onChange={(e) =>
                                    setChildEdit((s) => ({
                                      ...s,
                                      FirstName: e.target.value,
                                    }))
                                  }
                                  disabled={!editable}
                                />
                                <Input
                                  className="h-8"
                                  value={childEdit.LastName ?? c.LastName}
                                  onChange={(e) =>
                                    setChildEdit((s) => ({
                                      ...s,
                                      LastName: e.target.value,
                                    }))
                                  }
                                  disabled={!editable}
                                />
                              </div>
                              <Input
                                className="h-8"
                                type="email"
                                value={childEdit.email ?? c.email ?? ""}
                                onChange={(e) =>
                                  setChildEdit((s) => ({
                                    ...s,
                                    email: e.target.value,
                                  }))
                                }
                                disabled={!editable}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={saveChild}
                                  disabled={!editable}
                                  className="flex-1"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingChildId(null);
                                    setChildEdit({});
                                  }}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  className="text-left text-sm font-medium text-foreground hover:text-indigo-600 transition-colors"
                                  title="View child"
                                  onClick={() => loadAll(c.PlayerID)}
                                >
                                  {c.FirstName} {c.LastName}
                                  <div className="text-xs text-muted-foreground">
                                    ID #{c.PlayerID}
                                  </div>
                                </button>
                                <div className="inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1">
                                  <span
                                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                                      info.hasValid
                                        ? "bg-emerald-500"
                                        : "bg-red-500"
                                    }`}
                                  />
                                  <span
                                    className="font-mono text-xs"
                                    title={info.code || "—"}
                                  >
                                    {info.code || "—"}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {info.status ? `[${info.status}]` : ""}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingChildId(c.PlayerID);
                                    setChildEdit({
                                      FirstName: c.FirstName,
                                      LastName: c.LastName,
                                      email: c.email ?? "",
                                    });
                                  }}
                                  disabled={!editable}
                                  title={
                                    editable
                                      ? "Edit"
                                      : "You do not have permission to edit"
                                  }
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:border-red-400/40 dark:hover:bg-red-500/10"
                                  onClick={() => removeChild(c.PlayerID)}
                                  disabled={!allowDelete}
                                  title={allowDelete ? "Delete" : "Admins only"}
                                >
                                  Delete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => loadAll(c.PlayerID)}
                                >
                                  View
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {children.length === 0 && (
                      <div className="rounded-md border p-3 text-sm text-muted-foreground">
                        No children.
                      </div>
                    )}
                  </div>

                  {/* Desktop table */}
                  <div className="rounded-lg border overflow-x-auto hidden sm:block">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left w-[84px]">ID</th>
                          <th className="px-3 py-2 text-left min-w-[180px]">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left w-[280px]">
                            Email
                          </th>
                          <th className="px-3 py-2 text-left min-w-[220px]">
                            Band
                          </th>
                          <th className="px-3 py-2 text-left w-[170px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllChildren
                          ? children
                          : children.slice(0, CHILD_PREVIEW_COUNT)
                        ).length ? (
                          (showAllChildren
                            ? children
                            : children.slice(0, CHILD_PREVIEW_COUNT)
                          ).map((c) => {
                            const info = childDisplay(c);
                            const editing = editingChildId === c.PlayerID;

                            return (
                              <tr
                                key={c.PlayerID}
                                className="border-b last:border-b-0 hover:bg-muted/40 transition-colors"
                              >
                                <td className="px-3 py-3 align-top text-muted-foreground">
                                  {c.PlayerID}
                                </td>

                                <td className="px-3 py-3 align-top">
                                  {editing ? (
                                    <div className="flex gap-2">
                                      <Input
                                        className="h-8"
                                        value={
                                          childEdit.FirstName ?? c.FirstName
                                        }
                                        onChange={(e) =>
                                          setChildEdit((s) => ({
                                            ...s,
                                            FirstName: e.target.value,
                                          }))
                                        }
                                        disabled={!editable}
                                      />
                                      <Input
                                        className="h-8"
                                        value={childEdit.LastName ?? c.LastName}
                                        onChange={(e) =>
                                          setChildEdit((s) => ({
                                            ...s,
                                            LastName: e.target.value,
                                          }))
                                        }
                                        disabled={!editable}
                                      />
                                    </div>
                                  ) : (
                                    <button
                                      className="text-foreground hover:text-indigo-600 transition-colors"
                                      title="View child"
                                      onClick={() => loadAll(c.PlayerID)}
                                    >
                                      <span className="font-medium">
                                        {c.FirstName}
                                      </span>{" "}
                                      <span className="font-medium">
                                        {c.LastName}
                                      </span>
                                    </button>
                                  )}
                                </td>

                                <td className="px-3 py-3 align-top">
                                  {editing ? (
                                    <Input
                                      className="h-8"
                                      type="email"
                                      value={childEdit.email ?? c.email ?? ""}
                                      onChange={(e) =>
                                        setChildEdit((s) => ({
                                          ...s,
                                          email: e.target.value,
                                        }))
                                      }
                                      disabled={!editable}
                                    />
                                  ) : (
                                    <span
                                      className="block max-w-[260px] truncate text-foreground/90"
                                      title={c.email ?? "—"}
                                    >
                                      {c.email ?? "—"}
                                    </span>
                                  )}
                                </td>

                                <td className="px-3 py-3 align-top">
                                  <div className="inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1">
                                    <span
                                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                                        info.hasValid
                                          ? "bg-emerald-500"
                                          : "bg-red-500"
                                      }`}
                                    />
                                    <span
                                      className="font-mono text-xs"
                                      title={info.code || "—"}
                                    >
                                      {info.code || "—"}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {info.status ? `[${info.status}]` : ""}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-3 py-3 align-top">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    {editing ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={saveChild}
                                          disabled={!editable}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingChildId(null);
                                            setChildEdit({});
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingChildId(c.PlayerID);
                                            setChildEdit({
                                              FirstName: c.FirstName,
                                              LastName: c.LastName,
                                              email: c.email ?? "",
                                            });
                                          }}
                                          disabled={!editable}
                                          title={
                                            editable
                                              ? "Edit"
                                              : "You do not have permission to edit"
                                          }
                                        >
                                          Edit
                                        </Button>

                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:border-red-400/40 dark:hover:bg-red-500/10"
                                          onClick={() =>
                                            removeChild(c.PlayerID)
                                          }
                                          disabled={!allowDelete}
                                          title={
                                            allowDelete
                                              ? "Delete"
                                              : "Admins only"
                                          }
                                        >
                                          Delete
                                        </Button>

                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => loadAll(c.PlayerID)}
                                        >
                                          View
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              className="px-3 py-6 text-center text-muted-foreground"
                              colSpan={5}
                            >
                              No children.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {children.length > CHILD_PREVIEW_COUNT && (
                    <div className="mt-3 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllChildren(!showAllChildren)}
                      >
                        {showAllChildren
                          ? "Show less"
                          : `Show all ${children.length} children`}
                      </Button>
                    </div>
                  )}
                </section>
              )}

              {/* Wristbands */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">Wristbands</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="wb-valid-only"
                      checked={showValidOnlyBands}
                      onCheckedChange={setShowValidOnlyBands}
                    />
                    <Label htmlFor="wb-valid-only" className="text-sm">
                      {showValidOnlyBands ? "Valid only" : "Show all"}
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  {wristbands
                    .filter(
                      (wb) =>
                        !showValidOnlyBands ||
                        editingWbId === wb.WristbandTranID ||
                        isValidWb(wb)
                    )
                    .map((wb) => {
                      const editing = editingWbId === wb.WristbandTranID;
                      const s = new Date(wb.playerStartTime);
                      const e = new Date(wb.playerEndTime);
                      const isMaster =
                        e.getTime() - s.getTime() > 10 * 24 * 60 * 60 * 1000;

                      return (
                        <div
                          key={wb.WristbandTranID}
                          className="rounded-md border p-3 bg-background"
                        >
                          {editing ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <strong
                                className="font-mono"
                                title={wb.wristbandCode}
                              >
                                {wb.wristbandCode.length > 16
                                  ? `${wb.wristbandCode.slice(
                                      0,
                                      10
                                    )}…${wb.wristbandCode.slice(-4)}`
                                  : wb.wristbandCode}
                              </strong>

                              <Input
                                type="datetime-local"
                                className="h-8 w-44"
                                value={toLocalInput(wb.playerStartTime)}
                                onChange={(e) =>
                                  setWristbands((list) =>
                                    list.map((x) =>
                                      x.WristbandTranID === wb.WristbandTranID
                                        ? {
                                            ...x,
                                            playerStartTime: fromLocalInput(
                                              e.target.value
                                            ),
                                          }
                                        : x
                                    )
                                  )
                                }
                                disabled={!editable}
                              />
                              <Input
                                type="datetime-local"
                                className="h-8 w-44"
                                value={toLocalInput(wb.playerEndTime)}
                                onChange={(e) =>
                                  setWristbands((list) =>
                                    list.map((x) =>
                                      x.WristbandTranID === wb.WristbandTranID
                                        ? {
                                            ...x,
                                            playerEndTime: fromLocalInput(
                                              e.target.value
                                            ),
                                          }
                                        : x
                                    )
                                  )
                                }
                                disabled={!editable}
                              />

                              <select
                                className="h-8 rounded border bg-background px-2"
                                value={wb.wristbandStatusFlag}
                                onChange={(e) =>
                                  setWristbands((list) =>
                                    list.map((x) =>
                                      x.WristbandTranID === wb.WristbandTranID
                                        ? {
                                            ...x,
                                            wristbandStatusFlag: e.target.value,
                                          }
                                        : x
                                    )
                                  )
                                }
                                disabled={!editable}
                              >
                                <option value="R">Registered</option>
                                <option value="I">Initialized</option>
                              </select>

                              <div className="ml-auto flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveWb(wb)}
                                  disabled={!editable}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingWbId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                <strong
                                  className="font-mono"
                                  title={wb.wristbandCode}
                                >
                                  {wb.wristbandCode.length > 16
                                    ? `${wb.wristbandCode.slice(
                                        0,
                                        10
                                      )}…${wb.wristbandCode.slice(-4)}`
                                    : wb.wristbandCode}
                                </strong>
                                <span className="text-muted-foreground">
                                  Status:{" "}
                                  <b>
                                    {wb.wristbandStatusFlag === "R"
                                      ? "Registered"
                                      : "Initialized"}
                                  </b>
                                </span>
                                {isValidWb(wb) && (
                                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                )}
                              </div>

                              <div className="text-muted-foreground">
                                {isMaster ? (
                                  <em>Master wristband</em>
                                ) : (
                                  <>
                                    {fmtShort(s)} – {fmtShort(e)}
                                  </>
                                )}
                              </div>

                              <div className="ml-auto flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setEditingWbId(wb.WristbandTranID)
                                  }
                                  disabled={!editable}
                                  title={
                                    editable
                                      ? "Edit wristband"
                                      : "You do not have permission to edit"
                                  }
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:border-red-400/40 dark:hover:bg-red-500/10"
                                  onClick={() => removeWb(wb.WristbandTranID)}
                                  disabled={!allowDelete}
                                  title={
                                    allowDelete
                                      ? "Delete wristband"
                                      : "Admins only"
                                  }
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {wristbands.filter(
                    (wb) => !showValidOnlyBands || isValidWb(wb)
                  ).length === 0 && (
                    <div className="rounded-md border p-3 text-sm text-muted-foreground">
                      No wristbands.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- small ui helpers ---------- */
function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-2 ${className ?? ""}`}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

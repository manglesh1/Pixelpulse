"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

import {
  fetchAllLocations,
  fetchGameLocations,
  fetchGamesVariants,
  fetchLocationVariants,
  createLocationVariant,
  deleteLocationVariant,
  createGameLocation,
  deleteGameLocation,
  updateGameLocationOverrides,
} from "../server/client";

interface Props {
  open: boolean;
  onClose: () => void;
  gameId: number;
  gameName: string;
}

interface Location {
  LocationID: number;
  Name?: string;
}

interface GameLocation {
  id: number;
  LocationID: number;
  location?: Location;

  IpAddress?: string | null;
  LocalPort?: number | null;
  RemotePort?: number | null;
  SocketBReceiverPort?: number | null;
  NoOfControllers?: number | null;
  NoOfLedPerDevice?: number | null;
  MaxPlayers?: number | null;
  columns?: number | null;
  SmartPlugIP?: string | null;
}

interface GameVariant {
  ID: number;
  GameID: number;
  name: string;
}

export default function ManageGameLocationsDialog({
  open,
  onClose,
  gameId,
  gameName,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [assigned, setAssigned] = useState<GameLocation[]>([]);
  const [variants, setVariants] = useState<GameVariant[]>([]);
  const [filter, setFilter] = useState("");
  const [locationVariants, setLocationVariants] = useState<
    Record<number, number[]>
  >({});

  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      try {
        const [locs, assignedLocs, allVariants] = await Promise.all([
          fetchAllLocations(),
          fetchGameLocations(gameId),
          fetchGamesVariants(),
        ]);

        const filteredVariants = allVariants.filter((v) => v.GameID === gameId);

        const locVarEntries = await Promise.all(
          assignedLocs.map(async (loc) => {
            const vars = await fetchLocationVariants(gameId, loc.LocationID);
            return [loc.LocationID, vars.map((v) => v.GamesVariantId)];
          })
        );

        setAllLocations(locs);
        setAssigned(assignedLocs);
        setVariants(filteredVariants);
        setLocationVariants(Object.fromEntries(locVarEntries));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, gameId]);

  const updateOverride = async (
    locId: number,
    patch: Record<string, number | string | null>
  ) => {
    await updateGameLocationOverrides(gameId, {
      LocationID: locId,
      ...patch,
    });

    setAssigned((prev) =>
      prev.map((l) => (l.LocationID === locId ? { ...l, ...patch } : l))
    );
  };

  const toggleVariant = async (locId: number, variantId: number) => {
    const current = locationVariants[locId] ?? [];
    const isActive = current.includes(variantId);

    const gameLocation = assigned.find((a) => a.LocationID === locId);
    if (!gameLocation) return;

    if (isActive) {
      const all = await fetchLocationVariants(gameId, locId);
      const match = all.find((v) => v.GamesVariantId === variantId);
      if (match) await deleteLocationVariant(match.id);

      setLocationVariants((prev) => ({
        ...prev,
        [locId]: current.filter((v) => v !== variantId),
      }));
    } else {
      await createLocationVariant({
        GameLocationID: gameLocation.id,
        LocationID: locId,
        GamesVariantId: variantId,
        isActive: true,
      });

      setLocationVariants((prev) => ({
        ...prev,
        [locId]: [...current, variantId],
      }));
    }
  };

  const handleAddLocation = async (locId: number) => {
    if (assigned.some((a) => a.LocationID === locId)) return;

    const newLoc = await createGameLocation({
      GameID: gameId,
      LocationID: locId,
    });

    const fullLoc = allLocations.find((l) => l.LocationID === locId);

    setAssigned((prev) => [...prev, { ...newLoc, location: fullLoc }]);
  };

  const filteredLocations = allLocations.filter(
    (l) =>
      l.Name?.toLowerCase().includes(filter.toLowerCase()) &&
      !assigned.some((a) => a.LocationID === l.LocationID)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          !w-[95vw]
          max-w-[1100px]
          h-[90vh]
          flex
          flex-col
          overflow-hidden
        "
      >
        {/* Header */}
        <DialogHeader className="shrink-0">
          <DialogTitle>Manage Locations – {gameName}</DialogTitle>
          <DialogDescription>
            Location-specific overrides inherit from game defaults when empty.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <p className="text-center text-muted-foreground py-6">Loading…</p>
          ) : (
            <div className="h-full flex flex-col lg:flex-row gap-4">
              {/* LEFT: Add Location */}
              <div className="lg:w-1/3 shrink-0 flex flex-col gap-3">
                <h4 className="font-medium text-sm">Add Location</h4>

                <Input
                  placeholder="Filter locations…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => (
                      <div
                        key={loc.LocationID}
                        className="flex items-center justify-between border rounded p-2 bg-muted/40"
                      >
                        <span className="text-sm">{loc.Name}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddLocation(loc.LocationID)}
                        >
                          Add
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      All locations assigned.
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT: Assigned Locations */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {assigned.map((loc) => (
                  <Card key={loc.LocationID} className="p-4 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{loc.location?.Name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Location #{loc.LocationID}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteGameLocation(loc.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>

                    {/* Overrides */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <OverrideInput
                        label="IP Address"
                        value={loc.IpAddress}
                        onChange={(v) =>
                          updateOverride(loc.LocationID, {
                            IpAddress: v,
                          })
                        }
                      />
                      <OverrideNumber
                        label="Local Port"
                        value={loc.LocalPort}
                        onChange={(v) =>
                          updateOverride(loc.LocationID, {
                            LocalPort: v,
                          })
                        }
                      />
                      <OverrideNumber
                        label="Remote Port"
                        value={loc.RemotePort}
                        onChange={(v) =>
                          updateOverride(loc.LocationID, {
                            RemotePort: v,
                          })
                        }
                      />
                      <OverrideNumber
                        label="Socket B Receiver"
                        value={loc.SocketBReceiverPort}
                        onChange={(v) =>
                          updateOverride(loc.LocationID, {
                            SocketBReceiverPort: v,
                          })
                        }
                      />
                      <OverrideNumber
                        label="Controllers"
                        value={loc.NoOfControllers}
                        onChange={(v) =>
                          updateOverride(loc.LocationID, {
                            NoOfControllers: v,
                          })
                        }
                      />
                      <OverrideNumber
                        label="LEDs / Device"
                        value={loc.NoOfLedPerDevice}
                        onChange={(v) =>
                          updateOverride(loc.LocationID, {
                            NoOfLedPerDevice: v,
                          })
                        }
                      />
                      <OverrideNumber
                        label="Max Players"
                        value={loc.MaxPlayers}
                        onChange={(v) =>
                          updateOverride(loc.LocationID, {
                            MaxPlayers: v,
                          })
                        }
                      />
                      <OverrideNumber
                        label="Columns"
                        value={loc.columns}
                        onChange={(v) =>
                          updateOverride(loc.LocationID, {
                            columns: v,
                          })
                        }
                      />
                      <OverrideInput
                        label="Smart Plug IP"
                        value={loc.SmartPlugIP}
                        onChange={(v) =>
                          updateOverride(loc.LocationID, {
                            SmartPlugIP: v,
                          })
                        }
                      />
                    </div>

                    {/* Variants */}
                    <div>
                      <Label className="text-xs mb-2 block">Variants</Label>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((variant) => {
                          const active = locationVariants[
                            loc.LocationID
                          ]?.includes(variant.ID);

                          return (
                            <Badge
                              key={variant.ID}
                              variant={active ? "default" : "outline"}
                              onClick={() =>
                                toggleVariant(loc.LocationID, variant.ID)
                              }
                              className="cursor-pointer"
                            >
                              {variant.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Helpers ---------------- */

function OverrideInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        placeholder="Inherit"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
      />
    </div>
  );
}

function OverrideNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        placeholder="Inherit"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      />
    </div>
  );
}

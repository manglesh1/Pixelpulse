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
} from "../server/client";

interface ManageGameLocationsDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: number;
  gameName: string;
}

export default function ManageGameLocationsDialog({
  open,
  onClose,
  gameId,
  gameName,
}: ManageGameLocationsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
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

        console.log("variants", allVariants[0]);

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

  const handleAddLocation = async (locId: number) => {
    if (assigned.some((a) => a.LocationID === locId)) return;

    const newLoc = await createGameLocation({
      GameID: gameId,
      LocationID: locId,
    });

    const fullLoc = allLocations.find((l) => l.LocationID === locId);
    const enrichedLoc = {
      ...newLoc,
      location: fullLoc,
      Name: fullLoc?.Name,
    };

    setAssigned((prev) => [...prev, enrichedLoc]);
  };

  const handleRemove = async (locId: number) => {
    const rec = assigned.find((a) => a.LocationID === locId);
    if (!rec) return;
    await deleteGameLocation(rec.id);
    setAssigned((prev) => prev.filter((a) => a.LocationID !== locId));
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

  const filteredLocations = allLocations.filter(
    (l) =>
      l.Name?.toLowerCase().includes(filter.toLowerCase()) &&
      !assigned.some((a) => a.LocationID === l.LocationID)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[50vw] !w-[90vw]">
        <DialogHeader>
          <DialogTitle>Manage Locations for {gameName}</DialogTitle>
          <DialogDescription>
            Assign this game to locations and toggle variants per room.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : (
          <div className="flex gap-4">
            {/* LEFT: Add location panel */}
            <div className="w-1/3 space-y-2">
              <h4 className="text-sm font-medium mb-2">Add Location</h4>
              <Input
                placeholder="Type to filter..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div className="space-y-1 max-h-[65vh] overflow-y-auto pr-1">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <div
                      key={loc.LocationID}
                      className="flex items-center justify-between bg-muted/40 border rounded p-2"
                    >
                      <span>{loc.Name}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddLocation(loc.LocationID)}
                      >
                        Add
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    All locations already assigned.
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: Assigned */}
            <div className="flex-1 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <h4 className="text-sm font-medium mb-2">
                Assigned ({assigned.length})
              </h4>
              {assigned.map((loc) => (
                <Card
                  key={`loc-${loc.LocationID}`}
                  className="bg-muted/40 border p-4 rounded-lg space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {loc.location?.Name ?? loc.Name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Location #{loc.LocationID}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(loc.LocationID)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </div>

                  {/* Variants */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                      Variants
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => {
                        const isActive = (
                          locationVariants[loc.LocationID] ?? []
                        ).includes(variant.ID);
                        return (
                          <Badge
                            key={`var-${variant.ID}-${loc.LocationID}`}
                            variant={isActive ? "default" : "outline"}
                            onClick={() =>
                              toggleVariant(loc.LocationID, variant.ID)
                            }
                            className={`cursor-pointer transition ${
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-primary/20"
                            }`}
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
      </DialogContent>
    </Dialog>
  );
}

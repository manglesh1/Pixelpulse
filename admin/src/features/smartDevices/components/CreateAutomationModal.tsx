"use client";

import React from "react";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TimeUnit = "min" | "sec";

export default function CreateAutomationModal({
  open,
  values,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  values: {
    deviceAlias: string;
    macAddress: string;
    deviceIp: string;
    adapter: "tplink";
    enabled: boolean;
    onDurationValue: number;
    onDurationUnit: TimeUnit;
    minIntervalValue: number;
    minIntervalUnit: TimeUnit;
    activeGraceValue: number;
    activeGraceUnit: TimeUnit;
    maxOnValue: number | "";
    maxOnUnit: TimeUnit;
    requireActivePlayers: boolean;
    notes: string;
  };
  onChange: (patch: Partial<typeof values>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const FORM_ID = "create-automation-form";

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent
        className="
          p-0 bg-background text-foreground border border-border
          w-screen h-[100dvh] rounded-none
          sm:h-auto sm:w-full sm:max-w-[720px] sm:rounded-lg
          grid grid-rows-[auto_1fr_auto]
        "
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* Header (sticky) */}
        <DialogHeader className="px-6 pt-6 pb-4 sticky top-0 bg-background z-10 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>Create automation</DialogTitle>
              <DialogDescription className="mt-1">
                Bind to a device and configure timing rules.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Body (scrollable) */}
        <form
          id={FORM_ID}
          onSubmit={onSubmit}
          className="overflow-y-auto overscroll-contain touch-pan-y"
        >
          <div className="px-6 pb-6">
            {/* Device & flags */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  value={values.deviceAlias}
                  onChange={(e) => onChange({ deviceAlias: e.target.value })}
                  placeholder="e.g. Lobby Lamps"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mac">MAC address</Label>
                <Input
                  id="mac"
                  value={values.macAddress}
                  onChange={(e) => onChange({ macAddress: e.target.value })}
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ip">Device IP (optional)</Label>
                <Input
                  id="ip"
                  value={values.deviceIp}
                  onChange={(e) => onChange({ deviceIp: e.target.value })}
                  placeholder="192.168.0.42"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adapter">Adapter</Label>
                <Select
                  value={values.adapter}
                  onValueChange={(v) => onChange({ adapter: v as "tplink" })}
                >
                  <SelectTrigger id="adapter">
                    <SelectValue placeholder="Choose adapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tplink">TP-Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="inline-flex items-center gap-2">
                  <Switch
                    checked={values.enabled}
                    onCheckedChange={(v) => onChange({ enabled: v })}
                  />
                  Enabled
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, the rule is active immediately.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="inline-flex items-center gap-2">
                  <Switch
                    checked={values.requireActivePlayers}
                    onCheckedChange={(v) =>
                      onChange({ requireActivePlayers: v })
                    }
                  />
                  Require active players
                </Label>
                <p className="text-xs text-muted-foreground">
                  Only run while at least one player is currently active.
                </p>
              </div>
            </div>

            {/* Timing rules */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberWithUnit
                id="onDuration"
                label="On duration"
                value={values.onDurationValue}
                unit={values.onDurationUnit}
                onValue={(n) => onChange({ onDurationValue: n })}
                onUnit={(u) => onChange({ onDurationUnit: u })}
                min={0}
              />
              <NumberWithUnit
                id="minInterval"
                label="Minimum interval"
                value={values.minIntervalValue}
                unit={values.minIntervalUnit}
                onValue={(n) => onChange({ minIntervalValue: n })}
                onUnit={(u) => onChange({ minIntervalUnit: u })}
                min={0}
              />
              <NumberWithUnit
                id="activeGrace"
                label="Active grace"
                value={values.activeGraceValue}
                unit={values.activeGraceUnit}
                onValue={(n) => onChange({ activeGraceValue: n })}
                onUnit={(u) => onChange({ activeGraceUnit: u })}
                min={0}
                hint="Extra time to consider a player 'active' after last activity."
              />
              <NumberWithUnit
                id="maxOn"
                label="Max ON (optional)"
                value={
                  values.maxOnValue === "" ? "" : Number(values.maxOnValue)
                }
                allowEmpty
                unit={values.maxOnUnit}
                onValue={(nOrEmpty) =>
                  onChange({
                    maxOnValue:
                      nOrEmpty === "" || Number.isNaN(nOrEmpty as number)
                        ? ""
                        : Number(nOrEmpty),
                  })
                }
                onUnit={(u) => onChange({ maxOnUnit: u })}
                min={0}
                hint="Upper bound for continuous ON time."
              />
            </div>

            {/* Notes */}
            <div className="mt-6 space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={values.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                placeholder="Short description or purpose…"
              />
            </div>
          </div>
        </form>

        {/* Footer (sticky) */}
        <DialogFooter className="px-6 pb-6 sticky bottom-0 bg-background border-t border-border pt-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end w-full">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            {/* Submit targets the form above */}
            <Button type="submit" form={FORM_ID}>
              Create
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- helpers ---------- */
type NumberWithUnitBase = {
  id: string;
  label: string;
  unit: TimeUnit;
  onUnit: (u: TimeUnit) => void;
  min?: number;
  hint?: string;
};

type NumberWithUnitStrictProps = NumberWithUnitBase & {
  allowEmpty?: false;
  value: number;
  onValue: (n: number) => void;
};

type NumberWithUnitOptionalProps = NumberWithUnitBase & {
  allowEmpty: true;
  value: number | "";
  onValue: (n: number | "") => void;
};

function NumberWithUnit(
  props: NumberWithUnitStrictProps | NumberWithUnitOptionalProps
) {
  const { id, label, unit, onUnit, min = 0, hint } = props;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.target.value;
    if ("allowEmpty" in props && props.allowEmpty) {
      if (raw === "") return props.onValue("");
      const n = Number(raw);
      props.onValue(Number.isNaN(n) ? "" : n);
    } else {
      const n = Number(raw);
      props.onValue(Number.isNaN(n) ? min : n);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          value={
            ("value" in props ? props.value : undefined) as number | string
          }
          onChange={handleChange}
          className="w-full"
        />
        <Select value={unit} onValueChange={(v) => onUnit(v as TimeUnit)}>
          <SelectTrigger className="w-[92px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="min">min</SelectItem>
            <SelectItem value="sec">sec</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

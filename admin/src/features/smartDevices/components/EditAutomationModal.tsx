"use client";

import React from "react";

export type EditForm = {
  id: number;
  deviceAlias: string;
  macAddress: string;
  deviceIp: string;
  adapter: "tplink";
  enabled: boolean;
  onDurationValue: number | "";
  onDurationUnit: "min" | "sec";
  minIntervalValue: number | "";
  minIntervalUnit: "min" | "sec";
  activeGraceValue: number | "";
  activeGraceUnit: "min" | "sec";
  maxOnValue: number | "";
  maxOnUnit: "min" | "sec";
  requireActivePlayers: boolean;
  notes: string;
};

export default function EditAutomationModal({
  open,
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  form: EditForm;
  onChange: (patch: Partial<EditForm>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
        flex
        items-start justify-end
        p-0
        sm:items-center sm:justify-center sm:p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-automation-title"
    >
      {/* Panel */}
      <div
        className="
          bg-background text-foreground shadow-lg border border-border
          w-screen h-[100dvh] rounded-none
          sm:w-full sm:max-w-2xl sm:h-auto sm:rounded-lg
          grid grid-rows-[auto_1fr_auto]
        "
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* Header (sticky) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background">
          <h5 id="edit-automation-title" className="text-base font-semibold">
            Edit Automation{" "}
            <span className="text-muted-foreground">#{form.id}</span>
          </h5>
          <button
            className="
              rounded p-2 text-muted-foreground
              hover:bg-muted/60
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
            "
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body (scrollable) */}
        <form onSubmit={onSubmit} className="overflow-y-auto">
          <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Device / Identity */}
            <div className="md:col-span-2">
              <SectionTitle
                title="Device"
                subtitle="Identifiers used to target the device."
              />
            </div>

            <Field label="Alias">
              <input
                className="
                  w-full rounded-md border border-input bg-background
                  px-3 py-2 text-sm text-foreground
                  placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                "
                value={form.deviceAlias}
                onChange={(e) => onChange({ deviceAlias: e.target.value })}
                placeholder="e.g. Projector"
              />
            </Field>

            <Field label="MAC">
              <input
                className="
                  w-full rounded-md border border-input bg-background
                  px-3 py-2 text-sm font-mono text-foreground
                  placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                "
                value={form.macAddress}
                onChange={(e) => onChange({ macAddress: e.target.value })}
                placeholder="AA:BB:CC:DD:EE:FF"
              />
            </Field>

            <Field label="Adapter">
              <select
                className="
                  w-full rounded-md border border-input bg-background
                  px-3 py-2 text-sm text-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                "
                value={form.adapter}
                onChange={(e) =>
                  onChange({ adapter: e.target.value as "tplink" })
                }
              >
                <option value="tplink">TP-Link</option>
              </select>
            </Field>

            <div className="flex items-center gap-2">
              <input
                id="enabled"
                className="h-4 w-4 accent-primary"
                type="checkbox"
                checked={!!form.enabled}
                onChange={(e) => onChange({ enabled: e.target.checked })}
              />
              <label htmlFor="enabled" className="text-sm">
                Enabled
              </label>
            </div>

            {/* Behavior */}
            <div className="md:col-span-2 mt-2">
              <SectionTitle
                title="Behavior"
                subtitle="Configure durations and throttling."
              />
            </div>

            <NumberUnitField
              label="On Duration"
              value={form.onDurationValue}
              unit={form.onDurationUnit}
              onValue={(v) => onChange({ onDurationValue: v })}
              onUnit={(u) => onChange({ onDurationUnit: u })}
              help="How long to keep the device ON per trigger."
            />

            <NumberUnitField
              label="Min Interval"
              value={form.minIntervalValue}
              unit={form.minIntervalUnit}
              onValue={(v) => onChange({ minIntervalValue: v })}
              onUnit={(u) => onChange({ minIntervalUnit: u })}
              help="Minimum time between consecutive activations."
            />

            <NumberUnitField
              label="Active Grace"
              value={form.activeGraceValue}
              unit={form.activeGraceUnit}
              onValue={(v) => onChange({ activeGraceValue: v })}
              onUnit={(u) => onChange({ activeGraceUnit: u })}
              help="Wait period after activity before turning off."
            />

            <NumberUnitField
              label="Max On (optional)"
              value={form.maxOnValue}
              unit={form.maxOnUnit}
              onValue={(v) => onChange({ maxOnValue: v })}
              onUnit={(u) => onChange({ maxOnUnit: u })}
              allowEmpty
              help="Upper bound on continuous ON time. Leave blank for no limit."
            />

            <div className="flex items-center gap-2">
              <input
                id="requireActivePlayers"
                className="h-4 w-4 accent-primary"
                type="checkbox"
                checked={!!form.requireActivePlayers}
                onChange={(e) =>
                  onChange({ requireActivePlayers: e.target.checked })
                }
              />
              <label htmlFor="requireActivePlayers" className="text-sm">
                Require Active Players
              </label>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <Field label="Notes">
                <input
                  className="
                    w-full rounded-md border border-input bg-background
                    px-3 py-2 text-sm text-foreground
                    placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                  "
                  value={form.notes}
                  onChange={(e) => onChange({ notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </Field>
            </div>
          </div>

          {/* Footer (sticky) */}
          <div className="px-5 py-4 border-t border-border bg-background sticky bottom-0">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="
                  rounded-md border border-input bg-background
                  px-3 py-2 text-sm
                  hover:bg-muted
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                "
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="
                  rounded-md bg-primary text-primary-foreground
                  px-3 py-2 text-sm
                  hover:bg-primary/90
                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                "
                type="submit"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= helpers ================= */

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-1">
      <div className="text-sm font-semibold">{title}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm grid gap-1">
      <div className="text-foreground/90">{label}</div>
      {children}
    </label>
  );
}

/**
 * Handles number | "" values cleanly for <input type="number" />
 * Keeps value as string to avoid React's number/empty mismatch.
 */
function NumberUnitField({
  label,
  value,
  unit,
  onValue,
  onUnit,
  help,
  allowEmpty = false,
}: {
  label: string;
  value: number | "";
  unit: "min" | "sec";
  onValue: (v: number | "") => void;
  onUnit: (u: "min" | "sec") => void;
  help?: string;
  allowEmpty?: boolean;
}) {
  const stringValue =
    value === "" ? "" : Number.isFinite(value as number) ? String(value) : "";

  const inputBase =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground " +
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring " +
    "focus:ring-offset-2 focus:ring-offset-background";

  const selectBase =
    "rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground " +
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";

  return (
    <div className="text-sm">
      <div className="mb-1">{label}</div>
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className={inputBase}
          value={stringValue}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onValue(allowEmpty ? "" : 0);
            } else {
              const n = Number(raw);
              onValue(Number.isNaN(n) ? (allowEmpty ? "" : 0) : n);
            }
          }}
          placeholder={allowEmpty ? "—" : "0"}
        />
        <select
          className={selectBase}
          value={unit}
          onChange={(e) => onUnit(e.target.value as "min" | "sec")}
        >
          <option value="min">min</option>
          <option value="sec">sec</option>
        </select>
      </div>
      {help && <div className="mt-1 text-xs text-muted-foreground">{help}</div>}
    </div>
  );
}

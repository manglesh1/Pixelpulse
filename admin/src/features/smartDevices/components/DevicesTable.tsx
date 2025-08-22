"use client";

import React from "react";
import { Loader2, Power, PlusCircle, Copy } from "lucide-react";
import PaginationBar from "@/components/pagination/PaginationBar";

export type Device = {
  alias?: string;
  ip?: string;
  mac?: string;
  model?: string;
  powerState?: string; // "on" | "off" | "unknown"
};

function deviceKey(d: Device) {
  return d.mac || d.ip || d.alias || "";
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function copyToClipboard(text?: string) {
  if (!text) return;
  try {
    navigator.clipboard?.writeText(text);
  } catch {}
}

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  totalCount?: number;
  showPageInput?: boolean;
  pageSizeOptions?: number[];
};

export default function DevicesTable({
  devices,
  busyMap,
  onToggle,
  onCreateAutomation,
  pagination,
}: {
  devices: Device[];
  busyMap: Record<string, boolean>;
  onToggle: (device: Device, desired: "on" | "off") => void;
  onCreateAutomation: (device: Device) => void;
  pagination?: PaginationProps;
}) {
  return (
    <>
      {/* Mobile / Tablet / Split-screen: card list (<= lg) */}
      <div className="lg:hidden space-y-3">
        {devices.length === 0 ? (
          <div className="rounded-md border border-border bg-background p-6 text-center text-muted-foreground">
            No devices found.
          </div>
        ) : (
          devices.map((d) => (
            <DeviceCard
              key={deviceKey(d)}
              d={d}
              busy={!!busyMap[deviceKey(d)]}
              onToggle={onToggle}
              onCreateAutomation={onCreateAutomation}
            />
          ))
        )}

        {pagination && (
          <div className="pt-2">
            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={pagination.onPageChange}
              pageSize={pagination.pageSize}
              onPageSizeChange={pagination.onPageSizeChange}
              totalCount={pagination.totalCount}
              showPageInput={pagination.showPageInput}
              pageSizeOptions={pagination.pageSizeOptions}
            />
          </div>
        )}
      </div>

      {/* Desktop: table (lg+) */}
      <div className="hidden lg:block overflow-x-auto rounded-md border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr className="border-b border-border">
              <Th className="min-w-[200px]">Device</Th>
              <Th className="w-[160px] xl:w-[180px]">IP</Th>
              <Th className="w-[200px] xl:w-[220px]">MAC</Th>
              <Th className="hidden xl:table-cell w-[180px]">Model</Th>
              <Th className="w-[110px]">Status</Th>
              <Th className="w-[260px] xl:w-[320px]">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const key = deviceKey(d);
              const isBusy = !!busyMap[key];
              const state = (d.powerState || "unknown").toLowerCase();

              return (
                <tr
                  key={key}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors"
                >
                  {/* Device */}
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-start gap-3">
                      <div
                        className={clsx(
                          "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background",
                          state === "on" && "bg-emerald-500",
                          state === "off" && "bg-zinc-400 dark:bg-zinc-500",
                          state !== "on" && state !== "off" && "bg-amber-400"
                        )}
                        aria-label={`power-${state}`}
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {d.alias || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {key || "unidentified"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* IP */}
                  <td className="px-3 py-3 align-top">
                    <MonoWithCopy value={d.ip} />
                  </td>

                  {/* MAC */}
                  <td className="px-3 py-3 align-top">
                    <MonoWithCopy value={d.mac} />
                  </td>

                  {/* Model */}
                  <td className="hidden xl:table-cell px-3 py-3 align-top">
                    {d.model ? (
                      <span className="truncate inline-block max-w-[160px]">
                        {d.model}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Status pill */}
                  <td className="px-3 py-3 align-top">
                    <StatusPill state={state as "on" | "off" | "unknown"} />
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap items-center gap-2">
                      <SegmentedToggle
                        isBusy={isBusy}
                        state={state as "on" | "off" | "unknown"}
                        onOn={() => onToggle(d, "on")}
                        onOff={() => onToggle(d, "off")}
                      />
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted/60"
                        onClick={() => onCreateAutomation(d)}
                        title="Create automation for this device"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Create Automation
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {devices.length === 0 && (
              <tr>
                <td
                  className="px-3 py-10 text-center text-muted-foreground"
                  colSpan={6}
                >
                  No devices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination (only if props provided) */}
        {pagination && (
          <div className="p-3">
            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={pagination.onPageChange}
              pageSize={pagination.pageSize}
              onPageSizeChange={pagination.onPageSizeChange}
              totalCount={pagination.totalCount}
              showPageInput={pagination.showPageInput}
              pageSizeOptions={pagination.pageSizeOptions}
            />
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- tiny UI helpers ---------- */

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={clsx(
        "px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wide",
        className
      )}
    >
      {children}
    </th>
  );
}

function StatusPill({ state }: { state: "on" | "off" | "unknown" }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1";
  if (state === "on")
    return (
      <span
        className={clsx(
          base,
          "bg-emerald-500/15 text-emerald-700 ring-emerald-600/20",
          "dark:text-emerald-400 dark:ring-emerald-400/20"
        )}
      >
        <Power className="h-3.5 w-3.5" />
        On
      </span>
    );
  if (state === "off")
    return (
      <span
        className={clsx(
          base,
          "bg-zinc-500/10 text-zinc-700 ring-zinc-600/20",
          "dark:text-zinc-300 dark:ring-zinc-400/20"
        )}
      >
        <Power className="h-3.5 w-3.5 rotate-180" />
        Off
      </span>
    );
  return (
    <span
      className={clsx(
        base,
        "bg-amber-500/15 text-amber-700 ring-amber-600/20",
        "dark:text-amber-400 dark:ring-amber-400/20"
      )}
    >
      <Power className="h-3.5 w-3.5" />
      Unknown
    </span>
  );
}

function SegmentedToggle({
  isBusy,
  state,
  onOn,
  onOff,
}: {
  isBusy: boolean;
  state: "on" | "off" | "unknown";
  onOn: () => void;
  onOff: () => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border">
      <button
        className={clsx(
          "px-2.5 py-1.5 text-sm inline-flex items-center gap-1.5",
          state === "on"
            ? "bg-emerald-600 text-emerald-50"
            : "bg-background hover:bg-muted/60"
        )}
        disabled={isBusy}
        onClick={onOn}
        title="Turn ON"
      >
        {isBusy && state !== "on" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Power className="h-3.5 w-3.5" />
        )}
        ON
      </button>
      <button
        className={clsx(
          "px-2.5 py-1.5 text-sm inline-flex items-center gap-1.5 border-l border-border",
          state === "off"
            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-200 dark:text-zinc-900"
            : "bg-background hover:bg-muted/60"
        )}
        disabled={isBusy}
        onClick={onOff}
        title="Turn OFF"
      >
        {isBusy && state !== "off" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Power className="h-3.5 w-3.5 rotate-180" />
        )}
        OFF
      </button>
    </div>
  );
}

function MonoWithCopy({ value }: { value?: string }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[13px]">{value}</span>
      <button
        className="rounded border border-border bg-background px-1.5 py-0.5 text-xs hover:bg-muted/60"
        title="Copy"
        onClick={() => copyToClipboard(value)}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ---------- Mobile/Tablet card (<= lg) ---------- */

function DeviceCard({
  d,
  busy,
  onToggle,
  onCreateAutomation,
}: {
  d: Device;
  busy: boolean;
  onToggle: (device: Device, desired: "on" | "off") => void;
  onCreateAutomation: (device: Device) => void;
}) {
  const state = (d.powerState || "unknown").toLowerCase() as
    | "on"
    | "off"
    | "unknown";

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background",
            state === "on" && "bg-emerald-500",
            state === "off" && "bg-zinc-400 dark:bg-zinc-500",
            state !== "on" && state !== "off" && "bg-amber-400"
          )}
          aria-label={`power-${state}`}
        />
        <div className="min-w-0 w-full">
          <div className="font-medium truncate">{d.alias || "—"}</div>
          <div className="text-xs text-muted-foreground truncate">
            {deviceKey(d) || "unidentified"}
          </div>

          <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">IP</span>
              <MonoWithCopy value={d.ip} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">MAC</span>
              <MonoWithCopy value={d.mac} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusPill state={state} />
            </div>
            {d.model ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="truncate max-w-[55%] text-right">
                  {d.model}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <SegmentedToggle
              isBusy={busy}
              state={state}
              onOn={() => onToggle(d, "on")}
              onOff={() => onToggle(d, "off")}
            />
            <button
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted/60"
              onClick={() => onCreateAutomation(d)}
              title="Create automation for this device"
            >
              <PlusCircle className="h-4 w-4" />
              Create Automation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

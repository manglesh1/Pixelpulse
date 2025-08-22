"use client";

import React from "react";
import type { Automation } from "@/features/smartDevices/server/client";

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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlugZap, Power, PowerOff, Link2 } from "lucide-react";

export default function AutomationsTable({
  rows,
  onEnable,
  onDisable,
  onPulse,
  onForceOn,
  onForceOff,
  onBind,
  onEdit,
  onDelete,
}: {
  rows: Automation[];
  onEnable: (row: Automation) => void;
  onDisable: (row: Automation) => void;
  onPulse: (row: Automation) => void;
  onForceOn: (row: Automation) => void;
  onForceOff: (row: Automation) => void;
  onBind: (row: Automation) => void;
  onEdit: (row: Automation) => void;
  onDelete: (row: Automation) => void;
}) {
  return (
    <>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-md border p-6 text-center text-muted-foreground">
            No automations.
          </div>
        ) : (
          rows.map((a) => (
            <MobileAutomationCard
              key={a.id}
              row={a}
              onEnable={onEnable}
              onDisable={onDisable}
              onPulse={onPulse}
              onForceOn={onForceOn}
              onForceOff={onForceOff}
              onBind={onBind}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {/* md+ : table */}
      <div className="relative overflow-x-auto rounded-md border hidden md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="min-w-[200px]">Alias</TableHead>

              {/* Hide non-essentials until lg/xl so table stays comfy */}
              <TableHead className="hidden lg:table-cell w-[220px]">
                MAC
              </TableHead>
              <TableHead className="hidden xl:table-cell w-[120px]">
                Adapter
              </TableHead>

              <TableHead className="w-[120px]">Enabled</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[220px]">
                Notes
              </TableHead>
              <TableHead className="w-[1%] whitespace-nowrap text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((a) => {
              const enabled = !!a.enabled;
              return (
                <TableRow key={a.id} className="hover:bg-muted/40">
                  <TableCell className="text-muted-foreground">
                    {a.id}
                  </TableCell>

                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="truncate" title={a.deviceAlias || ""}>
                        {a.deviceAlias || "—"}
                      </span>
                      {a.deviceIp ? (
                        <Badge variant="outline" className="hidden sm:inline">
                          {a.deviceIp}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <div
                      className="truncate font-mono text-xs"
                      title={a.macAddress || "—"}
                    >
                      {a.macAddress || "—"}
                    </div>
                  </TableCell>

                  <TableCell className="hidden xl:table-cell">
                    <Badge variant="secondary" className="uppercase">
                      {a.adapter || "—"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {enabled ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-600">
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <div
                      className="max-w-[420px] truncate text-foreground/90"
                      title={a.notes || "—"}
                    >
                      {a.notes || "—"}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    {/* Wide screens: pill button group */}
                    <div className="hidden lg:flex justify-end gap-2">
                      {enabled ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDisable(a)}
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEnable(a)}
                        >
                          Enable
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPulse(a)}
                      >
                        <PlugZap className="mr-2 h-4 w-4" />
                        Pulse 10s
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onForceOn(a)}
                      >
                        <Power className="mr-2 h-4 w-4" />
                        Force ON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onForceOff(a)}
                      >
                        <PowerOff className="mr-2 h-4 w-4" />
                        Force OFF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onBind(a)}
                      >
                        <Link2 className="mr-2 h-4 w-4" />
                        Bind
                      </Button>
                      <Button size="sm" onClick={() => onEdit(a)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                        onClick={() => onDelete(a)}
                      >
                        Delete
                      </Button>
                    </div>

                    {/* md / md+ but narrow: overflow menu */}
                    <div className="lg:hidden inline-flex">
                      <RowActionsMenu
                        row={a}
                        onEnable={onEnable}
                        onDisable={onDisable}
                        onPulse={onPulse}
                        onForceOn={onForceOn}
                        onForceOff={onForceOff}
                        onBind={onBind}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No automations.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/* --------------------------------- */
/* Mobile Card + Shared Actions menu */
/* --------------------------------- */

function MobileAutomationCard({
  row,
  onEnable,
  onDisable,
  onPulse,
  onForceOn,
  onForceOff,
  onBind,
  onEdit,
  onDelete,
}: {
  row: Automation;
  onEnable: (row: Automation) => void;
  onDisable: (row: Automation) => void;
  onPulse: (row: Automation) => void;
  onForceOn: (row: Automation) => void;
  onForceOff: (row: Automation) => void;
  onBind: (row: Automation) => void;
  onEdit: (row: Automation) => void;
  onDelete: (row: Automation) => void;
}) {
  const enabled = !!row.enabled;

  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            #{row.id} <span className="font-normal">•</span>{" "}
            <span
              className="truncate inline-block max-w-[65vw]"
              title={row.deviceAlias || ""}
            >
              {row.deviceAlias || "—"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {row.deviceIp ? (
              <Badge variant="outline">{row.deviceIp}</Badge>
            ) : null}
            <Badge variant={enabled ? "default" : "outline"}>
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
            {row.adapter ? (
              <Badge variant="secondary" className="uppercase">
                {row.adapter}
              </Badge>
            ) : null}
          </div>
          {row.notes ? (
            <div className="mt-2 line-clamp-2 text-sm text-foreground/90">
              {row.notes}
            </div>
          ) : null}
          {/* MAC as small mono line */}
          {row.macAddress ? (
            <div className="mt-1 font-mono text-[12px] text-muted-foreground break-all">
              {row.macAddress}
            </div>
          ) : null}
        </div>

        <RowActionsMenu
          row={row}
          onEnable={onEnable}
          onDisable={onDisable}
          onPulse={onPulse}
          onForceOn={onForceOn}
          onForceOff={onForceOff}
          onBind={onBind}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function RowActionsMenu({
  row,
  onEnable,
  onDisable,
  onPulse,
  onForceOn,
  onForceOff,
  onBind,
  onEdit,
  onDelete,
}: {
  row: Automation;
  onEnable: (row: Automation) => void;
  onDisable: (row: Automation) => void;
  onPulse: (row: Automation) => void;
  onForceOn: (row: Automation) => void;
  onForceOff: (row: Automation) => void;
  onBind: (row: Automation) => void;
  onEdit: (row: Automation) => void;
  onDelete: (row: Automation) => void;
}) {
  const enabled = !!row.enabled;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Actions for #${row.id}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Automation #{row.id}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {enabled ? (
          <DropdownMenuItem onClick={() => onDisable(row)}>
            Disable
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onEnable(row)}>
            Enable
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onPulse(row)}>
          Pulse 10s
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onForceOn(row)}>
          Force ON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onForceOff(row)}>
          Force OFF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onBind(row)}>
          Bind from Discovery
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => onDelete(row)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

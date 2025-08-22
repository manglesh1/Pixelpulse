"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import DevicesTable, {
  type Device,
} from "@/features/smartDevices/components/DevicesTable";
import AutomationsTable from "@/features/smartDevices/components/AutomationsTable";
import CreateAutomationModal from "@/features/smartDevices/components/CreateAutomationModal";
import EditAutomationModal, {
  type EditForm,
} from "@/features/smartDevices/components/EditAutomationModal";

import {
  fetchSmartDevices,
  refreshDiscovery,
  setSmartDeviceStatus,
  setSmartDeviceStatusByMac,
  setSmartDeviceStatusByAlias,
  getSmartDeviceStatusByMac,
  getSmartDeviceStatusByAlias,
  getSmartDeviceStatus,
  fetchAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  enableAutomation,
  disableAutomation,
  bindAutomationFromDiscovery,
  pulseAutomation,
  forceOnAutomation,
  forceOffAutomation,
  type Automation,
} from "@/features/smartDevices/server/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

type TimeUnit = "min" | "sec";
type NumOrEmpty = number | "";

export type NewAutoForm = {
  deviceAlias: string;
  deviceIp: string;
  macAddress: string;
  adapter: "tplink";
  enabled: boolean;
  onDurationValue: number;
  onDurationUnit: TimeUnit;
  minIntervalValue: number;
  minIntervalUnit: TimeUnit;
  activeGraceValue: number;
  activeGraceUnit: TimeUnit;
  maxOnValue: NumOrEmpty;
  maxOnUnit: TimeUnit;
  requireActivePlayers: boolean;
  notes: string;
};

// -------- helpers --------
const toMs = (val: number | "" | null | undefined, unit: "sec" | "min") => {
  if (val === "" || val == null) return null;
  return unit === "sec" ? val * 1000 : val * 60 * 1000;
};
const fromMs = (
  ms: number | null | undefined
): { value: NumOrEmpty; unit: TimeUnit } => {
  if (ms == null) return { value: "" as const, unit: "min" };
  if (ms % 60000 === 0) return { value: ms / 60000, unit: "min" };
  if (ms % 1000 === 0) return { value: ms / 1000, unit: "sec" };
  return { value: Math.round(ms / 1000), unit: "sec" };
};
const deviceKey = (d: Device) => d.mac || d.ip || d.alias || "";

const pollUntil = async (
  fn: () => Promise<boolean>,
  { intervalMs = 400, timeoutMs = 3000 } = {}
) => {
  const start = Date.now();
  let ok = false;
  while (!ok && Date.now() - start < timeoutMs) {
    ok = await fn();
    if (ok) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
};

const pageSize = 10;

export default function SmartDevicesPage() {
  const [activeTab, setActiveTab] = useState<"devices" | "automations">(
    "devices"
  );

  // DEVICES
  const [devices, setDevices] = useState<Device[]>([]);
  const [devSearch, setDevSearch] = useState("");
  const [devPage, setDevPage] = useState(1);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});

  // AUTOMATIONS
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [autoSearch, setAutoSearch] = useState("");
  const [loadingAutos, setLoadingAutos] = useState(true);

  // CREATE modal
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [newAuto, setNewAuto] = useState<NewAutoForm>({
    deviceAlias: "",
    deviceIp: "",
    macAddress: "",
    adapter: "tplink",
    enabled: true,
    onDurationValue: 4,
    onDurationUnit: "min",
    minIntervalValue: 30,
    minIntervalUnit: "min",
    activeGraceValue: 0,
    activeGraceUnit: "min",
    maxOnValue: "",
    maxOnUnit: "min",
    requireActivePlayers: true,
    notes: "",
  });
  const [lastCreated, setLastCreated] = useState<{
    id: number;
    alias: string;
  } | null>(null);

  // EDIT modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  // ===== DEVICES =====
  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const data = await fetchSmartDevices();
      setDevices((data || []).filter((d) => !!d?.mac));
    } finally {
      setLoadingDevices(false);
    }
  };

  const doRefreshDiscovery = async () => {
    await refreshDiscovery();
    await loadDevices();
  };

  useEffect(() => {
    if (activeTab === "devices") loadDevices();
  }, [activeTab]);

  const filteredDevices = useMemo(() => {
    const lower = devSearch.toLowerCase();
    return devices.filter(
      (d) =>
        (d.alias && d.alias.toLowerCase().includes(lower)) ||
        (d.ip && d.ip.includes(lower)) ||
        (d.mac && d.mac.toLowerCase().includes(lower)) ||
        (d.model && d.model.toLowerCase().includes(lower))
    );
  }, [devices, devSearch]);

  const pageDevices = useMemo(
    () => filteredDevices.slice((devPage - 1) * pageSize, devPage * pageSize),
    [filteredDevices, devPage]
  );

  const fetchSingleStatus = async (device: Device) => {
    const tryOnce = async () => {
      if (device.mac) return await getSmartDeviceStatusByMac(device.mac);
      if (device.alias) return await getSmartDeviceStatusByAlias(device.alias);
      if (device.ip) return await getSmartDeviceStatus(device.ip);
      throw new Error("No identifier to refresh device");
    };
    try {
      return await tryOnce();
    } catch (e: unknown) {
      const code = (e as { response?: { status?: number } })?.response?.status;
      if (code === 404) {
        try {
          await refreshDiscovery();
        } catch {}
        return await tryOnce();
      }
      throw e;
    }
  };

  const applySingleStatusToState = (
    key: string,
    payload: (Partial<Device> & { state?: string }) | null,
    fallbackAlias?: string
  ) => {
    if (!payload) return;
    const nextState = (payload.state || "").toLowerCase();
    setDevices((prev) =>
      prev.map((d) => {
        if (deviceKey(d) !== key) return d;
        return {
          ...d,
          ip: payload.ip || d.ip,
          alias: payload.alias || d.alias || fallbackAlias || "",
          mac: payload.mac || d.mac,
          powerState: nextState || d.powerState,
        };
      })
    );
  };

  const toggleDevice = async (device: Device, desired: "on" | "off") => {
    const key = deviceKey(device);
    setDevices((prev) =>
      prev.map((d) =>
        deviceKey(d) === key ? { ...d, powerState: desired } : d
      )
    );
    setBusyMap((m) => ({ ...m, [key]: true }));

    try {
      if (device.mac) {
        await setSmartDeviceStatusByMac(device.mac, desired);
      } else if (device.alias) {
        await setSmartDeviceStatusByAlias(device.alias, desired);
      } else if (device.ip) {
        await setSmartDeviceStatus(device.ip, desired);
      } else {
        throw new Error("No identifier (MAC/Alias/IP) to control this device");
      }

      await pollUntil(async () => {
        const status = await fetchSingleStatus(device);
        if (status) {
          applySingleStatusToState(key, status, device.alias);
          return (status.state || "").toLowerCase() === desired;
        }
        return false;
      });
    } catch {
      try {
        const status = await fetchSingleStatus(device);
        applySingleStatusToState(key, status, device.alias);
      } catch {}
      alert(
        `Failed to turn ${desired} for ${
          device.alias || device.ip || device.mac
        }`
      );
    } finally {
      setBusyMap((m) => ({ ...m, [key]: false }));
    }
  };

  const openCreateAutomationModal = (device: Device) => {
    setNewAuto((prev) => ({
      ...prev,
      deviceAlias: device.alias || "",
      deviceIp: device.ip || "",
      macAddress: device.mac || "",
      adapter: "tplink",
      enabled: true,
    }));
    setIsAutoModalOpen(true);
    setLastCreated(null);
  };

  const submitCreateAutomation: React.FormEventHandler<
    HTMLFormElement
  > = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        deviceAlias: newAuto.deviceAlias,
        deviceIp: newAuto.deviceIp || "",
        macAddress: newAuto.macAddress || "",
        adapter: newAuto.adapter || "tplink",
        enabled: !!newAuto.enabled,
        onDurationMs:
          toMs(newAuto.onDurationValue, newAuto.onDurationUnit) ?? 0,
        minIntervalMs:
          toMs(newAuto.minIntervalValue, newAuto.minIntervalUnit) ?? 0,
        activeGraceMs:
          toMs(newAuto.activeGraceValue, newAuto.activeGraceUnit) ?? 0,
        maxOnMs:
          newAuto.maxOnValue === "" || newAuto.maxOnValue == null
            ? null
            : toMs(newAuto.maxOnValue, newAuto.maxOnUnit),
        requireActivePlayers: !!newAuto.requireActivePlayers,
        notes: newAuto.notes || "",
      };
      const row = await createAutomation(payload);
      try {
        await bindAutomationFromDiscovery(row.id);
      } catch {}
      setLastCreated({ id: row.id, alias: row.deviceAlias || "" });
      setIsAutoModalOpen(false);
      if (activeTab === "automations") await loadAutomations();
      alert(`Automation #${row.id} created for "${row.deviceAlias}"`);
    } catch (err) {
      console.error(err);
      alert("Failed to create automation");
    }
  };

  // ===== AUTOMATIONS =====
  const loadAutomations = useCallback(async () => {
    setLoadingAutos(true);
    try {
      const data = await fetchAutomations({ q: autoSearch });
      setAutomations(data || []);
    } finally {
      setLoadingAutos(false);
    }
  }, [autoSearch]);

  useEffect(() => {
    if (activeTab !== "automations") return;
    const t = setTimeout(() => {
      loadAutomations();
    }, 300);
    return () => clearTimeout(t);
  }, [autoSearch, activeTab, loadAutomations]);

  const clickEnable = async (row: Automation) => {
    await enableAutomation(row.id);
    await loadAutomations();
  };
  const clickDisable = async (row: Automation) => {
    await disableAutomation(row.id);
    await loadAutomations();
  };
  const clickPulse = async (row: Automation) => {
    await pulseAutomation(row.id, 10000);
  };
  const clickForceOn = async (row: Automation) => {
    await forceOnAutomation(row.id, 15000);
  };
  const clickForceOff = async (row: Automation) => {
    await forceOffAutomation(row.id);
  };
  const clickBind = async (row: Automation) => {
    await bindAutomationFromDiscovery(row.id);
    await loadAutomations();
  };
  const clickDelete = async (row: Automation) => {
    if (!confirm(`Delete automation #${row.id} (${row.deviceAlias})?`)) return;
    await deleteAutomation(row.id);
    await loadAutomations();
  };

  const openEditAutomation = (row: Automation) => {
    const onDur = fromMs(row.onDurationMs);
    const minInt = fromMs(row.minIntervalMs);
    const actG = fromMs(row.activeGraceMs);
    const maxOn = fromMs(row.maxOnMs);
    setEditForm({
      id: row.id,
      deviceAlias: row.deviceAlias || "",
      macAddress: row.macAddress || "",
      deviceIp: row.deviceIp || "",
      adapter: (row.adapter as "tplink") || "tplink",
      enabled: !!row.enabled,
      onDurationValue: onDur.value,
      onDurationUnit: onDur.unit,
      minIntervalValue: minInt.value,
      minIntervalUnit: minInt.unit,
      activeGraceValue: actG.value,
      activeGraceUnit: actG.unit,
      maxOnValue: maxOn.value,
      maxOnUnit: maxOn.unit,
      requireActivePlayers: !!row.requireActivePlayers,
      notes: row.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const submitEditAutomation: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    if (!editForm) return;
    const f = editForm;
    const payload = {
      deviceAlias: f.deviceAlias,
      macAddress: f.macAddress || "",
      deviceIp: f.deviceIp || "",
      adapter: f.adapter || "tplink",
      enabled: !!f.enabled,
      onDurationMs: toMs(f.onDurationValue, f.onDurationUnit) ?? 0,
      minIntervalMs: toMs(f.minIntervalValue, f.minIntervalUnit) ?? 0,
      activeGraceMs: toMs(f.activeGraceValue, f.activeGraceUnit) ?? 0,
      maxOnMs:
        f.maxOnValue === "" || f.maxOnValue == null
          ? null
          : toMs(f.maxOnValue, f.maxOnUnit),
      requireActivePlayers: !!f.requireActivePlayers,
      notes: f.notes || "",
    };
    await updateAutomation(f.id, payload);
    setIsEditModalOpen(false);
    await loadAutomations();
  };

  // -------- render --------
  return (
    <div className="mx-auto max-w-[1600px] p-4">
      {/* Header + tabs */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Smart Devices & Automations</h2>

        <div className="inline-flex overflow-hidden rounded-md border">
          <Button
            variant={activeTab === "devices" ? "default" : "ghost"}
            className={
              activeTab === "devices" ? "rounded-none" : "rounded-none"
            }
            onClick={() => setActiveTab("devices")}
          >
            Devices
          </Button>
          <Separator orientation="vertical" />
          <Button
            variant={activeTab === "automations" ? "default" : "ghost"}
            className={
              activeTab === "automations" ? "rounded-none" : "rounded-none"
            }
            onClick={() => setActiveTab("automations")}
          >
            Automations
          </Button>
        </div>
      </div>

      {/* DEVICES TAB */}
      {activeTab === "devices" && (
        <Card>
          <CardHeader className="sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Devices</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Discover and control connected devices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search devices…"
                value={devSearch}
                onChange={(e) => {
                  setDevSearch(e.target.value);
                  setDevPage(1);
                }}
                className="w-[260px]"
              />
              <Button variant="outline" onClick={loadDevices}>
                Reload List
              </Button>
              <Button onClick={doRefreshDiscovery}>Refresh Discovery</Button>
            </div>
          </CardHeader>

          <CardContent>
            {lastCreated?.id ? (
              <div className="mb-4 flex items-center justify-between rounded-md border bg-blue-50 p-3 text-sm">
                <div>
                  Created automation <strong>#{lastCreated.id}</strong>
                  {lastCreated.alias ? (
                    <>
                      {" "}
                      for <strong>{lastCreated.alias}</strong>
                    </>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pulseAutomation(lastCreated.id, 10000)}
                  >
                    Pulse 10s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => forceOnAutomation(lastCreated.id, 15000)}
                  >
                    Force ON (15s)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => forceOffAutomation(lastCreated.id)}
                  >
                    Force OFF
                  </Button>
                </div>
              </div>
            ) : null}

            {loadingDevices ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                <DevicesTable
                  devices={pageDevices}
                  busyMap={busyMap}
                  onToggle={toggleDevice}
                  onCreateAutomation={openCreateAutomationModal}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* AUTOMATIONS TAB */}
      {activeTab === "automations" && (
        <Card>
          <CardHeader className="sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Automations</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Search, manage, and edit power rules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Input
                  className="w-[320px] pr-10"
                  placeholder="Search automations…"
                  value={autoSearch}
                  onChange={(e) => setAutoSearch(e.target.value)}
                />
                {autoSearch && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setAutoSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loadingAutos ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : (
              <AutomationsTable
                rows={automations}
                onEnable={clickEnable}
                onDisable={clickDisable}
                onPulse={clickPulse}
                onForceOn={clickForceOn}
                onForceOff={clickForceOff}
                onBind={clickBind}
                onEdit={openEditAutomation}
                onDelete={clickDelete}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Create / Edit modals */}
      <CreateAutomationModal
        open={isAutoModalOpen}
        values={newAuto}
        onChange={(patch) => setNewAuto((p) => ({ ...p, ...patch }))}
        onClose={() => setIsAutoModalOpen(false)}
        onSubmit={submitCreateAutomation}
      />

      {isEditModalOpen && editForm && (
        <EditAutomationModal
          open={isEditModalOpen}
          form={editForm}
          onChange={(patch) => setEditForm((p) => (p ? { ...p, ...patch } : p))}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={submitEditAutomation}
        />
      )}
    </div>
  );
}

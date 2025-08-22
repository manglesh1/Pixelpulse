import { http } from "@/lib/http";

/* ===========================
   Types
=========================== */

export type SmartDevice = {
  alias?: string;
  ip?: string;
  mac?: string; // colonized, preferred identifier
  model?: string;
  powerState?: string; // "on" | "off" | "unknown"
};

export type Automation = {
  id: number;
  deviceAlias: string;
  macAddress?: string | null;
  deviceIp?: string | null;
  adapter: string; // e.g. "tplink"
  enabled: boolean;
  notes?: string | null;
  onDurationMs: number;
  minIntervalMs: number;
  activeGraceMs: number;
  maxOnMs: number | null;
  requireActivePlayers: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AutomationLog = {
  id: number;
  automationId: number;
  ts?: string; // ISO timestamp
  level?: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, unknown>;
};

export type ResolveTargetResult = {
  ip?: string | null;
  mac?: string | null;
  alias?: string | null;
};

/* ===========================
   Discovery / Devices
=========================== */

export async function fetchSmartDevices(): Promise<SmartDevice[]> {
  try {
    const res = await http.get("/smartDevices");
    return (res.data as SmartDevice[]) ?? [];
  } catch (err) {
    console.error("Failed to fetch smart devices", err);
    return [];
  }
}

export async function refreshDiscovery(): Promise<{
  refreshed: boolean;
  count?: number;
}> {
  const res = await http.post("/devices/refresh");
  return res.data as { refreshed: boolean; count?: number };
}

/** Control by simple IP (least preferred) */
export async function setSmartDeviceStatus(ip: string, state: "on" | "off") {
  const res = await http.get("/smartDevices/set", { params: { ip, state } });
  return res.data as { ip: string; state: string; message?: string };
}

export async function getSmartDeviceStatus(ip: string) {
  const res = await http.get("/smartDevices/get", { params: { ip } });
  return res.data as {
    ip: string;
    state: string;
    alias?: string;
    mac?: string;
  };
}

/** Control by MAC (preferred) */
export async function setSmartDeviceStatusByMac(
  mac: string,
  state: "on" | "off"
) {
  const res = await http.post("/device/status/mac", null, {
    params: { mac, state },
  });
  return res.data as {
    message?: string;
    mac?: string;
    ip?: string;
    state?: string;
  };
}

export async function getSmartDeviceStatusByMac(mac: string) {
  const res = await http.get("/device/status/mac", { params: { mac } });
  return res.data as {
    mac: string;
    ip?: string;
    alias?: string;
    state?: string;
  };
}

/** Control by alias (handy if you trust aliases) */
export async function setSmartDeviceStatusByAlias(
  alias: string,
  state: "on" | "off"
) {
  const res = await http.post("/device/status/alias", null, {
    params: { alias, state },
  });
  return res.data as {
    message?: string;
    mac?: string;
    ip?: string;
    state?: string;
    alias?: string;
  };
}

export async function getSmartDeviceStatusByAlias(alias: string) {
  const res = await http.get("/device/status/alias", { params: { alias } });
  return res.data as {
    mac?: string;
    ip?: string;
    alias?: string;
    state?: string;
  };
}

/* ===========================
   Automations CRUD & Control
=========================== */

export async function fetchAutomations(
  params: { enabled?: boolean; q?: string } = {}
) {
  const query: Record<string, string> = {};
  if (params.enabled !== undefined) query.enabled = String(params.enabled);
  if (params.q) query.q = params.q;

  const res = await http.get("/automations", { params: query });
  return (res.data as Automation[]) ?? [];
}

export async function getAutomation(id: number) {
  const res = await http.get(`/automations/${id}`);
  return res.data as Automation;
}

export async function createAutomation(data: {
  deviceAlias: string;
  macAddress?: string;
  deviceIp?: string;
  adapter?: string; // default: "tplink"
  enabled?: boolean;
  onDurationMs: number;
  minIntervalMs: number;
  activeGraceMs: number;
  maxOnMs: number | null;
  requireActivePlayers: boolean;
  notes?: string;
}) {
  const res = await http.post("/automations", data);
  return res.data as Automation;
}

export async function updateAutomation(id: number, data: Partial<Automation>) {
  const res = await http.put(`/automations/${id}`, data);
  return res.data as Automation;
}

export async function deleteAutomation(id: number) {
  const res = await http.delete(`/automations/${id}`);
  return res.data as { ok?: boolean } | undefined;
}

export async function enableAutomation(id: number) {
  const res = await http.post(`/automations/${id}/enable`);
  return res.data as { ok?: boolean } | Automation;
}

export async function disableAutomation(id: number) {
  const res = await http.post(`/automations/${id}/disable`);
  return res.data as { ok?: boolean } | Automation;
}

export async function bindAutomationFromDiscovery(id: number) {
  const res = await http.post(`/automations/${id}/bind`);
  return res.data as {
    ok: boolean;
    automation: Automation;
    discovered?: SmartDevice[];
  };
}

export async function resolveAutomationTarget(id: number) {
  const res = await http.get(`/automations/${id}/resolve`);
  return res.data as ResolveTargetResult;
}

export async function getAutomationLogs(
  id: number,
  opts: { limit?: number } = {}
) {
  const res = await http.get(`/automations/${id}/logs`, {
    params: { limit: opts.limit ?? 200 },
  });
  return (res.data as AutomationLog[]) ?? [];
}

/** Momentary on; turns off after onMs if supported by backend */
export async function pulseAutomation(id: number, onMs?: number) {
  const res = await http.post(`/automations/${id}/pulse`, null, {
    params: onMs != null ? { onMs } : {},
  });
  return res.data as { ok?: boolean };
}

/** Force ON immediately; optionally auto-off after autoOffMs */
export async function forceOnAutomation(id: number, autoOffMs?: number) {
  const res = await http.post(`/automations/${id}/force-on`, null, {
    params: autoOffMs != null ? { autoOffMs } : {},
  });
  return res.data as { ok?: boolean };
}

/** Force OFF immediately */
export async function forceOffAutomation(id: number) {
  const res = await http.post(`/automations/${id}/force-off`);
  return res.data as { ok?: boolean };
}

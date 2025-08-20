// src/pages/smart-devices.js
import React, { useEffect, useMemo, useState } from "react";
import {
  // Devices / discovery
  fetchSmartDevices,
  refreshDiscovery,
  setSmartDeviceStatus,
  setSmartDeviceStatusByMac,
  setSmartDeviceStatusByAlias,
  getSmartDeviceStatusByMac,
  getSmartDeviceStatusByAlias,
  getSmartDeviceStatus,
  // Automations CRUD/control
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
} from "../services/api";
import { withAuth } from "../../utils/withAuth";

export const getServerSideProps = withAuth()(async () => {
  return { props: {} };
});

// ---- helpers ----
const toMs = (val, unit) => {
  if (val === "" || val == null) return null;
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  return unit === "sec" ? n * 1000 : n * 60 * 1000;
};
const fromMs = (ms) => {
  if (ms == null) return { value: "", unit: "min" };
  if (ms % 60000 === 0) return { value: ms / 60000, unit: "min" };
  if (ms % 1000 === 0) return { value: ms / 1000, unit: "sec" };
  return { value: Math.round(ms / 1000), unit: "sec" };
};

// unique key we already use for <tr key=...>
const deviceKey = (d) => d.mac || d.ip || d.alias;

// poll fetchSmartDevices until predicate true or timeout
const pollUntil = async (fn, { intervalMs = 400, timeoutMs = 3000 } = {}) => {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await fn();
    if (result) return true;
    if (Date.now() - start >= timeoutMs) return false;
    await new Promise(r => setTimeout(r, intervalMs));
  }
};

const pageSize = 10;

const SmartDevices = () => {
  const [activeTab, setActiveTab] = useState("devices"); // 'devices' | 'automations'

  // -------- DEVICES / DISCOVERY --------
  const [devices, setDevices] = useState([]);
  const [devSearch, setDevSearch] = useState("");
  const [devPage, setDevPage] = useState(1);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // create automation modal (from device)
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [newAuto, setNewAuto] = useState({
    deviceAlias: "",
    deviceIp: "",
    macAddress: "",
    adapter: "tplink",
    enabled: true,
    // human inputs
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
  const [lastCreated, setLastCreated] = useState(null); // {id, alias}

  // -------- AUTOMATIONS --------
  const [automations, setAutomations] = useState([]);
  const [autoSearch, setAutoSearch] = useState("");
  const [loadingAutos, setLoadingAutos] = useState(true);

  // edit automation modal
  const [editAuto, setEditAuto] = useState(null); // row being edited
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const [busyMap, setBusyMap] = useState({}); // key -> true/false

// Fetch status for exactly one device.
// MAC/alias routes auto-refresh cache server-side; IP route does not, so we
// trigger /devices/refresh once on a 404 and retry.
const fetchSingleStatus = async (device) => {
  const tryOnce = async () => {
    if (device.mac) return await getSmartDeviceStatusByMac(device.mac);
    if (device.alias) return await getSmartDeviceStatusByAlias(device.alias);
    if (device.ip) return await getSmartDeviceStatus(device.ip);
    throw new Error("No identifier to refresh device");
  };

  try {
    return await tryOnce();
  } catch (e) {
    const code = e?.response?.status;
    // For MAC/alias a 404 means not in cache -> /devices/refresh then retry.
    // For IP, the /smartDevices/get path won’t do discovery, so we also refresh.
    if (code === 404) {
      try { await refreshDiscovery(); } catch {}
      return await tryOnce();
    }
    throw e;
  }
};

// Update only that one row in state from a status payload
const applySingleStatusToState = (setDevices, key, payload, fallbackAlias) => {
  if (!payload) return;
  const nextState = (payload.state || "").toLowerCase();
  const nextIp = payload.ip;
  const nextMac = payload.mac;        // colonized (MAC routes)
  const nextAlias = payload.alias;    // alias route

  setDevices(prev => prev.map(d => {
    if (deviceKey(d) !== key) return d;
    return {
      ...d,
      ip: nextIp || d.ip,
      alias: nextAlias || d.alias || fallbackAlias || "",
      mac: nextMac || d.mac,
      powerState: nextState || d.powerState,
    };
  }));
};


  // ===== DEVICES =====
  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const data = await fetchSmartDevices();
      const controllable = (data || []).filter((d) => !!d?.mac);
      setDevices(controllable);
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

  const totalDevPages = Math.max(
    1,
    Math.ceil(filteredDevices.length / pageSize)
  );
  const pageDevices = useMemo(
    () => filteredDevices.slice((devPage - 1) * pageSize, devPage * pageSize),
    [filteredDevices, devPage]
  );

const toggleDevice = async (device, desired) => {
  const key = deviceKey(device);

  // optimistic UI
  setDevices(prev =>
    prev.map(d => deviceKey(d) === key ? { ...d, powerState: desired } : d)
  );
  setBusyMap(m => ({ ...m, [key]: true }));

  try {
    // send the command
    if (device.mac) {
      await setSmartDeviceStatusByMac(device.mac, desired);
    } else if (device.alias) {
      await setSmartDeviceStatusByAlias(device.alias, desired);
    } else if (device.ip) {
      await setSmartDeviceStatus(device.ip, desired);
    } else {
      throw new Error("No identifier (MAC/Alias/IP) to control this device");
    }

    // poll only this device’s status until it matches, doing a 1-off discovery if needed
    await pollUntil(async () => {
      const status = await fetchSingleStatus(device);
      if (status) {
        applySingleStatusToState(setDevices, key, status, device.alias);
        return (status.state || "").toLowerCase() === desired;
      }
      return false;
    });
  } catch (e) {
    // undo optimistic update by fetching this single device once
    try {
      const status = await fetchSingleStatus(device);
      applySingleStatusToState(setDevices, key, status, device.alias);
    } catch {
      // if that fails, just no-op; row will correct on next manual refresh
    }
    alert(`Failed to turn ${desired} for ${device.alias || device.ip || device.mac}`);
  } finally {
    setBusyMap(m => ({ ...m, [key]: false }));
  }
};



  const openCreateAutomationModal = (device) => {
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

  const handleNewAutoChange = (e) => {
    const { name, type, value, checked } = e.target;
    setNewAuto((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitCreateAutomation = async (e) => {
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
      // If user is switching to automations next, refresh:
      await loadAutomations();
      alert(`Automation #${row.id} created for "${row.deviceAlias}"`);
    } catch (err) {
      console.error(err);
      alert("Failed to create automation");
    }
  };

  // ===== AUTOMATIONS =====
  const loadAutomations = async () => {
    setLoadingAutos(true);
    try {
      const data = await fetchAutomations({ q: autoSearch });
      setAutomations(data || []);
    } finally {
      setLoadingAutos(false);
    }
  };

  useEffect(() => {
    if (activeTab === "automations") loadAutomations();
  }, [activeTab]);

  const searchAutomations = async (e) => {
    e?.preventDefault?.();
    await loadAutomations();
  };

  const clickEnable = async (row) => {
    await enableAutomation(row.id);
    await loadAutomations();
  };
  const clickDisable = async (row) => {
    await disableAutomation(row.id);
    await loadAutomations();
  };
  const clickPulse = async (row) => {
    await pulseAutomation(row.id, 10000);
  };
  const clickForceOn = async (row) => {
    await forceOnAutomation(row.id, 15000);
  };
  const clickForceOff = async (row) => {
    await forceOffAutomation(row.id);
  };
  const clickBind = async (row) => {
    await bindAutomationFromDiscovery(row.id);
    await loadAutomations();
  };
  const clickDelete = async (row) => {
    if (!confirm(`Delete automation #${row.id} (${row.deviceAlias})?`)) return;
    await deleteAutomation(row.id);
    await loadAutomations();
  };

  // --- Edit modal ---
  const openEditAutomation = (row) => {
    const onDur = fromMs(row.onDurationMs);
    const minInt = fromMs(row.minIntervalMs);
    const actG = fromMs(row.activeGraceMs);
    const maxOn = fromMs(row.maxOnMs);

    setEditForm({
      id: row.id,
      deviceAlias: row.deviceAlias || "",
      macAddress: row.macAddress || "",
      deviceIp: row.deviceIp || "",
      adapter: row.adapter || "tplink",
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

  const handleEditChange = (e) => {
    const { name, type, value, checked } = e.target;
    setEditForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitEditAutomation = async (e) => {
    e.preventDefault();
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

  return (
    <div
      className="container-fluid bg-white py-4"
      style={{ minHeight: "100vh" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Smart Devices & Automations</h2>
        <div className="btn-group" role="group">
          <button
            className={`btn ${
              activeTab === "devices" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setActiveTab("devices")}
          >
            Devices
          </button>
          <button
            className={`btn ${
              activeTab === "automations"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() => setActiveTab("automations")}
          >
            Automations
          </button>
        </div>
      </div>

      {/* ======= DEVICES TAB ======= */}
      {activeTab === "devices" && (
        <>
          {lastCreated?.id && (
            <div className="alert alert-info d-flex align-items-center justify-content-between">
              <div>
                Created automation <strong>#{lastCreated.id}</strong>
                {lastCreated.alias ? (
                  <>
                    {" "}
                    for <strong>{lastCreated.alias}</strong>
                  </>
                ) : null}
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => pulseAutomation(lastCreated.id, 10000)}
                >
                  Pulse 10s
                </button>
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={() => forceOnAutomation(lastCreated.id, 15000)}
                >
                  Force ON (15s)
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => forceOffAutomation(lastCreated.id)}
                >
                  Force OFF
                </button>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center mb-3">
            <input
              className="form-control"
              style={{ maxWidth: 320 }}
              placeholder="Search devices..."
              value={devSearch}
              onChange={(e) => {
                setDevSearch(e.target.value);
                setDevPage(1);
              }}
            />
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={doRefreshDiscovery}
              >
                Refresh Discovery
              </button>
              <button className="btn btn-primary" onClick={loadDevices}>
                Reload List
              </button>
            </div>
          </div>

          {loadingDevices ? (
            <div className="text-center my-5">
              <div
                className="spinner-border text-primary"
                style={{ width: "3rem", height: "3rem" }}
              />
            </div>
          ) : (
            <>
              <table className="table table-striped table-hover align-middle table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Alias</th>
                    <th>IP</th>
                    <th>MAC</th>
                    <th>Model</th>
                    <th>Status</th>
                    <th style={{ width: 360 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageDevices.map((d) => (
                    <tr key={d.mac || d.ip || d.alias}>
                      <td>{d.alias || "—"}</td>
                      <td>{d.ip || "—"}</td>
                      <td>{d.mac || "—"}</td>
                      <td>{d.model || "—"}</td>
                      <td>{d.powerState || "Unknown"}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <button
                              className="btn btn-sm btn-success"
                              disabled={!!busyMap[deviceKey(d)]}
                              onClick={() => toggleDevice(d, "on")}
                            >
                              ON
                            </button>
                            <button
                              className="btn btn-sm btn-warning"
                              disabled={!!busyMap[deviceKey(d)]}
                              onClick={() => toggleDevice(d, "off")}
                            >
                              OFF
                            </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openCreateAutomationModal(d)}
                          >
                            Create Automation
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageDevices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        No devices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* pagination */}
              <nav className="mt-3 d-flex justify-content-center">
                <ul className="pagination">
                  <li
                    className={`page-item ${devPage === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setDevPage((p) => Math.max(1, p - 1))}
                    >
                      &laquo;
                    </button>
                  </li>
                  {Array.from({ length: totalDevPages }, (_, i) => i + 1)
                    .slice(0, 8)
                    .map((p) => (
                      <li
                        key={p}
                        className={`page-item ${p === devPage ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setDevPage(p)}
                        >
                          {p}
                        </button>
                      </li>
                    ))}
                  <li
                    className={`page-item ${
                      devPage === totalDevPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        setDevPage((p) => Math.min(totalDevPages, p + 1))
                      }
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </>
          )}
        </>
      )}

      {/* ======= AUTOMATIONS TAB ======= */}
      {activeTab === "automations" && (
        <>
          <form className="d-flex gap-2 mb-3" onSubmit={searchAutomations}>
            <input
              className="form-control"
              style={{ maxWidth: 360 }}
              placeholder="Search by alias, MAC, notes…"
              value={autoSearch}
              onChange={(e) => setAutoSearch(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={async () => {
                setAutoSearch("");
                await loadAutomations();
              }}
            >
              Reset
            </button>
          </form>

          {loadingAutos ? (
            <div className="text-center my-5">
              <div
                className="spinner-border text-primary"
                style={{ width: "3rem", height: "3rem" }}
              />
            </div>
          ) : (
            <table className="table table-striped table-hover align-middle table-bordered">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Alias</th>
                  <th>MAC</th>
                  <th>Adapter</th>
                  <th>Enabled</th>
                  <th>Notes</th>
                  <th style={{ width: 520 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {automations.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.deviceAlias}</td>
                    <td>{a.macAddress || "—"}</td>
                    <td>{a.adapter}</td>
                    <td>
                      {a.enabled ? (
                        <span className="badge text-bg-success">Enabled</span>
                      ) : (
                        <span className="badge text-bg-secondary">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td>{a.notes || "—"}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {a.enabled ? (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => clickDisable(a)}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => clickEnable(a)}
                          >
                            Enable
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => clickPulse(a)}
                        >
                          Pulse 10s
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => clickForceOn(a)}
                        >
                          Force ON (15s)
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => clickForceOff(a)}
                        >
                          Force OFF
                        </button>
                        <button
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => clickBind(a)}
                        >
                          Bind from Discovery
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openEditAutomation(a)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => clickDelete(a)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {automations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No automations
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ===== Create Automation modal (from device) ===== */}
      {isAutoModalOpen && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Automation</h5>
                <button
                  className="btn-close"
                  onClick={() => setIsAutoModalOpen(false)}
                />
              </div>
              <form onSubmit={submitCreateAutomation}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Alias</label>
                      <input
                        name="deviceAlias"
                        className="form-control"
                        value={newAuto.deviceAlias}
                        onChange={handleNewAutoChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">MAC</label>
                      <input
                        name="macAddress"
                        className="form-control"
                        value={newAuto.macAddress}
                        onChange={handleNewAutoChange}
                        placeholder="AA:BB:CC:DD:EE:FF"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Adapter</label>
                      <select
                        name="adapter"
                        className="form-select"
                        value={newAuto.adapter}
                        onChange={handleNewAutoChange}
                      >
                        <option value="tplink">TP-Link</option>
                      </select>
                    </div>

                    <div className="col-md-6 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          id="newAutoEnabled"
                          className="form-check-input"
                          type="checkbox"
                          name="enabled"
                          checked={!!newAuto.enabled}
                          onChange={handleNewAutoChange}
                        />
                        <label
                          htmlFor="newAutoEnabled"
                          className="form-check-label ms-1"
                        >
                          Enabled
                        </label>
                      </div>
                    </div>

                    {/* On Duration */}
                    <div className="col-md-6">
                      <label className="form-label">On Duration</label>
                      <div className="input-group">
                        <input
                          name="onDurationValue"
                          type="number"
                          min="0"
                          className="form-control"
                          value={newAuto.onDurationValue}
                          onChange={handleNewAutoChange}
                        />
                        <select
                          name="onDurationUnit"
                          className="form-select"
                          value={newAuto.onDurationUnit}
                          onChange={handleNewAutoChange}
                        >
                          <option value="min">min</option>
                          <option value="sec">sec</option>
                        </select>
                      </div>
                    </div>

                    {/* Min Interval */}
                    <div className="col-md-6">
                      <label className="form-label">Min Interval</label>
                      <div className="input-group">
                        <input
                          name="minIntervalValue"
                          type="number"
                          min="0"
                          className="form-control"
                          value={newAuto.minIntervalValue}
                          onChange={handleNewAutoChange}
                        />
                        <select
                          name="minIntervalUnit"
                          className="form-select"
                          value={newAuto.minIntervalUnit}
                          onChange={handleNewAutoChange}
                        >
                          <option value="min">min</option>
                          <option value="sec">sec</option>
                        </select>
                      </div>
                    </div>

                    {/* Active Grace */}
                    <div className="col-md-6">
                      <label className="form-label">Active Grace</label>
                      <div className="input-group">
                        <input
                          name="activeGraceValue"
                          type="number"
                          min="0"
                          className="form-control"
                          value={newAuto.activeGraceValue}
                          onChange={handleNewAutoChange}
                        />
                        <select
                          name="activeGraceUnit"
                          className="form-select"
                          value={newAuto.activeGraceUnit}
                          onChange={handleNewAutoChange}
                        >
                          <option value="min">min</option>
                          <option value="sec">sec</option>
                        </select>
                      </div>
                    </div>

                    {/* Max On (optional) */}
                    <div className="col-md-6">
                      <label className="form-label">Max On (optional)</label>
                      <div className="input-group">
                        <input
                          name="maxOnValue"
                          type="number"
                          min="0"
                          className="form-control"
                          value={newAuto.maxOnValue}
                          onChange={handleNewAutoChange}
                          placeholder=""
                        />
                        <select
                          name="maxOnUnit"
                          className="form-select"
                          value={newAuto.maxOnUnit}
                          onChange={handleNewAutoChange}
                        >
                          <option value="min">min</option>
                          <option value="sec">sec</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          id="newAutoRequirePlayers"
                          className="form-check-input"
                          type="checkbox"
                          name="requireActivePlayers"
                          checked={!!newAuto.requireActivePlayers}
                          onChange={handleNewAutoChange}
                        />
                        <label
                          htmlFor="newAutoRequirePlayers"
                          className="form-check-label ms-1"
                        >
                          Require Active Players
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <input
                        name="notes"
                        className="form-control"
                        value={newAuto.notes}
                        onChange={handleNewAutoChange}
                        placeholder="optional notes"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setIsAutoModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" type="submit">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit Automation modal ===== */}
      {isEditModalOpen && editForm && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Automation #{editForm.id}</h5>
                <button
                  className="btn-close"
                  onClick={() => setIsEditModalOpen(false)}
                />
              </div>
              <form onSubmit={submitEditAutomation}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Alias</label>
                      <input
                        name="deviceAlias"
                        className="form-control"
                        value={editForm.deviceAlias}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">MAC</label>
                      <input
                        name="macAddress"
                        className="form-control"
                        value={editForm.macAddress}
                        onChange={handleEditChange}
                        placeholder="AA:BB:CC:DD:EE:FF"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Adapter</label>
                      <select
                        name="adapter"
                        className="form-select"
                        value={editForm.adapter}
                        onChange={handleEditChange}
                      >
                        <option value="tplink">TP-Link</option>
                      </select>
                    </div>

                    <div className="col-md-6 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          id="editEnabled"
                          className="form-check-input"
                          type="checkbox"
                          name="enabled"
                          checked={!!editForm.enabled}
                          onChange={handleEditChange}
                        />
                        <label
                          htmlFor="editEnabled"
                          className="form-check-label ms-1"
                        >
                          Enabled
                        </label>
                      </div>
                    </div>

                    {/* On Duration */}
                    <div className="col-md-6">
                      <label className="form-label">On Duration</label>
                      <div className="input-group">
                        <input
                          name="onDurationValue"
                          type="number"
                          min="0"
                          className="form-control"
                          value={editForm.onDurationValue}
                          onChange={handleEditChange}
                        />
                        <select
                          name="onDurationUnit"
                          className="form-select"
                          value={editForm.onDurationUnit}
                          onChange={handleEditChange}
                        >
                          <option value="min">min</option>
                          <option value="sec">sec</option>
                        </select>
                      </div>
                    </div>

                    {/* Min Interval */}
                    <div className="col-md-6">
                      <label className="form-label">Min Interval</label>
                      <div className="input-group">
                        <input
                          name="minIntervalValue"
                          type="number"
                          min="0"
                          className="form-control"
                          value={editForm.minIntervalValue}
                          onChange={handleEditChange}
                        />
                        <select
                          name="minIntervalUnit"
                          className="form-select"
                          value={editForm.minIntervalUnit}
                          onChange={handleEditChange}
                        >
                          <option value="min">min</option>
                          <option value="sec">sec</option>
                        </select>
                      </div>
                    </div>

                    {/* Active Grace */}
                    <div className="col-md-6">
                      <label className="form-label">Active Grace</label>
                      <div className="input-group">
                        <input
                          name="activeGraceValue"
                          type="number"
                          min="0"
                          className="form-control"
                          value={editForm.activeGraceValue}
                          onChange={handleEditChange}
                        />
                        <select
                          name="activeGraceUnit"
                          className="form-select"
                          value={editForm.activeGraceUnit}
                          onChange={handleEditChange}
                        >
                          <option value="min">min</option>
                          <option value="sec">sec</option>
                        </select>
                      </div>
                    </div>

                    {/* Max On (optional) */}
                    <div className="col-md-6">
                      <label className="form-label">Max On (optional)</label>
                      <div className="input-group">
                        <input
                          name="maxOnValue"
                          type="number"
                          min="0"
                          className="form-control"
                          value={editForm.maxOnValue}
                          onChange={handleEditChange}
                        />
                        <select
                          name="maxOnUnit"
                          className="form-select"
                          value={editForm.maxOnUnit}
                          onChange={handleEditChange}
                        >
                          <option value="min">min</option>
                          <option value="sec">sec</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6 d-flex align-items-end">
                      <div className="form-check">
                        <input
                          id="editRequirePlayers"
                          className="form-check-input"
                          type="checkbox"
                          name="requireActivePlayers"
                          checked={!!editForm.requireActivePlayers}
                          onChange={handleEditChange}
                        />
                        <label
                          htmlFor="editRequirePlayers"
                          className="form-check-label ms-1"
                        >
                          Require Active Players
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <input
                        name="notes"
                        className="form-control"
                        value={editForm.notes}
                        onChange={handleEditChange}
                        placeholder="optional notes"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" type="submit">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDevices;

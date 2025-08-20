// controllers/smartDevicesController.js
const { Client } = require("tplink-smarthome-api");
const client = new Client();

const registry = require("../services/deviceRegistry");
const {
  discoverDevicesInternal,
  normalizeMac,
} = require("../services/tplinkDiscovery");

// ---------- helpers ----------
/** Resolve IP by priority: MAC -> alias -> provided ip */
const resolveIp = async ({ mac, alias, ip }) => {
  if (mac) {
    const d = await registry.getByMac(mac);
    if (d?.ip) return d.ip;
  }
  if (alias) {
    const d = await registry.getByAlias(alias);
    if (d?.ip) return d.ip;
  }
  return ip || null;
};

// ---------- low-level control by IP ----------
const setDevicePowerInternal = async (ip, state) => {
  const device = await client.getDevice({ host: ip });
  await device.setPowerState(state === "on");
};

// ---------- control by MAC / alias ----------
const setDevicePowerByMacInternal = async (mac, state) => {
  const host = await resolveIp({ mac });
  if (!host) throw new Error(`Device not found for MAC ${mac}`);
  const device = await client.getDevice({ host });
  await device.setPowerState(state === "on");
  return host;
};

const getDevicePowerByMacInternal = async (mac) => {
  const host = await resolveIp({ mac });
  if (!host) throw new Error(`Device not found for MAC ${mac}`);
  const device = await client.getDevice({ host });
  const on = await device.getPowerState();
  return { ip: host, state: on ? "on" : "off" };
};

const setDevicePowerByAliasInternal = async (alias, state) => {
  const host = await resolveIp({ alias });
  if (!host) throw new Error(`Device not found for alias ${alias}`);
  const device = await client.getDevice({ host });
  await device.setPowerState(state === "on");
  return host;
};

const getDevicePowerByAliasInternal = async (alias) => {
  const host = await resolveIp({ alias });
  if (!host) throw new Error(`Device not found for alias ${alias}`);
  const device = await client.getDevice({ host });
  const on = await device.getPowerState();
  return { ip: host, state: on ? "on" : "off" };
};

// ---------- HTTP handlers ----------
module.exports = {
  // List discovered devices (no DB writes)
  findAll: async (req, res) => {
    try {
      const devices = await discoverDevicesInternal();
      res.status(200).json(devices);
    } catch (err) {
      res
        .status(500)
        .send({ message: "Error discovering devices", error: err.message });
    }
  },

  // Refresh the in-memory discovery cache (used by engine and endpoints)
  refreshDiscovery: async (req, res) => {
    try {
      const list = await registry.refresh();
      res.status(200).json({ refreshed: true, count: list.length });
    } catch (err) {
      res
        .status(500)
        .send({ message: "Failed to refresh discovery", error: err.message });
    }
  },

  // ---- IP-based (existing) ----
  setStatus: async (req, res) => {
    try {
      const { ip, state } = req.query;
      if (!ip || !["on", "off"].includes(state)) {
        return res
          .status(400)
          .send({ message: "Missing or invalid query parameters: ip, state" });
      }
      await setDevicePowerInternal(ip, state);
      res.status(200).send({ message: `Device ${ip} turned ${state}` });
    } catch (err) {
      res
        .status(500)
        .send({ message: "Failed to control device", error: err.message });
    }
  },

  getStatus: async (req, res) => {
    try {
      const { ip } = req.query;
      if (!ip)
        return res.status(400).send({ message: "Missing query parameter: ip" });
      const device = await client.getDevice({ host: ip });
      const powerState = await device.getPowerState();
      res.status(200).send({ ip, state: powerState ? "on" : "off" });
    } catch (err) {
      res
        .status(500)
        .send({ message: "Failed to get device status", error: err.message });
    }
  },

  // ---- MAC-based ----
  setStatusByMac: async (req, res) => {
    try {
      const { mac, state } = req.query;
      if (!mac || !["on", "off"].includes(state)) {
        return res
          .status(400)
          .send({ message: "Missing or invalid query parameters: mac, state" });
      }
      const normalized = normalizeMac(mac);
      const ip = await setDevicePowerByMacInternal(normalized, state);
      res
        .status(200)
        .send({ message: `Device ${normalized} (${ip}) turned ${state}` });
    } catch (err) {
      res
        .status(500)
        .send({
          message: "Failed to control device by MAC",
          error: err.message,
        });
    }
  },

  getStatusByMac: async (req, res) => {
    try {
      const { mac } = req.query;
      if (!mac)
        return res
          .status(400)
          .send({ message: "Missing query parameter: mac" });
      const normalized = normalizeMac(mac);
      const { ip, state } = await getDevicePowerByMacInternal(normalized);
      res.status(200).send({ mac: normalized, ip, state });
    } catch (err) {
      res
        .status(500)
        .send({
          message: "Failed to get device status by MAC",
          error: err.message,
        });
    }
  },

  // ---- Alias-based ----
  setStatusByAlias: async (req, res) => {
    try {
      const { alias, state } = req.query;
      if (!alias || !["on", "off"].includes(state)) {
        return res
          .status(400)
          .send({
            message: "Missing or invalid query parameters: alias, state",
          });
      }
      const ip = await setDevicePowerByAliasInternal(alias, state);
      res
        .status(200)
        .send({ message: `Device '${alias}' (${ip}) turned ${state}` });
    } catch (err) {
      res
        .status(500)
        .send({
          message: "Failed to control device by alias",
          error: err.message,
        });
    }
  },

  getStatusByAlias: async (req, res) => {
    try {
      const { alias } = req.query;
      if (!alias)
        return res
          .status(400)
          .send({ message: "Missing query parameter: alias" });
      const { ip, state } = await getDevicePowerByAliasInternal(alias);
      res.status(200).send({ alias, ip, state });
    } catch (err) {
      res
        .status(500)
        .send({
          message: "Failed to get device status by alias",
          error: err.message,
        });
    }
  },

  // ---------- expose internals for other modules (e.g., engine) ----------
  discoverDevicesInternal,
  resolveIp,
  setDevicePowerInternal,
  setDevicePowerByMacInternal,
  getDevicePowerByMacInternal,
  setDevicePowerByAliasInternal,
  getDevicePowerByAliasInternal,
};

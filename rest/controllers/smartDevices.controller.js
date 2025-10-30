// controllers/smartDevices.controller.js
const dgram = require("dgram");
const os = require("os");
const { Client } = require("tplink-smarthome-api");
const client = new Client();

// ---------- env/config ----------
const DEFAULT_BIND_IP = process.env.BIND_IP || "0.0.0.0";
const DEFAULT_BROADCAST = process.env.BROADCAST_ADDR || "255.255.255.255";
const PORT = 9999; // TP-Link UDP port
const DISCOVERY_WINDOW_MS = Number(process.env.DISCOVERY_WINDOW_MS || 3000);

// ---------- NIC helpers ----------
function findInterfaceByIp(ip) {
  if (!ip || ip === "0.0.0.0") return null;
  const nics = os.networkInterfaces();
  for (const nicName of Object.keys(nics)) {
    for (const addr of nics[nicName] || []) {
      if (!addr.internal && addr.family === "IPv4" && addr.address === ip) {
        return addr;
      }
    }
  }
  return null;
}

function ipToInt(ip) {
  return ip.split(".").reduce((a, o) => (a << 8) + (o | 0), 0) >>> 0;
}
function intToIp(int) {
  return [24, 16, 8, 0].map((s) => (int >>> s) & 255).join(".");
}
function deriveBroadcastFrom(address, netmask) {
  try {
    const a = ipToInt(address);
    const m = ipToInt(netmask);
    const bcast = (a & m) | (~m >>> 0);
    return intToIp(bcast);
  } catch {
    return null;
  }
}
function chooseBindAndBroadcast() {
  let bindIp = DEFAULT_BIND_IP;
  let broadcast = DEFAULT_BROADCAST;

  const nic = findInterfaceByIp(bindIp);
  if (!nic && bindIp !== "0.0.0.0") bindIp = "0.0.0.0";
  if (nic?.address && nic?.netmask) {
    const subnetBroadcast = deriveBroadcastFrom(nic.address, nic.netmask);
    if (subnetBroadcast) broadcast = subnetBroadcast;
  }
  return { bindIp, broadcast };
}

// ---------- MAC helpers ----------
function macRaw(mac) {
  const raw = (mac || "").toUpperCase().replace(/[^0-9A-F]/g, "");
  return raw.length === 12 ? raw : null;
}
function macColon(mac) {
  const raw = macRaw(mac);
  return raw ? raw.match(/.{2}/g).join(":") : null;
}

// ---------- caches ----------
const byMac = new Map(); // RAW 12-char -> record
const byAlias = new Map(); // lowercased alias -> record
const byIp = new Map(); // ip -> record

function upsertCache(dev) {
  const raw = macRaw(dev.mac);
  const pretty = macColon(dev.mac);
  const rec = {
    ip: dev.ip || null,
    alias: dev.alias || null,
    mac: pretty || null, // pretty for UI
    _macRaw: raw || null, // internal key
    model: dev.model || null,
    powerState: dev.powerState || "Unknown",
    updatedAt: Date.now(),
  };
  if (raw) byMac.set(raw, rec);
  if (rec.alias) byAlias.set(rec.alias.toLowerCase(), rec);
  if (rec.ip) byIp.set(rec.ip, rec);
  return rec;
}

function listFromCache() {
  const unique = new Map();
  for (const [k, v] of byMac) unique.set(k, v);
  for (const [ip, v] of byIp) {
    if (v._macRaw) continue;
    unique.set(ip, v);
  }
  return Array.from(unique.values());
}

// ---------- TP-Link UDP crypto ----------
function encrypt(input) {
  let key = 171;
  const buf = Buffer.alloc(input.length);
  for (let i = 0; i < input.length; i++) {
    buf[i] = input.charCodeAt(i) ^ key;
    key = buf[i];
  }
  return buf;
}
function decrypt(buffer) {
  let key = 171;
  let out = "";
  for (let i = 0; i < buffer.length; i++) {
    const ch = buffer[i] ^ key;
    key = buffer[i];
    out += String.fromCharCode(ch);
  }
  return out;
}

// ---------- discovery ----------
async function discoverDevicesInternal() {
  const { bindIp, broadcast } = chooseBindAndBroadcast();
  const message = encrypt('{"system":{"get_sysinfo":{}}}');
  const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
  const seen = new Set();
  const discovered = [];

  return await new Promise((resolve) => {
    let finished = false;
    const end = (err) => {
      if (finished) return;
      finished = true;
      try {
        socket.close();
      } catch {}
      if (err) return resolve([]);
      resolve(discovered);
    };

    socket.once("error", (e) => end(e));

    socket.on("message", (msg, rinfo) => {
      const ip = rinfo.address;
      if (seen.has(ip)) return;
      seen.add(ip);
      try {
        const json = JSON.parse(decrypt(msg));
        const info = json?.system?.get_sysinfo;
        if (info) {
          const rec = upsertCache({
            ip,
            alias: info.alias,
            mac: info.mac || info.mic_mac,
            model: info.model || info.dev_name,
            powerState: info.relay_state === 1 ? "on" : "off",
          });
          discovered.push(rec);
        }
      } catch {
        /* ignore */
      }
    });

    socket.bind({ address: bindIp, port: 0, exclusive: false }, () => {
      try {
        socket.setBroadcast(true);
      } catch {}
      socket.send(message, 0, message.length, PORT, broadcast, (err) => {
        if (err) return end(err);
      });
    });

    setTimeout(() => end(), DISCOVERY_WINDOW_MS);
  });
}

// ---------- TCP control ----------
async function setDevicePowerInternal(ip, state) {
  const device = await client.getDevice({ host: ip });
  await device.setPowerState(state === "on");
}
async function getDevicePowerInternal(ip) {
  const device = await client.getDevice({ host: ip });
  const on = await device.getPowerState();
  return on ? "on" : "off";
}

// ---------- resolve via cache (+ refresh) ----------
async function resolveIpByMacOrRefresh(macInput) {
  const raw = macRaw(macInput);
  if (!raw) return null;
  const hit = byMac.get(raw);
  if (hit?.ip) return hit.ip;
  await discoverDevicesInternal();
  const hit2 = byMac.get(raw);
  return hit2?.ip || null;
}

async function resolveIpByAliasOrRefresh(aliasInput) {
  const key = (aliasInput || "").toLowerCase();
  const hit = byAlias.get(key);
  if (hit?.ip) return hit.ip;
  await discoverDevicesInternal();
  const hit2 = byAlias.get(key);
  return hit2?.ip || null;
}

// ---------- auth/scope helpers ----------
function isAdmin(req) {
  return req?.ctx?.role === "admin";
}

// Returns an array of {macAddress, deviceAlias} for automations visible to the caller.
// Non-admin -> restricted by their LocationID via (room OR locationVariant). Admin -> all.
async function listPermittedAutomationBindings(req) {
  const db = req.db;
  const { SmartDeviceAutomation, GameLocation, LocationVariant } = db;

  const include = [
    {
      model: GameLocation,
      as: "room",
      required: false,
      attributes: ["LocationID"],
    },
    {
      model: LocationVariant,
      as: "locationVariant",
      required: false,
      attributes: ["LocationID"],
    },
  ];

  const where = {};
  if (!isAdmin(req)) {
    const locId = req.ctx?.locationId;
    if (!locId) return []; // no scope -> no bindings
    where[db.Sequelize.Op.or] = [
      { "$room.LocationID$": String(locId) },
      { "$locationVariant.LocationID$": String(locId) },
    ];
  }

  const rows = await SmartDeviceAutomation.findAll({
    where,
    attributes: ["macAddress", "deviceAlias"],
    include,
  });

  // Normalize/clean
  const bindings = [];
  for (const r of rows) {
    if (r.macAddress)
      bindings.push({
        macAddress: r.macAddress.toUpperCase(),
        deviceAlias: null,
      });
    if (r.deviceAlias)
      bindings.push({ macAddress: null, deviceAlias: r.deviceAlias });
  }
  return bindings;
}

// Check that alias/mac is permitted for non-admins, using automation bindings
async function ensureAliasOrMacPermitted(req, { alias, mac }) {
  if (isAdmin(req)) return true;
  const bindings = await listPermittedAutomationBindings(req);
  const keyAlias = alias ? alias.toLowerCase() : null;
  const keyMacRaw = mac ? macRaw(mac) : null;

  return bindings.some((b) => {
    if (b.deviceAlias && keyAlias && b.deviceAlias.toLowerCase() === keyAlias)
      return true;
    if (b.macAddress && keyMacRaw && macRaw(b.macAddress) === keyMacRaw)
      return true;
    return false;
  });
}

// Filter discovered/cache list by permitted bindings for non-admins
async function filterDevicesByBindings(req, devices) {
  if (isAdmin(req)) return devices;
  const bindings = await listPermittedAutomationBindings(req);
  if (bindings.length === 0) return [];

  const aliasSet = new Set(
    bindings
      .filter((b) => b.deviceAlias)
      .map((b) => b.deviceAlias.toLowerCase())
  );
  const macSet = new Set(
    bindings
      .filter((b) => b.macAddress)
      .map((b) => macRaw(b.macAddress))
      .filter(Boolean)
  );

  return devices.filter((d) => {
    const byAlias = d.alias ? aliasSet.has(d.alias.toLowerCase()) : false;
    const byMac = d._macRaw ? macSet.has(d._macRaw) : false;
    return byAlias || byMac;
  });
}

// ---------- Controller ----------
module.exports = {
  // List devices from cache (refresh if empty).
  // Admin -> all. Non-admin -> only devices referenced by visible automations.
  findAll: async (req, res) => {
    try {
      let list = listFromCache();
      if (list.length === 0) {
        await discoverDevicesInternal();
        list = listFromCache();
      }
      const scoped = await filterDevicesByBindings(req, list);
      res.status(200).json(scoped);
    } catch (err) {
      res
        .status(500)
        .send({ message: "Error discovering devices", error: err.message });
    }
  },

  // Force refresh discovery.
  // Admin -> refresh & return all. Non-admin -> refresh & return scoped list.
  refreshDiscovery: async (req, res) => {
    try {
      await discoverDevicesInternal();
      const list = listFromCache();
      const scoped = await filterDevicesByBindings(req, list);
      res
        .status(200)
        .json({ refreshed: true, count: scoped.length, devices: scoped });
    } catch (err) {
      res
        .status(500)
        .send({ message: "Discovery refresh failed", error: err.message });
    }
  },

  // ---- IP-based (ADMIN ONLY) ----
  getStatus: async (req, res) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
      const { ip } = req.query;
      if (!ip) return res.status(400).send({ message: "Missing ip" });
      const state = await getDevicePowerInternal(ip);
      res.status(200).send({ ip, state });
    } catch (err) {
      res
        .status(500)
        .send({ message: "Failed to get device status", error: err.message });
    }
  },

  setStatus: async (req, res) => {
    try {
      if (!isAdmin(req)) return res.status(403).json({ error: "Admin only" });
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

  // ---- MAC-based (scoped to location via automations) ----
  getStatusByMac: async (req, res) => {
    try {
      const { mac } = req.query;
      if (!mac) return res.status(400).send({ message: "Missing mac" });

      const permitted = await ensureAliasOrMacPermitted(req, {
        mac,
        alias: null,
      });
      if (!permitted)
        return res.status(403).json({ error: "Forbidden for this location" });

      const ip = await resolveIpByMacOrRefresh(mac);
      if (!ip) {
        return res.status(404).send({
          message: "MAC not found in discovery cache",
          hint: "Call /devices/refresh then try again",
          mac: macColon(mac),
        });
      }
      const state = await getDevicePowerInternal(ip);
      res.status(200).send({ mac: macColon(mac), ip, state });
    } catch (err) {
      res
        .status(500)
        .send({
          message: "Failed to get device status by MAC",
          error: err.message,
        });
    }
  },

  setStatusByMac: async (req, res) => {
    try {
      const { mac, state } = req.query;
      if (!mac || !["on", "off"].includes(state)) {
        return res
          .status(400)
          .send({ message: "Missing or invalid query parameters: mac, state" });
      }

      const permitted = await ensureAliasOrMacPermitted(req, {
        mac,
        alias: null,
      });
      if (!permitted)
        return res.status(403).json({ error: "Forbidden for this location" });

      const ip = await resolveIpByMacOrRefresh(mac);
      if (!ip) {
        return res.status(404).send({
          message: "MAC not found in discovery cache",
          hint: "Call /devices/refresh then try again",
          mac: macColon(mac),
        });
      }
      await setDevicePowerInternal(ip, state);
      res
        .status(200)
        .send({ message: `Device ${macColon(mac)} (${ip}) turned ${state}` });
    } catch (err) {
      res
        .status(502)
        .send({
          message: "Failed to control device by MAC",
          error: err.message,
        });
    }
  },

  // ---- Alias-based (scoped to location via automations) ----
  getStatusByAlias: async (req, res) => {
    try {
      const { alias } = req.query;
      if (!alias) return res.status(400).send({ message: "Missing alias" });

      const permitted = await ensureAliasOrMacPermitted(req, {
        alias,
        mac: null,
      });
      if (!permitted)
        return res.status(403).json({ error: "Forbidden for this location" });

      const ip = await resolveIpByAliasOrRefresh(alias);
      if (!ip) {
        return res.status(404).send({
          message: "Alias not found in discovery cache",
          hint: "Call /devices/refresh then try again",
          alias,
        });
      }
      const state = await getDevicePowerInternal(ip);
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

      const permitted = await ensureAliasOrMacPermitted(req, {
        alias,
        mac: null,
      });
      if (!permitted)
        return res.status(403).json({ error: "Forbidden for this location" });

      const ip = await resolveIpByAliasOrRefresh(alias);
      if (!ip) {
        return res.status(404).send({
          message: "Alias not found in discovery cache",
          hint: "Call /devices/refresh then try again",
          alias,
        });
      }
      await setDevicePowerInternal(ip, state);
      res
        .status(200)
        .send({ message: `Device "${alias}" (${ip}) turned ${state}` });
    } catch (err) {
      res
        .status(502)
        .send({
          message: "Failed to control device by alias",
          error: err.message,
        });
    }
  },

  // expose internals for other controllers (e.g., automations)
  discoverDevicesInternal,
  setDevicePowerInternal,
};

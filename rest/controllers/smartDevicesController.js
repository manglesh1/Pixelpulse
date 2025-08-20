// controllers/smartDevices.js
const dgram = require('dgram');
const os = require('os');
const { Client } = require('tplink-smarthome-api');
const client = new Client();

// --- config (env overrideable) ---
const DEFAULT_BIND_IP = process.env.BIND_IP || '0.0.0.0';
const DEFAULT_BROADCAST = process.env.BROADCAST_ADDR || '255.255.255.255';
const PORT = 9999; // TP-Link devices listen here
const DISCOVERY_WINDOW_MS = Number(process.env.DISCOVERY_WINDOW_MS || 3000);

// --- util: host nic awareness ---
function findInterfaceByIp(ip) {
  if (!ip || ip === '0.0.0.0') return null;
  const nics = os.networkInterfaces();
  for (const nicName of Object.keys(nics)) {
    for (const addr of nics[nicName] || []) {
      if (!addr.internal && addr.family === 'IPv4' && addr.address === ip) {
        return addr; // { address, netmask, ... }
      }
    }
  }
  return null;
}

function ipToInt(ip) {
  return ip.split('.').reduce((a, o) => (a << 8) + (o | 0), 0) >>> 0;
}
function intToIp(int) {
  return [24,16,8,0].map(shift => (int >>> shift) & 255).join('.');
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
  if (!nic && bindIp !== '0.0.0.0') {
    console.warn(`[smartDevices] BIND_IP=${bindIp} not present on host; falling back to 0.0.0.0`);
    bindIp = '0.0.0.0';
  }

  // If we have a concrete NIC, prefer its subnet broadcast
  if (nic?.address && nic?.netmask) {
    const subnetBroadcast = deriveBroadcastFrom(nic.address, nic.netmask);
    if (subnetBroadcast) {
      broadcast = subnetBroadcast;
    }
  }

  return { bindIp, broadcast };
}

// --- MAC helpers (ONE canonical shape everywhere) ---
function macRaw(mac) {
  const raw = (mac || '').toUpperCase().replace(/[^0-9A-F]/g, '');
  return raw.length === 12 ? raw : null;
}
function macColon(mac) {
  const raw = macRaw(mac);
  return raw ? raw.match(/.{2}/g).join(':') : null;
}

// --- in-memory caches ---
const byMac = new Map();   // key: RAW 12-char MAC -> device record
const byAlias = new Map(); // key: alias lowercased -> device record
const byIp = new Map();    // key: ip -> device record

function upsertCache(dev) {
  // dev: { ip, alias, mac, model, powerState }
  const raw = macRaw(dev.mac);
  const pretty = macColon(dev.mac);
  const rec = {
    ip: dev.ip,
    alias: dev.alias || null,
    mac: pretty || null,        // nice-looking for UI
    _macRaw: raw || null,       // internal key
    model: dev.model || null,
    powerState: dev.powerState || 'Unknown',
    updatedAt: Date.now(),
  };
  if (raw) byMac.set(raw, rec);
  if (rec.alias) byAlias.set(rec.alias.toLowerCase(), rec);
  if (rec.ip) byIp.set(rec.ip, rec);
  return rec;
}

function listFromCache() {
  // prefer MAC-keyed records so we don’t duplicate by IP/alias
  const unique = new Map();
  for (const [k, v] of byMac) unique.set(k, v);
  // also include any IP-only entries not seen above
  for (const [ip, v] of byIp) {
    if (v._macRaw) continue;
    unique.set(ip, v);
  }
  return Array.from(unique.values());
}

// --- TP-Link crypto helpers for UDP discovery ---
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
  let out = '';
  for (let i = 0; i < buffer.length; i++) {
    const ch = buffer[i] ^ key;
    key = buffer[i];
    out += String.fromCharCode(ch);
  }
  return out;
}

// --- Discovery (UDP broadcast), updates caches, returns devices array ---
async function discoverDevicesInternal() {
  const { bindIp, broadcast } = chooseBindAndBroadcast();
  const message = encrypt('{"system":{"get_sysinfo":{}}}');
  const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  const seen = new Set();
  const discovered = [];

  return await new Promise((resolve) => {
    let finished = false;
    const end = (err) => {
      if (finished) return;
      finished = true;
      try { socket.close(); } catch {}
      if (err) {
        console.error('[tplink] discovery failed:', err.message);
        return resolve([]); // don’t crash callers
      }
      resolve(discovered);
    };

    socket.once('error', (e) => end(e));

    socket.on('message', (msg, rinfo) => {
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
            mac: info.mac || info.mic_mac,   // handle both keys
            model: info.model || info.dev_name,
            powerState: info.relay_state === 1 ? 'on' : 'off',
          });
          discovered.push(rec);
        }
      } catch {
        /* ignore malformed packet */
      }
    });

    // Bind to an ephemeral local port on the chosen interface (or 0.0.0.0)
    socket.bind({ address: bindIp, port: 0, exclusive: false }, () => {
      try { socket.setBroadcast(true); } catch {}
      socket.send(message, 0, message.length, PORT, broadcast, (err) => {
        if (err) return end(err);
      });
    });

    setTimeout(() => end(), DISCOVERY_WINDOW_MS);
  });
}

// --- TCP control via tplink-smarthome-api (IP-based) ---
async function setDevicePowerInternal(ip, state) {
  const device = await client.getDevice({ host: ip });
  await device.setPowerState(state === 'on');
}
async function getDevicePowerInternal(ip) {
  const device = await client.getDevice({ host: ip });
  const on = await device.getPowerState();
  return on ? 'on' : 'off';
}

// --- resolve helpers using cache, with auto-refresh fallback ---
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
  const key = (aliasInput || '').toLowerCase();
  const hit = byAlias.get(key);
  if (hit?.ip) return hit.ip;
  await discoverDevicesInternal();
  const hit2 = byAlias.get(key);
  return hit2?.ip || null;
}

// --- Controller ---
module.exports = {
  // List devices (from cache; if empty do a quick discovery)
  findAll: async (_req, res) => {
    try {
      let list = listFromCache();
      if (list.length === 0) {
        await discoverDevicesInternal();
        list = listFromCache();
      }
      res.status(200).json(list);
    } catch (err) {
      res
        .status(500)
        .send({ message: 'Error discovering devices', error: err.message });
    }
  },

  // Force refresh discovery
  refreshDiscovery: async (_req, res) => {
    try {
      const found = await discoverDevicesInternal();
      res.status(200).json({ refreshed: true, count: found.length });
    } catch (err) {
      res
        .status(500)
        .send({ message: 'Discovery refresh failed', error: err.message });
    }
  },

  // ---- IP-based (kept) ----
  getStatus: async (req, res) => {
    try {
      const { ip } = req.query;
      if (!ip) return res.status(400).send({ message: 'Missing ip' });
      const state = await getDevicePowerInternal(ip);
      res.status(200).send({ ip, state });
    } catch (err) {
      res
        .status(500)
        .send({ message: 'Failed to get device status', error: err.message });
    }
  },
  setStatus: async (req, res) => {
    try {
      const { ip, state } = req.query;
      if (!ip || !['on', 'off'].includes(state)) {
        return res
          .status(400)
          .send({ message: 'Missing or invalid query parameters: ip, state' });
      }
      await setDevicePowerInternal(ip, state);
      res.status(200).send({ message: `Device ${ip} turned ${state}` });
    } catch (err) {
      res
        .status(500)
        .send({ message: 'Failed to control device', error: err.message });
    }
  },

  // ---- MAC-based ----
  getStatusByMac: async (req, res) => {
    try {
      const { mac } = req.query;
      if (!mac) return res.status(400).send({ message: 'Missing mac' });
      const ip = await resolveIpByMacOrRefresh(mac);
      if (!ip) {
        return res.status(404).send({
          message: 'MAC not found in discovery cache',
          hint: 'Call /devices/refresh then try again',
          mac: macColon(mac),
        });
      }
      const state = await getDevicePowerInternal(ip);
      res.status(200).send({ mac: macColon(mac), ip, state });
    } catch (err) {
      res
        .status(500)
        .send({ message: 'Failed to get device status by MAC', error: err.message });
    }
  },

  setStatusByMac: async (req, res) => {
    try {
      const { mac, state } = req.query;
      if (!mac || !['on', 'off'].includes(state)) {
        return res
          .status(400)
          .send({ message: 'Missing or invalid query parameters: mac, state' });
      }
      const ip = await resolveIpByMacOrRefresh(mac);
      if (!ip) {
        return res.status(404).send({
          message: 'MAC not found in discovery cache',
          hint: 'Call /devices/refresh then try again',
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
        .send({ message: 'Failed to control device by MAC', error: err.message });
    }
  },

  // ---- Alias-based (nice to have) ----
  getStatusByAlias: async (req, res) => {
    try {
      const { alias } = req.query;
      if (!alias) return res.status(400).send({ message: 'Missing alias' });
      const ip = await resolveIpByAliasOrRefresh(alias);
      if (!ip) {
        return res.status(404).send({
          message: 'Alias not found in discovery cache',
          hint: 'Call /devices/refresh then try again',
          alias,
        });
      }
      const state = await getDevicePowerInternal(ip);
      res.status(200).send({ alias, ip, state });
    } catch (err) {
      res
        .status(500)
        .send({ message: 'Failed to get device status by alias', error: err.message });
    }
  },

  setStatusByAlias: async (req, res) => {
    try {
      const { alias, state } = req.query;
      if (!alias || !['on', 'off'].includes(state)) {
        return res
          .status(400)
          .send({ message: 'Missing or invalid query parameters: alias, state' });
      }
      const ip = await resolveIpByAliasOrRefresh(alias);
      if (!ip) {
        return res.status(404).send({
          message: 'Alias not found in discovery cache',
          hint: 'Call /devices/refresh then try again',
          alias,
        });
      }
      await setDevicePowerInternal(ip, state);
      res.status(200).send({ message: `Device "${alias}" (${ip}) turned ${state}` });
    } catch (err) {
      res
        .status(502)
        .send({ message: 'Failed to control device by alias', error: err.message });
    }
  },

  discoverDevicesInternal,
  setDevicePowerInternal,
};

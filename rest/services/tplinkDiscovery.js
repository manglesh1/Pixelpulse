// Lightweight TP-Link/Kasa UDP discovery (port 9999) with XOR cipher.
// Exports:
//   - discoverDevicesInternal(opts?): Promise<Array<{ ip, alias, mac, model, powerState, swVersion, hwVersion }>>
//
// Env overrides:
//   BIND_IP         = IP to bind the UDP socket to (optional; default OS-selected)
//   BROADCAST_ADDR  = broadcast address (default "255.255.255.255")
//   DISCOVERY_MS    = timeout in ms (default 4000)

const dgram = require("dgram");

// ---------- helpers ----------
const normalizeMac = (mac) =>
  (mac || "")
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "")
    .match(/.{1,2}/g)
    ?.join(":") || "";

const encrypt = (input) => {
  const key = 171;
  const buf = Buffer.alloc(input.length);
  let k = key;
  for (let i = 0; i < input.length; i++) {
    buf[i] = input.charCodeAt(i) ^ k;
    k = buf[i];
  }
  return buf;
};

const decrypt = (buffer) => {
  const key = 171;
  let result = "";
  let k = key;
  for (let i = 0; i < buffer.length; i++) {
    const ch = buffer[i] ^ k;
    k = buffer[i];
    result += String.fromCharCode(ch);
  }
  return result;
};

// Extracts a boolean "on/off" as "on"/"off" string from various Kasa responses
function extractPowerState(info) {
  // Switches: relay_state 0/1
  if (typeof info?.relay_state === "number") {
    return info.relay_state === 1 ? "on" : "off";
  }
  // Bulbs: light_state.on_off 0/1
  if (typeof info?.light_state?.on_off === "number") {
    return info.light_state.on_off === 1 ? "on" : "off";
  }
  // Some firmwares: sysinfo.on_time exists but no direct on/off -> unknown
  return "Unknown";
}

function extractAlias(info, ip) {
  return info?.alias || info?.dev_name || info?.description || `Device-${ip}`;
}

// ---------- main ----------
async function discoverDevicesInternal(opts = {}) {
  const PORT = 9999;
  const LOCAL_IP = process.env.BIND_IP || opts.bindIp || undefined;
  const BROADCAST_ADDR =
    process.env.BROADCAST_ADDR || opts.broadcast || "255.255.255.255";
  const TIMEOUT_MS = Number(process.env.DISCOVERY_MS || opts.timeoutMs || 4000);

  const message = encrypt('{"system":{"get_sysinfo":{}}}');
  const socket = dgram.createSocket("udp4");

  // Track by MAC primarily; fall back to IP if no MAC
  const byKey = new Map();

  return new Promise((resolve, reject) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      try {
        socket.close();
      } catch {}
      // return unique devices
      resolve(Array.from(byKey.values()));
    };

    socket.on("error", (err) => {
      // Don’t explode the app because discovery failed
      // Caller can decide what to do with an empty list
      try {
        socket.close();
      } catch {}
      reject(err);
    });

    socket.on("message", (msg, rinfo) => {
      try {
        const ip = rinfo.address;

        const raw = decrypt(msg);
        const json = JSON.parse(raw);
        const info = json?.system?.get_sysinfo;

        if (!info) return;

        const mac = normalizeMac(info.mac) || null;
        const alias = extractAlias(info, ip);
        const model = info.model || info.type || "";
        const swVersion = info.sw_ver || null;
        const hwVersion = info.hw_ver || null;
        const powerState = extractPowerState(info);

        const key = mac || ip;
        if (!byKey.has(key)) {
          byKey.set(key, {
            ip,
            alias,
            mac,
            model,
            swVersion,
            hwVersion,
            powerState,
          });
        } else {
          // If we already have an entry, prefer to keep the first (stable)
          // but update IP if MAC matches and IP changed (rare but possible).
          const cur = byKey.get(key);
          if (mac && cur.mac === mac && cur.ip !== ip) {
            cur.ip = ip;
            byKey.set(key, cur);
          }
        }
      } catch {
        // ignore malformed packets
      }
    });

    socket.bind(PORT, LOCAL_IP, () => {
      try {
        socket.setBroadcast(true);
      } catch {}
      socket.send(message, 0, message.length, PORT, BROADCAST_ADDR, (err) => {
        if (err) {
          try {
            socket.close();
          } catch {}
          return reject(err);
        }
      });
    });

    setTimeout(finish, TIMEOUT_MS);
  });
}

module.exports = {
  discoverDevicesInternal,
  normalizeMac,
};

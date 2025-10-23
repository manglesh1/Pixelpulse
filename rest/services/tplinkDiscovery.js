const dgram = require("dgram");

const normalizeMac = (mac) =>
  (mac || "")
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "")
    .match(/.{1,2}/g)
    ?.join(":") || "";

function encrypt(jsonStr) {
  const key = 171;
  const buf = Buffer.alloc(jsonStr.length);
  let k = key;
  for (let i = 0; i < jsonStr.length; i++) {
    buf[i] = jsonStr.charCodeAt(i) ^ k;
    k = buf[i];
  }
  return buf;
}
function decrypt(buffer) {
  const key = 171;
  let result = "", k = key;
  for (let i = 0; i < buffer.length; i++) {
    const ch = buffer[i] ^ k;
    k = buffer[i];
    result += String.fromCharCode(ch);
  }
  return result;
}

async function discoverDevicesInternal({
  timeoutMs = 2500,
  bindIp = process.env.BIND_IP,                 // optional
  broadcastAddr = process.env.BROADCAST_ADDR || "255.255.255.255",
} = {}) {
  const PORT = 9999; // TP-Link listens here
  const message = encrypt('{"system":{"get_sysinfo":{}}}');
  const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

  const foundIps = new Set();
  const devices = [];

  return new Promise((resolve) => {
    let done = false;
    const finish = (err) => {
      if (done) return;
      done = true;
      try { socket.close(); } catch {}
      if (err) {
        console.error("[tplinkDiscovery] discovery failed:", err.message);
        return resolve([]); // don’t crash callers
      }
      resolve(devices);
    };

    socket.once("error", (err) => finish(err));

    socket.on("message", (msg, rinfo) => {
      const ip = rinfo.address;
      if (foundIps.has(ip)) return;
      foundIps.add(ip);
      try {
        const response = JSON.parse(decrypt(msg));
        const info = response?.system?.get_sysinfo;
        if (info) {
          devices.push({
            ip,
            alias: info.alias || "",
            mac: normalizeMac(info.mac || info.mic_mac || ""),
            model: info.model || info.dev_name || "",
            powerState: info.relay_state === 1 ? "on" : "off",
          });
        }
      } catch {
        // ignore bad packets
      }
    });

    socket.bind(
      // bind ephemeral port; avoid 9999 to prevent EADDRINUSE
      { address: bindIp || "0.0.0.0", port: 0, exclusive: false },
      () => {
        try {
          socket.setBroadcast(true);
        } catch {}
        // send broadcast probe
        socket.send(message, 0, message.length, PORT, broadcastAddr, (err) => {
          if (err) return finish(err);
        });
      }
    );

    setTimeout(() => finish(), timeoutMs);
  });
}

module.exports = { discoverDevicesInternal, normalizeMac };

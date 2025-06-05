const dgram = require('dgram');
const { Client } = require('tplink-smarthome-api');
const client = new Client();

let cachedDevices = [];

const discoverDevicesInternal = async () => {
  const LOCAL_IP = '10.0.1.188';
  const PORT = 9999;
  const BROADCAST_ADDR = '255.255.255.255';

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
    let result = '';
    let k = key;
    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i] ^ k;
      k = buffer[i];
      result += String.fromCharCode(char);
    }
    return result;
  };

  const message = encrypt('{"system":{"get_sysinfo":{}}}');
  const socket = dgram.createSocket('udp4');
  const found = new Set();
  const devices = [];

  return new Promise((resolve, reject) => {
    socket.bind(PORT, LOCAL_IP, () => {
      socket.setBroadcast(true);
      socket.send(message, 0, message.length, PORT, BROADCAST_ADDR, (err) => {
        if (err) {
          socket.close();
          return reject(err);
        }
      });
    });

    socket.on('message', (msg, rinfo) => {
      const ip = rinfo.address;
      if (ip === LOCAL_IP) return;
      if (found.has(ip)) return;
      found.add(ip);

      try {
        const response = JSON.parse(decrypt(msg));
        const info = response?.system?.get_sysinfo;
        if (info) {
          devices.push({
            ip,
            alias: info.alias,
            mac: info.mac,
            model: info.model,
            powerState: info.relay_state === 1 ? 'on' : 'off',
          });
        }
      } catch (err) {
        // Ignore malformed packets
      }
    });

    setTimeout(() => {
      socket.close();
      resolve(devices);
    }, 3000);
  });
};

const setDevicePowerInternal = async (ip, state) => {
  const device = await client.getDevice({ host: ip });
  await device.setPowerState(state === 'on');
};

// Expose these internal methods
module.exports = {
  findAll: async (req, res) => {
    try {
      const devices = await discoverDevicesInternal();
      res.status(200).json(devices);
    } catch (err) {
      res.status(500).send({ message: 'Error discovering devices', error: err.message });
    }
  },
  setStatus: async (req, res) => {
    try {
      const { ip, state } = req.query;
      if (!ip || !['on', 'off'].includes(state)) {
        return res.status(400).send({ message: 'Missing or invalid query parameters: ip, state' });
      }
      await setDevicePowerInternal(ip, state);
      res.status(200).send({ message: `Device ${ip} turned ${state}` });
    } catch (err) {
      res.status(500).send({ message: 'Failed to control device', error: err.message });
    }
  },
  getStatus: async (req, res) => {
    try {
      const { ip } = req.query;
      if (!ip) return res.status(400).send({ message: 'Missing query parameter: ip' });

      const device = await client.getDevice({ host: ip });
      const powerState = await device.getPowerState();
      res.status(200).send({ ip, state: powerState ? 'on' : 'off' });
    } catch (err) {
      res.status(500).send({ message: 'Failed to get device status', error: err.message });
    }
  },

  // 🔥 Internal methods for direct use
  discoverDevicesInternal,
  setDevicePowerInternal,
};

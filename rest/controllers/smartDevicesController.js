const { Client } = require('tplink-smarthome-api');
const client = new Client();

let cachedDevices = [];

const discoverDevicesInternal = async () => {
  const found = new Set();
  const newClient = new (require('tplink-smarthome-api')).Client();
  cachedDevices = [];

  return new Promise((resolve) => {
    const discovery = newClient.startDiscovery();

    discovery.on('device-new', async (device) => {
      if (!found.has(device.host)) {
        found.add(device.host);
        const powerState = await device.getPowerState();
        cachedDevices.push({
          ip: device.host,
          alias: device.alias,
          mac: device.mac,
          model: device.model,
          powerState: powerState ? 'on' : 'off'
        });
      }
    });

    setTimeout(() => {
      newClient.stopDiscovery();
      resolve(cachedDevices);
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

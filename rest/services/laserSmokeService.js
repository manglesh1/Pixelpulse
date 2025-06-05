const smartDeviceController = require('../controllers/smartDevicesController');
const { hasActivePlayersInternal } = require('../controllers/WristbandTranController');


const CHECK_INTERVAL = 60 * 1000;
const SMOKE_DURATION = 4 * 60 * 1000;
const SMOKE_INTERVAL = 30 * 60 * 1000;

let lastSmokeTime = 0;
let smokeTimer = null;

const axios = require('axios');

const hasActivePlayers = async () => {
  try {
    return await hasActivePlayersInternal();
  } catch (err) {
    console.error('Error checking active players:', err.message);
    return false;
  }
};

const getLaserSmokeIp = async () => {
  try {
    const devices = await smartDeviceController.discoverDevicesInternal();
    const laserDevice = devices.find(d => d.alias?.toLowerCase() === 'laser smoke');
    return laserDevice?.ip || null;
  } catch (err) {
    console.error('Error finding Laser Smoke device:', err.message);
    return null;
  }
};

const setSmokeState = async (ip, state) => {
  try {
    await smartDeviceController.setDevicePowerInternal(ip, state);
    console.log(`[${new Date().toISOString()}] Smoke ${state.toUpperCase()} (via controller)`);
  } catch (err) {
    console.error(`Failed to set smoke ${state}:`, err.message);
  }
};

const runScheduler = async () => {
  const now = Date.now();
  const shouldTrigger = now - lastSmokeTime >= SMOKE_INTERVAL;

  if (!shouldTrigger) {
    const timeLeft = Math.round((SMOKE_INTERVAL - (now - lastSmokeTime)) / 1000);
    return console.log(`[${new Date().toISOString()}] Waiting ${timeLeft}s for next smoke`);
  }

  const isActive = await hasActivePlayers();
  if (!isActive) {
    return console.log(`[${new Date().toISOString()}] No active players — skipping smoke`);
  }

  const ip = await getLaserSmokeIp();
  if (!ip) {
    return console.error('Laser Smoke device not found');
  }

  await setSmokeState(ip, 'on');
  lastSmokeTime = Date.now();

  clearTimeout(smokeTimer);
  smokeTimer = setTimeout(() => {
    setSmokeState(ip, 'off');
  }, SMOKE_DURATION);
};

const startSmokeScheduler = () => {
  console.log('🚦 Starting Laser Smoke Scheduler (controller version)');
  setInterval(runScheduler, CHECK_INTERVAL);
};

module.exports = { startSmokeScheduler };

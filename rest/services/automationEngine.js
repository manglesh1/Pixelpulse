// services/automationEngine.js
const {
  SmartDeviceAutomation,
  SmartDeviceAutomationLog,
} = require("../models");
const smart = require("../controllers/smartDevicesController");
const {
  hasActivePlayersInternal,
} = require("../controllers/WristbandTranController");

class AutomationEngine {
  constructor({ tickMs = 1000, reloadMs = 3000 } = {}) {
    this.tickMs = tickMs;
    this.reloadMs = reloadMs;

    // id -> { row, onTimer, onStartMs, lastOnAtMs, lastPlayersSeenAtMs }
    this.state = new Map();
    this._tick = null;
    this._reload = null;
  }

  async start() {
    await this.reload();
    this._tick = setInterval(
      () => this.tick().catch(console.error),
      this.tickMs
    );
    this._reload = setInterval(
      () => this.reload().catch(console.error),
      this.reloadMs
    );
    console.log(
      `[AutomationEngine] started (tick=${this.tickMs}ms reload=${this.reloadMs}ms)`
    );
  }

  stop() {
    if (this._tick) clearInterval(this._tick);
    if (this._reload) clearInterval(this._reload);
    this._tick = this._reload = null;

    for (const st of this.state.values()) {
      if (st.onTimer) clearTimeout(st.onTimer);
    }
    this.state.clear();
    console.log("[AutomationEngine] stopped");
  }

  async reload() {
    const rows = await SmartDeviceAutomation.findAll({
      where: { enabled: true },
      order: [["id", "ASC"]],
    });

    const seen = new Set();
    for (const row of rows) {
      seen.add(row.id);
      const cur = this.state.get(row.id);
      if (!cur) {
        this.state.set(row.id, {
          row,
          onTimer: null,
          onStartMs: null,
          lastOnAtMs: row.lastOnAt ? new Date(row.lastOnAt).getTime() : 0,
          lastPlayersSeenAtMs: 0,
        });
      } else {
        // replace the row in-place so changes apply immediately
        cur.row = row;
      }
    }

    // remove state for disabled/deleted rows
    for (const id of Array.from(this.state.keys())) {
      if (!seen.has(id)) {
        const st = this.state.get(id);
        if (st?.onTimer) clearTimeout(st.onTimer);
        this.state.delete(id);
      }
    }
  }

  async tick() {
    const now = Date.now();
    let playersActive = null;

    for (const [id, st] of this.state) {
      const row = st.row;

      // gate on active players (with grace)
      if (row.requireActivePlayers) {
        if (playersActive === null) {
          try {
            playersActive = await hasActivePlayersInternal();
          } catch {
            playersActive = false;
          }
        }
        if (playersActive) st.lastPlayersSeenAtMs = now;

        const graceMs = Math.max(0, row.activeGraceMs || 0);
        const withinGrace = now - st.lastPlayersSeenAtMs <= graceMs;

        if (!playersActive && !withinGrace) {
          // ensure OFF if it happens to be ON
          if (st.onStartMs) await this.turnOff(st).catch(() => {});
          continue;
        }
      }

      // if ON → check if its onDuration (or maxOnMs safety) elapsed
      if (st.onStartMs) {
        const onDur = Math.max(0, row.onDurationMs || 60000);
        const elapsed = now - st.onStartMs;
        const safety = row.maxOnMs != null ? Math.max(0, row.maxOnMs) : null;

        if (elapsed >= onDur || (safety != null && elapsed >= safety)) {
          await this.turnOff(st).catch(() => {});
        }
        continue;
      }

      // if OFF → check interval
      const lastOn = st.lastOnAtMs || 0;
      const due = now - lastOn >= Math.max(0, row.minIntervalMs || 0);
      if (!due) continue;

      // trigger pulse
      await this.turnOn(st).catch(async (e) => {
        await this.log(row.deviceIp, row, "error", "on_failed", { message: e.message });
      });
    }
  }

async turnOn(st) {
  if (st.onStartMs) return; 
  const row = st.row;
  try {
    await smart.setDevicePowerInternal(row.deviceIp || "", "on");
  } catch (e) {
    await this.log(row, "error", "on_failed", { ip: row.deviceIp, message: e.message });
    throw e;
  }
  const now = Date.now();
  st.onStartMs = now;
  st.lastOnAtMs = now;

  row.lastOnAt = new Date(now);
  row.status = "on";
  await row.save({ fields: ["lastOnAt", "status"] });

  const onDur = Math.max(0, row.onDurationMs || 60000);
  if (st.onTimer) clearTimeout(st.onTimer);
  st.onTimer = setTimeout(() => this.turnOff(st).catch(() => {}), onDur + 50);

  await this.log(row.deviceIp, row, "on", "turnedOn", { ip: row.deviceIp, onDurationMs: onDur });
}

async turnOff(st) {
  if (!st.onStartMs && !st.onTimer) return; 
  const row = st.row;
  console.log(`[AutomationEngine] turning off device ${row.deviceIp}`);
  try {
    await smart.setDevicePowerInternal(row.deviceIp || "", "off");
  } catch (e) {
    await this.log(row.deviceIp, row, "error", "off_failed", { ip: row.deviceIp, message: e.message });
    throw e;
  }

  st.onStartMs = null;
  if (st.onTimer) {
    clearTimeout(st.onTimer);
    st.onTimer = null;
  }

  row.lastOffAt = new Date();
  row.status = "off";
  await row.save({ fields: ["lastOffAt", "status"] });

  await this.log(row.deviceIp, row, "off", "turnedOff", { ip: row.deviceIp });
}

  async log(ip, row, event, reason, extra = {}) {
    try {
      await SmartDeviceAutomationLog.create({
        automationId: row.id,
        deviceAlias: row.deviceAlias,
        macAddress: row.macAddress || null,
        resolvedIp: ip,
        event,
        reason,
        contextJson: extra,
      });
    } catch (err) {
      console.log("[AutomationEngine] log failed:", err.message || err.toString());
    }
  }
}

// ---- singleton helpers (easy to import in server) ----
let engineInstance = null;

async function startAutomationEngine(opts = {}) {
  if (!engineInstance) {
    engineInstance = new AutomationEngine(opts);
    await engineInstance.start();
  }
  return engineInstance;
}

function stopAutomationEngine() {
  if (engineInstance) {
    engineInstance.stop();
    engineInstance = null;
  }
}

function getAutomationEngine() {
  return engineInstance;
}

module.exports = {
  AutomationEngine,
  startAutomationEngine,
  stopAutomationEngine,
  getAutomationEngine,
};

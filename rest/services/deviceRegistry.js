const {
  discoverDevicesInternal,
} = require("../controllers/smartDevices.controller");

const norm = (m) =>
  (m || "")
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "")
    .match(/.{1,2}/g)
    ?.join(":") || "";

class DeviceRegistry {
  constructor(ttlMs = 30000) {
    this.ttlMs = ttlMs;
    this.cache = [];
    this.ts = 0;
    this.refreshing = null;
  }
  async refresh() {
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      const list = await discoverDevicesInternal();
      this.cache = list.map((d) => ({
        ...d,
        mac: norm(d.mac),
        alias: d.alias || "",
      }));
      this.ts = Date.now();
      this.refreshing = null;
      return this.cache;
    })().catch(() => ((this.refreshing = null), this.cache));
    return this.refreshing;
  }
  async ensureFresh() {
    if (Date.now() - this.ts > this.ttlMs) await this.refresh();
  }
  async getByMac(mac) {
    await this.ensureFresh();
    return this.cache.find((d) => d.mac === norm(mac)) || null;
  }
  async getByAlias(alias) {
    await this.ensureFresh();
    return (
      this.cache.find(
        (d) => d.alias.toLowerCase() === (alias || "").toLowerCase()
      ) || null
    );
  }
}
module.exports = new DeviceRegistry();

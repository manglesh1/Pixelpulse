import axios from "axios";

const CONTROLLER_BASE_URL =
  process.env.NEXT_PUBLIC_CONTROLLER_URL || "http://localhost:5199";

const controller = axios.create({
  baseURL: CONTROLLER_BASE_URL,
});

// Scanner
export const getScannerStatus = async () => {
  const res = await controller.get("/scanner/status");
  return res.data; // { ready, lastStatus, port }
};

export const openScannerLiveSocket = () => {
  // Convert http:// to ws://, https:// to wss://
  const wsBase = CONTROLLER_BASE_URL.replace(/^http/, "ws");
  return new WebSocket(`${wsBase}/scanner/live`);
};

export const getGameStatus = async () => {
  const res = await controller.get("/game/status");
  // Expect something like: { status: "Idle" | "Running", gameCode?: string }
  return res.data;
};

export const startGame = async (gameCode) => {
  const body = { gameCode };

  const res = await controller.post("/game/start", JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return res.data;
};

export const resetPlayerQueue = async () => {
  const res = await controller.post("/game/stop");
  return res.data;
};
export const openScoreHubSocket = () => {
  const wsBase = CONTROLLER_BASE_URL.replace(/^http/, "ws");
  return new WebSocket(`${wsBase}/scorehub`);
};

export const enterMaintenance = async () => {
  await controller.post("/api/admin/maintenance/start");
};

export const exitMaintenance = async () => {
  await controller.post("/api/admin/maintenance/stop");
};

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

export const startGame = async ({
  gameCode,
  variantName,
  playerUids,
  gameType,
}) => {
  const body = {
    gameCode,
    variantName,
    playerCount: playerUids.length,
    playerUids,
    gameType,
  };

  const res = await controller.post("/game/start", body);
  return res.data;
};

export const resetGame = async () => {
  const res = await controller.post("/game/reset");
  return res.data;
};

// // -------- Scoreboard helpers (optional, for names) --------
// export const sendPlayerNames = async (names) => {
//   // You can add a matching endpoint in your controller:
//   // POST /scores/players  { names: string[] }
//   try {
//     await controller.post("/scores/players", { names });
//   } catch (err) {
//     console.error("sendPlayerNames failed", err);
//   }
// };

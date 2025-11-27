import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach x-api-key automatically to all requests
api.interceptors.request.use((config) => {
  const key = process.env.NEXT_PUBLIC_API_KEY;
  if (key) config.headers["x-api-key"] = key;
  return config;
});

// ---------------------------------------------
//   EXPORT API FUNCTIONS USING "api" INSTANCE
// ---------------------------------------------

export const fetchPlayerbyId = async (id) => {
  const res = await api.get(`/player/${id}`);
  return res.data;
};

export const fetchPlayersByEmail = async (email) => {
  const res = await api.get(`/player/findAll/?email=${email}`);
  return res.data;
};

export const createPlayer = async (pls) => {
  const res = await api.post(`/player/create`, pls);
  return res.data;
};

export const updatePlayer = async (id, pls) => {
  try {
    const res = await api.put(`/player/${id}`, pls);
    return res.data;
  } catch (err) {
    console.log(err);
  }
};

export const getRequirePlayer = async () => {
  try {
    const res = await api.get(`/config?configKey=RequireWaiver`);
    return res.data.configValue.toLowerCase() === "yes";
  } catch (error) {
    console.log("Error fetching requireWaiver:", error);
  }
};

export const validatePlayer = async (id) => {
  try {
    const res = await api.get(`/wristbandtran/validatePlayer?PlayerID=${id}`);
    return res.status === 200;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const fetchGameDataApi = async (gameCode) => {
  try {
    const res = await api.get(`/game/findByGameCode/?gameCode=${gameCode}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchActiveGameDataApi = async (gameCode) => {
  try {
    const res = await api.get(
      `/game/findActiveGamesByGameCode/?gameCode=${gameCode}`
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchGameStatusApi = async (gameCode, gameData) => {
  try {
    const res = await api.get(
      `/game-status?gameCode=${encodeURIComponent(
        gameCode
      )}&IpAddress=${encodeURIComponent(
        gameData.IpAddress
      )}&port=${encodeURIComponent(gameData.LocalPort)}`
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchHighScoresApi = async () => {
  try {
    const res = await api.get(`/stats/highestScores`);
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchPlayerInfoApi = async (wristbandTranID) => {
  try {
    const res = await api.get(
      `/wristbandtran/getplaysummary?wristbanduid=${wristbandTranID}`
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchHighScoresApiByGameCode = async (gameId) => {
  try {
    const res = await api.get(`/playerScore/getTopScoresForVariants/${gameId}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchHighScoresApiForPlayerByGameVariantId = async (
  gameVariantId,
  player
) => {
  try {
    const res = await api.get(
      `/playerScore/getTopScoreForPlayer/${gameVariantId}/${player}`
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchRequireWristbandScanApi = async () => {
  try {
    const res = await api.get(`/config?configKey=RequireWristbandScan`);
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchAllVariants = async () => {
  const res = await api.get(`/gamesVariant/findAll`);
  return res.data;
};

export const fetchLeaderboardScores = async (variantId) => {
  const res = await api.get(`/playerScore/allForVariant/${variantId}`);
  return res.data;
};

export const fetchTopAllTime = async (limit = SIDEBAR_ROWS) => {
  const res = await api.get(`/playerScore/topAllTime?limit=${limit}`);
  return res.data.map((x) => ({
    ...x,
    Points: x.TotalTopPoints ?? x.Points,
    StartTime: x.LastPlayed ?? x.StartTime,
  }));
};

export const fetchTopRecent = async (
  days = RECENT_DAYS,
  limit = SIDEBAR_ROWS
) => {
  const res = await api.get(
    `/playerScore/topRecent?days=${days}&limit=${limit}`
  );
  return res.data.map((x) => ({
    ...x,
    Points: x.TotalTopPoints ?? x.Points,
    StartTime: x.LastPlayed ?? x.StartTime,
  }));
};

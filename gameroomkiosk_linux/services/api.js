const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const api = require("../middleware/apiClient");

export const fetchPlayersByEmail = async (email) => {
  const res = await api.get(`${API_BASE_URL}/player/findAll/?email=${email}`);
  return res.data;
};

export const validatePlayer = async (id) => {
  try {
    const res = await api.get(
      `${API_BASE_URL}/wristbandtran/validatePlayer?PlayerID=${id}`
    );
    return res.status === 200;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const fetchActiveGameDataApi = async (gameCode) => {
  try {
    const res = await api.get(
      `${API_BASE_URL}/game/findActiveGamesByGameCode/?gameCode=${gameCode}`
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchHighScoresApiByGameCode = async (gameId) => {
  try {
    const res = await api.get(
      `${API_BASE_URL}/playerScore/getTopScoresForVariants/${gameId}`
    );
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const findOrCreatePlayer = async (player) => {
  const res = await api.post("/player/findOrCreate", player);
  return res.data;
};

export const findOrCreateChildPlayer = async (player) => {
  const res = await api.post("/player/findOrCreateChild", player);
  return res.data;
};

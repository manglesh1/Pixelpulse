import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchPlayers = async () => {
  try {
      const res = await axios.get(`${API_URL}/player/findAll`);
      return res.data;
  } catch (err) {
      console.error('Could not fetch list of players!', err);
      return [];
  }
}

export const fetchPlayersBySigneeId = async (signeeid) => {
  const res = await axios.get(`${API_URL}/player/findAll/?signeeid=${signeeid}`);
  return res.data;
}

export const fetchPlayerById = async (id) => {
  const res = await axios.get(`${API_URL}/player/${id}`);
  return res.data;
}

// GameroomTypes API functions
export const fetchGameroomTypes = async () => {
    const response = await axios.get(`${API_URL}/gameroomType/findAll`);
  return response.data;
};

export const createGameroomType = async (data) => {
  const url = `${API_URL}/gameroomType/create`;
  const response = await axios.post(url, data);
  return response.data;
};

export const deleteGameroomType = async (id) => {
  await axios.delete(`${API_URL}/gameroomType/${id}`);
};

export const updateGameroomType = async (id, data) => {
  const response = await axios.put(`${API_URL}/gameroomType/${id}`, data);
  return response.data;
};

// Games API functions
export const fetchGames = async () => {
  const response = await axios.get(`${API_URL}/game/findAll`);
  return response.data;
};

export const createGame = async (data) => {
  const url = `${API_URL}/game/create`;
  const response = await axios.post(url, data);
  return response.data;
};

export const deleteGame = async (id) => {
  await axios.delete(`${API_URL}/game/${id}`);
};

export const updateGame = async (id, data) => {
  const response = await axios.put(`${API_URL}/game/${id}`, data);
  return response.data;
};

// GamesVariant API functions
export const fetchGamesVariants = async () => {
  const response = await axios.get(`${API_URL}/gamesVariant/findAll`);
  return response.data;
};

export const createGamesVariant = async (data) => {
  const url = `${API_URL}/gamesVariant/create`;
  const response = await axios.post(url, data);
  return response.data;
};

export const deleteGamesVariant = async (id) => {
  await axios.delete(`${API_URL}/gamesVariant/${id}`);
};

export const updateGamesVariant = async (id, data) => {
  const response = await axios.put(`${API_URL}/gamesVariant/${id}`, data);
  return response.data;
};

// Notifications API functions
export const fetchNotifications = async () => {
  const response = await axios.get(`${API_URL}/notifications/findAll`);
  return response.data;
};

export const createNotification = async (data) => {
  const response = await axios.post(`${API_URL}/notifications/create`, data);
  return response.data;
};

// PlayerScores API functions
export const fetchPlayerScores = async () => {
  const response = await axios.get(`${API_URL}/playerScore/findAll`);
  return response.data;
};

export const createPlayerScore = async (data) => {
  const response = await axios.post(`${API_URL}/playerScore/create`, data);
  return response.data;
};

// Config API functions
export const fetchConfigs = async () => {
  const response = await axios.get(`${API_URL}/config/findAll`);
  return response.data;
};

export const createConfig = async (data) => {
  const url = `${API_URL}/config/create`;
  const response = await axios.post(url, data);
  return response.data;
};

export const deleteConfig = async (id) => {
  await axios.delete(`${API_URL}/config/${id}`);
};

export const updateConfig = async (id, data) => {
  const response = await axios.put(`${API_URL}/config/${id}`, data);
  return response.data;
};

// Devices API functions
export const fetchDevices = async () => {
  const response = await axios.get(`${API_URL}/devices`);
  return response.data;
};

export const createDevice = async (data) => {
  const response = await axios.post(`${API_URL}/devices/create`, data);
  return response.data;
};

export const updateDevice = async (id, data) => {
  const response = await axios.put(`${API_URL}/devices/${id}`, data);
  return response.data;
};

export const deleteDevice = async (id) => {
  await axios.delete(`${API_URL}/devices/${id}`);
};

// Smart Devices API functions (Kasa or similar)

export const fetchSmartDevices = async () => {
  try {
    const response = await axios.get(`${API_URL}/smartDevices`);
    return response.data;
  } catch (err) {
    console.error('Failed to fetch smart devices', err);
    return [];
  }
};

export const setSmartDeviceStatus = async (ip, state) => {
  try {
    const response = await axios.get(`${API_URL}/smartDevices/set`, {
      params: { ip, state }
    });
    return response.data;
  } catch (err) {
    console.error(`Failed to set power state for ${ip}`, err);
    throw err;
  }
};

export const getSmartDeviceStatus = async (ip) => {
  try {
    const response = await axios.get(`${API_URL}/smartDevices/get`, {
      params: { ip }
    });
    return response.data;
  } catch (err) {
    console.error(`Failed to get status for ${ip}`, err);
    return null;
  }
};

export const fetchGameStats = async (startDate, endDate) => {
  try {
    const response = await axios.get(`${API_URL}/stats/game-stats`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (err) {
    console.error('Failed to fetch game stats', err);
    return { dailyPlays: [], playsPerGame: [], topGames: [] };
  }
};

export const fetchActiveGameVariants = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats/active-game-variants`);
    return response.data.activeGames || [];
  } catch (err) {
    console.error('Failed to fetch active game variants', err);
    return [];
  }
};

export const updatePlayer = async (id, data) => {
  const response = await axios.put(`${API_URL}/player/${id}`, data);
  return response.data;
};

export const fetchWristbandsByPlayerID = async (playerID) => {
  try {
    const res = await axios.get(`${API_URL}/wristbandtran/findAll`, {
      params: { playerID }
    });
    return res.data;
  } catch (err) {
    console.error('Could not fetch wristbands for', playerID, err);
    return [];
  }
};

export const deletePlayer = async (id) => {
  await axios.delete(`${API_URL}/player/${id}`);
};

export const updateWristband = async (data) => {
  try {
    const res = await axios.put(`${API_URL}/wristbandtran`, data);
    return res.data;
  } catch (err) {
    console.error('Failed to update wristband', data, err);
    throw err;
  }
};

export const deleteWristband = async (id) => {
  try {
    await axios.delete(`${API_URL}/wristbandtran/${id}`);
  } catch (err) {
    console.error('Failed to delete wristband', id, err);
    throw err;
  }
};

export const fetchPagedPlayers = async ({
  page,
  pageSize,
  search = '',
  validOnly,
  masterOnly,
  playingNow
}) => {
  try {
    const res = await axios.get(`${API_URL}/player/paged`, {
      params: { page, pageSize, search, validOnly, masterOnly, playingNow }
    });
    return res.data;
  } catch (err) {
    console.error('Could not fetch paged players', err);
    return { total: 0, page, pageSize, players: [] };
  }
};

export const fetchPagedPlayerScores = async ({
    page,
    pageSize,
    startDate,
    endDate,
    gamesVariantId,
    search,          
  }) => {
    try {
      const params = {
        page,
        pageSize,
        ...(startDate      ? { startDate }      : {}),
        ...(endDate        ? { endDate }        : {}),
        ...(gamesVariantId ? { gamesVariantId } : {}),
        ...(search         ? { search }         : {}),
      };

      const res = await axios.get(`${API_URL}/playerScore/findPaged`, { params });
      return res.data;
    } catch (err) {
      console.error('Could not fetch paged playerScores', err);
      return {
        data: [],
        pagination: { page, pageSize, totalItems: 0, totalPages: 0 }
      };
    }
};

export const deletePlayerScore = async (id) => {
  return axios.delete(`${API_URL}/playerScore/${id}`);
};

// Auth routes

export const getCurrentUser = async () => {
  const res = await axios.get(`${API_URL}/me`, { withCredentials: true });
  return res.data;
};

export const registerAdmin = async ({ email, password, role }) => {
  const res = await axios.post(
    `${API_URL}/register`,
    { email, password, role },
    { withCredentials: true }
  );
  return res.data;
};


export async function fetchDailyPlays({ days = 30, end = '' } = {}) {
  const params = { days };
  if (end) params.end = end;
  try {
    const res = await axios.get(`${API_URL}/stats/plays/daily`, { params });
    return res.data;
  } catch (err) {
    console.error('Could not fetch daily plays', err);
    return { days, end, plays: [] };
  }
}


export async function fetchHourlyPlays({ date = '' } = {}) {
  const params = {};
  if (date) params.date = date;
  try {
    const res = await axios.get(`${API_URL}/stats/plays/hourly`, { params });
    return res.data;
  } catch (err) {
    console.error('Could not fetch hourly plays', err);
    return { date: date || 'today', hourly: [] };
  }
}

export async function fetchTopVariants({ days = 30, end = '', limit = 10 } = {}) {
  const params = { days, limit };
  if (end) params.end = end;
  try {
    const res = await axios.get(`${API_URL}/stats/variants/top`, { params });
    return res.data;
  } catch (err) {
    console.error('Could not fetch top variants', err);
    return { days, end, top: [] };
  }
}

export async function fetchGameShareForDay({ date = '', startDate = '', endDate = '', startUtc = '', endUtc = '' } = {}) {
  const params = {};
  if (date)      params.date = date;           // legacy single-day (Toronto)
  if (startDate) params.startDate = startDate; // Toronto local YYYY-MM-DD
  if (endDate)   params.endDate   = endDate;
  if (startUtc)  params.startUtc  = startUtc;  // explicit UTC ISO
  if (endUtc)    params.endUtc    = endUtc;

  try {
    const res = await axios.get(`${API_URL}/stats/game/share`, { params });
    return res.data; // { startUtc, endUtc, share: [...] }
  } catch (err) {
    console.error('Could not fetch game share for day', err);
    return { startUtc: '', endUtc: '', share: [] };
  }
}


export async function fetchWeekdayHourHeatmap({ weeks = 12 } = {}) {
  const params = { weeks };
  try {
    const res = await axios.get(`${API_URL}/stats/heatmap/weekday-hour`, { params });
    return res.data; // { weeks, matrix: [...] }
  } catch (err) {
    console.error('Could not fetch weekday-hour heatmap', err);
    return { weeks, matrix: [] };
  }
}

export async function fetchGameLengthAverages({
  minSeconds = 5,
  maxSeconds = 3600,
  startUtc,
  endUtc,
  startDate,   // <-- add
  endDate      // <-- add
} = {}) {
  const params = { minSeconds, maxSeconds };

  // Pass either Toronto-local date bounds OR explicit UTC bounds.
  // Backend will prefer explicit UTC if both are present.
  if (startDate) params.startDate = startDate;
  if (endDate)   params.endDate   = endDate;
  if (startUtc)  params.startUtc  = startUtc;
  if (endUtc)    params.endUtc    = endUtc;

  try {
    const res = await axios.get(`${API_URL}/stats/game-length/averages`, { params });
    return res.data;
  } catch (err) {
    console.error('Could not fetch game length averages', err);
    return { overall: null, byGame: [], byVariant: [] };
  }
}

export const fetchVariantAnalytics = async (variantId) => {
  try {
    const res = await axios.get(
      `${API_URL}/stats/game-variant/${variantId}/analytics`,
      { withCredentials: true } // keep cookies if your API uses session auth
    );
    return res.data;
  } catch (err) {
    // Surface something useful to the UI:
    const status = err?.response?.status;
    const serverMsg = err?.response?.data?.error || err?.response?.data;
    console.error('Failed to fetch variant analytics', status, serverMsg || err.message);
    throw new Error(serverMsg || `Failed to fetch variant analytics (HTTP ${status ?? 'unknown'})`);
  }
};
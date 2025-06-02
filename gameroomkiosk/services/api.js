import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchPlayerbyId = async (id) => {
    const res = await axios.get(`${API_BASE_URL}/player/${id}`)
    return res.data;
}

export const fetchPlayersByEmail = async (email) => {
    const res = await axios.get(`${API_BASE_URL}/player/findAll/?email=${email}`);
    return res.data;
}

export const createPlayer = async (pls) => {
    const res = await axios.post(`${API_BASE_URL}/player/create`, pls);
    return res.data;
}

export const updatePlayer = async (id, pls) => {
    try {
        const res = await axios.put(`${API_BASE_URL}/player/${id}`, pls);
        return res.data;
    } catch (err) {
        console.log(err);
    }
} 

export const getRequirePlayer = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/config?configKey=RequireWaiver`);
        return res.data.configValue.toLowerCase() === 'yes' ? true : false;
    } catch (error) {
        console.log('Error fetching requireWaiver:', error);
    }
}

export const validatePlayer = async (id) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/wristbandtran/validatePlayer?PlayerID=${id}`);
        return res.status==200 ? true:false;
    } catch (err) {
        console.log(err);
        return false;
    }
} 

export const fetchGameDataApi = async (gameCode) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/game/findByGameCode/?gameCode=${gameCode}`);
        return res.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const fetchActiveGameDataApi = async (gameCode) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/game/findActiveGamesByGameCode/?gameCode=${gameCode}`);
        return res.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const fetchGameStatusApi = async (gameCode, gameData) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/game-status?gameCode=${encodeURIComponent(gameCode)}&IpAddress=${encodeURIComponent(gameData.IpAddress)}&port=${encodeURIComponent(gameData.LocalPort)}`);
        return res.data;
    } catch(error) {
        console.log(error);
        return null;
    }
}

export const fetchHighScoresApi = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/stats/highestScores`);
        return res.data;
    } catch(error) {
        console.log(error);
        return null;
    }
}

export const fetchPlayerInfoApi = async (wristbandTranID) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/wristbandtran/getplaysummary?wristbanduid=${wristbandTranID}`);
        return res.data;
    } catch(error) {
        console.log(error);
        return null;
    }
}

export const fetchHighScoresApiByGameCode = async (gameId) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/playerScore/getTopScoresForVariants/${gameId}`);
        return res.data;
    } catch(error) {
        console.log(error);
        return null;
    }
}

export const fetchHighScoresApiForPlayerByGameVariantId = async (gameVariantId, player) => {
    try {
        const res = await axios.get(`${API_BASE_URL}/playerScore/getTopScoreForPlayer/${gameVariantId}/${player}`);
        return res.data;
    } catch(error) {
        console.log(error);
        return null;
    }
}

export const fetchRequireWristbandScanApi = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/config?configKey=RequireWristbandScan`);
        return res.data;
    } catch(error) {
        console.log(error);
        return null;
    }
}

export const fetchAllVariants = async () => {
    const res = await axios.get(`${API_BASE_URL}/gamesVariant/findAll`);
    return res.data;
};

export const fetchLeaderboardScores = async (variantId) => {
    const res = await axios.get(`${API_BASE_URL}/playerScore/allForVariant/${variantId}`);
    return res.data;
};

export const fetchTopAllTime = async (limit = SIDEBAR_ROWS) => {
    const res = await axios.get(`${API_BASE_URL}/playerScore/topAllTime?limit=${limit}`);
    return res.data.map(x => ({
      ...x,
      Points: x.TotalTopPoints ?? x.Points,
      StartTime: x.LastPlayed ?? x.StartTime
    }));
};

export const fetchTopRecent = async (days = RECENT_DAYS, limit = SIDEBAR_ROWS) => {
    const res = await axios.get(`${API_BASE_URL}/playerScore/topRecent?days=${days}&limit=${limit}`);
    return res.data.map(x => ({
      ...x,
      Points: x.TotalTopPoints ?? x.Points,
      StartTime: x.LastPlayed ?? x.StartTime
    }));
};
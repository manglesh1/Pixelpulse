import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

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
  const response = await axios.get(`${API_URL}/player-scores/findAll`);
  return response.data;
};

export const createPlayerScore = async (data) => {
  const response = await axios.post(`${API_URL}/player-scores/create`, data);
  return response.data;
};

// Add other functions for different entities like Player, Booking, etc.

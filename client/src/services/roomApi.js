import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms`;

const buildHeaders = (token) => ({
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': token,
  },
});

export const createRoom = async (token, gameId) => {
  const response = await axios.post(API_BASE_URL, { gameId }, buildHeaders(token));
  return response.data;
};

export const joinRoom = async (token, code) => {
  const response = await axios.post(`${API_BASE_URL}/join`, { code }, buildHeaders(token));
  return response.data;
};

export const getRoom = async (token, code) => {
  const response = await axios.get(`${API_BASE_URL}/${code}`, buildHeaders(token));
  return response.data;
};

export const startRoom = async (token, code) => {
  const response = await axios.post(`${API_BASE_URL}/${code}/start`, {}, buildHeaders(token));
  return response.data;
};

export const bootstrapGame = async (token, code) => {
  const response = await axios.post(`${API_BASE_URL}/${code}/game/bootstrap`, {}, buildHeaders(token));
  return response.data;
};

export const getGameState = async (token, code) => {
  const response = await axios.get(`${API_BASE_URL}/${code}/game/state`, buildHeaders(token));
  return response.data;
};

export const sendGameInput = async (token, code, input) => {
  const response = await axios.post(`${API_BASE_URL}/${code}/game/input`, input, buildHeaders(token));
  return response.data;
};

export const sendGameMove = async (token, code, payload) => {
  const response = await axios.post(`${API_BASE_URL}/${code}/game/move`, payload, buildHeaders(token));
  return response.data;
};

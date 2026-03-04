import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pokemonAPI = {
  getAll: () => API.get('/api/pokemon-spawns'),
  getNearby: (latitude, longitude, radius = 5) =>
    API.get('/api/pokemon-spawns/nearby', {
      params: { latitude, longitude, radius },
    }),
  add: (data) => API.post('/api/pokemon-spawns', data),
  update: (id, data) => API.put(`/api/pokemon-spawns/${id}`, data),
  delete: (id) => API.delete(`/api/pokemon-spawns/${id}`),
};

export const raidAPI = {
  getAll: () => API.get('/api/raids'),
  getNearby: (latitude, longitude, radius = 5) =>
    API.get('/api/raids/nearby', {
      params: { latitude, longitude, radius },
    }),
  add: (data) => API.post('/api/raids', data),
  update: (id, data) => API.put(`/api/raids/${id}`, data),
  delete: (id) => API.delete(`/api/raids/${id}`),
};

export const routeAPI = {
  getAll: () => API.get('/api/routes'),
  getById: (id) => API.get(`/api/routes/${id}`),
  add: (data) => API.post('/api/routes', data),
  update: (id, data) => API.put(`/api/routes/${id}`, data),
  delete: (id) => API.delete(`/api/routes/${id}`),
};

export default API;

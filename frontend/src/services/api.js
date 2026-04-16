import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ADMIN_TOKEN_KEY = 'dronescope_admin_token';
const USER_TOKEN_KEY = 'dronescope_user_token';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const adminToken = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    const userToken = window.localStorage.getItem(USER_TOKEN_KEY);

    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    if (userToken) {
      config.headers['X-User-Authorization'] = `Bearer ${userToken}`;
    }
  }

  return config;
});

export function getAdminToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

export function setAdminToken(token) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

export function clearAdminToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

export function getUserToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(USER_TOKEN_KEY) || '';
}

export function setUserToken(token) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(USER_TOKEN_KEY, token);
  }
}

export function clearUserToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(USER_TOKEN_KEY);
  }
}

export const loginAdmin = (payload) =>
  api.post('/admin/login', payload).then((response) => response.data);

export const getAdminSession = () =>
  api.get('/admin/session').then((response) => response.data);

export const signUpUser = (payload) =>
  api.post('/auth/signup', payload).then((response) => response.data);

export const signInUser = (payload) =>
  api.post('/auth/login', payload).then((response) => response.data);

export const getUserSession = () =>
  api.get('/auth/session').then((response) => response.data);

export const getUpdates = (filters = {}) =>
  api.get('/updates', { params: filters }).then((response) => response.data);

export const getHistory = () =>
  api.get('/history').then((response) => response.data);

export const askAiQuery = (payload) =>
  api.post('/ai-query', payload).then((response) => response.data);

export function subscribeToUpdates(onUpdate, onError) {
  const eventSource = new EventSource(`${API_URL}/updates/stream`);

  eventSource.addEventListener('update', (event) => {
    onUpdate(JSON.parse(event.data));
  });

  eventSource.onerror = (error) => {
    onError?.(error);
  };

  return () => {
    eventSource.close();
  };
}

export const getCountries = () => api.get('/countries').then((response) => response.data);
export const createCountry = (payload) => api.post('/countries', payload).then((response) => response.data);
export const updateCountry = (id, payload) => api.put(`/countries/${id}`, payload).then((response) => response.data);
export const deleteCountry = (id) => api.delete(`/countries/${id}`).then((response) => response.data);

export const getDrones = (filters = {}) =>
  api.get('/drones', { params: filters }).then((response) => response.data);
export const createDrone = (payload) => api.post('/drones', payload).then((response) => response.data);
export const updateDrone = (id, payload) => api.put(`/drones/${id}`, payload).then((response) => response.data);
export const deleteDrone = (id) => api.delete(`/drones/${id}`).then((response) => response.data);

export const getCounterSystems = () =>
  api.get('/counter-systems').then((response) => response.data);
export const createCounterSystem = (payload) =>
  api.post('/counter-systems', payload).then((response) => response.data);
export const updateCounterSystem = (id, payload) =>
  api.put(`/counter-systems/${id}`, payload).then((response) => response.data);
export const deleteCounterSystem = (id) =>
  api.delete(`/counter-systems/${id}`).then((response) => response.data);

export const runSimulation = (payload) =>
  api.post('/simulate', payload).then((response) => response.data);

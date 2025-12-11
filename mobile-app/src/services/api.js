import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMockLeaderboard,
  getMockTournament,
  getMockTournamentById,
  getMockTournaments,
  getTournamentsForState,
  getTournamentsNearLocation,
  joinMockTournament,
} from '../mocks/tournaments';

// Base API configuration
const API_BASE_URL = 'http://localhost:3000/api'; // Change to your server URL

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // Navigate to login screen (implement navigation service)
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  signUp: async (email, password, username, region, favorite_species) => {
    const response = await api.post('/auth/signup', {
      email,
      password,
      username,
      region,
      favorite_species,
    });
    return response.data;
  },

  signIn: async (email, password) => {
    const response = await api.post('/auth/signin', { email, password });
    return response.data;
  },
};

// Tournament API
export const tournamentAPI = {
  getTournaments: async (filters = {}) => {
    try {
      const response = await api.get('/tournaments', { params: filters });
      return response.data;
    } catch (error) {
      console.warn('Using mock tournaments data:', error.message);
      const { state, lat, lng } = filters;

      const hasCoordinates =
        typeof lat !== 'undefined' && typeof lng !== 'undefined';

      if (hasCoordinates) {
        const parsedLat = Number(lat);
        const parsedLng = Number(lng);

        if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
          return getTournamentsNearLocation(
            { lat: parsedLat, lng: parsedLng },
            { stateHint: state }
          );
        }
      }

      if (state) {
        return getTournamentsForState(state);
      }

      return getMockTournaments(filters);
    }
  },

  getTournamentById: async (id) => {
    try {
      const response = await api.get(`/tournaments/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Using mock tournament detail for ${id}:`, error.message);
      const result = getMockTournamentById(id);
      if (!result) {
        return getMockTournament(id)?.tournament ?? null;
      }
      return result;
    }
  },

  joinTournament: async (id) => {
    try {
      const response = await api.post(`/tournaments/${id}/join`);
      return response.data;
    } catch (error) {
      console.warn(`Using mock join tournament for ${id}:`, error.message);
      return joinMockTournament(id);
    }
  },

  getLeaderboard: async (id) => {
    try {
      const response = await api.get(`/tournaments/${id}/leaderboard`);
      return response.data;
    } catch (error) {
      console.warn(`Using mock leaderboard for ${id}:`, error.message);
      return getMockLeaderboard(id);
    }
  },

  getMyCatches: async (id) => {
    const response = await api.get(`/tournaments/${id}/my-catches`);
    return response.data;
  },
};

// Catch API
export const catchAPI = {
  startSession: async (tournament_id, gps_lat, gps_lon) => {
    const response = await api.post('/catches/sessions/start', {
      tournament_id,
      gps_lat,
      gps_lon,
    });
    return response.data;
  },

  submitCatch: async (formData) => {
    const response = await api.post('/catches', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getCatchById: async (id) => {
    const response = await api.get(`/catches/${id}`);
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  getMyTournaments: async (status) => {
    const response = await api.get('/users/me/tournaments', {
      params: { status },
    });
    return response.data;
  },

  getMyCatchHistory: async (tournament_id) => {
    const response = await api.get('/users/me/catches', {
      params: { tournament_id },
    });
    return response.data;
  },

  getWalletBalance: async () => {
    const response = await api.get('/users/me/wallet');
    return response.data;
  },
};

export default api;

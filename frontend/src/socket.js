import { io } from 'socket.io-client';

// Connect to backend server (Render in production, localhost in development)
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const defaultBackendUrl = isLocal
  ? (window.location.port === '5000' ? window.location.origin : `http://${window.location.hostname}:5000`)
  : 'https://smartcollege-transport-backend.onrender.com';

const BACKEND_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) 
  ? import.meta.env.VITE_BACKEND_URL 
  : defaultBackendUrl;

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000
});

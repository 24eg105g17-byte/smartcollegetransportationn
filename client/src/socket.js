import { io } from 'socket.io-client';

// Connect to backend server on port 5000
const host = window.location.hostname || 'localhost';
const BACKEND_URL = window.location.port === '5000'
  ? window.location.origin
  : `http://${host}:5000`;

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000
});

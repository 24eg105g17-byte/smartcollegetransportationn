// server.js - Express & Socket.IO server for Smart College Transportation System
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startSimulator } from './simulator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load in-memory datasets
const readJson = (filename) => {
  const filePath = path.join(__dirname, 'data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

let routes = readJson('routes.json');
let buses = readJson('buses.json');
let drivers = readJson('drivers.json');
let students = readJson('students.json');
let alerts = readJson('alerts.json');

// --- REST Endpoints ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/routes', (req, res) => {
  res.json(routes);
});

app.get('/api/buses', (req, res) => {
  res.json(buses);
});

app.get('/api/drivers', (req, res) => {
  res.json(drivers);
});

app.get('/api/students', (req, res) => {
  res.json(students);
});

app.get('/api/students/verify/:rollNo', (req, res) => {
  const rollNo = req.params.rollNo.toUpperCase().trim();
  const student = students.find(s => s.rollNo.toUpperCase() === rollNo);
  if (student) {
    res.json({ found: true, student });
  } else {
    res.status(404).json({ found: false, message: 'Student roll number not found' });
  }
});

app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

app.post('/api/alerts', (req, res) => {
  const { type, title, message, routeId, priority } = req.body;
  const newAlert = {
    id: `alert-${Date.now()}`,
    type: type || 'info',
    title: title || 'Notice',
    message: message || '',
    routeId: routeId || 'all',
    priority: priority || 'Normal',
    timestamp: new Date().toISOString()
  };
  alerts.unshift(newAlert);
  io.emit('new_alert', newAlert);
  io.emit('alerts_update', alerts);
  res.status(201).json(newAlert);
});

app.put('/api/buses/:id', (req, res) => {
  const busId = req.params.id;
  const bus = buses.find(b => b.id === busId);
  if (!bus) {
    return res.status(404).json({ error: 'Bus not found' });
  }
  Object.assign(bus, req.body);
  bus.lastUpdated = new Date().toISOString();
  io.emit('buses_update', buses);
  res.json(bus);
});

// --- Socket.IO Handling ---
io.on('connection', (socket) => {
  console.log(`[Socket] New client connected: ${socket.id}`);

  // Send initial state snapshot immediately
  socket.emit('init_state', {
    routes,
    buses,
    drivers,
    alerts
  });

  // Driver toggles simulation (moving / stationary)
  socket.on('driver_toggle_sim', ({ busId, isSimulating }) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      bus.isSimulating = typeof isSimulating === 'boolean' ? isSimulating : !bus.isSimulating;
      io.emit('buses_update', buses);
    }
  });

  // Driver updates speed
  socket.on('driver_update_speed', ({ busId, speed }) => {
    const bus = buses.find(b => b.id === busId);
    if (bus && typeof speed === 'number') {
      bus.speed = Math.max(0, Math.min(80, speed));
      bus.targetSpeed = bus.speed;
      io.emit('buses_update', buses);
    }
  });

  // Driver steps to next stop manually
  socket.on('driver_advance_stop', ({ busId }) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      const route = routes.find(r => r.id === bus.routeId);
      if (route && route.waypoints && route.waypoints.length > 0) {
        bus.currentWaypointIndex = ((bus.currentWaypointIndex || 0) + 1) % route.waypoints.length;
        bus.waypointProgress = 0;
        const pt = route.waypoints[bus.currentWaypointIndex];
        bus.currentLocation = { lat: pt[0], lng: pt[1] };
        io.emit('buses_update', buses);
      }
    }
  });

  // Driver updates status (e.g. "Boarding", "In Transit", "Delayed")
  socket.on('driver_update_status', ({ busId, status }) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      bus.status = status;
      io.emit('buses_update', buses);
    }
  });

  // Driver updates passenger occupancy
  socket.on('driver_update_passengers', ({ busId, delta, count }) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      if (typeof count === 'number') {
        bus.occupiedSeats = Math.max(0, Math.min(bus.capacity, count));
      } else if (typeof delta === 'number') {
        bus.occupiedSeats = Math.max(0, Math.min(bus.capacity, bus.occupiedSeats + delta));
      }
      io.emit('buses_update', buses);
    }
  });

  // Emergency SOS triggered by driver or admin
  socket.on('send_sos', ({ busId, reason, lat, lng }) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      bus.status = 'EMERGENCY SOS';
    }
    const sosAlert = {
      id: `alert-sos-${Date.now()}`,
      type: 'danger',
      title: `🚨 EMERGENCY SOS: ${bus ? bus.busNumber : 'Bus Alert'}`,
      message: reason || 'Driver reported an immediate emergency or breakdown.',
      routeId: bus ? bus.routeId : 'all',
      priority: 'CRITICAL',
      timestamp: new Date().toISOString()
    };
    alerts.unshift(sosAlert);
    io.emit('buses_update', buses);
    io.emit('new_alert', sosAlert);
    io.emit('alerts_update', alerts);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Serve frontend build if dist folder exists
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start simulator
startSimulator(buses, routes, io);

server.listen(PORT, () => {
  console.log(`🚌 Smart College Transportation Server running on http://localhost:${PORT}`);
});

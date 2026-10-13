# 🚌 Smart College Transportation System

A modern, real-time college bus tracking and transportation management system built with **React**, **Node.js**, **Express**, **Socket.IO**, and **Leaflet**.

---

## 🌟 Key Features

1. **🗺️ Live GPS Radar & Interactive Map View**
   - Real-time simulation of college buses moving along designated city-to-campus routes.
   - Interactive OpenStreetMap (CartoDB Dark Voyager) tiles with smooth GPS waypoint interpolation.
   - Dynamic stop markers showing morning pickup and evening drop schedules.
   - Live telemetry: bus speed (km/h), fuel level, seat occupancy progress, and ETA to the next stop.

2. **🎓 Student Transit Portal**
   - **Search Routes & Pickup Points:** Find nearby stops and scheduled morning/evening timings.
   - **Real-Time Bus ETA & Vacancy:** See available seats before boarding.
   - **Digital Verified Bus Pass:** ID card view with RFID simulation, QR token hash, roll number verification, and print support.

3. **👨‍✈️ Driver Cockpit & Trip Console**
   - **Real-time Telemetry:** Live velocity gauge, fuel monitor, and coordinates.
   - **Trip Controls:** Pause or resume live GPS broadcasting.
   - **Passenger Counter:** Board (+1) and off-board (-1) controls with capacity warnings.
   - **Emergency SOS:** Direct critical alarm broadcasting to the campus control room.

4. **🛡️ Admin Fleet Command Hub**
   - **Fleet Overview KPIs:** Active buses count, route coverage, total passengers en-route, and fleet efficiency.
   - **Driver Assignments:** Complete driver registry with direct contact and license records.
   - **Broadcast Notifications:** Push emergency alerts or traffic delay notifications live to all students and drivers.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Start the Backend Server
```bash
# Open a terminal:
cd server
npm start
```
The server will run on `http://localhost:5000` and start the GPS simulation engine with Socket.IO.

### 2. Start the Frontend Client
```bash
# Open a second terminal:
cd client
npm run dev
```
The client will launch on `http://localhost:5173`. Open your browser and navigate to `http://localhost:5173` to interact with the system!

---

## 📁 Project Architecture

```
smart college transportation system/
├── package.json               # Root scripts
├── server/                    # Node.js + Express + Socket.IO Backend
│   ├── server.js              # Express app & real-time Socket.IO handler
│   ├── simulator.js           # GPS movement simulation engine
│   ├── package.json
│   └── data/
│       ├── routes.json        # Campus routes, stops, and waypoints
│       ├── buses.json         # Fleet dataset
│       ├── drivers.json       # Driver profiles
│       ├── students.json      # Student registration & bus pass tokens
│       └── alerts.json        # System announcements & emergency logs
└── client/                    # React 18 + Vite + Leaflet Frontend
    ├── index.html             # Tailwind & Leaflet styles
    ├── vite.config.js         # Proxy configuration for API & WebSocket
    └── src/
        ├── App.jsx            # Main app container & real-time socket events
        ├── socket.js          # Socket.IO client connection
        └── components/
            ├── Navbar.jsx     # Navigation and role switcher
            ├── MapView.jsx    # Leaflet interactive map with animated bus icons
            ├── StudentPortal.jsx # Route search, timetables & digital pass
            ├── DriverPortal.jsx  # Telemetry, passenger count & SOS trigger
            └── AdminDashboard.jsx# Fleet KPIs, dispatch table & broadcast center
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/routes` | Get all campus routes and stop timings |
| `GET` | `/api/buses` | Get real-time status of all fleet vehicles |
| `GET` | `/api/drivers` | Get driver profiles and assignments |
| `GET` | `/api/students/verify/:rollNo` | Verify a student roll number for bus pass |
| `GET` | `/api/alerts` | Get active announcements and emergency logs |
| `POST` | `/api/alerts` | Broadcast a new notice or emergency alert |
| `PUT` | `/api/buses/:id` | Update bus status or attributes |

---

## ⚡ Real-Time Socket.IO Events

- `init_state`: Initial snapshot of routes, buses, drivers, and alerts.
- `buses_update`: Emitted every 1.6s with updated GPS positions and ETAs.
- `driver_toggle_sim`: Toggle GPS movement for a vehicle.
- `driver_update_passengers`: Live passenger count change.
- `send_sos`: Critical emergency SOS broadcast.
- `new_alert`: Push notification broadcasted system-wide.

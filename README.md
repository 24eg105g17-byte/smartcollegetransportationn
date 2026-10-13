# 🚌 Smart College Transportation System

A modern, real-time college bus tracking and transportation management system built with **React 18**, **Node.js**, **Express**, **Socket.IO**, and **Leaflet**.

---

## 🌟 Key Features

1. **🗺️ Live GPS Radar & Interactive Map View**
   - Real-time simulation of college buses moving along designated city-to-campus routes.
   - Interactive OpenStreetMap tiles with smooth GPS waypoint interpolation.
   - Dynamic stop markers showing morning pickup and evening drop schedules.
   - Live telemetry: bus speed (km/h), fuel level, seat occupancy progress, and ETA to the next stop.

2. **🎓 Student Transit Portal**
   - **Search Routes & Pickup Points:** Find nearby stops and scheduled morning/evening timings.
   - **Real-Time Bus ETA & Vacancy:** See available seats before boarding.
   - **Digital Verified Bus Pass:** ID card view with RFID simulation, QR token hash, roll number verification, and print support.

3. **👨‍✈️ Driver Cockpit & Trip Console**
   - **Real-time Telemetry:** Live velocity gauge, fuel monitor, and coordinates.
   - **Trip Controls:** Pause or resume live GPS broadcasting, speed regulation, and manual step-to-stop.
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
# In terminal 1:
cd backend
npm install
npm start
```
The server runs on `http://localhost:5000` and starts the real-time GPS simulation engine with Socket.IO.

### 2. Start the Frontend Client
```bash
# In terminal 2:
cd frontend
npm install
npm run dev
```
The client launches on `http://localhost:5173`. Open your browser and navigate to `http://localhost:5173` to interact with the system!

### 3. Windows 1-Click Launch
On Windows, simply double-click `start.bat` in the root folder to start both servers automatically.

---

## 🌐 Deploy to Vercel

This repository is optimized for Vercel deployment:

1. Import this repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Standard Vite settings apply automatically:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. SPA route rewrites in `vercel.json` route all requests to `index.html` seamlessly.
5. The app includes client-side fallback telemetry so the interactive map, routes, driver console, student pass, and admin alerts run smoothly on serverless environments!

---

## 📁 Project Architecture

```
smartcollegetransportationn/
├── package.json               # Root scripts & Vercel build definition
├── vercel.json                # Vercel deployment configuration
├── start.bat                  # 1-click launcher for Windows
├── backend/                   # Node.js + Express + Socket.IO Backend
│   ├── server.js              # Express app & real-time Socket.IO handler
│   ├── simulator.js           # GPS movement simulation engine
│   ├── package.json
│   ├── .env.example
│   └── data/
│       ├── routes.json        # Campus routes, stops, and waypoints
│       ├── buses.json         # Fleet dataset
│       ├── drivers.json       # Driver profiles
│       ├── students.json      # Student registration & bus pass tokens
│       └── alerts.json        # System announcements & emergency logs
└── frontend/                  # React 18 + Vite + Leaflet Frontend
    ├── index.html             # Full-height styles & meta configuration
    ├── vite.config.js         # Proxy configuration for API & WebSocket
    ├── package.json
    ├── .env.example
    └── src/
        ├── App.jsx            # Main app container & real-time socket events
        ├── socket.js          # Socket.IO client connection
        ├── data/              # Fallback datasets for serverless deployments
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
- `buses_update`: Emitted every 1.5s with updated GPS positions and ETAs.
- `driver_toggle_sim`: Toggle GPS movement for a vehicle.
- `driver_update_speed`: Dynamically update vehicle velocity.
- `driver_advance_stop`: Manually step vehicle to next waypoint.
- `driver_update_passengers`: Live passenger count change.
- `send_sos`: Critical emergency SOS broadcast.
- `new_alert`: Push notification broadcasted system-wide.

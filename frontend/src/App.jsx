import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import StudentPortal from './components/StudentPortal';
import DriverPortal from './components/DriverPortal';
import AdminDashboard from './components/AdminDashboard';
import { socket } from './socket';

import defaultRoutes from './data/routes.json';
import defaultBuses from './data/buses.json';
import defaultDrivers from './data/drivers.json';
import defaultAlerts from './data/alerts.json';

// Haversine formula
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [routes, setRoutes] = useState(defaultRoutes);
  const [buses, setBuses] = useState(defaultBuses);
  const [drivers, setDrivers] = useState(defaultDrivers);
  const [alerts, setAlerts] = useState(defaultAlerts);
  const [selectedBusId, setSelectedBusId] = useState('bus-101');
  const [sosAlert, setSosAlert] = useState(null);

  const isConnectedRef = useRef(socket.connected);

  // Fetch initial data from server if available
  const loadData = () => {
    fetch('/api/routes')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setRoutes(data); })
      .catch(() => {});

    fetch('/api/buses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBuses(data);
          if (!selectedBusId) setSelectedBusId(data[0].id);
        }
      })
      .catch(() => {});

    fetch('/api/drivers')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setDrivers(data); })
      .catch(() => {});

    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setAlerts(data); })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  // Socket.IO event listeners
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      isConnectedRef.current = true;
      loadData();
    }

    function onDisconnect() {
      setIsConnected(false);
      isConnectedRef.current = false;
    }

    function onInitState(data) {
      if (data.routes) setRoutes(data.routes);
      if (data.buses && data.buses.length > 0) {
        setBuses(data.buses);
        if (!selectedBusId) setSelectedBusId(data.buses[0].id);
      }
      if (data.drivers) setDrivers(data.drivers);
      if (data.alerts) setAlerts(data.alerts);
    }

    function onBusesUpdate(updatedBuses) {
      setBuses(updatedBuses);
    }

    function onAlertsUpdate(updatedAlerts) {
      setAlerts(updatedAlerts);
    }

    function onNewAlert(alert) {
      setAlerts(prev => [alert, ...prev]);
      if (alert.priority === 'CRITICAL' || alert.type === 'danger') {
        setSosAlert(alert);
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('init_state', onInitState);
    socket.on('buses_update', onBusesUpdate);
    socket.on('alerts_update', onAlertsUpdate);
    socket.on('new_alert', onNewAlert);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('init_state', onInitState);
      socket.off('buses_update', onBusesUpdate);
      socket.off('alerts_update', onAlertsUpdate);
      socket.off('new_alert', onNewAlert);
    };
  }, [selectedBusId]);

  // Client-Side GPS Simulator Fallback (Ensures Vercel and offline deployments always animate)
  useEffect(() => {
    const STEP_SPEED = 0.07;

    const timer = setInterval(() => {
      // If connected to live backend socket, let backend drive telemetry
      if (isConnectedRef.current) return;

      setBuses(prevBuses => {
        return prevBuses.map(bus => {
          if (!bus.isSimulating) return bus;

          const route = routes.find(r => r.id === bus.routeId);
          if (!route || !route.waypoints || route.waypoints.length < 2) return bus;

          const waypoints = route.waypoints;
          const totalPoints = waypoints.length;

          let progress = (bus.waypointProgress || 0) + STEP_SPEED;
          let dir = bus.direction !== undefined ? bus.direction : 1;
          let idx = bus.currentWaypointIndex || 0;

          if (progress >= 1.0) {
            progress = 0.0;
            idx += dir;

            if (idx >= totalPoints - 1) {
              dir = -1;
              idx = totalPoints - 2;
            } else if (idx <= 0) {
              dir = 1;
              idx = 0;
            }
          }

          const safeIdx1 = Math.max(0, Math.min(totalPoints - 1, idx));
          const nextIdx = dir === 1 ? safeIdx1 + 1 : safeIdx1 - 1;
          const safeIdx2 = Math.max(0, Math.min(totalPoints - 1, nextIdx));

          const p1 = waypoints[safeIdx1];
          const p2 = waypoints[safeIdx2] || p1;

          const lat = p1[0] + (p2[0] - p1[0]) * progress;
          const lng = p1[1] + (p2[1] - p1[1]) * progress;

          const baseSpeed = bus.targetSpeed || bus.speed || 40;
          const speedVariation = (Math.random() * 2 - 1);
          const currentSpeed = Math.max(15, Math.min(65, Math.round(baseSpeed + speedVariation)));

          // Nearest stop & ETA
          let nextStop = bus.nextStop;
          let etaNextStop = bus.etaNextStop;
          if (route.stops && route.stops.length > 0) {
            let shortestDist = Infinity;
            let closest = null;
            route.stops.forEach(s => {
              const d = getDistanceKm(lat, lng, s.lat, s.lng);
              if (d < shortestDist) {
                shortestDist = d;
                closest = s;
              }
            });
            if (closest) {
              nextStop = closest.name;
              const etaMin = Math.max(1, Math.round((shortestDist / currentSpeed) * 60));
              etaNextStop = `${etaMin} mins`;
            }
          }

          return {
            ...bus,
            currentLocation: {
              lat: Number(lat.toFixed(5)),
              lng: Number(lng.toFixed(5))
            },
            speed: currentSpeed,
            currentWaypointIndex: safeIdx1,
            waypointProgress: progress,
            direction: dir,
            nextStop,
            etaNextStop,
            lastUpdated: new Date().toISOString()
          };
        });
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [routes]);

  // Tab switcher with window resize dispatch for Leaflet tiles
  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'map') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 150);
    }
  };

  // Optimistic & REST update handler for buses
  const handleUpdateBus = (busId, updates) => {
    setBuses(prev => prev.map(b => b.id === busId ? { ...b, ...updates } : b));
    fetch(`/api/buses/${busId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});
  };

  const handleCreateAlert = (newAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
    if (newAlert.priority === 'CRITICAL' || newAlert.type === 'danger') {
      setSosAlert(newAlert);
    }
  };

  const handleTrackBus = (busId) => {
    setSelectedBusId(busId);
    handleSelectTab('map');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        isConnected={isConnected}
        alertCount={alerts.length}
      />

      {/* Critical SOS Floating Banner */}
      {sosAlert && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg sticky top-16 z-40 animate-pulse">
          <div className="flex items-center space-x-2">
            <span className="text-base">🚨</span>
            <span>{sosAlert.title}: {sosAlert.message}</span>
          </div>
          <button
            onClick={() => setSosAlert(null)}
            className="bg-black/30 hover:bg-black/50 text-white px-2 py-0.5 rounded text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Views */}
      <main className="flex-1 flex flex-col">
        {/* Map tab kept alive in DOM to avoid Leaflet reinitialization errors */}
        <div className={activeTab === 'map' ? 'flex-1 flex flex-col' : 'hidden'}>
          <MapView
            routes={routes}
            buses={buses}
            drivers={drivers}
            selectedBusId={selectedBusId}
            setSelectedBusId={setSelectedBusId}
          />
        </div>

        {activeTab === 'student' && (
          <StudentPortal
            routes={routes}
            buses={buses}
            onTrackBus={handleTrackBus}
          />
        )}

        {activeTab === 'driver' && (
          <DriverPortal
            buses={buses}
            routes={routes}
            drivers={drivers}
            onUpdateBus={handleUpdateBus}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            buses={buses}
            routes={routes}
            drivers={drivers}
            alerts={alerts}
            onTrackBus={handleTrackBus}
            onNewAlert={handleCreateAlert}
          />
        )}
      </main>
    </div>
  );
}

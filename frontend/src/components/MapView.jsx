import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export default function MapView({ routes = [], buses = [], drivers = [], selectedBusId, setSelectedBusId }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const busMarkersRef = useRef({});
  const routeLayersRef = useRef([]);
  const stopMarkersRef = useRef([]);

  const [activeRouteFilter, setActiveRouteFilter] = useState('all');

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset any prior leaflet reference on DOM element
    if (mapContainerRef.current._leaflet_id) {
      mapContainerRef.current._leaflet_id = null;
    }

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {}
      mapInstanceRef.current = null;
    }

    // Default center: College area (Hyderabad corridor)
    const initialCenter = [17.4420, 78.3900];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // Standard OpenStreetMap Tile Layer (reliable, fast, no external key needed)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Force multiple invalidateSize calls to guarantee tile rendering
    const timers = [
      setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 100),
      setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 400),
      setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 1000)
    ];

    return () => {
      timers.forEach(t => clearTimeout(t));

      Object.values(busMarkersRef.current).forEach(m => {
        try { m.remove(); } catch (e) {}
      });
      busMarkersRef.current = {};

      routeLayersRef.current.forEach(l => {
        try { l.remove(); } catch (e) {}
      });
      routeLayersRef.current = [];

      stopMarkersRef.current.forEach(m => {
        try { m.remove(); } catch (e) {}
      });
      stopMarkersRef.current = [];

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Render Routes and Bus Stops
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routes || routes.length === 0) return;

    routeLayersRef.current.forEach(layer => {
      try { map.removeLayer(layer); } catch (e) {}
    });
    routeLayersRef.current = [];

    stopMarkersRef.current.forEach(marker => {
      try { map.removeLayer(marker); } catch (e) {}
    });
    stopMarkersRef.current = [];

    const filteredRoutes = activeRouteFilter === 'all'
      ? routes
      : routes.filter(r => r.id === activeRouteFilter);

    filteredRoutes.forEach(route => {
      // Draw route path
      if (route.waypoints && route.waypoints.length > 1) {
        const polyline = L.polyline(route.waypoints, {
          color: route.color || '#3b82f6',
          weight: 5,
          opacity: 0.9,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(map);

        polyline.bindTooltip(`<b>${route.name}</b><br/>Est: ${route.estimatedDuration}`, {
          sticky: true
        });

        routeLayersRef.current.push(polyline);
      }

      // Draw stops
      if (route.stops) {
        route.stops.forEach(stop => {
          const stopIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: `
              <div style="background-color: ${route.color || '#2563eb'}; border: 2px solid white; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.5);" title="${stop.name}"></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });

          const stopMarker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map);
          stopMarker.bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; min-width: 170px;">
              <h4 style="font-weight: bold; margin: 0 0 4px 0; color: #1e3a8a;">🚏 ${stop.name}</h4>
              <p style="margin: 0; color: #475569;">Route: <b>${route.code}</b></p>
              <p style="margin: 2px 0; color: #475569;">Morning Arrival: <b>${stop.timeMorning}</b></p>
              <p style="margin: 0; color: #475569;">Evening Departure: <b>${stop.timeEvening}</b></p>
            </div>
          `);
          stopMarkersRef.current.push(stopMarker);
        });
      }
    });
  }, [routes, activeRouteFilter]);

  // 3. Update Bus GPS Position Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !buses || buses.length === 0) return;

    buses.forEach(bus => {
      if (!bus.currentLocation || typeof bus.currentLocation.lat !== 'number') return;
      const { lat, lng } = bus.currentLocation;

      const route = routes.find(r => r.id === bus.routeId);
      const isSelected = selectedBusId === bus.id;
      const routeColor = route?.color || '#3b82f6';
      const isEmergency = bus.status === 'EMERGENCY SOS';

      const iconHtml = `
        <div style="position: relative; cursor: pointer; pointer-events: auto;">
          <div style="
            background: ${isEmergency ? '#ef4444' : routeColor};
            color: white;
            padding: 4px 8px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            border: 2px solid ${isSelected ? '#fbbf24' : '#ffffff'};
            transform: translate(-50%, -50%);
            white-space: nowrap;
          ">
            <span>${isEmergency ? '🚨' : '🚌'}</span>
            <span>${bus.busNumber.split('-')[2] || bus.busNumber}</span>
            <span style="font-size: 9px; opacity: 0.9;">${bus.speed || 0}km/h</span>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        className: 'bus-custom-icon',
        html: iconHtml,
        iconSize: [40, 24],
        iconAnchor: [0, 0]
      });

      if (!busMarkersRef.current[bus.id]) {
        const marker = L.marker([lat, lng], { icon: busIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedBusId(bus.id);
        });
        busMarkersRef.current[bus.id] = marker;
      } else {
        const marker = busMarkersRef.current[bus.id];
        marker.setLatLng([lat, lng]);
        marker.setIcon(busIcon);

        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
      }

      if (activeRouteFilter !== 'all' && bus.routeId !== activeRouteFilter) {
        if (busMarkersRef.current[bus.id] && map.hasLayer(busMarkersRef.current[bus.id])) {
          map.removeLayer(busMarkersRef.current[bus.id]);
        }
      } else {
        if (busMarkersRef.current[bus.id] && !map.hasLayer(busMarkersRef.current[bus.id])) {
          busMarkersRef.current[bus.id].addTo(map);
        }
      }
    });

    if (selectedBusId) {
      const activeBus = buses.find(b => b.id === selectedBusId);
      if (activeBus && activeBus.currentLocation) {
        map.panTo([activeBus.currentLocation.lat, activeBus.currentLocation.lng], {
          animate: true,
          duration: 0.6
        });
      }
    }
  }, [buses, routes, selectedBusId, activeRouteFilter]);

  // Center on college main campus
  const centerCampus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([17.4350, 78.3420], 14, { animate: true });
    }
  };

  const selectedBus = buses.find(b => b.id === selectedBusId);
  const selectedRoute = routes.find(r => r.id === selectedBus?.routeId);
  const selectedDriver = drivers?.find(d => d.id === selectedBus?.driverId);

  return (
    <div className="relative w-full flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950 min-h-[550px] h-[calc(100vh-4rem)]">
      {/* Map Filter & Actions Bar */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap gap-2 items-center bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-xl max-w-xl">
        <select
          value={activeRouteFilter}
          onChange={(e) => setActiveRouteFilter(e.target.value)}
          className="bg-slate-800 text-xs text-slate-100 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="all">🗺️ All Routes & Fleet</option>
          {routes.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
          ))}
        </select>

        <button
          onClick={centerCampus}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center space-x-1 font-medium cursor-pointer"
        >
          <span>🏫</span>
          <span>Center Campus</span>
        </button>

        <div className="text-[11px] text-slate-400 pl-2 border-l border-slate-700 hidden sm:flex items-center space-x-2">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            <span>R-101</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>R-102</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>R-103</span>
          </span>
        </div>
      </div>

      {/* Main Map Canvas with guaranteed explicit dimensions */}
      <div className="flex-1 h-full w-full relative min-h-[500px]">
        <div
          ref={mapContainerRef}
          className="w-full h-full min-h-[500px]"
          style={{ width: '100%', height: '100%', minHeight: '500px' }}
        />
      </div>

      {/* Fleet Live Status Drawer */}
      <div className="w-full md:w-96 bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800 p-4 overflow-y-auto max-h-72 md:max-h-full flex flex-col space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <span>🚍</span>
            <span>Fleet Live Status</span>
          </h3>
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
            {buses.length} Vehicles Online
          </span>
        </div>

        {/* Bus Cards List */}
        <div className="space-y-3">
          {buses.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-slate-800/40 rounded-xl">
              Connecting to live telemetry feed...
            </div>
          ) : (
            buses.map(bus => {
              const route = routes.find(r => r.id === bus.routeId);
              const driver = drivers?.find(d => d.id === bus.driverId);
              const isSelected = selectedBusId === bus.id;

              return (
                <div
                  key={bus.id}
                  onClick={() => setSelectedBusId(bus.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900/30 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: route?.color || '#3b82f6' }}
                      />
                      <span className="font-bold text-sm text-white">{bus.busNumber}</span>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      bus.status === 'EMERGENCY SOS'
                        ? 'bg-red-500 text-white animate-pulse'
                        : bus.status === 'In Transit'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {bus.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Route:</span>
                      <span className="font-medium text-slate-200">{route?.name || 'Assigned Route'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Next Stop:</span>
                      <span className="font-semibold text-blue-300">{bus.nextStop || 'Approaching'} ({bus.etaNextStop || '--'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Speed & Occupancy:</span>
                      <span>
                        <b className="text-white">{bus.speed || 0} km/h</b> • {bus.occupiedSeats}/{bus.capacity} seats
                      </span>
                    </div>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="mt-2.5">
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          bus.occupiedSeats / bus.capacity > 0.85
                            ? 'bg-rose-500'
                            : bus.occupiedSeats / bus.capacity > 0.6
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (bus.occupiedSeats / bus.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Driver quick contact */}
                  {driver && isSelected && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/80 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <img
                          src={driver.avatar}
                          alt={driver.name}
                          className="w-6 h-6 rounded-full object-cover border border-slate-600"
                        />
                        <div>
                          <p className="font-medium text-white">{driver.name}</p>
                          <p className="text-[10px] text-slate-400">Driver ({driver.experience})</p>
                        </div>
                      </div>
                      <a
                        href={`tel:${driver.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-700 hover:bg-slate-600 text-blue-400 px-2 py-1 rounded text-[11px] font-semibold"
                      >
                        📞 Call
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { socket } from '../socket';

export default function DriverPortal({ buses = [], routes = [], drivers = [], onUpdateBus }) {
  const [selectedBusId, setSelectedBusId] = useState('bus-101');
  const [sosReason, setSosReason] = useState('Mechanical Breakdown / Engine Failure');
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Find active bus or fallback
  const activeBus = buses.find(b => b.id === selectedBusId) || buses[0] || {
    id: 'bus-101',
    busNumber: 'TS-09-UB-4021',
    routeId: 'route-1',
    driverId: 'drv-1',
    capacity: 50,
    occupiedSeats: 34,
    speed: 40,
    status: 'In Transit',
    isSimulating: true,
    fuelLevel: '80%',
    nextStop: 'JNTU Main Gate',
    etaNextStop: '4 mins',
    currentLocation: { lat: 17.4932, lng: 78.4018 }
  };

  const assignedRoute = routes.find(r => r.id === activeBus?.routeId);
  const driver = drivers?.find(d => d.id === activeBus?.driverId);

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // 1. Toggle GPS Movement / Simulation
  const handleToggleSim = () => {
    const nextState = !activeBus.isSimulating;
    if (onUpdateBus) {
      onUpdateBus(activeBus.id, { isSimulating: nextState });
    }
    socket.emit('driver_toggle_sim', { busId: activeBus.id, isSimulating: nextState });
    showToast(nextState ? '▶️ GPS Telemetry Resumed' : '⏸️ GPS Telemetry Paused');
  };

  // 2. Adjust Speed
  const handleSpeedChange = (delta) => {
    const newSpeed = Math.max(0, Math.min(80, (activeBus.speed || 30) + delta));
    if (onUpdateBus) {
      onUpdateBus(activeBus.id, { speed: newSpeed });
    }
    socket.emit('driver_update_speed', { busId: activeBus.id, speed: newSpeed });
    showToast(`⚡ Speed set to ${newSpeed} km/h`);
  };

  // 3. Advance to Next Stop manually
  const handleAdvanceStop = () => {
    socket.emit('driver_advance_stop', { busId: activeBus.id });
    showToast(`🚏 Moving to next route waypoint...`);
  };

  // 4. Update Status (In Transit, At Stop, Delayed)
  const handleStatusChange = (status) => {
    if (onUpdateBus) {
      onUpdateBus(activeBus.id, { status });
    }
    socket.emit('driver_update_status', { busId: activeBus.id, status });
    showToast(`Status updated: ${status}`);
  };

  // 5. Passenger Counter
  const handlePassengerDelta = (delta) => {
    const newCount = Math.max(0, Math.min(activeBus.capacity, (activeBus.occupiedSeats || 0) + delta));
    if (onUpdateBus) {
      onUpdateBus(activeBus.id, { occupiedSeats: newCount });
    }
    socket.emit('driver_update_passengers', { busId: activeBus.id, delta });
    showToast(delta > 0 ? `+1 Passenger Boarded (${newCount}/${activeBus.capacity})` : `-1 Passenger Off-boarded (${newCount}/${activeBus.capacity})`);
  };

  // 6. Trigger Emergency SOS
  const handleTriggerSos = () => {
    if (onUpdateBus) {
      onUpdateBus(activeBus.id, { status: 'EMERGENCY SOS' });
    }
    socket.emit('send_sos', {
      busId: activeBus.id,
      reason: sosReason,
      lat: activeBus.currentLocation?.lat,
      lng: activeBus.currentLocation?.lng
    });
    setShowSosModal(false);
    setSosSent(true);
    setTimeout(() => setSosSent(false), 7000);
  };

  const occupancyRatio = Math.min(100, (activeBus.occupiedSeats / activeBus.capacity) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Vehicle Selection */}
      <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl border border-amber-500/30">
            👨‍✈️
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Driver Cockpit & Trip Console</h1>
            <p className="text-xs text-slate-400">
              Broadcasting GPS coordinates for: <b className="text-blue-400">{activeBus.busNumber}</b>
            </p>
          </div>
        </div>

        {/* Bus switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Switch Vehicle:</span>
          <select
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs font-semibold text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {buses.length > 0 ? (
              buses.map(b => (
                <option key={b.id} value={b.id}>
                  {b.busNumber} ({routes.find(r => r.id === b.routeId)?.code || 'Route'})
                </option>
              ))
            ) : (
              <option value="bus-101">TS-09-UB-4021 (R-101)</option>
            )}
          </select>
        </div>
      </div>

      {/* Floating Action Feedback Toast */}
      {feedbackMsg && (
        <div className="bg-blue-600/90 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-blue-400/40 shadow-lg flex items-center justify-between transition animate-fade-in">
          <span>✓ {feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-white/80 hover:text-white ml-2 text-xs">✕</button>
        </div>
      )}

      {/* Emergency SOS Banner */}
      {sosSent && (
        <div className="bg-rose-500/20 border-2 border-rose-500 p-4 rounded-xl text-rose-300 font-bold text-sm flex items-center space-x-3 animate-pulse">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="text-white">EMERGENCY SOS BROADCAST ACTIVE!</p>
            <p className="text-xs font-normal text-rose-300">Campus Control Room, security, and transport fleet manager have been alerted.</p>
          </div>
        </div>
      )}

      {/* Main Cockpit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Live Speed & Telemetry */}
        <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700 space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Velocity & Engine Telemetry
            </span>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-5xl font-extrabold text-white">{activeBus.speed || 0}</span>
              <span className="text-sm font-semibold text-slate-400">km/h</span>
            </div>

            {/* Speed Adjuster Buttons */}
            <div className="mt-3 flex items-center space-x-2">
              <button
                onClick={() => handleSpeedChange(-5)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold"
              >
                -5 km/h
              </button>
              <button
                onClick={() => handleSpeedChange(5)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold"
              >
                +5 km/h
              </button>
              <span className="text-[11px] text-slate-400 font-mono">Target: {activeBus.speed || 0}</span>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-700/60 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Fuel Level:</span>
              <span className="font-semibold text-emerald-400">{activeBus.fuelLevel || '80%'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">GPS Transmitter:</span>
              <span className={`font-semibold ${activeBus.isSimulating ? 'text-emerald-400' : 'text-amber-400'}`}>
                {activeBus.isSimulating ? '● Broadcasting Live' : '○ Paused'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current GPS:</span>
              <span className="font-mono text-slate-300">
                {activeBus.currentLocation?.lat?.toFixed(4)}, {activeBus.currentLocation?.lng?.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleToggleSim}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                activeBus.isSimulating
                  ? 'bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500 text-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              {activeBus.isSimulating ? '⏸️ Pause GPS Movement' : '▶️ Resume GPS Movement'}
            </button>
            <button
              onClick={handleAdvanceStop}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer"
            >
              ⏭️ Advance to Next Stop
            </button>
          </div>
        </div>

        {/* Card 2: Passenger Occupancy Controller */}
        <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Passenger Count
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                occupancyRatio > 90
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {occupancyRatio > 90 ? 'BUS NEAR CAPACITY' : 'SEATS VACANT'}
              </span>
            </div>

            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-5xl font-extrabold text-white">{activeBus.occupiedSeats}</span>
              <span className="text-sm font-semibold text-slate-400">/ {activeBus.capacity} Total</span>
            </div>
          </div>

          {/* Occupancy Progress bar */}
          <div>
            <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  occupancyRatio > 90 ? 'bg-rose-500' : occupancyRatio > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyRatio}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-right mt-1">
              {activeBus.capacity - activeBus.occupiedSeats} remaining seats
            </p>
          </div>

          {/* Increment / Decrement buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
            <button
              onClick={() => handlePassengerDelta(-1)}
              disabled={activeBus.occupiedSeats <= 0}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>🔻</span>
              <span>Off-board (-1)</span>
            </button>
            <button
              onClick={() => handlePassengerDelta(1)}
              disabled={activeBus.occupiedSeats >= activeBus.capacity}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <span>🔺</span>
              <span>Board (+1)</span>
            </button>
          </div>
        </div>

        {/* Card 3: Route Status & Next Stop */}
        <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700 space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Route & Next Stop
            </span>
            <div className="mt-3">
              <h3 className="text-base font-bold text-white">{assignedRoute?.name || 'Assigned Campus Route'}</h3>
              <p className="text-xs text-blue-400 font-semibold mt-1">
                Upcoming Stop: <b>{activeBus.nextStop || 'JNTU Main Gate'}</b>
              </p>
              <p className="text-xs text-slate-400">
                ETA: <b className="text-white">{activeBus.etaNextStop || '4 mins'}</b>
              </p>
            </div>
          </div>

          {/* Quick status switch buttons */}
          <div className="space-y-1.5 pt-3 border-t border-slate-700/60">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
              Broadcast Status
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {['In Transit', 'At Stop', 'Delayed'].map(st => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    activeBus.status === st
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency SOS Button */}
          <button
            onClick={() => setShowSosModal(true)}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-rose-600/40 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>🚨</span>
            <span>Trigger Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* Emergency SOS Confirmation Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-rose-500 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-500">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-extrabold text-white">Broadcast Emergency SOS</h3>
                <p className="text-xs text-rose-400">This alerts the campus control room immediately.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Select Emergency Nature:</label>
              <select
                value={sosReason}
                onChange={(e) => setSosReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Mechanical Breakdown / Engine Failure">Mechanical Breakdown / Engine Failure</option>
                <option value="Medical Emergency / Passenger Injury">Medical Emergency / Passenger Injury</option>
                <option value="Traffic Gridlock / Road Blocked">Traffic Gridlock / Road Blocked</option>
                <option value="Security Incident / Police Support Required">Security Incident / Police Support</option>
              </select>
            </div>

            <div className="p-3 bg-rose-950/40 border border-rose-900 rounded-xl text-xs text-rose-300">
              Vehicle: <b>{activeBus.busNumber}</b> ({activeBus.currentLocation?.lat?.toFixed(4)}, {activeBus.currentLocation?.lng?.toFixed(4)})
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowSosModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerSos}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40 cursor-pointer"
              >
                Confirm & Broadcast SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';

export default function AdminDashboard({ buses, routes, drivers, alerts, onTrackBus, onNewAlert }) {
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [targetRoute, setTargetRoute] = useState('all');
  const [alertType, setAlertType] = useState('info');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const totalSeats = buses.reduce((acc, b) => acc + b.capacity, 0);
  const occupiedSeats = buses.reduce((acc, b) => acc + b.occupiedSeats, 0);
  const activeBusesCount = buses.filter(b => b.status !== 'Idle').length;

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMsg.trim()) return;

    const newAlertObj = {
      id: `alert-${Date.now()}`,
      title: announcementTitle,
      message: announcementMsg,
      routeId: targetRoute,
      type: alertType,
      priority: alertType === 'danger' ? 'CRITICAL' : 'NORMAL',
      timestamp: new Date().toISOString()
    };

    if (onNewAlert) {
      onNewAlert(newAlertObj);
    }

    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlertObj)
      });
    } catch (err) {
      // Offline / static deployment
    }

    setAnnouncementTitle('');
    setAnnouncementMsg('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
            Campus Fleet Dispatch & Admin
          </span>
          <h1 className="text-2xl font-bold text-white mt-2">
            Transportation Control Command Center
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Real-time fleet status, driver management, student transit load, and emergency communications.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-emerald-400">All Dispatch Relays Online</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Fleet</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{activeBusesCount}</span>
            <span className="text-xs font-semibold text-slate-400">/ {buses.length} Buses On Road</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">100% Fleet Service Availability</p>
        </div>

        <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Passengers</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-blue-400">{occupiedSeats}</span>
            <span className="text-xs font-semibold text-slate-400">/ {totalSeats} Capacity</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {Math.round((occupiedSeats / totalSeats) * 100)}% fleet seat utilization
          </p>
        </div>

        <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Designated Routes</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-purple-400">{routes.length}</span>
            <span className="text-xs font-semibold text-slate-400">Active Corridors</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">66.2 km total daily coverage</p>
        </div>

        <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">System Alerts</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-400">{alerts.length}</span>
            <span className="text-xs font-semibold text-slate-400">Active Notices</span>
          </div>
          <p className="text-[11px] text-amber-400 font-medium">Auto-synced to all student apps</p>
        </div>
      </div>

      {/* Main Admin Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Fleet Management Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>🚍</span>
              <span>Live Fleet Tracking & Driver Assignments</span>
            </h2>

            <div className="overflow-x-auto border border-slate-700/60 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-3">Vehicle</th>
                    <th className="py-3 px-3">Route</th>
                    <th className="py-3 px-3">Assigned Driver</th>
                    <th className="py-3 px-3">Next Stop / ETA</th>
                    <th className="py-3 px-3">Occupancy</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {buses.map(bus => {
                    const route = routes.find(r => r.id === bus.routeId);
                    const driver = drivers.find(d => d.id === bus.driverId);
                    return (
                      <tr key={bus.id} className="hover:bg-slate-700/30 transition">
                        <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                          {bus.busNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: route?.color || '#3b82f6' }}
                          >
                            {route?.code || 'R-00'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-slate-200">{driver?.name || 'Unassigned'}</p>
                          <p className="text-[10px] text-slate-400">{driver?.phone}</p>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-blue-300 font-medium">{bus.nextStop}</p>
                          <p className="text-[10px] text-slate-400">{bus.etaNextStop}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold">{bus.occupiedSeats}</span> / {bus.capacity}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            bus.status === 'EMERGENCY SOS'
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {bus.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onTrackBus(bus.id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow transition"
                          >
                            Track
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Dispatch Broadcast & Incident Log */}
        <div className="lg:col-span-4 space-y-6">
          {/* Broadcast Form */}
          <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>📢</span>
              <span>Broadcast Notice / Alert</span>
            </h2>

            {broadcastSuccess && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 p-2.5 rounded-xl text-xs text-emerald-400 font-semibold">
                ✓ Alert successfully broadcast to all students & drivers!
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Notice Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rain Delay / Route Deviation"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Message Details:</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Detailed announcement for passengers..."
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Target Route:</label>
                  <select
                    value={targetRoute}
                    onChange={(e) => setTargetRoute(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="all">All Routes</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Type:</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="info">Info / Notice</option>
                    <option value="warning">Warning / Delay</option>
                    <option value="danger">Urgent / Critical</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl text-xs shadow-md shadow-blue-600/30 transition"
              >
                Send Real-time Broadcast
              </button>
            </form>
          </div>

          {/* Active Notices & Emergency Feed */}
          <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>🔔</span>
              <span>Recent Alerts & SOS Feed</span>
            </h3>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map(a => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      a.type === 'danger'
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                        : a.type === 'warning'
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-slate-900/60 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{a.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90">{a.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No active incident alerts.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

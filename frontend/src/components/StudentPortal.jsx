import React, { useState } from 'react';
import defaultStudents from '../data/students.json';

export default function StudentPortal({ routes, buses, onTrackBus }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('route-1');
  const [rollInput, setRollInput] = useState('21A91A0501');
  const [studentPass, setStudentPass] = useState({
    name: 'Sai Chandana Gokaraju',
    rollNo: '21A91A0501',
    department: 'Computer Science & Engineering',
    year: '4th Year (2023-2027)',
    routeCode: 'R-101 (North Express)',
    pickupStop: 'JNTU Main Gate',
    validUntil: '31-Dec-2026',
    passType: 'Annual RFID Smart Pass',
    status: 'ACTIVE / VERIFIED',
    qrToken: 'SCTS-PASS-21A91A0501-VERIFIED'
  });
  const [verificationMsg, setVerificationMsg] = useState(null);

  const selectedRoute = routes.find(r => r.id === selectedRouteId);
  const busOnRoute = buses.find(b => b.routeId === selectedRouteId);

  // Verify pass against backend or local dataset fallback
  const handleVerifyRoll = async () => {
    const cleanRoll = rollInput.trim().toUpperCase();
    try {
      const res = await fetch(`/api/students/verify/${cleanRoll}`);
      if (res.ok) {
        const data = await res.json();
        updateStudentView(data.student);
        return;
      }
    } catch (err) {
      // Fallback to local dataset on static Vercel deployment
    }

    // Local lookup
    const localMatch = defaultStudents.find(s => s.rollNo.toUpperCase() === cleanRoll);
    if (localMatch) {
      updateStudentView(localMatch);
    } else {
      setVerificationMsg({ type: 'error', text: `Roll number "${cleanRoll}" not found in registry.` });
    }
  };

  const updateStudentView = (s) => {
    const matchingRoute = routes.find(r => r.id === s.routeId);
    setStudentPass({
      name: s.name,
      rollNo: s.rollNo,
      department: s.department,
      year: s.year,
      routeCode: matchingRoute ? `${matchingRoute.code} (${matchingRoute.name})` : s.routeId,
      pickupStop: s.pickupStop,
      validUntil: s.passValidUntil,
      passType: s.passType,
      status: 'ACTIVE / VERIFIED',
      qrToken: s.qrToken
    });
    setVerificationMsg({ type: 'success', text: `Pass verified for ${s.name}!` });
  };

  const filteredStops = selectedRoute?.stops?.filter(stop =>
    stop.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 p-6 rounded-2xl border border-blue-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            Student Transport Portal
          </span>
          <h1 className="text-2xl font-bold text-white mt-2">
            Campus Route Timetable & Digital Pass
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Check real-time bus arrivals, look up schedule timings for your stop, and access your college bus pass.
          </p>
        </div>
        {busOnRoute && (
          <button
            onClick={() => onTrackBus(busOnRoute.id)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 text-sm cursor-pointer"
          >
            <span>🛰️</span>
            <span>Track Bus {busOnRoute.busNumber} Live</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Routes & Schedule Timetable */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>🚏</span>
              <span>Find Bus Timetable & Stops</span>
            </h2>

            {/* Route Tabs */}
            <div className="flex flex-wrap gap-2">
              {routes.map(route => {
                const isSelected = route.id === selectedRouteId;
                return (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {route.code} • {route.name.split('-')[1] || route.name}
                  </button>
                );
              })}
            </div>

            {/* Live Bus Tracker Mini Banner */}
            {busOnRoute && (
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/80 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-400">BUS EN-ROUTE</span>
                    <span className="text-xs text-slate-400">({busOnRoute.busNumber})</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Next Stop: <span className="text-blue-400">{busOnRoute.nextStop}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Estimated Time: <b className="text-slate-200">{busOnRoute.etaNextStop}</b> • Speed: <b className="text-slate-200">{busOnRoute.speed} km/h</b>
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    busOnRoute.occupiedSeats >= busOnRoute.capacity - 5
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {Math.max(0, busOnRoute.capacity - busOnRoute.occupiedSeats)} Seats Left
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {busOnRoute.occupiedSeats}/{busOnRoute.capacity} Occupied
                  </p>
                </div>
              </div>
            )}

            {/* Search Stop Bar */}
            <div>
              <input
                type="text"
                placeholder="Search pickup point (e.g., JNTU, Begumpet, Tolichowki)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stops Table */}
            <div className="overflow-hidden border border-slate-700/60 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Pickup / Drop Point</th>
                    <th className="py-2.5 px-3">Morning Pickup</th>
                    <th className="py-2.5 px-3">Evening Return</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredStops.length > 0 ? (
                    filteredStops.map((stop) => {
                      const isNext = busOnRoute?.nextStop === stop.name;
                      return (
                        <tr
                          key={stop.id}
                          className={`transition ${isNext ? 'bg-blue-900/30 font-semibold' : 'hover:bg-slate-700/30'}`}
                        >
                          <td className="py-3 px-3 text-slate-400">{stop.order}</td>
                          <td className="py-3 px-3 font-medium text-white flex items-center space-x-1.5">
                            {isNext && <span className="text-blue-400 animate-bounce">📍</span>}
                            <span>{stop.name}</span>
                          </td>
                          <td className="py-3 px-3 text-emerald-400 font-semibold">{stop.timeMorning}</td>
                          <td className="py-3 px-3 text-amber-400">{stop.timeEvening}</td>
                          <td className="py-3 px-3 text-right">
                            {isNext ? (
                              <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Approaching ({busOnRoute.etaNextStop})
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Scheduled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-400">
                        No bus stops match "{searchQuery}" on this route.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Digital Student Pass */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800/70 p-5 rounded-2xl border border-slate-700 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>💳</span>
              <span>Digital College Bus Pass</span>
            </h2>

            {/* Pass Lookup Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter Student Roll No (e.g. 21A91A0501)"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleVerifyRoll}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                Verify Pass
              </button>
            </div>

            {verificationMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-medium ${
                verificationMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {verificationMsg.text}
              </div>
            )}

            {/* Digital Pass Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border-2 border-indigo-500/40 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 opacity-5 text-indigo-400 pointer-events-none select-none text-[180px]">
                🚌
              </div>

              {/* Pass Header */}
              <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-base">
                    🎓
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-white tracking-wider uppercase">
                      College Transport Board
                    </h3>
                    <p className="text-[10px] text-indigo-300">Official Student Transit Pass</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {studentPass.status}
                </span>
              </div>

              {/* Student Details Grid */}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-300">Student Name</span>
                  <p className="font-bold text-white text-sm">{studentPass.name}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-300">Roll Number</span>
                  <p className="font-mono font-bold text-blue-300 text-sm">{studentPass.rollNo}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-300">Branch & Dept</span>
                  <p className="font-medium text-slate-200">{studentPass.department}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-300">Academic Year</span>
                  <p className="font-medium text-slate-200">{studentPass.year}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-300">Designated Stop</span>
                  <p className="font-bold text-emerald-400">{studentPass.pickupStop}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-indigo-300">Valid Until</span>
                  <p className="font-medium text-amber-300">{studentPass.validUntil}</p>
                </div>
              </div>

              {/* QR Code & Print button */}
              <div className="mt-5 pt-3 border-t border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-white p-1 rounded-lg shadow flex flex-col justify-between">
                    <svg viewBox="0 0 24 24" className="w-full h-full text-slate-900 fill-current">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h4v2h-4v-2zm-4 0h2v2h-2v-2zm2 4h4v2h-4v-2zm-2 2h2v2h-2v-2zm4-4h2v2h-2v-2zM6 6h2v2H6V6zm10 0h2v2h-2V6zm-10 12h2v2H6v-2zm6-8h2v2h-2v-2zm4 2h2v2h-2v-2zm-2 2h2v2h-2v-2z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Token Hash</span>
                    <span className="text-[11px] font-mono text-indigo-300">{studentPass.qrToken.slice(0, 16)}...</span>
                    <span className="text-[9px] text-emerald-400 block font-semibold">✓ RFID Tap Enabled</span>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  🖨️ Print Pass
                </button>
              </div>
            </div>

            {/* Helpline Info */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200 flex items-center space-x-1">
                <span>📞</span>
                <span>Campus Transport Office Helpline:</span>
              </p>
              <p>Direct Desk: <b>+91 (040) 2345-6789</b></p>
              <p>Email: <b>transport-helpdesk@college.edu</b></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

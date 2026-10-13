import React from 'react';

export default function Navbar({ activeTab, setActiveTab, isConnected, alertCount }) {
  const tabs = [
    { id: 'map', label: 'Live Bus Radar', icon: '🗺️' },
    { id: 'student', label: 'Student Pass & Routes', icon: '🎓' },
    { id: 'driver', label: 'Driver Cockpit', icon: '👨‍✈️' },
    { id: 'admin', label: 'Admin Fleet Hub', icon: '🛡️' }
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & College Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('map')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              🚌
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                UniTransit Smart
              </span>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                College Transportation & Tracking
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'admin' && alertCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
              }`} />
              <span>{isConnected ? 'GPS Live Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Mobile Submenu */}
        <div className="md:hidden flex space-x-1 py-2 overflow-x-auto border-t border-slate-800/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-300 bg-slate-800/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

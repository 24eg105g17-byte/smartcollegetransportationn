import React from 'react';
import { User, LogOut, Shield, Award } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  isConnected,
  alertCount,
  currentUser,
  onOpenLogin,
  onOpenSignup,
  onLogout
}) {
  const tabs = [
    { id: 'map', label: 'Live Bus Radar', icon: '🗺️', isPublic: true },
    { id: 'student', label: 'Student Pass & Routes', icon: '🎓', isPublic: false },
    { id: 'driver', label: 'Driver Cockpit', icon: '👨‍✈️', isPublic: false },
    { id: 'admin', label: 'Admin Fleet Hub', icon: '🛡️', isPublic: false }
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-semibold">Admin</span>;
      case 'driver':
        return <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-semibold">Driver</span>;
      default:
        return <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-semibold">Student</span>;
    }
  };

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

          {/* User Auth & Live Status */}
          <div className="flex items-center space-x-3">
            {/* Live GPS Indicator */}
            <div className={`hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
              }`} />
              <span>{isConnected ? 'GPS Live' : 'Connecting...'}</span>
            </div>

            {/* Auth Profile or Login/Signup buttons */}
            {currentUser ? (
              <div className="flex items-center space-x-2.5 bg-slate-800/80 border border-slate-700/80 pl-2 pr-1.5 py-1 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-semibold text-slate-100 max-w-[120px] truncate block">
                        {currentUser.name}
                      </span>
                      {getRoleBadge(currentUser.role)}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {currentUser.studentId}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-700/60 transition-colors ml-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenLogin}
                  className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenSignup}
                  className="text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Submenu */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-800/60 overflow-x-auto space-x-2">
          <div className="flex space-x-1">
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

          {currentUser && (
            <div className="flex items-center space-x-1.5 pl-2 flex-shrink-0">
              <span className="text-[11px] text-slate-300 font-medium truncate max-w-[80px]">
                {currentUser.name}
              </span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 p-1"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

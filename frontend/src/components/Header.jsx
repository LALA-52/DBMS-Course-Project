import React from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, Server } from 'lucide-react';

export default function Header({ currentSection, dbStatus, onCheckConnection, checkingDb }) {
  const isConnected = dbStatus?.connected;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Pharmacy Prescription & Medicine Stock System
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            DBMS Course Project &bull; Live MySQL Demonstration (Presentation-III)
          </p>
        </div>
        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
        <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
          {currentSection}
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {/* MySQL Connection Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          isConnected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          <div className="relative flex items-center justify-center">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <span className="font-semibold">
              MySQL {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {dbStatus && (
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                ({dbStatus.host}:{dbStatus.port}/{dbStatus.database || 'pharmacy_management'})
              </span>
            )}
          </div>

          <button
            onClick={onCheckConnection}
            disabled={checkingDb}
            title="Refresh database connection status"
            className="ml-1 p-1 hover:bg-black/5 rounded-full text-slate-500 hover:text-slate-700 transition"
          >
            <RefreshCw className={`w-3 h-3 ${checkingDb ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}

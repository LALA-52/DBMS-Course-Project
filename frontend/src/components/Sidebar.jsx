import React from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  Users, 
  FileText, 
  Database, 
  ShieldCheck,
  Server
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medicines', label: 'Medicines', icon: Pill },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'db-operations', label: 'Database Operations', icon: Database, isDemo: true },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base tracking-tight leading-none">
              PharmaCore
            </h2>
            <span className="text-[11px] text-emerald-400 font-medium">
              DBMS Management
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Core Modules
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.isDemo && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  isActive ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                }`}>
                  Demo
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Project Info Card */}
      <div className="p-4 m-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Academic Evaluation</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Course: Database Management Systems
        </p>
        <p className="text-slate-500 text-[10px] mt-1">
          Presentation-III &bull; Live SQL Transactions & ACID operations.
        </p>
      </div>

      {/* Database Schema tag */}
      <div className="px-6 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>MySQL Schema</span>
        <span className="font-mono text-emerald-400">pharmacy_management</span>
      </div>
    </aside>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Users, 
  FileText, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Database, 
  Package, 
  CheckCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import api from '../services/api';

export default function DashboardPage({ setActiveTab, notify }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard();
      if (res.success) {
        setStats(res.stats);
        setLowStockItems(res.lowStockItems || []);
        setRecentPrescriptions(res.recentPrescriptions || []);
        setDbStatus(res.dbStatus);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'Dashboard Fetch Failed',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Refresh Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            DBMS System Overview & Real-Time Metrics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated metrics queried directly from live MySQL relational database.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh MySQL Stats</span>
        </button>
      </div>

      {/* Presentation Demo Guide Box */}
      <div className="bg-emerald-950 text-emerald-100 p-5 rounded-xl border border-emerald-800 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
              Presentation-III Demonstration Sequence
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('db-operations')}
            className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <span>Open Dedicated Demo Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-3 bg-emerald-900/60 rounded-lg border border-emerald-800/80">
            <span className="font-bold text-emerald-300 block mb-1">Step 1 &bull; Initial State</span>
            <p className="text-slate-300 text-[11px]">View existing records in MySQL tables (Medicines, Patients, Prescriptions).</p>
          </div>
          <div className="p-3 bg-emerald-900/60 rounded-lg border border-emerald-800/80">
            <span className="font-bold text-emerald-300 block mb-1">Step 2 &bull; INSERT Record</span>
            <p className="text-slate-300 text-[11px]">Add test medicine: "Paracetamol 500mg" (Batch: DEMO001, Qty: 100).</p>
          </div>
          <div className="p-3 bg-emerald-900/60 rounded-lg border border-emerald-800/80">
            <span className="font-bold text-emerald-300 block mb-1">Step 3 &bull; Verify DB State</span>
            <p className="text-slate-300 text-[11px]">Observe newly inserted row appear highlighted and total medicine count increment.</p>
          </div>
          <div className="p-3 bg-emerald-900/60 rounded-lg border border-emerald-800/80">
            <span className="font-bold text-emerald-300 block mb-1">Step 4 &bull; DELETE & Check</span>
            <p className="text-slate-300 text-[11px]">Delete the inserted record, verify MySQL deletion & table refresh.</p>
          </div>
        </div>
      </div>

      {/* Metric Cards (Fetched from MySQL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Medicines */}
        <div 
          onClick={() => setActiveTab('medicines')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Medicines
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : stats?.totalMedicines ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>SQL:</span>
              <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                COUNT(*) FROM medicines
              </code>
            </p>
          </div>
        </div>

        {/* Card 2: Total Patients */}
        <div 
          onClick={() => setActiveTab('patients')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-sky-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : stats?.totalPatients ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>SQL:</span>
              <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                COUNT(*) FROM patients
              </code>
            </p>
          </div>
        </div>

        {/* Card 3: Total Prescriptions */}
        <div 
          onClick={() => setActiveTab('prescriptions')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Prescriptions
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : stats?.totalPrescriptions ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>SQL:</span>
              <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                COUNT(*) FROM prescriptions
              </code>
            </p>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div 
          onClick={() => setActiveTab('medicines')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low Stock Alert
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-amber-600">
              {loading ? '...' : stats?.lowStockMedicines ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Condition:</span>
              <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                quantity &le; 10
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Alert Table + Recent Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-900">
                Low Stock Threshold Monitor (Qty &le; 10)
              </h4>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
              {lowStockItems.length} Critical
            </span>
          </div>

          <div className="p-0 overflow-x-auto flex-1">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No low stock medicines found. All inventory levels are above threshold.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">ID</th>
                    <th className="py-2.5 px-3 font-semibold">Medicine Name</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Units Left</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map((item) => (
                    <tr key={item.medicine_id} className="hover:bg-amber-50/40">
                      <td className="py-2.5 px-3 font-mono text-slate-500">#{item.medicine_id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{item.medicine_name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.category || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                          {item.quantity} units
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Prescriptions (Relational JOIN data) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-bold text-slate-900">
                Recent Prescriptions (SQL Relational JOINs)
              </h4>
            </div>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              View All &rarr;
            </button>
          </div>

          <div className="p-0 overflow-x-auto flex-1">
            {recentPrescriptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recent prescriptions found.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">RX #</th>
                    <th className="py-2.5 px-3 font-semibold">Patient</th>
                    <th className="py-2.5 px-3 font-semibold">Prescribed Medicine</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPrescriptions.map((rx) => (
                    <tr key={rx.prescription_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-500">#{rx.prescription_id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{rx.patient_name}</td>
                      <td className="py-2.5 px-3 text-slate-700">{rx.medicine_name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">{rx.quantity}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{rx.prescription_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

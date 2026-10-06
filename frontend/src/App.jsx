import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Notification from './components/Notification';
import DashboardPage from './pages/DashboardPage';
import MedicinesPage from './pages/MedicinesPage';
import PatientsPage from './pages/PatientsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import DbOperationsPage from './pages/DbOperationsPage';
import api from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [notification, setNotification] = useState(null);

  const checkDbConnection = async () => {
    setCheckingDb(true);
    try {
      const res = await api.getHealth();
      setDbStatus(res.database);
    } catch (err) {
      setDbStatus({
        connected: false,
        error: err.message,
        host: 'localhost',
        port: 2250,
        database: 'pharmacy_management'
      });
    } finally {
      setCheckingDb(false);
    }
  };

  useEffect(() => {
    checkDbConnection();
    // Poll every 15s to keep connection status badge synchronized
    const interval = setInterval(checkDbConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const notify = ({ type = 'info', title, message, sql, autoClose = true }) => {
    setNotification({ type, title, message, sql, autoClose });
  };

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'System Dashboard';
      case 'medicines':
        return 'Medicines & Stock';
      case 'patients':
        return 'Patient Registry';
      case 'prescriptions':
        return 'Prescriptions & Dispensing';
      case 'db-operations':
        return 'DBMS Operations Demo';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentSection={getSectionTitle()}
          dbStatus={dbStatus}
          onCheckConnection={checkDbConnection}
          checkingDb={checkingDb}
        />

        {/* Database Warning Bar if MySQL is disconnected */}
        {dbStatus && !dbStatus.connected && (
          <div className="bg-rose-600 text-white px-6 py-2.5 text-xs flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider bg-rose-700 px-2 py-0.5 rounded text-[10px]">
                MySQL Disconnected
              </span>
              <span>
                Unable to reach MySQL server on {dbStatus.host}:{dbStatus.port} ({dbStatus.error || 'Connection refused'}). Please verify credentials in <code>backend/.env</code>.
              </span>
            </div>
            <button
              onClick={checkDbConnection}
              className="px-2.5 py-1 bg-white text-rose-700 font-bold rounded hover:bg-rose-50 text-[11px] transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {activeTab === 'dashboard' && (
              <DashboardPage setActiveTab={setActiveTab} notify={notify} />
            )}
            {activeTab === 'medicines' && (
              <MedicinesPage notify={notify} />
            )}
            {activeTab === 'patients' && (
              <PatientsPage notify={notify} />
            )}
            {activeTab === 'prescriptions' && (
              <PrescriptionsPage notify={notify} />
            )}
            {activeTab === 'db-operations' && (
              <DbOperationsPage notify={notify} />
            )}
          </div>
        </main>
      </div>

      {/* Global Toast Notifications */}
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}

// Uses relative path '/api' which Vite proxies to http://127.0.0.1:5000/api
// This prevents cross-origin and IPv6/IPv4 mismatch issues in browsers
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot reach backend server. Please verify backend is running on port 5000.');
    }
    throw error;
  }
}

export const api = {
  // System Health & MySQL Status
  getHealth: () => request('/health'),

  // Dashboard Metrics
  getDashboard: () => request('/dashboard'),

  // Medicines
  getMedicines: (search = '') => request(`/medicines${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createMedicine: (data) => request('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  deleteMedicine: (id) => request(`/medicines/${id}`, { method: 'DELETE' }),

  // Patients
  getPatients: (search = '') => request(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Prescriptions
  getPrescriptions: (search = '') => request(`/prescriptions${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createPrescription: (data) => request('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  deletePrescription: (id) => request(`/prescriptions/${id}`, { method: 'DELETE' }),

  // Presentation III Dedicated DBMS Operations
  getDbTables: () => request('/db-ops/tables'),
  getDbSchema: (table) => request(`/db-ops/schema/${table}`),
  getDbRecords: (table) => request(`/db-ops/records/${table}`),
  insertDbRecord: (table, data) => request(`/db-ops/insert/${table}`, { method: 'POST', body: JSON.stringify(data) }),
  deleteDbRecord: (table, id) => request(`/db-ops/delete/${table}/${id}`, { method: 'DELETE' }),
};

export default api;

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection, pool } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const medicineRoutes = require('./routes/medicineRoutes');
const patientRoutes = require('./routes/patientRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const dbOpsRoutes = require('./routes/dbOpsRoutes');

app.use('/api/medicines', medicineRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/db-ops', dbOpsRoutes);

// Health & MySQL status check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();

  // If user visits directly in a browser (wants HTML view)
  if (req.accepts('html') && !req.accepts('json')) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Pharmacy Backend API - Health Status</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
          .card { max-width: 650px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
          .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; }
          .badge-success { background: #064e3b; color: #34d399; border: 1px solid #059669; }
          .badge-error { background: #4c0519; color: #f43f5e; border: 1px solid #e11d48; }
          h1 { font-size: 20px; margin: 0 0 16px 0; display: flex; align-items: center; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          td { padding: 10px 12px; border-bottom: 1px solid #334155; }
          td:first-child { color: #94a3b8; font-weight: 500; width: 35%; }
          td:last-child { font-family: monospace; color: #38bdf8; }
          .btn { display: inline-block; margin-top: 20px; background: #10b981; color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; }
          .btn:hover { background: #059669; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>
            <span>Pharmacy DBMS API Health</span>
            <span class="badge ${dbStatus.connected ? 'badge-success' : 'badge-error'}">
              ${dbStatus.connected ? '● MySQL Connected' : '● MySQL Disconnected'}
            </span>
          </h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">
            The backend REST server is active and communicating with MySQL.
          </p>
          <table>
            <tr><td>Server Port</td><td>${PORT}</td></tr>
            <tr><td>Database Host</td><td>${dbStatus.host}</td></tr>
            <tr><td>Database Port</td><td>${dbStatus.port}</td></tr>
            <tr><td>Database Name</td><td>${dbStatus.database}</td></tr>
            <tr><td>Database User</td><td>${dbStatus.user}</td></tr>
            <tr><td>Server Uptime</td><td>${Math.floor(process.uptime())} seconds</td></tr>
            ${dbStatus.error ? `<tr><td>Connection Error</td><td style="color:#f43f5e;">${dbStatus.error}</td></tr>` : ''}
          </table>
          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <a href="http://localhost:3000" class="btn">Open Frontend App (Port 3000)</a>
            <a href="/api/health" style="display:inline-block; margin-top:20px; color:#38bdf8; text-decoration:underline; font-size:13px; padding: 8px;">View JSON Format</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  if (req.accepts('html') && !req.accepts('json')) {
    return res.redirect('/api/health');
  }

  res.json({
    project: 'Pharmacy Prescription & Medicine Stock Management System',
    type: 'DBMS Course Project API',
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard',
      medicines: '/api/medicines',
      patients: '/api/patients',
      prescriptions: '/api/prescriptions',
      dbOps: '/api/db-ops'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: err.message
  });
});

// Bind explicitly to 0.0.0.0
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`====================================================`);
  console.log(`🚀 Pharmacy DBMS Backend Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔍 Checking MySQL Database connection...`);
  
  const status = await testConnection();
  if (status.connected) {
    console.log(`✅ Connected to MySQL database '${status.database}' on ${status.host}:${status.port}`);
  } else {
    console.warn(`⚠️ MySQL Connection Warning: ${status.error}`);
    console.warn(`   Please ensure MySQL is running on port ${status.port} and check credentials in backend/.env`);
  }
  console.log(`====================================================`);
});

const { pool, testConnection } = require('../config/db');

// GET /api/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Medicines
    const [medCountResult] = await pool.query('SELECT COUNT(*) as total FROM medicines');
    const totalMedicines = medCountResult[0].total;

    // 2. Total Patients
    const [patientCountResult] = await pool.query('SELECT COUNT(*) as total FROM patients');
    const totalPatients = patientCountResult[0].total;

    // 3. Total Prescriptions
    const [prescCountResult] = await pool.query('SELECT COUNT(*) as total FROM prescriptions');
    const totalPrescriptions = prescCountResult[0].total;

    // 4. Low Stock Medicines (threshold <= 10)
    const [lowStockResult] = await pool.query(
      'SELECT medicine_id, medicine_name, category, quantity, unit_price FROM medicines WHERE quantity <= 10 ORDER BY quantity ASC'
    );
    const lowStockCount = lowStockResult.length;

    // 5. Total Stock Units
    const [totalStockUnitsResult] = await pool.query('SELECT COALESCE(SUM(quantity), 0) as totalUnits, COALESCE(SUM(quantity * unit_price), 0) as totalValuation FROM medicines');

    // 6. Recent Prescriptions (top 5)
    const [recentPrescriptions] = await pool.query(`
      SELECT 
        pr.prescription_id,
        p.patient_name,
        m.medicine_name,
        DATE_FORMAT(pr.prescription_date, "%Y-%m-%d") as prescription_date,
        pr.dosage,
        pr.quantity,
        pr.doctor_name
      FROM prescriptions pr
      JOIN patients p ON pr.patient_id = p.patient_id
      JOIN medicines m ON pr.medicine_id = m.medicine_id
      ORDER BY pr.prescription_id DESC
      LIMIT 5
    `);

    // 7. MySQL Server Status
    const dbStatus = await testConnection();

    res.json({
      success: true,
      stats: {
        totalMedicines,
        totalPatients,
        totalPrescriptions,
        lowStockMedicines: lowStockCount,
        totalUnits: totalStockUnitsResult[0].totalUnits,
        totalValuation: parseFloat(totalStockUnitsResult[0].totalValuation).toFixed(2)
      },
      lowStockItems: lowStockResult,
      recentPrescriptions,
      dbStatus
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard metrics from MySQL.',
      error: error.message
    });
  }
};

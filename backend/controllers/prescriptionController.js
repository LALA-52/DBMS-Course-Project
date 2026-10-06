const { pool } = require('../config/db');

// GET /api/prescriptions
exports.getAllPrescriptions = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        pr.prescription_id,
        pr.patient_id,
        p.patient_name,
        p.phone as patient_phone,
        pr.medicine_id,
        m.medicine_name,
        m.batch_number,
        m.quantity as remaining_stock,
        m.unit_price,
        DATE_FORMAT(pr.prescription_date, "%Y-%m-%d") as prescription_date,
        pr.dosage,
        pr.quantity,
        pr.doctor_name,
        pr.created_at
      FROM prescriptions pr
      INNER JOIN patients p ON pr.patient_id = p.patient_id
      INNER JOIN medicines m ON pr.medicine_id = m.medicine_id
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` WHERE p.patient_name LIKE ? OR m.medicine_name LIKE ? OR pr.doctor_name LIKE ?`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY pr.prescription_id DESC';

    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve prescriptions from MySQL database.',
      error: error.message
    });
  }
};

// POST /api/prescriptions
// Demonstrates SQL Transactions, Foreign Key integrity, and Stock management
exports.createPrescription = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      patient_id,
      medicine_id,
      prescription_date,
      dosage,
      quantity,
      doctor_name
    } = req.body;

    const patientId = parseInt(patient_id, 10);
    const medicineId = parseInt(medicine_id, 10);
    const presQty = parseInt(quantity, 10);

    if (isNaN(patientId) || isNaN(medicineId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Patient and Medicine selections are required.'
      });
    }

    if (isNaN(presQty) || presQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Prescription quantity must be greater than zero.'
      });
    }

    if (!prescription_date) {
      return res.status(400).json({
        success: false,
        message: 'Prescription date is required.'
      });
    }

    // Begin Database Transaction
    await connection.beginTransaction();

    // 1. Verify Patient exists
    const [patientRows] = await connection.query(
      'SELECT patient_name FROM patients WHERE patient_id = ?',
      [patientId]
    );
    if (patientRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patientId} not found in MySQL.`
      });
    }

    // 2. Verify Medicine exists and lock row for stock check
    const [medRows] = await connection.query(
      'SELECT medicine_name, quantity FROM medicines WHERE medicine_id = ? FOR UPDATE',
      [medicineId]
    );
    if (medRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Medicine with ID ${medicineId} not found in MySQL.`
      });
    }

    const currentStock = medRows[0].quantity;
    if (currentStock < presQty) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for '${medRows[0].medicine_name}'. Available: ${currentStock}, Requested: ${presQty}.`
      });
    }

    // 3. Insert Prescription Record
    const insertQuery = `
      INSERT INTO prescriptions 
      (patient_id, medicine_id, prescription_date, dosage, quantity, doctor_name) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [insertResult] = await connection.query(insertQuery, [
      patientId,
      medicineId,
      prescription_date,
      dosage ? dosage.trim() : null,
      presQty,
      doctor_name ? doctor_name.trim() : 'Attending Physician'
    ]);

    // 4. Update Medicine Stock (Stock Reduction)
    const updateStockQuery = `
      UPDATE medicines 
      SET quantity = quantity - ? 
      WHERE medicine_id = ?
    `;
    await connection.query(updateStockQuery, [presQty, medicineId]);

    // Commit Transaction
    await connection.commit();

    // Fetch the inserted record with JOINs
    const [newRecord] = await pool.query(`
      SELECT 
        pr.prescription_id,
        pr.patient_id,
        p.patient_name,
        pr.medicine_id,
        m.medicine_name,
        m.quantity as remaining_stock,
        DATE_FORMAT(pr.prescription_date, "%Y-%m-%d") as prescription_date,
        pr.dosage,
        pr.quantity,
        pr.doctor_name,
        pr.created_at
      FROM prescriptions pr
      INNER JOIN patients p ON pr.patient_id = p.patient_id
      INNER JOIN medicines m ON pr.medicine_id = m.medicine_id
      WHERE pr.prescription_id = ?
    `, [insertResult.insertId]);

    res.status(201).json({
      success: true,
      message: `Prescription created successfully! Reduced stock for '${medRows[0].medicine_name}' by ${presQty} (New Stock: ${currentStock - presQty}).`,
      data: newRecord[0],
      insertId: insertResult.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating prescription transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription and deduct stock in MySQL.',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// DELETE /api/prescriptions/:id
exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const prescriptionId = parseInt(id, 10);

    if (isNaN(prescriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prescription ID format.'
      });
    }

    const [existing] = await pool.query('SELECT * FROM prescriptions WHERE prescription_id = ?', [prescriptionId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Prescription with ID ${prescriptionId} not found in MySQL.`
      });
    }

    const [result] = await pool.query('DELETE FROM prescriptions WHERE prescription_id = ?', [prescriptionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Prescription with ID ${prescriptionId} could not be deleted.`
      });
    }

    res.json({
      success: true,
      message: `Prescription record #${prescriptionId} successfully deleted from MySQL database.`,
      deletedId: prescriptionId
    });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prescription from MySQL.',
      error: error.message
    });
  }
};

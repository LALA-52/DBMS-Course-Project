const { pool } = require('../config/db');

// GET /api/patients
exports.getAllPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT patient_id, patient_name, age, gender, phone, created_at FROM patients';
    const params = [];

    if (search && search.trim() !== '') {
      query += ' WHERE patient_name LIKE ? OR phone LIKE ? OR gender LIKE ?';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY patient_id DESC';

    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patients from MySQL database.',
      error: error.message
    });
  }
};

// GET /api/patients/:id
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT patient_id, patient_name, age, gender, phone, created_at FROM patients WHERE patient_id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} not found.`
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching patient by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient record.',
      error: error.message
    });
  }
};

// POST /api/patients
exports.createPatient = async (req, res) => {
  try {
    const { patient_name, age, gender, phone } = req.body;

    if (!patient_name || patient_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Patient Name is required.'
      });
    }

    const parsedAge = age !== undefined && age !== '' ? parseInt(age, 10) : null;
    if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150)) {
      return res.status(400).json({
        success: false,
        message: 'Age must be a valid number between 0 and 150.'
      });
    }

    const query = `
      INSERT INTO patients (patient_name, age, gender, phone) 
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      patient_name.trim(),
      parsedAge,
      gender ? gender.trim() : null,
      phone ? phone.trim() : null
    ]);

    const [newRow] = await pool.query(
      'SELECT patient_id, patient_name, age, gender, phone, created_at FROM patients WHERE patient_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Patient record successfully inserted into MySQL.',
      data: newRow[0],
      insertId: result.insertId
    });
  } catch (error) {
    console.error('Error inserting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to insert patient record into MySQL.',
      error: error.message
    });
  }
};

// DELETE /api/patients/:id
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = parseInt(id, 10);

    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format.'
      });
    }

    const [existing] = await pool.query('SELECT * FROM patients WHERE patient_id = ?', [patientId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patientId} not found in MySQL.`
      });
    }

    const [result] = await pool.query('DELETE FROM patients WHERE patient_id = ?', [patientId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patientId} could not be deleted.`
      });
    }

    res.json({
      success: true,
      message: `Patient ID ${patientId} ('${existing[0].patient_name}') and any associated records successfully deleted from MySQL database.`,
      deletedId: patientId
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient record from MySQL.',
      error: error.message
    });
  }
};

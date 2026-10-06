const { pool } = require('../config/db');

const ALLOWED_TABLES = ['medicines', 'patients', 'prescriptions'];

const PRIMARY_KEYS = {
  medicines: 'medicine_id',
  patients: 'patient_id',
  prescriptions: 'prescription_id'
};

// GET /api/db-ops/tables
exports.getTables = async (req, res) => {
  res.json({
    success: true,
    tables: ALLOWED_TABLES
  });
};

// GET /api/db-ops/schema/:table
exports.getTableSchema = async (req, res) => {
  const { table } = req.params;

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({
      success: false,
      message: `Invalid table: '${table}'. Allowed tables: ${ALLOWED_TABLES.join(', ')}`
    });
  }

  try {
    const [columns] = await pool.query(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA, COLUMN_COMMENT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [table]
    );

    res.json({
      success: true,
      table,
      primaryKey: PRIMARY_KEYS[table],
      columns
    });
  } catch (error) {
    console.error('Error fetching table schema:', error);
    res.status(500).json({
      success: false,
      message: `Failed to inspect schema for table '${table}'.`,
      error: error.message
    });
  }
};

// GET /api/db-ops/records/:table
exports.viewTableRecords = async (req, res) => {
  const { table } = req.params;

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({
      success: false,
      message: `Invalid table: '${table}'. Allowed tables: ${ALLOWED_TABLES.join(', ')}`
    });
  }

  try {
    const pk = PRIMARY_KEYS[table];
    let query = `SELECT * FROM ${table} ORDER BY ${pk} DESC`;

    // For prescriptions, join with patient and medicine name for clarity during presentation
    if (table === 'prescriptions') {
      query = `
        SELECT 
          pr.prescription_id,
          pr.patient_id,
          p.patient_name,
          pr.medicine_id,
          m.medicine_name,
          DATE_FORMAT(pr.prescription_date, "%Y-%m-%d") as prescription_date,
          pr.dosage,
          pr.quantity,
          pr.doctor_name,
          pr.created_at
        FROM prescriptions pr
        LEFT JOIN patients p ON pr.patient_id = p.patient_id
        LEFT JOIN medicines m ON pr.medicine_id = m.medicine_id
        ORDER BY pr.prescription_id DESC
      `;
    }

    const [rows] = await pool.query(query);

    res.json({
      success: true,
      table,
      executedQuery: query.replace(/\s+/g, ' ').trim(),
      primaryKey: pk,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(`Error viewing records for table ${table}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to view records from table '${table}'.`,
      error: error.message
    });
  }
};

// POST /api/db-ops/insert/:table
exports.insertTableRecord = async (req, res) => {
  const { table } = req.params;
  const payload = req.body;

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({
      success: false,
      message: `Invalid table: '${table}'. Allowed tables: ${ALLOWED_TABLES.join(', ')}`
    });
  }

  try {
    // Filter out primary key (auto-increment) and created_at if passed
    const pk = PRIMARY_KEYS[table];
    const filteredKeys = Object.keys(payload).filter(
      (k) => k !== pk && k !== 'created_at' && payload[k] !== undefined && payload[k] !== ''
    );

    if (filteredKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid columns provided for INSERT.'
      });
    }

    const columnsList = filteredKeys.join(', ');
    const placeholders = filteredKeys.map(() => '?').join(', ');
    const values = filteredKeys.map((k) => payload[k]);

    const sql = `INSERT INTO ${table} (${columnsList}) VALUES (${placeholders})`;

    const [result] = await pool.query(sql, values);

    // Format query for demo explanation
    const debugQuery = `INSERT INTO ${table} (${columnsList}) VALUES (${values.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})`;

    // Retrieve the newly inserted record
    const [newRow] = await pool.query(`SELECT * FROM ${table} WHERE ${pk} = ?`, [result.insertId]);

    res.status(201).json({
      success: true,
      message: `Record successfully inserted into '${table}' with ID ${result.insertId}.`,
      executedSql: debugQuery,
      insertId: result.insertId,
      record: newRow[0]
    });
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    res.status(500).json({
      success: false,
      message: `MySQL Error while inserting into '${table}': ${error.message}`,
      error: error.message,
      errorCode: error.code
    });
  }
};

// DELETE /api/db-ops/delete/:table/:id
exports.deleteTableRecord = async (req, res) => {
  const { table, id } = req.params;

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({
      success: false,
      message: `Invalid table: '${table}'. Allowed tables: ${ALLOWED_TABLES.join(', ')}`
    });
  }

  const recordId = parseInt(id, 10);
  if (isNaN(recordId)) {
    return res.status(400).json({
      success: false,
      message: 'ID must be an integer.'
    });
  }

  const pk = PRIMARY_KEYS[table];

  try {
    // Check if record exists
    const [existing] = await pool.query(`SELECT * FROM ${table} WHERE ${pk} = ?`, [recordId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Record with ${pk} = ${recordId} not found in '${table}'.`
      });
    }

    const sql = `DELETE FROM ${table} WHERE ${pk} = ?`;
    const [result] = await pool.query(sql, [recordId]);

    const debugQuery = `DELETE FROM ${table} WHERE ${pk} = ${recordId};`;

    res.json({
      success: true,
      message: `Record with ${pk} = ${recordId} was successfully deleted from '${table}'.`,
      executedSql: debugQuery,
      deletedId: recordId,
      deletedRecord: existing[0]
    });
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        success: false,
        message: `Foreign Key Constraint Error: This record in '${table}' is referenced by child records in another table. Delete the child records first.`,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: `Failed to delete record from '${table}': ${error.message}`,
      error: error.message
    });
  }
};

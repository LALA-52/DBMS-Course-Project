const { pool } = require('../config/db');

// GET /api/medicines
exports.getAllMedicines = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT medicine_id, medicine_name, category, manufacturer, batch_number, DATE_FORMAT(expiry_date, "%Y-%m-%d") as expiry_date, quantity, unit_price, created_at FROM medicines';
    const params = [];

    if (search && search.trim() !== '') {
      query += ' WHERE medicine_name LIKE ? OR category LIKE ? OR manufacturer LIKE ? OR batch_number LIKE ?';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY medicine_id DESC';

    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve medicines from MySQL database.',
      error: error.message
    });
  }
};

// GET /api/medicines/:id
exports.getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT medicine_id, medicine_name, category, manufacturer, batch_number, DATE_FORMAT(expiry_date, "%Y-%m-%d") as expiry_date, quantity, unit_price, created_at FROM medicines WHERE medicine_id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Medicine with ID ${id} not found.`
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching medicine by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve medicine record.',
      error: error.message
    });
  }
};

// POST /api/medicines
exports.createMedicine = async (req, res) => {
  try {
    const {
      medicine_name,
      category,
      manufacturer,
      batch_number,
      expiry_date,
      quantity,
      unit_price
    } = req.body;

    // Validation
    if (!medicine_name || medicine_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Medicine Name is required.'
      });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid non-negative integer.'
      });
    }

    const parsedPrice = parseFloat(unit_price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit Price must be a valid non-negative number.'
      });
    }

    const query = `
      INSERT INTO medicines 
      (medicine_name, category, manufacturer, batch_number, expiry_date, quantity, unit_price) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      medicine_name.trim(),
      category ? category.trim() : null,
      manufacturer ? manufacturer.trim() : null,
      batch_number ? batch_number.trim() : null,
      expiry_date || null,
      parsedQty,
      parsedPrice
    ]);

    // Fetch the newly created record to return full row to client
    const [newRow] = await pool.query(
      'SELECT medicine_id, medicine_name, category, manufacturer, batch_number, DATE_FORMAT(expiry_date, "%Y-%m-%d") as expiry_date, quantity, unit_price, created_at FROM medicines WHERE medicine_id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Medicine record successfully inserted into MySQL.',
      data: newRow[0],
      insertId: result.insertId
    });
  } catch (error) {
    console.error('Error inserting medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to insert medicine record into MySQL.',
      error: error.message
    });
  }
};

// DELETE /api/medicines/:id
exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicineId = parseInt(id, 10);

    if (isNaN(medicineId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid medicine ID format.'
      });
    }

    // Check if record exists
    const [existing] = await pool.query('SELECT * FROM medicines WHERE medicine_id = ?', [medicineId]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Medicine with ID ${medicineId} does not exist in MySQL.`
      });
    }

    // Delete query
    const [result] = await pool.query('DELETE FROM medicines WHERE medicine_id = ?', [medicineId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Medicine with ID ${medicineId} could not be deleted.`
      });
    }

    res.json({
      success: true,
      message: `Medicine ID ${medicineId} ('${existing[0].medicine_name}') successfully deleted from MySQL database.`,
      deletedId: medicineId
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    // Handle Foreign Key constraint violation
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        success: false,
        message: 'Integrity Constraint Error: Cannot delete this medicine because active prescriptions reference it in MySQL (Foreign Key constraint: prescriptions.medicine_id). Delete those prescriptions first.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete medicine record from MySQL.',
      error: error.message
    });
  }
};

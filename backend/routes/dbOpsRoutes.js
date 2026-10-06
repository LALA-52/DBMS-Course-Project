const express = require('express');
const router = express.Router();
const dbOpsController = require('../controllers/dbOpsController');

router.get('/tables', dbOpsController.getTables);
router.get('/schema/:table', dbOpsController.getTableSchema);
router.get('/records/:table', dbOpsController.viewTableRecords);
router.post('/insert/:table', dbOpsController.insertTableRecord);
router.delete('/delete/:table/:id', dbOpsController.deleteTableRecord);

module.exports = router;

const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');

router.get('/', prescriptionController.getAllPrescriptions);
router.post('/', prescriptionController.createPrescription);
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router;

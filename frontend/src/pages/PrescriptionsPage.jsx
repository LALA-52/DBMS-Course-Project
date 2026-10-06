import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw, 
  Calendar, 
  X, 
  FileCheck, 
  AlertCircle,
  TrendingDown,
  User,
  Pill
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

export default function PrescriptionsPage({ notify }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const initialFormState = {
    patient_id: '',
    medicine_id: '',
    prescription_date: new Date().toISOString().split('T')[0],
    dosage: '',
    quantity: '1',
    doctor_name: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  const fetchPrescriptions = async (searchTerm = search) => {
    setLoading(true);
    try {
      const res = await api.getPrescriptions(searchTerm);
      if (res.success) {
        setPrescriptions(res.data);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'Failed to Fetch Prescriptions',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Patients & Medicines for the dropdowns
  const fetchDropdownData = async () => {
    try {
      const [patRes, medRes] = await Promise.all([
        api.getPatients(),
        api.getMedicines()
      ]);
      if (patRes.success) setPatients(patRes.data);
      if (medRes.success) setMedicines(medRes.data);
    } catch (err) {
      console.error('Error fetching dropdown records:', err);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchDropdownData();
  }, []);

  const handleOpenModal = () => {
    fetchDropdownData(); // ensure fresh stock amounts
    setIsModalOpen(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPrescriptions(search);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const selectedMedicine = medicines.find(
    (m) => m.medicine_id === parseInt(formData.medicine_id, 10)
  );

  const validateForm = () => {
    const errors = {};
    if (!formData.patient_id) errors.patient_id = 'Please select a patient';
    if (!formData.medicine_id) errors.medicine_id = 'Please select a medicine';
    if (!formData.prescription_date) errors.prescription_date = 'Date is required';
    if (!formData.dosage.trim()) errors.dosage = 'Dosage instructions are required';

    const reqQty = parseInt(formData.quantity, 10);
    if (isNaN(reqQty) || reqQty <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    } else if (selectedMedicine && reqQty > selectedMedicine.quantity) {
      errors.quantity = `Exceeds available stock (${selectedMedicine.quantity} units left)`;
    }

    if (!formData.doctor_name.trim()) errors.doctor_name = 'Prescribing Doctor Name is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPrescription = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        patient_id: parseInt(formData.patient_id, 10),
        medicine_id: parseInt(formData.medicine_id, 10),
        prescription_date: formData.prescription_date,
        dosage: formData.dosage.trim(),
        quantity: parseInt(formData.quantity, 10),
        doctor_name: formData.doctor_name.trim()
      };

      const res = await api.createPrescription(payload);
      if (res.success) {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setNewlyAddedId(res.insertId);

        notify({
          type: 'success',
          title: 'ACID Transaction Successful',
          message: res.message || 'Prescription created and medicine stock decremented in MySQL.',
          sql: `BEGIN TRANSACTION;\nINSERT INTO prescriptions ...;\nUPDATE medicines SET quantity = quantity - ${payload.quantity} WHERE medicine_id = ${payload.medicine_id};\nCOMMIT;`
        });

        await fetchPrescriptions('');
        setSearch('');

        setTimeout(() => {
          setNewlyAddedId(null);
        }, 5000);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'Transaction Aborted (Rollback)',
        message: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (rx) => {
    setItemToDelete(rx);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);

    try {
      const res = await api.deletePrescription(itemToDelete.prescription_id);
      if (res.success) {
        notify({
          type: 'success',
          title: 'MySQL DELETE Successful',
          message: `Prescription #${itemToDelete.prescription_id} deleted from MySQL.`,
          sql: `DELETE FROM prescriptions WHERE prescription_id = ${itemToDelete.prescription_id};`
        });
        setDeleteModalOpen(false);
        setItemToDelete(null);
        await fetchPrescriptions();
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'DELETE Operation Failed',
        message: err.message
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Prescription Dispensing & Stock Reduction</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Table: <code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">prescriptions</code> &bull; Implements MySQL ACID Transactions with automatic stock decrements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchPrescriptions();
              fetchDropdownData();
            }}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
            title="Refresh table from MySQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Prescription</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search prescriptions by patient name, medicine name, or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition"
          >
            Filter
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchPrescriptions('');
              }}
              className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 transition"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">RX #</th>
                <th className="py-3 px-4">Patient (FK)</th>
                <th className="py-3 px-4">Medicine (FK)</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Dosage Instructions</th>
                <th className="py-3 px-4 text-right">Dispensed Qty</th>
                <th className="py-3 px-4">Doctor Name</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && prescriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Querying MySQL table `prescriptions` with JOINs...</span>
                    </div>
                  </td>
                </tr>
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No prescription records found in MySQL database. Click "Create Prescription" to add one.
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx) => {
                  const isNew = rx.prescription_id === newlyAddedId;
                  return (
                    <tr
                      key={rx.prescription_id}
                      className={`transition-colors ${
                        isNew ? 'bg-indigo-50/80 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        #{rx.prescription_id}
                        {isNew && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-semibold">
                            NEW
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{rx.patient_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {rx.patient_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{rx.medicine_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Remaining Stock: {rx.remaining_stock ?? 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{rx.prescription_date}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={rx.dosage}>
                        {rx.dosage}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {rx.quantity} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{rx.doctor_name}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openDeleteModal(rx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Delete from MySQL"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PRESCRIPTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Issue Prescription (MySQL Transaction)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPrescription} className="p-6 space-y-4 text-xs">
              {/* Patient Selection Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Select Patient (Foreign Key: patient_id) *
                </label>
                <select
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formErrors.patient_id ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Choose Patient from MySQL --</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      #{p.patient_id} - {p.patient_name} ({p.age} yrs, {p.gender})
                    </option>
                  ))}
                </select>
                {formErrors.patient_id && (
                  <p className="text-rose-500 text-[11px] mt-1">{formErrors.patient_id}</p>
                )}
              </div>

              {/* Medicine Selection Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-slate-500" />
                  Select Medicine (Foreign Key: medicine_id) *
                </label>
                <select
                  name="medicine_id"
                  value={formData.medicine_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formErrors.medicine_id ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Choose Medicine from MySQL --</option>
                  {medicines.map((m) => (
                    <option key={m.medicine_id} value={m.medicine_id}>
                      #{m.medicine_id} - {m.medicine_name} [Stock: {m.quantity} | ${parseFloat(m.unit_price).toFixed(2)}]
                    </option>
                  ))}
                </select>
                {formErrors.medicine_id && (
                  <p className="text-rose-500 text-[11px] mt-1">{formErrors.medicine_id}</p>
                )}
              </div>

              {/* Stock decrement warning badge */}
              {selectedMedicine && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between text-[11px]">
                  <span className="text-amber-800 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                    Current Stock in MySQL: <strong>{selectedMedicine.quantity} units</strong>
                  </span>
                  <span className="font-semibold text-amber-900">
                    Will reduce to: {Math.max(0, selectedMedicine.quantity - (parseInt(formData.quantity, 10) || 0))}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dispense Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      formErrors.quantity ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.quantity && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.quantity}</p>
                  )}
                </div>

                {/* Prescription Date */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Prescription Date *
                  </label>
                  <input
                    type="date"
                    name="prescription_date"
                    value={formData.prescription_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      formErrors.prescription_date ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.prescription_date && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.prescription_date}</p>
                  )}
                </div>
              </div>

              {/* Dosage */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dosage Instructions *
                </label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleInputChange}
                  placeholder="e.g. 1 tablet twice daily after meals for 5 days"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formErrors.dosage ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {formErrors.dosage && (
                  <p className="text-rose-500 text-[11px] mt-1">{formErrors.dosage}</p>
                )}
              </div>

              {/* Doctor Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prescribing Doctor *
                </label>
                <input
                  type="text"
                  name="doctor_name"
                  value={formData.doctor_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Dr. Robert House (General Physician)"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    formErrors.doctor_name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {formErrors.doctor_name && (
                  <p className="text-rose-500 text-[11px] mt-1">{formErrors.doctor_name}</p>
                )}
              </div>

              {/* SQL Transaction Preview */}
              <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto">
                <span className="text-slate-500 block mb-0.5">-- MySQL Transaction (ACID Stock Reduction):</span>
                <code>
                  START TRANSACTION;<br/>
                  INSERT INTO prescriptions (patient_id, medicine_id, prescription_date, dosage, quantity, doctor_name) VALUES ({formData.patient_id || '?'}, {formData.medicine_id || '?'}, '{formData.prescription_date}', '{formData.dosage || '...'}', {formData.quantity || 1}, '{formData.doctor_name || '...'}');<br/>
                  UPDATE medicines SET quantity = quantity - {formData.quantity || 1} WHERE medicine_id = {formData.medicine_id || '?'};<br/>
                  COMMIT;
                </code>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Committing Transaction...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Commit Prescription & Deduct Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Confirm MySQL DELETE Operation"
        message={`Are you sure you want to permanently delete prescription #${itemToDelete?.prescription_id} for '${itemToDelete?.patient_name}'? This will execute a DELETE query in MySQL.`}
        confirmText="Confirm DELETE"
        isDeleting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}

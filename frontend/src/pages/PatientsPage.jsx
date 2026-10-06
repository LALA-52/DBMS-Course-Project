import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw, 
  FileCheck, 
  X, 
  UserPlus, 
  Phone, 
  Calendar 
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

export default function PatientsPage({ notify }) {
  const [patients, setPatients] = useState([]);
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
    patient_name: '',
    age: '',
    gender: 'Male',
    phone: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  const fetchPatients = async (searchTerm = search) => {
    setLoading(true);
    try {
      const res = await api.getPatients(searchTerm);
      if (res.success) {
        setPatients(res.data);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'Failed to Fetch Patients',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients(search);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.patient_name.trim()) errors.patient_name = 'Patient Name is required';
    if (formData.age === '' || isNaN(formData.age) || parseInt(formData.age, 10) < 0 || parseInt(formData.age, 10) > 150) {
      errors.age = 'Age must be between 0 and 150';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone Number is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        patient_name: formData.patient_name.trim(),
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        phone: formData.phone.trim()
      };

      const res = await api.createPatient(payload);
      if (res.success) {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setNewlyAddedId(res.insertId);

        notify({
          type: 'success',
          title: 'MySQL INSERT Successful',
          message: `Inserted patient '${payload.patient_name}' with ID #${res.insertId} into 'patients' table.`,
          sql: `INSERT INTO patients (patient_name, age, gender, phone) VALUES ('${payload.patient_name}', ${payload.age}, '${payload.gender}', '${payload.phone}');`
        });

        await fetchPatients('');
        setSearch('');

        setTimeout(() => {
          setNewlyAddedId(null);
        }, 5000);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'INSERT Operation Failed',
        message: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (patient) => {
    setItemToDelete(patient);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);

    try {
      const res = await api.deletePatient(itemToDelete.patient_id);
      if (res.success) {
        notify({
          type: 'success',
          title: 'MySQL DELETE Successful',
          message: `Patient #${itemToDelete.patient_id} ('${itemToDelete.patient_name}') deleted from MySQL.`,
          sql: `DELETE FROM patients WHERE patient_id = ${itemToDelete.patient_id};`
        });
        setDeleteModalOpen(false);
        setItemToDelete(null);
        await fetchPatients();
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
            <Users className="w-5 h-5 text-sky-600" />
            <span>Patient Registry & Demographics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Table: <code className="font-mono text-sky-700 bg-sky-50 px-1 py-0.5 rounded">patients</code> &bull; Total Registered: <span className="font-semibold text-slate-800">{patients.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPatients()}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
            title="Refresh table from MySQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Patient</span>
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
              placeholder="Search patients by name, phone number, or gender..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
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
                fetchPatients('');
              }}
              className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 transition"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Registered At</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && patients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                      <span>Querying MySQL table `patients`...</span>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No patient records found in MySQL database. Click "Add Patient" to insert one.
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const isNew = p.patient_id === newlyAddedId;
                  return (
                    <tr
                      key={p.patient_id}
                      className={`transition-colors ${
                        isNew ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        #{p.patient_id}
                        {isNew && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-sky-600 text-white font-semibold">
                            NEW
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.patient_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.age ?? '-'} yrs</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          p.gender === 'Female' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {p.gender || 'Other'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.phone || '-'}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openDeleteModal(p)}
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

      {/* ADD PATIENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Insert Patient Record into MySQL
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="p-6 space-y-4">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    name="patient_name"
                    value={formData.patient_name}
                    onChange={handleInputChange}
                    placeholder="e.g. John Doe"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                      formErrors.patient_name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.patient_name && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.patient_name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Age *
                    </label>
                    <input
                      type="number"
                      name="age"
                      min="0"
                      max="150"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="e.g. 45"
                      className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                        formErrors.age ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                    {formErrors.age && (
                      <p className="text-rose-500 text-[11px] mt-1">{formErrors.age}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +1-555-0143"
                    className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                      formErrors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* SQL Statement Preview */}
              <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto">
                <span className="text-slate-500 block mb-0.5">-- MySQL Query:</span>
                <code>
                  INSERT INTO patients (patient_name, age, gender, phone)
                  VALUES ('{formData.patient_name || '...'}', {formData.age || 0}, '{formData.gender}', '{formData.phone || '...'}');
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Executing INSERT...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Execute INSERT</span>
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
        message={`Are you sure you want to permanently delete patient '${itemToDelete?.patient_name}' (ID #${itemToDelete?.patient_id}) from the MySQL database? Associated prescription records may also be affected by Foreign Key cascading.`}
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

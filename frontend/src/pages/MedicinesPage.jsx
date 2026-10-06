import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  Sparkles, 
  X,
  FileCheck,
  Check
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

export default function MedicinesPage({ notify }) {
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
    medicine_name: '',
    category: '',
    manufacturer: '',
    batch_number: '',
    expiry_date: '',
    quantity: '',
    unit_price: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  const fetchMedicines = async (searchTerm = search) => {
    setLoading(true);
    try {
      const res = await api.getMedicines(searchTerm);
      if (res.success) {
        setMedicines(res.data);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'Query Execution Failed',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedicines(search);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Pre-fill demo data for Presentation-III
  const handlePrefillDemo = () => {
    setFormData({
      medicine_name: 'Paracetamol 500mg',
      category: 'Analgesic',
      manufacturer: 'Demo Pharma',
      batch_number: 'DEMO001',
      expiry_date: '2028-12-31',
      quantity: '100',
      unit_price: '25.00'
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.medicine_name.trim()) errors.medicine_name = 'Medicine Name is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.manufacturer.trim()) errors.manufacturer = 'Manufacturer is required';
    if (!formData.batch_number.trim()) errors.batch_number = 'Batch Number is required';
    if (!formData.expiry_date) errors.expiry_date = 'Expiry Date is required';
    if (formData.quantity === '' || isNaN(formData.quantity) || parseInt(formData.quantity, 10) < 0) {
      errors.quantity = 'Quantity must be a non-negative integer';
    }
    if (formData.unit_price === '' || isNaN(formData.unit_price) || parseFloat(formData.unit_price) < 0) {
      errors.unit_price = 'Unit Price must be a valid positive number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        medicine_name: formData.medicine_name.trim(),
        category: formData.category.trim(),
        manufacturer: formData.manufacturer.trim(),
        batch_number: formData.batch_number.trim(),
        expiry_date: formData.expiry_date,
        quantity: parseInt(formData.quantity, 10),
        unit_price: parseFloat(formData.unit_price)
      };

      const res = await api.createMedicine(payload);
      if (res.success) {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setNewlyAddedId(res.insertId);

        notify({
          type: 'success',
          title: 'MySQL INSERT Successful',
          message: `Inserted '${payload.medicine_name}' with ID #${res.insertId} into 'medicines' table.`,
          sql: `INSERT INTO medicines (medicine_name, category, manufacturer, batch_number, expiry_date, quantity, unit_price) VALUES ('${payload.medicine_name}', '${payload.category}', '${payload.manufacturer}', '${payload.batch_number}', '${payload.expiry_date}', ${payload.quantity}, ${payload.unit_price});`
        });

        await fetchMedicines('');
        setSearch('');

        // Clear highlight after 5s
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

  const openDeleteModal = (medicine) => {
    setItemToDelete(medicine);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);

    try {
      const res = await api.deleteMedicine(itemToDelete.medicine_id);
      if (res.success) {
        notify({
          type: 'success',
          title: 'MySQL DELETE Successful',
          message: `Record #${itemToDelete.medicine_id} ('${itemToDelete.medicine_name}') deleted from MySQL.`,
          sql: `DELETE FROM medicines WHERE medicine_id = ${itemToDelete.medicine_id};`
        });
        setDeleteModalOpen(false);
        setItemToDelete(null);
        await fetchMedicines();
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
            <Pill className="w-5 h-5 text-emerald-600" />
            <span>Medicine Inventory & Stock Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Table: <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">medicines</code> &bull; Total Records: <span className="font-semibold text-slate-800">{medicines.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchMedicines()}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
            title="Refresh table from MySQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
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
              placeholder="Search medicines by name, category, manufacturer, or batch number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
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
                fetchMedicines('');
              }}
              className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 transition"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Medicine Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Batch No.</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && medicines.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Querying MySQL table `medicines`...</span>
                    </div>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    No medicine records found in MySQL database. Click "Add Medicine" to insert one.
                  </td>
                </tr>
              ) : (
                medicines.map((m) => {
                  const isNew = m.medicine_id === newlyAddedId;
                  const isLowStock = m.quantity <= 10;
                  return (
                    <tr
                      key={m.medicine_id}
                      className={`transition-colors ${
                        isNew ? 'bg-emerald-50/80 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        #{m.medicine_id}
                        {isNew && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-600 text-white font-semibold">
                            NEW
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {m.medicine_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {m.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{m.manufacturer || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.batch_number || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{m.expiry_date}</td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            isLowStock
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {m.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                        ${parseFloat(m.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openDeleteModal(m)}
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

      {/* ADD MEDICINE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Insert Medicine Record into MySQL
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Demo Pre-fill Button */}
            <div className="px-6 pt-4 pb-2 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
              <span className="text-xs text-emerald-900 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Live Presentation Quick Filler:
              </span>
              <button
                type="button"
                onClick={handlePrefillDemo}
                className="text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-sm"
              >
                Autofill "Paracetamol 500mg" (Demo Req)
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddMedicine} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Medicine Name */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    name="medicine_name"
                    value={formData.medicine_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Paracetamol 500mg"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      formErrors.medicine_name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.medicine_name && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.medicine_name}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Analgesic, Antibiotic"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      formErrors.category ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.category && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.category}</p>
                  )}
                </div>

                {/* Manufacturer */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="e.g. Demo Pharma"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      formErrors.manufacturer ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.manufacturer && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.manufacturer}</p>
                  )}
                </div>

                {/* Batch Number */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleInputChange}
                    placeholder="e.g. DEMO001"
                    className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      formErrors.batch_number ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.batch_number && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.batch_number}</p>
                  )}
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      formErrors.expiry_date ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.expiry_date && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.expiry_date}</p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="e.g. 100"
                    className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      formErrors.quantity ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.quantity && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.quantity}</p>
                  )}
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    placeholder="e.g. 25.00"
                    className={`w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                      formErrors.unit_price ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  {formErrors.unit_price && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.unit_price}</p>
                  )}
                </div>
              </div>

              {/* SQL Statement Preview */}
              <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto">
                <span className="text-slate-500 block mb-0.5">-- MySQL Query Preview:</span>
                <code>
                  INSERT INTO medicines (medicine_name, category, manufacturer, batch_number, expiry_date, quantity, unit_price)
                  VALUES ('{formData.medicine_name || '...'}', '{formData.category || '...'}', '{formData.manufacturer || '...'}', '{formData.batch_number || '...'}', '{formData.expiry_date || '...'}', {formData.quantity || 0}, {formData.unit_price || 0.0});
                </code>
              </div>

              {/* Action Buttons */}
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Executing INSERT...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Execute INSERT in MySQL</span>
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
        message={`Are you sure you want to permanently delete '${itemToDelete?.medicine_name}' (ID #${itemToDelete?.medicine_id}) from the MySQL database? This will execute a DELETE statement.`}
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

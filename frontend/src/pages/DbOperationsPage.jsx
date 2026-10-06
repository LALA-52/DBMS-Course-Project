import React, { useState, useEffect } from 'react';
import { 
  Database, 
  PlusCircle, 
  Trash2, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Code2, 
  Terminal, 
  Sparkles,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

export default function DbOperationsPage({ notify }) {
  const [tables, setTables] = useState(['medicines', 'patients', 'prescriptions']);
  
  // Section A: INSERT State
  const [insertTable, setInsertTable] = useState('medicines');
  const [insertData, setInsertData] = useState({
    medicine_name: 'Paracetamol 500mg',
    category: 'Analgesic',
    manufacturer: 'Demo Pharma',
    batch_number: 'DEMO001',
    expiry_date: '2028-12-31',
    quantity: '100',
    unit_price: '25.00'
  });
  const [insertLoading, setInsertLoading] = useState(false);
  const [insertResult, setInsertResult] = useState(null);

  // Section B: DELETE State
  const [deleteTable, setDeleteTable] = useState('medicines');
  const [deleteRecordsList, setDeleteRecordsList] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Section C: VIEW State
  const [viewTable, setViewTable] = useState('medicines');
  const [viewRecords, setViewRecords] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewQuery, setViewQuery] = useState('');

  // Switch insert template when insert table changes
  const handleInsertTableChange = (table) => {
    setInsertTable(table);
    setInsertResult(null);
    if (table === 'medicines') {
      setInsertData({
        medicine_name: 'Paracetamol 500mg',
        category: 'Analgesic',
        manufacturer: 'Demo Pharma',
        batch_number: 'DEMO001',
        expiry_date: '2028-12-31',
        quantity: '100',
        unit_price: '25.00'
      });
    } else if (table === 'patients') {
      setInsertData({
        patient_name: 'David Beckham',
        age: '49',
        gender: 'Male',
        phone: '+1-555-0999'
      });
    } else if (table === 'prescriptions') {
      setInsertData({
        patient_id: '1',
        medicine_id: '1',
        prescription_date: new Date().toISOString().split('T')[0],
        dosage: '1 tablet twice daily after meals',
        quantity: '10',
        doctor_name: 'Dr. House (Presentation Demo)'
      });
    }
  };

  // Handle Input Change for Section A
  const handleInsertInputChange = (key, value) => {
    setInsertData((prev) => ({ ...prev, [key]: value }));
  };

  // Section A: Execute INSERT
  const handleExecuteInsert = async (e) => {
    e.preventDefault();
    setInsertLoading(true);
    setInsertResult(null);

    try {
      const res = await api.insertDbRecord(insertTable, insertData);
      if (res.success) {
        setInsertResult({
          success: true,
          message: res.message,
          sql: res.executedSql,
          insertId: res.insertId,
          record: res.record
        });

        notify({
          type: 'success',
          title: 'Section A: MySQL INSERT Success',
          message: res.message,
          sql: res.executedSql
        });

        // If currently viewing the same table, refresh view immediately
        if (viewTable === insertTable) {
          fetchViewRecords(insertTable);
        }
        // If delete table matches, refresh the records list
        if (deleteTable === insertTable) {
          fetchDeleteOptions(deleteTable);
        }
      }
    } catch (err) {
      setInsertResult({
        success: false,
        message: err.message
      });
      notify({
        type: 'error',
        title: 'Section A: INSERT Failed',
        message: err.message
      });
    } finally {
      setInsertLoading(false);
    }
  };

  // Fetch records to populate Section B delete selector
  const fetchDeleteOptions = async (table) => {
    try {
      const res = await api.getDbRecords(table);
      if (res.success) {
        setDeleteRecordsList(res.data);
        if (res.data.length > 0) {
          const pk = res.primaryKey;
          setSelectedRecordId(String(res.data[0][pk]));
        } else {
          setSelectedRecordId('');
        }
      }
    } catch (err) {
      console.error('Error fetching delete records list:', err);
    }
  };

  // Handle Delete Table Change
  const handleDeleteTableChange = (table) => {
    setDeleteTable(table);
    setDeleteResult(null);
    fetchDeleteOptions(table);
  };

  // Section B: Confirm & Execute DELETE
  const handleExecuteDelete = async () => {
    if (!selectedRecordId) return;
    setDeleteLoading(true);
    setDeleteResult(null);

    try {
      const res = await api.deleteDbRecord(deleteTable, selectedRecordId);
      if (res.success) {
        setDeleteResult({
          success: true,
          message: res.message,
          sql: res.executedSql,
          deletedId: res.deletedId
        });

        notify({
          type: 'success',
          title: 'Section B: MySQL DELETE Success',
          message: res.message,
          sql: res.executedSql
        });

        setDeleteModalOpen(false);

        // Refresh records in delete list
        await fetchDeleteOptions(deleteTable);

        // Refresh Section C view if matching
        if (viewTable === deleteTable) {
          fetchViewRecords(viewTable);
        }
      }
    } catch (err) {
      setDeleteResult({
        success: false,
        message: err.message
      });
      notify({
        type: 'error',
        title: 'Section B: DELETE Failed',
        message: err.message
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Section C: Fetch Records
  const fetchViewRecords = async (table = viewTable) => {
    setViewLoading(true);
    try {
      const res = await api.getDbRecords(table);
      if (res.success) {
        setViewRecords(res.data);
        setViewQuery(res.executedQuery);
      }
    } catch (err) {
      notify({
        type: 'error',
        title: 'Section C: VIEW Failed',
        message: err.message
      });
    } finally {
      setViewLoading(false);
    }
  };

  // Load initial states
  useEffect(() => {
    fetchDeleteOptions(deleteTable);
    fetchViewRecords(viewTable);
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Academic Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs mb-1">
              <Database className="w-4 h-4" />
              <span>DBMS Presentation-III Live Demonstration Console</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Direct Database Operations against MySQL (`pharmacy_management`)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              This interface is engineered specifically to demonstrate raw SQL statements (INSERT, DELETE, VIEW) and verify ACID properties in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 bg-slate-800 rounded-lg border border-slate-700 text-xs font-mono text-emerald-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>MySQL 9.x / 26.x</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION A & SECTION B (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ========================================================= */}
        {/* SECTION A: INSERT RECORD */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  SECTION A &bull; INSERT RECORD
                </h3>
                <p className="text-[11px] text-slate-500">Executes SQL INSERT INTO statement</p>
              </div>
            </div>
            
            {/* Table Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 font-medium">Table:</span>
              <select
                value={insertTable}
                onChange={(e) => handleInsertTableChange(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {tables.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleExecuteInsert} className="p-5 flex-1 flex flex-col space-y-4">
            <div className="space-y-3 flex-1 text-xs">
              {Object.keys(insertData).map((field) => (
                <div key={field}>
                  <label className="block font-semibold text-slate-700 mb-1 capitalize">
                    {field.replace(/_/g, ' ')}:
                  </label>
                  <input
                    type={field.includes('date') ? 'date' : field.includes('price') || field.includes('quantity') || field.includes('age') || field.includes('id') ? 'number' : 'text'}
                    step={field.includes('price') ? '0.01' : '1'}
                    value={insertData[field] || ''}
                    onChange={(e) => handleInsertInputChange(field, e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              ))}
            </div>

            {/* Generated SQL Preview */}
            <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto">
              <span className="text-slate-500 block text-[10px]">-- Executing SQL:</span>
              <code>
                INSERT INTO {insertTable} ({Object.keys(insertData).join(', ')})
                VALUES ({Object.values(insertData).map(v => `'${v}'`).join(', ')});
              </code>
            </div>

            {/* Result Message Box */}
            {insertResult && (
              <div className={`p-3 rounded-lg text-xs ${
                insertResult.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {insertResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{insertResult.success ? 'Query Executed Successfully!' : 'Execution Failed'}</span>
                </div>
                <p className="mt-1 text-[11px]">{insertResult.message}</p>
                {insertResult.insertId && (
                  <p className="font-mono text-[11px] font-bold mt-1 text-emerald-700">
                    Generated AUTO_INCREMENT ID: #{insertResult.insertId}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={insertLoading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {insertLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Executing MySQL INSERT...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Execute INSERT Record</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ========================================================= */}
        {/* SECTION B: DELETE RECORD */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                B
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  SECTION B &bull; DELETE RECORD
                </h3>
                <p className="text-[11px] text-slate-500">Executes SQL DELETE FROM statement</p>
              </div>
            </div>

            {/* Table Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 font-medium">Table:</span>
              <select
                value={deleteTable}
                onChange={(e) => handleDeleteTableChange(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                {tables.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Target Record to Delete from `{deleteTable}`:
                </label>
                {deleteRecordsList.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-400 border border-slate-200">
                    No records found in table `{deleteTable}` to delete.
                  </div>
                ) : (
                  <select
                    value={selectedRecordId}
                    onChange={(e) => setSelectedRecordId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    {deleteRecordsList.map((row) => {
                      const pk = deleteTable === 'medicines' ? 'medicine_id' : deleteTable === 'patients' ? 'patient_id' : 'prescription_id';
                      const label = deleteTable === 'medicines' 
                        ? `${row.medicine_name} (Batch: ${row.batch_number}, Qty: ${row.quantity})`
                        : deleteTable === 'patients'
                        ? `${row.patient_name} (${row.gender}, ${row.phone})`
                        : `RX #${row.prescription_id} - ${row.patient_name} (${row.medicine_name})`;
                      return (
                        <option key={row[pk]} value={row[pk]}>
                          ID #{row[pk]} &bull; {label}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Or manual ID input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Or enter specific Record ID:
                </label>
                <input
                  type="number"
                  placeholder="Record ID"
                  value={selectedRecordId}
                  onChange={(e) => setSelectedRecordId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Generated SQL Preview */}
              <div className="p-3 bg-slate-950 text-rose-400 font-mono text-[11px] rounded-lg overflow-x-auto">
                <span className="text-slate-500 block text-[10px]">-- Executing SQL:</span>
                <code>
                  DELETE FROM {deleteTable} WHERE {deleteTable === 'medicines' ? 'medicine_id' : deleteTable === 'patients' ? 'patient_id' : 'prescription_id'} = {selectedRecordId || '?'};
                </code>
              </div>

              {/* Result Message Box */}
              {deleteResult && (
                <div className={`p-3 rounded-lg text-xs ${
                  deleteResult.success
                    ? 'bg-rose-50 text-rose-900 border border-rose-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {deleteResult.success ? <CheckCircle2 className="w-4 h-4 text-rose-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                    <span>{deleteResult.success ? 'Record Permanently Deleted from MySQL' : 'Execution Failed'}</span>
                  </div>
                  <p className="mt-1 text-[11px]">{deleteResult.message}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={!selectedRecordId || deleteLoading || deleteRecordsList.length === 0}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Initiate DELETE from MySQL</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION C: VIEW RECORDS */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-indigo-50/50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              C
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                SECTION C &bull; VIEW RECORDS
              </h3>
              <p className="text-[11px] text-slate-500">Live query result from MySQL table `{viewTable}`</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 font-medium">Select Table:</span>
              <select
                value={viewTable}
                onChange={(e) => {
                  setViewTable(e.target.value);
                  fetchViewRecords(e.target.value);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {tables.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchViewRecords(viewTable)}
              disabled={viewLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${viewLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Records</span>
            </button>
          </div>
        </div>

        {/* Live Executed Query Bar */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-[11px]">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Executed SQL:</span>
            <code className="text-emerald-400">{viewQuery || `SELECT * FROM ${viewTable}`}</code>
          </div>
          <span className="text-slate-400 text-[11px] font-mono">
            {viewRecords.length} rows returned
          </span>
        </div>

        {/* Table Results */}
        <div className="overflow-x-auto">
          {viewLoading ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
              <span>Querying MySQL `{viewTable}` table...</span>
            </div>
          ) : viewRecords.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Table `{viewTable}` currently contains 0 records in MySQL.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  {Object.keys(viewRecords[0]).map((col) => (
                    <th key={col} className="py-3 px-4 capitalize whitespace-nowrap">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewRecords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 font-mono text-[11px]">
                    {Object.keys(row).map((col) => (
                      <td key={col} className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                        {row[col] !== null ? String(row[col]) : <span className="text-slate-400 italic">NULL</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal for Section B */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Confirm Section B MySQL DELETE"
        message={`Are you sure you want to execute DELETE FROM ${deleteTable} WHERE id = ${selectedRecordId}? This live database change will immediately update the database.`}
        confirmText="Execute MySQL DELETE"
        isDeleting={deleteLoading}
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}

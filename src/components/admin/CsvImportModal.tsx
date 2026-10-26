import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Download, CheckCircle2, AlertTriangle, 
  RefreshCw, FileText, Check, ShieldCheck, ChevronRight
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { CsvImportMode, ImportRowValidation, ImportHistoryItem } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { 
  generateCsvTemplate, 
  parseCsv, 
  validateAndDiffCsvRows, 
  executeImport, 
  generateImportAuditReportCsv 
} from '../../lib/bulkProductService';

export interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importMode, setImportMode] = useState<CsvImportMode>('upsert');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [validatedRows, setValidatedRows] = useState<ImportRowValidation[]>([]);
  const [rowFilter, setRowFilter] = useState<'all' | 'valid' | 'invalid' | 'create' | 'update'>('all');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState<{
    processed: number;
    total: number;
    successes: number;
    failures: number;
  } | null>(null);
  const [completedHistoryItem, setCompletedHistoryItem] = useState<ImportHistoryItem | null>(null);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isExecuting) {
        if (isConfirmModalOpen) setIsConfirmModalOpen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExecuting, isConfirmModalOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUploadedFileName('');
      setValidatedRows([]);
      setCompletedHistoryItem(null);
      setExecutionProgress(null);
      setIsExecuting(false);
      setIsConfirmModalOpen(false);
      setRowFilter('all');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Template Download
  const handleDownloadTemplate = () => {
    const csvContent = generateCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ra_guppy_products_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sample CSV template downloaded.', 'success');
  };

  // Handle File Upload and Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please upload a valid .csv spreadsheet file', 'error');
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsv(text);

        if (parsed.rows.length === 0) {
          showToast('The selected CSV file does not contain any product data rows', 'error');
          return;
        }

        const existingProducts = mockDb.getProducts();
        const categories = mockDb.getCategories();
        const validation = validateAndDiffCsvRows(parsed.rows, importMode, existingProducts, categories);

        setValidatedRows(validation.results);
        setCompletedHistoryItem(null);
        showToast(`Parsed ${validation.results.length} rows (${validation.validCount} valid, ${validation.invalidCount} with issues)`, 'info');
      } catch (err: any) {
        showToast(err.message || 'Error parsing CSV file', 'error');
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Toggle row selection for inclusion
  const toggleRowSelection = (rowNumber: number) => {
    setValidatedRows(prev => prev.map(r => 
      r.row_number === rowNumber ? { ...r, is_selected: !r.is_selected } : r
    ));
  };

  // Select / Deselect all
  const selectAllValid = (select: boolean) => {
    setValidatedRows(prev => prev.map(r => ({
      ...r,
      is_selected: select && r.status !== 'invalid',
    })));
  };

  // Re-run validation when importMode changes
  const handleModeChange = (newMode: CsvImportMode) => {
    setImportMode(newMode);
    if (validatedRows.length > 0) {
      const rawRows = validatedRows.map(r => r.raw_data);
      const existingProducts = mockDb.getProducts();
      const categories = mockDb.getCategories();
      const validation = validateAndDiffCsvRows(rawRows, newMode, existingProducts, categories);
      setValidatedRows(validation.results);
    }
  };

  // Execute Import
  const handleCommitImport = async () => {
    setIsConfirmModalOpen(false);
    setIsExecuting(true);
    setExecutionProgress({ processed: 0, total: validatedRows.filter(r => r.is_selected).length, successes: 0, failures: 0 });

    try {
      const res = await executeImport(
        validatedRows,
        importMode,
        uploadedFileName || 'products-import.csv',
        user?.email || 'raguppies00@gmail.com',
        (progress) => {
          setExecutionProgress(progress);
        }
      );

      setCompletedHistoryItem(res.historyItem);
      setIsExecuting(false);

      if (res.success) {
        showToast(`Successfully processed ${res.historyItem.success_count} products!`, 'success');
      } else {
        showToast(`Import finished with ${res.historyItem.failure_count} errors. Check report.`, 'error');
      }
      onImportSuccess();
    } catch (err: any) {
      showToast(err.message || 'Import execution failed', 'error');
      setIsExecuting(false);
    }
  };

  // Retry failed rows
  const handleRetryFailedRows = () => {
    if (!completedHistoryItem) return;
    const failedRowNumbers = new Set(
      (completedHistoryItem.raw_results || [])
        .filter(r => r.status === 'failed')
        .map(r => r.row_number)
    );

    setValidatedRows(prev => prev.map(r => ({
      ...r,
      is_selected: failedRowNumbers.has(r.row_number),
    })));

    setCompletedHistoryItem(null);
    showToast(`Selected ${failedRowNumbers.size} failed rows for retry.`, 'info');
  };

  // Download Audit Report CSV
  const handleDownloadReport = (item: ImportHistoryItem) => {
    const csvContent = generateImportAuditReportCsv(item);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `import-audit-report-${item.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Import audit report downloaded.', 'success');
  };

  // Filtering preview rows
  const displayPreviewRows = validatedRows.filter(r => {
    if (rowFilter === 'valid') return r.status === 'valid' || r.status === 'warning';
    if (rowFilter === 'invalid') return r.status === 'invalid';
    if (rowFilter === 'create') return r.operation === 'create';
    if (rowFilter === 'update') return r.operation === 'update';
    return true;
  });

  const validCount = validatedRows.filter(r => r.status !== 'invalid').length;
  const invalidCount = validatedRows.filter(r => r.status === 'invalid').length;
  const createCount = validatedRows.filter(r => r.operation === 'create' && r.status !== 'invalid').length;
  const updateCount = validatedRows.filter(r => r.operation === 'update' && r.status !== 'invalid').length;
  const selectedCount = validatedRows.filter(r => r.is_selected).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-import-title"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 id="csv-import-title" className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                Bulk Product Import & CSV Engine
              </h2>
              <p className="text-xs text-slate-500">
                Upload inventory spreadsheets, map fields, inspect live diffs, and batch commit to catalog.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Download standardized RFC 4180 CSV template"
            >
              <Download className="w-3.5 h-3.5 text-blue-900" />
              <span>Download Template</span>
            </button>
            <button
              onClick={onClose}
              disabled={isExecuting}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Close CSV Import Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Mode Selection & Upload Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode Selector */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                1. Select Import Mode
              </label>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleModeChange('create')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    importMode === 'create'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold">Mode A</div>
                  <div className="text-[10px] font-normal opacity-90 mt-0.5">Create Only</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('update')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    importMode === 'update'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold">Mode B</div>
                  <div className="text-[10px] font-normal opacity-90 mt-0.5">Update Only</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('upsert')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    importMode === 'upsert'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold">Mode C</div>
                  <div className="text-[10px] font-normal opacity-90 mt-0.5">Upsert (Both)</div>
                </button>
              </div>

              <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                {importMode === 'create' && 'Mode A creates new products. Existing SKUs are rejected to strictly prevent duplicate catalog entries.'}
                {importMode === 'update' && 'Mode B matches products by SKU or ID. Omitted cells leave existing database values untouched.'}
                {importMode === 'upsert' && 'Mode C matches existing records by SKU or ID to update fields, and creates new products when no match exists.'}
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Click to Browse or Drag & Drop Product CSV'}
              </div>
              <p className="text-[11px] text-slate-500">
                Supports standard RFC 4180 format. Semicolon-delimited for tags and media URLs.
              </p>
            </div>
          </div>

          {/* Step 2: Validation Summary & Row Review */}
          {validatedRows.length > 0 && (
            <div className="space-y-4">
              {/* Validation Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                <div 
                  onClick={() => setRowFilter('all')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${rowFilter === 'all' ? 'border-blue-900 bg-blue-50/50 ring-1 ring-blue-900' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Rows</span>
                  <span className="text-lg font-bold text-slate-900 font-display block">{validatedRows.length}</span>
                </div>

                <div 
                  onClick={() => setRowFilter('valid')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${rowFilter === 'valid' ? 'border-green-600 bg-green-50/50 ring-1 ring-green-600' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-green-700 uppercase block">Valid</span>
                  <span className="text-lg font-bold text-green-700 font-display block">{validCount}</span>
                </div>

                <div 
                  onClick={() => setRowFilter('create')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${rowFilter === 'create' ? 'border-blue-700 bg-blue-50/50 ring-1 ring-blue-700' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Creates</span>
                  <span className="text-lg font-bold text-blue-700 font-display block">{createCount}</span>
                </div>

                <div 
                  onClick={() => setRowFilter('update')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${rowFilter === 'update' ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Updates</span>
                  <span className="text-lg font-bold text-amber-700 font-display block">{updateCount}</span>
                </div>

                <div 
                  onClick={() => setRowFilter('invalid')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${rowFilter === 'invalid' ? 'border-red-600 bg-red-50/50 ring-1 ring-red-600' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-red-600 uppercase block">Errors</span>
                  <span className="text-lg font-bold text-red-600 font-display block">{invalidCount}</span>
                </div>

                <div className="p-2.5 rounded-xl border bg-slate-50 border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Selected</span>
                  <span className="text-lg font-bold text-blue-900 font-display block">{selectedCount}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectAllValid(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Select All Valid
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAllValid(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Filter view:</span>
                  <select
                    value={rowFilter}
                    onChange={(e) => setRowFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs"
                  >
                    <option value="all">All Rows ({validatedRows.length})</option>
                    <option value="valid">Valid Rows ({validCount})</option>
                    <option value="create">New Products ({createCount})</option>
                    <option value="update">Modifications ({updateCount})</option>
                    <option value="invalid">Invalid / Errors ({invalidCount})</option>
                  </select>
                </div>
              </div>

              {/* Rows Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 text-center w-10">Use</th>
                      <th className="p-2.5 w-12">Row</th>
                      <th className="p-2.5">SKU</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Price</th>
                      <th className="p-2.5">Stock</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Mode Action</th>
                      <th className="p-2.5">Validation / Diffs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {displayPreviewRows.map((r) => (
                      <tr key={r.row_number} className={`hover:bg-slate-50 transition-colors ${!r.is_selected ? 'opacity-50' : ''}`}>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={r.is_selected}
                            disabled={r.status === 'invalid'}
                            onChange={() => toggleRowSelection(r.row_number)}
                            className="accent-blue-900 w-4 h-4 rounded cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-mono text-slate-400 text-[11px]">#{r.row_number}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">{r.parsed_data.sku || r.matched_product_sku || '—'}</td>
                        <td className="p-2.5 font-medium text-slate-800 max-w-[180px] truncate">{r.parsed_data.name || '—'}</td>
                        <td className="p-2.5 font-mono font-semibold text-slate-900">
                          {r.parsed_data.price !== undefined ? formatCurrency(r.parsed_data.price) : '—'}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">{r.parsed_data.stock_quantity ?? '—'}</td>
                        <td className="p-2.5 text-slate-600">{r.parsed_data.category_name || '—'}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            r.operation === 'create' ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {r.operation}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {r.errors.length > 0 ? (
                            <div className="text-red-600 flex items-center gap-1 font-semibold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{r.errors[0]}</span>
                            </div>
                          ) : r.diffs.length > 0 ? (
                            <div className="space-y-0.5 text-[11px]">
                              {r.diffs.map((d, dIdx) => (
                                <div key={dIdx} className="text-slate-600">
                                  <span className="font-semibold text-slate-800">{d.field}:</span>{' '}
                                  <span className="line-through text-slate-400">{String(d.old_value ?? 'none')}</span>{' '}
                                  <span className="text-blue-900 font-bold">→ {String(d.new_value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-green-700 font-semibold text-[11px] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              <span>Ready</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedCount > 0 ? (
              <span>Ready to commit <strong className="text-slate-900 font-bold">{selectedCount}</strong> selected rows.</span>
            ) : (
              <span>Upload a CSV file and select rows to import.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={selectedCount === 0 || isExecuting}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                selectedCount > 0 && !isExecuting
                  ? 'bg-blue-900 hover:bg-blue-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import Selected ({selectedCount})</span>
            </button>
          </div>
        </div>

        {/* Execution Confirmation Sub-Modal */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Confirm Bulk Import Execution</h3>
                  <span className="text-[11px] text-slate-500">Atomic database batch commit</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-600 leading-relaxed">
                <p>You are about to execute bulk import operations for <strong className="text-blue-900">{selectedCount} products</strong>:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Mode: <strong className="uppercase font-mono text-slate-800">{importMode}</strong></li>
                  <li>New products to create: <strong className="text-blue-900">{validatedRows.filter(r => r.is_selected && r.operation === 'create').length}</strong></li>
                  <li>Existing products to update: <strong className="text-amber-700">{validatedRows.filter(r => r.is_selected && r.operation === 'update').length}</strong></li>
                </ul>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  All operations are recorded in the security audit log with administrator identity ({user?.email || 'Admin'}).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirm & Commit Batches
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress & Results Modal */}
        {(isExecuting || completedHistoryItem) && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                {isExecuting ? (
                  <RefreshCw className="w-5 h-5 text-blue-900 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                <h3 className="font-bold text-slate-900 text-sm">
                  {isExecuting ? 'Processing Import Batches...' : 'Import Execution Complete'}
                </h3>
              </div>

              {isExecuting && executionProgress && (
                <div className="space-y-3 py-4">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Progress: {executionProgress.processed} of {executionProgress.total}</span>
                    <span>{Math.round((executionProgress.processed / Math.max(1, executionProgress.total)) * 100)}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-blue-900 transition-all duration-300"
                      style={{ width: `${(executionProgress.processed / Math.max(1, executionProgress.total)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span className="text-green-700 font-semibold">{executionProgress.successes} successful</span>
                    <span className="text-red-600 font-semibold">{executionProgress.failures} errors</span>
                  </div>
                </div>
              )}

              {completedHistoryItem && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase">Total</span>
                      <span className="font-bold text-base text-slate-900">{completedHistoryItem.total_rows}</span>
                    </div>
                    <div className="p-2.5 bg-green-50 rounded-xl border border-green-200">
                      <span className="text-[10px] text-green-700 block uppercase">Success</span>
                      <span className="font-bold text-base text-green-700">{completedHistoryItem.success_count}</span>
                    </div>
                    <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-[10px] text-red-600 block uppercase">Failed</span>
                      <span className="font-bold text-base text-red-600">{completedHistoryItem.failure_count}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase">Skipped</span>
                      <span className="font-bold text-base text-slate-600">{completedHistoryItem.skipped_count}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => handleDownloadReport(completedHistoryItem)}
                      className="flex-1 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-900" />
                      <span>Download Audit Report (CSV)</span>
                    </button>

                    {completedHistoryItem.failure_count > 0 && (
                      <button
                        onClick={handleRetryFailedRows}
                        className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Failed Rows</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setCompletedHistoryItem(null);
                        onClose();
                      }}
                      className="py-2 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

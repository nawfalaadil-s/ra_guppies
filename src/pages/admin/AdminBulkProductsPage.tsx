import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, 
  X, RefreshCw, Search, Layers, 
  Edit3, ShieldAlert, Check, 
  History, ChevronLeft, ChevronRight, ShieldCheck
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Product, CsvImportMode, ImportRowValidation, ImportHistoryItem } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { SEO } from '../../components/common/SEO';
import { 
  generateCsvTemplate, parseCsv, validateAndDiffCsvRows, 
  executeImport, generateImportAuditReportCsv, applyBulkEdit 
} from '../../lib/bulkProductService';
import { deleteSupabaseProducts } from '../../lib/supabaseSync';

export const AdminBulkProductsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'import' | 'bulk_edit' | 'history'>('import');
  const [products, setProducts] = useState<Product[]>(() => mockDb.getProducts());
  const categories = mockDb.getCategories();

  // -------------------------------------------------------------
  // TAB 1: CSV IMPORT & UPSERT STATE
  // -------------------------------------------------------------
  const [importMode, setImportMode] = useState<CsvImportMode>('upsert');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [validatedRows, setValidatedRows] = useState<ImportRowValidation[]>([]);
  const [rowFilter, setRowFilter] = useState<'all' | 'valid' | 'invalid' | 'creates' | 'updates'>('all');
  
  // Execution & Progress State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionProgress, setExecutionProgress] = useState<{ processed: number; total: number; successes: number; failures: number } | null>(null);
  const [completedHistoryItem, setCompletedHistoryItem] = useState<ImportHistoryItem | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // TAB 2: BULK EDIT & INVENTORY STATE
  // -------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Bulk Edit Action Config
  const [bulkActionField, setBulkActionField] = useState<'price' | 'compare_at_price' | 'stock_quantity' | 'status' | 'category_id' | 'subcategory_id' | 'is_featured' | 'tags'>('price');
  const [bulkActionOperation, setBulkActionOperation] = useState<'set' | 'increase_amount' | 'decrease_amount' | 'increase_percent' | 'decrease_percent' | 'add_tags' | 'remove_tags'>('set');
  const [bulkActionValue, setBulkActionValue] = useState<string>('');
  const [isBulkEditPreviewOpen, setIsBulkEditPreviewOpen] = useState(false);

  // Bulk Delete Modal
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [archiveOrdersProtected, setArchiveOrdersProtected] = useState(true);

  // -------------------------------------------------------------
  // TAB 3: IMPORT HISTORY STATE
  // -------------------------------------------------------------
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>(() => mockDb.getImportHistory());

  const refreshProducts = () => {
    setProducts(mockDb.getProducts());
    setImportHistory(mockDb.getImportHistory());
  };

  // -------------------------------------------------------------
  // CSV TEMPLATE DOWNLOAD
  // -------------------------------------------------------------
  const handleDownloadTemplate = () => {
    const csvContent = generateCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ra-guppy-product-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sample CSV template downloaded successfully.', 'success');
  };

  // -------------------------------------------------------------
  // CSV FILE UPLOAD & VALIDATION
  // -------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please upload a valid .csv file.', 'error');
      return;
    }

    setUploadedFileName(file.name);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { rows } = parseCsv(text);

        if (rows.length === 0) {
          showToast('The CSV file contains no data rows.', 'error');
          setIsParsing(false);
          return;
        }

        const currentProducts = mockDb.getProducts();
        const currentCategories = mockDb.getCategories();

        const validation = validateAndDiffCsvRows(
          rows,
          importMode,
          currentProducts,
          currentCategories
        );

        setValidatedRows(validation.results);
        setIsParsing(false);
        showToast(`Parsed ${rows.length} rows. ${validation.validCount} valid, ${validation.invalidCount} errors.`, 'info');
      } catch (err: any) {
        showToast(err.message || 'Failed to parse CSV file', 'error');
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  // Re-run validation if import mode changes
  useEffect(() => {
    if (validatedRows.length > 0) {
      const rawRows = validatedRows.map(r => r.raw_data);
      const currentProducts = mockDb.getProducts();
      const currentCategories = mockDb.getCategories();
      const revalidated = validateAndDiffCsvRows(rawRows, importMode, currentProducts, currentCategories);
      setValidatedRows(revalidated.results);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importMode]);

  // Toggle selection for a single row
  const toggleRowSelection = (rowNumber: number) => {
    setValidatedRows(prev => prev.map(r => 
      r.row_number === rowNumber ? { ...r, is_selected: !r.is_selected } : r
    ));
  };

  // Select all / deselect all rows in preview
  const toggleAllRows = (select: boolean) => {
    setValidatedRows(prev => prev.map(r => 
      r.status === 'invalid' ? r : { ...r, is_selected: select }
    ));
  };

  // Execute Import
  const handleStartImport = async () => {
    setIsConfirmModalOpen(false);
    setIsExecuting(true);
    setExecutionProgress({ processed: 0, total: validatedRows.filter(r => r.is_selected).length, successes: 0, failures: 0 });

    try {
      const res = await executeImport(
        validatedRows,
        importMode,
        uploadedFileName || 'products-upload.csv',
        user?.email || 'raguppies00@gmail.com',
        (progress) => setExecutionProgress(progress)
      );

      setCompletedHistoryItem(res.historyItem);
      setIsExecuting(false);
      refreshProducts();

      if (res.success) {
        showToast(`Successfully processed ${res.historyItem.success_count} products!`, 'success');
      } else {
        showToast(`Import finished with ${res.historyItem.failure_count} errors. Check report.`, 'error');
      }
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

  // -------------------------------------------------------------
  // TAB 2: BULK EDIT FILTERING & PAGINATION
  // -------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
      if (statusFilter !== 'all') {
        const pStatus = p.status || (p.is_active ? 'published' : 'draft');
        if (pStatus !== statusFilter) return false;
      }
      if (stockFilter === 'in_stock' && p.stock_quantity <= 0) return false;
      if (stockFilter === 'out_of_stock' && p.stock_quantity > 0) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesSlug = p.slug.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesId && !matchesSlug) return false;
      }
      return true;
    });
  }, [products, categoryFilter, statusFilter, stockFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPageProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const toggleProductSelect = (id: string) => {
    const updated = new Set(selectedProductIds);
    if (updated.has(id)) {
      updated.delete(id);
      setIsAllMatchingSelected(false);
    } else {
      updated.add(id);
    }
    setSelectedProductIds(updated);
  };

  const selectCurrentPage = () => {
    const updated = new Set(selectedProductIds);
    currentPageProducts.forEach(p => updated.add(p.id));
    setSelectedProductIds(updated);
  };

  const selectAllMatching = () => {
    const updated = new Set<string>();
    filteredProducts.forEach(p => updated.add(p.id));
    setSelectedProductIds(updated);
    setIsAllMatchingSelected(true);
  };

  const clearSelection = () => {
    setSelectedProductIds(new Set());
    setIsAllMatchingSelected(false);
  };

  // Commit Bulk Edit
  const handleApplyBulkEdit = () => {
    if (selectedProductIds.size === 0) {
      showToast('No products selected for bulk editing.', 'error');
      return;
    }

    const res = applyBulkEdit(
      Array.from(selectedProductIds),
      {
        field: bulkActionField,
        operation: bulkActionOperation,
        value: bulkActionValue,
      },
      user?.email || 'raguppies00@gmail.com'
    );

    setIsBulkEditPreviewOpen(false);
    refreshProducts();
    clearSelection();
    showToast(`Bulk edit applied: ${res.successCount} updated successfully.`, 'success');
  };

  // Commit Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedProductIds.size === 0) return;
    const ids = Array.from(selectedProductIds);
    const targetProducts = products.filter(p => selectedProductIds.has(p.id));
    const skus = targetProducts.map(p => p.sku).filter(Boolean);

    // 1. Delete locally from mock database
    const res = mockDb.bulkDeleteProducts(ids, { force: true });

    // 2. Delete from live Supabase PostgreSQL
    await deleteSupabaseProducts(ids, skus);

    setIsBulkDeleteModalOpen(false);
    refreshProducts();
    clearSelection();

    showToast(`Permanently deleted ${ids.length} products from catalog and database.`, 'success');
  };

  // Filter preview rows
  const displayPreviewRows = useMemo(() => {
    if (rowFilter === 'all') return validatedRows;
    if (rowFilter === 'valid') return validatedRows.filter(r => r.status === 'valid');
    if (rowFilter === 'invalid') return validatedRows.filter(r => r.status === 'invalid');
    if (rowFilter === 'creates') return validatedRows.filter(r => r.operation === 'create');
    if (rowFilter === 'updates') return validatedRows.filter(r => r.operation === 'update');
    return validatedRows;
  }, [validatedRows, rowFilter]);

  const validCount = validatedRows.filter(r => r.status !== 'invalid').length;
  const invalidCount = validatedRows.filter(r => r.status === 'invalid').length;
  const createCount = validatedRows.filter(r => r.operation === 'create' && r.status !== 'invalid').length;
  const updateCount = validatedRows.filter(r => r.operation === 'update' && r.status !== 'invalid').length;
  const selectedCount = validatedRows.filter(r => r.is_selected).length;

  return (
    <div className="space-y-6 pb-16">
      <SEO title="Bulk Product & CSV Management | Admin" description="Bulk upload, CSV import, upsert, bulk editing, and safe deletion for ornamental fish catalog." />

      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
            <FileSpreadsheet className="w-4 h-4 text-red-600" />
            <span>High-Volume Catalog & Inventory Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Bulk Product Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Import, update, or upsert thousands of specimen records via CSV, batch-edit prices & inventory, and safely archive catalog records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-900" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'import'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>CSV Bulk Import & Upsert</span>
          {validatedRows.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 text-[10px]">{validatedRows.length}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bulk_edit')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'bulk_edit'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Bulk Edit & Inventory Tools</span>
          {selectedProductIds.size > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[10px]">{selectedProductIds.size}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Import History & Audit</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: CSV BULK IMPORT & UPSERT */}
      {/* ============================================================= */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Mode Selector & Upload Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Step 1: Choose Import Mode</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <label className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer font-bold transition-all ${
                    importMode === 'upsert' ? 'border-blue-900 bg-blue-50/50 text-blue-950 ring-1 ring-blue-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="import-mode"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="accent-blue-900"
                    />
                    <span>Mode C: Upsert (Update Matching + Create New)</span>
                  </label>

                  <label className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer font-bold transition-all ${
                    importMode === 'create' ? 'border-blue-900 bg-blue-50/50 text-blue-950 ring-1 ring-blue-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="import-mode"
                      checked={importMode === 'create'}
                      onChange={() => setImportMode('create')}
                      className="accent-blue-900"
                    />
                    <span>Mode A: Create Only (Reject Duplicate SKUs)</span>
                  </label>

                  <label className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border cursor-pointer font-bold transition-all ${
                    importMode === 'update' ? 'border-blue-900 bg-blue-50/50 text-blue-950 ring-1 ring-blue-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="import-mode"
                      checked={importMode === 'update'}
                      onChange={() => setImportMode('update')}
                      className="accent-blue-900"
                    />
                    <span>Mode B: Update Only (Match SKU/ID, Diff Columns)</span>
                  </label>
                </div>
              </div>

              <div className="text-xs text-slate-500 max-w-xs">
                {importMode === 'upsert' && 'Matches existing records by SKU or Product ID to update fields, and creates new products when no match exists.'}
                {importMode === 'create' && 'Creates new products only. Rejects existing SKUs to strictly prevent duplicate entries.'}
                {importMode === 'update' && 'Updates existing products by SKU or ID. Only modified columns are updated; omitted columns remain intact.'}
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer space-y-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 mx-auto flex items-center justify-center">
                {isParsing ? <RefreshCw className="w-6 h-6 animate-spin text-blue-900" /> : <Upload className="w-6 h-6" />}
              </div>
              <div className="text-xs font-bold text-slate-800">
                {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Click to Browse or Drag & Drop Product CSV'}
              </div>
              <p className="text-[11px] text-slate-500">
                Supports up to 10,000 rows. Semicolon-delimited for tags and media URLs. UTF-8 encoded.
              </p>
            </div>
          </div>

          {/* Validation Summary Cards */}
          {validatedRows.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                <div 
                  onClick={() => setRowFilter('all')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${rowFilter === 'all' ? 'border-blue-900 bg-blue-50/50 ring-1 ring-blue-900' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total Rows</span>
                  <span className="text-xl font-bold text-slate-900 font-display block mt-0.5">{validatedRows.length}</span>
                </div>

                <div 
                  onClick={() => setRowFilter('valid')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${rowFilter === 'valid' ? 'border-green-600 bg-green-50/50 ring-1 ring-green-600' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-green-700 uppercase">Valid Rows</span>
                  <span className="text-xl font-bold text-green-700 font-display block mt-0.5">{validCount}</span>
                </div>

                <div 
                  onClick={() => setRowFilter('invalid')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${rowFilter === 'invalid' ? 'border-red-600 bg-red-50/50 ring-1 ring-red-600' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-red-600 uppercase">Errors / Blocked</span>
                  <span className="text-xl font-bold text-red-600 font-display block mt-0.5">{invalidCount}</span>
                </div>

                <div 
                  onClick={() => setRowFilter('creates')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${rowFilter === 'creates' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Will Create</span>
                  <span className="text-xl font-bold text-blue-700 font-display block mt-0.5">{createCount}</span>
                </div>

                <div 
                  onClick={() => setRowFilter('updates')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${rowFilter === 'updates' ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Will Update</span>
                  <span className="text-xl font-bold text-amber-700 font-display block mt-0.5">{updateCount}</span>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Selected to Run</span>
                  <span className="text-xl font-bold text-blue-900 font-display">{selectedCount}</span>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">Preview & Column Mapping Review</span>
                    <button
                      type="button"
                      onClick={() => toggleAllRows(true)}
                      className="text-blue-900 hover:underline font-semibold"
                    >
                      Select All Valid
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAllRows(false)}
                      className="text-slate-500 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={selectedCount === 0 || isExecuting}
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-red-400" />
                      <span>Commit {selectedCount} Selected Rows</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100/70 sticky top-0 z-10 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3 w-10 text-center">✓</th>
                        <th className="p-3 w-14">Row</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Operation</th>
                        <th className="p-3">Status & Diffs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayPreviewRows.map((r) => {
                        return (
                          <tr key={r.row_number} className={`hover:bg-slate-50/70 transition-colors ${!r.is_selected ? 'opacity-50' : ''}`}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={r.is_selected}
                                disabled={r.status === 'invalid'}
                                onChange={() => toggleRowSelection(r.row_number)}
                                className="accent-blue-900 w-4 h-4 rounded"
                              />
                            </td>
                            <td className="p-3 font-mono text-slate-400 text-[11px]">#{r.row_number}</td>
                            <td className="p-3 font-mono font-bold text-slate-900">{r.parsed_data.sku || r.matched_product_sku || '—'}</td>
                            <td className="p-3 font-medium text-slate-800 max-w-[200px] truncate">{r.parsed_data.name || '—'}</td>
                            <td className="p-3 font-mono font-semibold text-slate-900">
                              {r.parsed_data.price !== undefined ? formatCurrency(r.parsed_data.price) : '—'}
                            </td>
                            <td className="p-3 font-mono text-slate-700">{r.parsed_data.stock_quantity ?? '—'}</td>
                            <td className="p-3 text-slate-600">{r.parsed_data.category_name || '—'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                r.operation === 'create' ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {r.operation}
                              </span>
                            </td>
                            <td className="p-3">
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Import Execution Confirmation Modal */}
          {isConfirmModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div 
                role="dialog" 
                aria-modal="true" 
                className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4"
              >
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
                    onClick={handleStartImport}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Confirm & Commit Import
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Execution Progress & Results Modal */}
          {(isExecuting || completedHistoryItem) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div 
                role="dialog" 
                aria-modal="true" 
                className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {isExecuting ? (
                      <RefreshCw className="w-5 h-5 text-blue-900 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isExecuting ? 'Processing Import Batches...' : 'Import Execution Complete'}
                    </h3>
                  </div>
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
                        onClick={() => setCompletedHistoryItem(null)}
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
      )}

      {/* ============================================================= */}
      {/* TAB 2: BULK EDIT & INVENTORY TOOLS */}
      {/* ============================================================= */}
      {activeTab === 'bulk_edit' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter name, SKU, slug..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.parent_id ? `└─ ${c.name}` : c.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="all">All Inventory</option>
                <option value="in_stock">In Stock (&gt; 0)</option>
                <option value="out_of_stock">Zero Stock</option>
              </select>
            </div>

            {/* Selection Status & Action Triggers */}
            {selectedProductIds.size > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-2xl border border-blue-200 text-blue-950 font-bold">
                <span>{selectedProductIds.size} Selected</span>
                <span className="text-slate-400">|</span>
                <button
                  onClick={() => setIsBulkEditPreviewOpen(true)}
                  className="px-2.5 py-1 bg-blue-900 text-white rounded-lg hover:bg-blue-800 text-[11px]"
                >
                  Bulk Edit
                </button>
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-[11px]"
                >
                  Bulk Delete
                </button>
                <button
                  onClick={clearSelection}
                  className="text-slate-500 hover:text-slate-800 text-[11px]"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Bulk Selection Notification Bar */}
          {selectedProductIds.size > 0 && selectedProductIds.size < filteredProducts.length && !isAllMatchingSelected && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 flex items-center justify-between">
              <span>All {currentPageProducts.length} products on this page are selected.</span>
              <button
                onClick={selectAllMatching}
                className="font-bold underline hover:text-blue-800"
              >
                Select all {filteredProducts.length} matching products across all pages
              </button>
            </div>
          )}

          {isAllMatchingSelected && (
            <div className="p-3 bg-blue-100 border border-blue-300 rounded-2xl text-xs text-blue-950 flex items-center justify-between font-bold">
              <span>All {filteredProducts.length} matching catalog products are selected across all pages.</span>
              <button onClick={clearSelection} className="underline text-blue-800 font-semibold">
                Clear selection
              </button>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={currentPageProducts.length > 0 && currentPageProducts.every(p => selectedProductIds.has(p.id))}
                        onChange={(e) => {
                          if (e.target.checked) selectCurrentPage();
                          else clearSelection();
                        }}
                        className="accent-blue-900 w-4 h-4 rounded"
                      />
                    </th>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Featured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPageProducts.map(p => {
                    const isSelected = selectedProductIds.has(p.id);
                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProductSelect(p.id)}
                            className="accent-blue-900 w-4 h-4 rounded"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">{p.sku}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          {p.strain && <span className="text-[10px] text-slate-400">{p.strain}</span>}
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>{p.category_name}</div>
                          {p.subcategory_name && (
                            <span className="text-[10px] text-blue-900 font-medium">└─ {p.subcategory_name}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">{formatCurrency(p.price)}</td>
                        <td className="p-3 font-mono">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            p.stock_quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                          }`}>
                            {p.stock_quantity} left
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {p.status || (p.is_active ? 'published' : 'draft')}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.is_featured ? (
                            <span className="text-amber-500 font-bold text-[11px]">★ Yes</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {currentPageProducts.length} of {filteredProducts.length} products</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Edit Modal */}
          {isBulkEditPreviewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div 
                role="dialog" 
                aria-modal="true" 
                className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-blue-900" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Bulk Edit {selectedProductIds.size} Products
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsBulkEditPreviewOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Field</label>
                    <select
                      value={bulkActionField}
                      onChange={(e) => setBulkActionField(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="price">Price (INR)</option>
                      <option value="compare_at_price">Compare at Price</option>
                      <option value="stock_quantity">Stock Quantity</option>
                      <option value="status">Status (published / draft / out_of_stock / archived)</option>
                      <option value="category_id">Category</option>
                      <option value="subcategory_id">Subcategory</option>
                      <option value="is_featured">Featured Flag</option>
                      <option value="tags">Tags (semicolon-separated)</option>
                    </select>
                  </div>

                  {(bulkActionField === 'price' || bulkActionField === 'stock_quantity') && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Operation Type</label>
                      <select
                        value={bulkActionOperation}
                        onChange={(e) => setBulkActionOperation(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="set">Set to Exact Value</option>
                        <option value="increase_amount">Increase by Fixed Amount (+)</option>
                        <option value="decrease_amount">Decrease by Fixed Amount (-)</option>
                        {bulkActionField === 'price' && (
                          <>
                            <option value="increase_percent">Increase by Percentage (+%)</option>
                            <option value="decrease_percent">Decrease by Percentage (-%)</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {bulkActionField === 'tags' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tag Operation</label>
                      <select
                        value={bulkActionOperation}
                        onChange={(e) => setBulkActionOperation(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="add_tags">Add Tags (append to existing)</option>
                        <option value="set">Replace Tags (overwrite)</option>
                        <option value="remove_tags">Remove Specific Tags</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Value</label>
                    {bulkActionField === 'category_id' ? (
                      <select
                        value={bulkActionValue}
                        onChange={(e) => setBulkActionValue(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="">Select Category...</option>
                        {categories.filter(c => !c.parent_id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : bulkActionField === 'subcategory_id' ? (
                      <select
                        value={bulkActionValue}
                        onChange={(e) => setBulkActionValue(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="">Select Subcategory (or Clear)...</option>
                        {categories.filter(c => !!c.parent_id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : bulkActionField === 'status' ? (
                      <select
                        value={bulkActionValue}
                        onChange={(e) => setBulkActionValue(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="published">published</option>
                        <option value="draft">draft</option>
                        <option value="out_of_stock">out_of_stock</option>
                        <option value="archived">archived</option>
                      </select>
                    ) : bulkActionField === 'is_featured' ? (
                      <select
                        value={bulkActionValue}
                        onChange={(e) => setBulkActionValue(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="true">True (Featured)</option>
                        <option value="false">False (Standard)</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={bulkActionValue}
                        onChange={(e) => setBulkActionValue(e.target.value)}
                        placeholder="Enter value..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBulkEditPreviewOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyBulkEdit}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Apply Bulk Edit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Delete Safeguard Modal */}
          {isBulkDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div 
                role="dialog" 
                aria-modal="true" 
                className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3 text-red-600">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Bulk Delete {selectedProductIds.size} Products
                    </h3>
                    <span className="text-[11px] text-slate-500">Historical order & GST audit protection</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-600 leading-relaxed">
                  <p>
                    You have selected <strong className="text-red-600 font-bold">{selectedProductIds.size} products</strong> for deletion.
                  </p>
                  
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={archiveOrdersProtected}
                        onChange={(e) => setArchiveOrdersProtected(e.target.checked)}
                        className="accent-blue-900 mt-0.5"
                      />
                      <div>
                        <strong className="block">Safeguard Order History (Recommended)</strong>
                        <span className="text-[11px] text-amber-800 block mt-0.5">
                          Products present in completed or historical orders will be archived (hidden from store) rather than permanently wiped, preserving customer tax invoices and courier manifests.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBulkDelete}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs"
                  >
                    Confirm Bulk Deletion
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: IMPORT HISTORY & AUDIT */}
      {/* ============================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between font-bold text-slate-800 bg-slate-50/50">
            <span>Historical Bulk CSV Import Logs</span>
            <span className="text-slate-400 font-normal">{importHistory.length} total recorded operations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100/70 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Total Rows</th>
                  <th className="p-3">Successes</th>
                  <th className="p-3">Failures</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No CSV imports have been performed yet.
                    </td>
                  </tr>
                ) : (
                  importHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono text-slate-600">
                        {new Date(item.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="p-3 font-medium text-slate-800">{item.admin_email}</td>
                      <td className="p-3 font-mono text-blue-900 font-semibold">{item.filename}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-slate-100 text-slate-700">
                          {item.mode}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">{item.total_rows}</td>
                      <td className="p-3 font-mono font-bold text-green-700">{item.success_count}</td>
                      <td className="p-3 font-mono font-bold text-red-600">{item.failure_count}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDownloadReport(item)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 font-semibold text-[11px] inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3 text-blue-900" />
                          <span>Report (CSV)</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

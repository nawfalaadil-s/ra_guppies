import React, { useState, useEffect, useMemo } from 'react';
import { 
  IndianRupee, TrendingUp, TrendingDown, DollarSign, 
  Calendar, Plus, Trash2, Search, Download, 
  FileSpreadsheet, Filter, CheckCircle2, AlertCircle, 
  RefreshCw, Tag, PieChart, BarChart3, X, ArrowUpRight, ArrowDownRight,
  Clock
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { mockDb } from '../../lib/mockDatabase';
import { 
  fetchSupabaseExpenses, 
  saveSupabaseExpense, 
  deleteSupabaseExpense 
} from '../../lib/supabaseSync';
import { Expense, ExpenseCategory, Order } from '../../lib/types';
import { formatCurrency, formatShortDate } from '../../lib/utils';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Feed & Live Foods',
  'Packaging & Oxygen Supplies',
  'Breeding Tanks & Equipment',
  'Electricity & Utilities',
  'Farm Logistics & Delivery',
  'Medications & Water Conditioners',
  'Marketing & Promotion',
  'General & Admin',
];

export const AdminAccountingPage: React.FC = () => {
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>(() => mockDb.getExpenses());
  const [orders, setOrders] = useState<Order[]>(() => mockDb.getOrders());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | ExpenseCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Feed & Live Foods' as ExpenseCategory,
    payee_vendor: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    receipt_url: '',
  });

  // Load from database
  const loadData = async () => {
    setIsLoading(true);
    try {
      const liveExpenses = await fetchSupabaseExpenses();
      setExpenses(liveExpenses);
      setOrders(mockDb.getOrders());
    } catch (err) {
      console.warn('Error loading accounting data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('Please enter a valid positive expense amount', 'error');
      return;
    }
    if (!formData.payee_vendor.trim()) {
      showToast('Please provide a payee or vendor name', 'error');
      return;
    }

    try {
      const newExpense = await saveSupabaseExpense({
        category: formData.category,
        payee_vendor: formData.payee_vendor.trim(),
        amount: amountVal,
        expense_date: formData.expense_date,
        description: formData.description.trim(),
        receipt_url: formData.receipt_url.trim() || undefined,
        created_by: 'raguppies00@gmail.com',
      });

      showToast(`Expense of ${formatCurrency(newExpense.amount)} recorded in ledger`, 'success');
      setIsAddModalOpen(false);
      setFormData({
        category: 'Feed & Live Foods',
        payee_vendor: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        receipt_url: '',
      });
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record expense', 'error');
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this recorded expense?')) return;
    try {
      await deleteSupabaseExpense(id);
      showToast('Expense record removed from ledger', 'success');
      await loadData();
    } catch (err: any) {
      showToast('Failed to delete expense', 'error');
    }
  };

  // Export Financial Ledger CSV
  const handleExportLedger = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [
      'Type,Reference / Order,Entity,Date,Category,Amount (INR),Notes',
      ...orders.map(o => `Income,${o.order_number},"${o.customer_name}",${o.created_at.split('T')[0]},Consignment Sale,${o.total_amount},"Status: ${o.payment_status}"`),
      ...expenses.map(e => `Expense,${e.id},"${e.payee_vendor}",${e.expense_date},${e.category},-${e.amount},"${e.description.replace(/"/g, '""')}"`)
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ra_guppy_financial_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported financial ledger to CSV', 'success');
  };

  // Calculations & Telemetry
  const verifiedOrders = useMemo(() => orders.filter(o => o.payment_status === 'verified'), [orders]);
  const grossSalesRevenue = verifiedOrders.reduce((acc, o) => acc + o.total_amount, 0);
  const totalShippingIncome = verifiedOrders.reduce((acc, o) => acc + o.delivery_fee, 0);
  const totalDiscountsGranted = verifiedOrders.reduce((acc, o) => acc + (o.discount_amount || 0), 0);
  const totalOperatingExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netOperatingProfit = grossSalesRevenue - totalOperatingExpenses;
  const pendingCollection = orders.filter(o => o.payment_status === 'pending').reduce((acc, o) => acc + o.total_amount, 0);

  // Category Expenses Breakdown
  const categoryExpenses = useMemo(() => {
    const breakdown: Record<string, number> = {};
    expenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
    });
    return breakdown;
  }, [expenses]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
      const matchesSearch = 
        e.payee_vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [expenses, selectedCategory, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Accounting, Expenses & P&L Telemetry
              </h1>
              <p className="text-sm text-slate-500">
                Live operating profit reconciliation, expense accounting, and verifiable financial ledgers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportLedger}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Ledger</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg shadow hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* P&L Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Gross Verified Revenue</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(grossSalesRevenue)}</div>
          <p className="text-xs text-slate-500 mt-1">{verifiedOrders.length} verified consignments</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Recorded Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOperatingExpenses)}</div>
          <p className="text-xs text-slate-500 mt-1">{expenses.length} operating expenses logged</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Net Operating Profit</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className={`text-2xl font-bold ${netOperatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(netOperatingProfit)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {grossSalesRevenue > 0 ? `${Math.round((netOperatingProfit / grossSalesRevenue) * 100)}% operating margin` : 'Revenue pending'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Pending UPI Verification</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(pendingCollection)}</div>
          <p className="text-xs text-slate-500 mt-1">Awaiting bank statement match</p>
        </div>
      </div>

      {/* Expense Category Breakdown Pills */}
      {Object.keys(categoryExpenses).length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block mb-2">
            Expense Allocation by Category
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryExpenses).map(([cat, amt]) => (
              <div key={cat} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">{cat}:</span>
                <span className="font-bold text-slate-900 font-mono">{formatCurrency(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h2 className="text-sm font-bold text-slate-900">Operating Expenses Ledger</h2>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {filteredExpenses.length}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor, description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as any)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No expenses recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Keep an accurate operational ledger by recording costs for live food cultures, packaging, oxygen, and farm utilities.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg shadow hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Expense</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payee / Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatShortDate(expense.expense_date)}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {expense.payee_vendor}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {expense.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={expense.description}>
                      {expense.description || '—'}
                      {expense.receipt_url && (
                        <a
                          href={expense.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-blue-600 hover:underline font-semibold"
                        >
                          [Receipt]
                        </a>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-red-600 font-mono">
                      -{formatCurrency(expense.amount)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Record Operating Expense</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Expense Category *
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Payee / Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Local Oxygen Gas Supplier, Live Artemia Hatchery"
                  value={formData.payee_vendor}
                  onChange={e => setFormData({ ...formData, payee_vendor: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="e.g. 1500"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 50 medical-grade oxygen canisters for live parcel courier dispatch"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Receipt Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://... bill or voucher image link"
                  value={formData.receipt_url}
                  onChange={e => setFormData({ ...formData, receipt_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg shadow-sm"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

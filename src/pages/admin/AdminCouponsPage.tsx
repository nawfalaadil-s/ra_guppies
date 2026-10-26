import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ticket, Plus, Search, Tag, Sparkles, Check, Copy, 
  Trash2, Edit3, RefreshCw, AlertCircle, Percent, 
  IndianRupee, Calendar, CheckCircle2, X, Download, 
  Clock, ShieldAlert, Layers, ArrowUpDown, Filter
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { mockDb } from '../../lib/mockDatabase';
import { 
  fetchSupabaseCoupons, 
  saveSupabaseCoupon, 
  deleteSupabaseCoupon, 
  toggleSupabaseCouponStatus 
} from '../../lib/supabaseSync';
import { Coupon } from '../../lib/types';
import { formatCurrency, formatShortDate } from '../../lib/utils';

export const AdminCouponsPage: React.FC = () => {
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>(() => mockDb.getCoupons());
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'code' | 'usage' | 'discount'>('newest');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Single Coupon Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '10',
    min_order_amount: '0',
    max_discount: '',
    usage_limit: '',
    expires_at: '',
    is_active: true,
  });

  // Bulk Generator Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    prefix: 'GUPPY',
    count: 5,
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '15',
    min_order_amount: '500',
    max_discount: '300',
    usage_limit: '1',
    expires_in_days: '30',
    description: 'Promotional campaign voucher',
  });
  const [bulkPreviewCodes, setBulkPreviewCodes] = useState<string[]>([]);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  // Load orders to compute actual coupon discount savings
  const orders = useMemo(() => mockDb.getOrders(), []);

  // Fetch coupons from Supabase & local storage
  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const liveCoupons = await fetchSupabaseCoupons();
      setCoupons(liveCoupons);
    } catch (err) {
      console.warn('Error loading coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  // Random Single Code Generator Helper
  const generateRandomCode = (prefix = 'GUPPY') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix.toUpperCase().trim()}${randomPart}`;
  };

  // Generate Bulk Preview Codes
  const generateBulkCodesList = (prefix: string, count: number) => {
    const cleanPrefix = (prefix.trim() || 'PROMO').toUpperCase();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const list: string[] = [];
    const used = new Set(coupons.map(c => c.code.toUpperCase()));

    while (list.length < count) {
      let code = cleanPrefix + '-';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!used.has(code) && !list.includes(code)) {
        list.push(code);
      }
    }
    return list;
  };

  // Recalculate bulk preview whenever config prefix/count changes
  useEffect(() => {
    if (isBulkModalOpen) {
      const list = generateBulkCodesList(bulkConfig.prefix, Number(bulkConfig.count) || 5);
      setBulkPreviewCodes(list);
    }
  }, [bulkConfig.prefix, bulkConfig.count, isBulkModalOpen]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: generateRandomCode('GUPPY'),
      description: 'Special store promotional discount',
      discount_type: 'percentage',
      discount_value: '10',
      min_order_amount: '0',
      max_discount: '',
      usage_limit: '',
      expires_at: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    let expiryVal = '';
    if (coupon.expires_at) {
      try {
        expiryVal = new Date(coupon.expires_at).toISOString().split('T')[0];
      } catch {
        expiryVal = '';
      }
    }

    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: String(coupon.min_order_amount || 0),
      max_discount: coupon.max_discount ? String(coupon.max_discount) : '',
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
      expires_at: expiryVal,
      is_active: coupon.is_active,
    });
    setIsModalOpen(true);
  };

  // Save Single Coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      showToast('Please enter a valid coupon code', 'error');
      return;
    }

    const discountVal = parseFloat(formData.discount_value);
    if (isNaN(discountVal) || discountVal <= 0) {
      showToast('Discount value must be greater than 0', 'error');
      return;
    }

    if (formData.discount_type === 'percentage' && discountVal > 100) {
      showToast('Percentage discount cannot exceed 100%', 'error');
      return;
    }

    // Check duplicate code if creating new
    if (!editingCoupon) {
      const exists = coupons.some(c => c.code.toUpperCase() === cleanCode);
      if (exists) {
        showToast(`Coupon code "${cleanCode}" already exists`, 'error');
        return;
      }
    }

    const payload: Partial<Coupon> & { code: string; discount_type: 'percentage' | 'fixed'; discount_value: number } = {
      ...(editingCoupon ? { id: editingCoupon.id, times_used: editingCoupon.times_used } : {}),
      code: cleanCode,
      description: formData.description.trim(),
      discount_type: formData.discount_type,
      discount_value: discountVal,
      min_order_amount: parseFloat(formData.min_order_amount) || 0,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : undefined,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit, 10) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at + 'T23:59:59.999Z').toISOString() : null,
      is_active: formData.is_active,
    };

    try {
      const saved = await saveSupabaseCoupon(payload);
      showToast(editingCoupon ? `Coupon ${saved.code} updated successfully` : `Coupon ${saved.code} created successfully`, 'success');
      setIsModalOpen(false);
      await loadCoupons();
    } catch (err: any) {
      showToast(err.message || 'Failed to save coupon', 'error');
    }
  };

  // Handle Bulk Generation Submit
  const handleSaveBulkCoupons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkPreviewCodes.length === 0) {
      showToast('No codes to generate', 'error');
      return;
    }

    const discountVal = parseFloat(bulkConfig.discount_value);
    if (isNaN(discountVal) || discountVal <= 0) {
      showToast('Discount value must be greater than 0', 'error');
      return;
    }

    setIsBulkSubmitting(true);
    try {
      const days = parseInt(bulkConfig.expires_in_days, 10) || 30;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      await Promise.all(bulkPreviewCodes.map(code => 
        saveSupabaseCoupon({
          code: code,
          description: bulkConfig.description || `${bulkConfig.discount_value}${bulkConfig.discount_type === 'percentage' ? '%' : '₹'} campaign voucher`,
          discount_type: bulkConfig.discount_type,
          discount_value: discountVal,
          min_order_amount: parseFloat(bulkConfig.min_order_amount) || 0,
          max_discount: bulkConfig.max_discount ? parseFloat(bulkConfig.max_discount) : undefined,
          usage_limit: bulkConfig.usage_limit ? parseInt(bulkConfig.usage_limit, 10) : 1,
          expires_at: expiryDate.toISOString(),
          is_active: true,
        })
      ));

      showToast(`Successfully generated and activated ${bulkPreviewCodes.length} promotional coupons!`, 'success');
      setIsBulkModalOpen(false);
      await loadCoupons();
    } catch (err: any) {
      showToast(err.message || 'Error creating bulk coupons', 'error');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (coupon: Coupon) => {
    const updatedStatus = !coupon.is_active;
    // Optimistic local update
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: updatedStatus } : c));
    
    try {
      await toggleSupabaseCouponStatus(coupon.id, updatedStatus);
      showToast(`Coupon ${coupon.code} is now ${updatedStatus ? 'Active' : 'Paused'}`, 'info');
    } catch (err) {
      showToast('Failed to update status in cloud', 'error');
      await loadCoupons();
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    try {
      await deleteSupabaseCoupon(couponToDelete.id);
      showToast(`Coupon ${couponToDelete.code} deleted permanently`, 'success');
      setIsDeleteModalOpen(false);
      setCouponToDelete(null);
      await loadCoupons();
    } catch (err: any) {
      showToast('Failed to delete coupon', 'error');
    }
  };

  // 1-Click Copy Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied "${code}" to clipboard`, 'success');
    setTimeout(() => {
      setCopiedCode(prev => prev === code ? null : prev);
    }, 2000);
  };

  // Export Bulk Codes to CSV
  const handleExportBulkCodes = () => {
    if (bulkPreviewCodes.length === 0) return;
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      ['Coupon Code,Discount,Min Order,Expires In Days', ...bulkPreviewCodes.map(code => 
        `${code},${bulkConfig.discount_value}${bulkConfig.discount_type === 'percentage' ? '%' : ' INR'},${bulkConfig.min_order_amount},${bulkConfig.expires_in_days}`
      )].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `coupons_${bulkConfig.prefix}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported codes to CSV file', 'success');
  };

  // Copy All Bulk Codes
  const handleCopyAllBulk = () => {
    navigator.clipboard.writeText(bulkPreviewCodes.join('\n'));
    showToast(`Copied ${bulkPreviewCodes.length} codes to clipboard`, 'success');
  };

  // Analytics & KPIs
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => {
    if (!c.is_active) return false;
    if (c.expires_at && new Date(c.expires_at) < new Date()) return false;
    if (c.usage_limit && (c.times_used || 0) >= c.usage_limit) return false;
    return true;
  }).length;

  const totalTimesRedeemed = coupons.reduce((acc, c) => acc + (c.times_used || 0), 0);

  // Compute total savings given to customers from verified orders
  const totalSavingsGiven = useMemo(() => {
    return orders.reduce((acc, o) => acc + (o.discount_amount || 0), 0);
  }, [orders]);

  // Filtered & Sorted Coupons List
  const filteredCoupons = useMemo(() => {
    return coupons
      .filter(c => {
        const matchesSearch = 
          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase());

        const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
        const isUsageExhausted = c.usage_limit ? (c.times_used || 0) >= c.usage_limit : false;

        let matchesStatus = true;
        if (statusFilter === 'active') {
          matchesStatus = c.is_active && !isExpired && !isUsageExhausted;
        } else if (statusFilter === 'inactive') {
          matchesStatus = !c.is_active;
        } else if (statusFilter === 'expired') {
          matchesStatus = isExpired || isUsageExhausted;
        }

        let matchesType = true;
        if (typeFilter !== 'all') {
          matchesType = c.discount_type === typeFilter;
        }

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        if (sortBy === 'code') {
          return a.code.localeCompare(b.code);
        }
        if (sortBy === 'usage') {
          return (b.times_used || 0) - (a.times_used || 0);
        }
        if (sortBy === 'discount') {
          return b.discount_value - a.discount_value;
        }
        return 0;
      });
  }, [coupons, searchTerm, statusFilter, typeFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Coupons & Discounts Management
              </h1>
              <p className="text-sm text-slate-500">
                Generate single or bulk promo codes, configure discount limits, and track redemptions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadCoupons}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-colors"
            title="Synchronize from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg shadow-sm hover:bg-purple-100 active:bg-purple-200 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Generate Bulk Codes</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg shadow hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Coupons</span>
            <Tag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCoupons}</div>
          <p className="text-xs text-slate-500 mt-1">Configured promo campaigns</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Active & Valid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{activeCoupons}</div>
          <p className="text-xs text-slate-500 mt-1">Ready for cart checkout</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Redemptions</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{totalTimesRedeemed}</div>
          <p className="text-xs text-slate-500 mt-1">Orders using promo codes</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Customer Savings</span>
            <IndianRupee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalSavingsGiven)}</div>
          <p className="text-xs text-slate-500 mt-1">Discounts granted to date</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="admin-coupon-search"
              type="text"
              placeholder="Search by code (e.g. AQUA10) or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 pl-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {(['all', 'active', 'inactive', 'expired'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-medium">Type:</span>
            {(['all', 'percentage', 'fixed'] as const).map(tp => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  typeFilter === tp
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tp === 'all' ? 'All' : tp === 'percentage' ? '% Percent' : '₹ Fixed'}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="code">Sort: Code (A-Z)</option>
              <option value="usage">Sort: Most Used</option>
              <option value="discount">Sort: Highest Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table / Grid List */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Ticket className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No coupons found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search criteria or filter options.'
              : 'Create your first promotional discount coupon or generate bulk promo codes.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg shadow hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Rules & Min Order</th>
                  <th className="py-3 px-4">Usage & Redemptions</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCoupons.map(coupon => {
                  const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
                  const isUsageExhausted = coupon.usage_limit ? (coupon.times_used || 0) >= coupon.usage_limit : false;
                  const isCurrentlyActive = coupon.is_active && !isExpired && !isUsageExhausted;

                  const usagePercent = coupon.usage_limit 
                    ? Math.min(100, Math.round(((coupon.times_used || 0) / coupon.usage_limit) * 100))
                    : null;

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded tracking-wide">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="text-slate-400 hover:text-emerald-600 transition-colors p-1 rounded hover:bg-slate-100"
                            title="Copy code to clipboard"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate" title={coupon.description}>
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Badge */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5">
                          {coupon.discount_type === 'percentage' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <Percent className="w-3 h-3" />
                              {coupon.discount_value}% OFF
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              <IndianRupee className="w-3 h-3" />
                              ₹{coupon.discount_value} OFF
                            </span>
                          )}
                        </div>
                        {coupon.discount_type === 'percentage' && coupon.max_discount && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Up to {formatCurrency(coupon.max_discount)}
                          </p>
                        )}
                      </td>

                      {/* Rules */}
                      <td className="py-3 px-4">
                        <div className="text-slate-700">
                          {coupon.min_order_amount > 0 ? (
                            <span>Min order: <strong className="font-semibold">{formatCurrency(coupon.min_order_amount)}</strong></span>
                          ) : (
                            <span className="text-slate-400 italic">No min order</span>
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-800">
                              {coupon.times_used || 0}
                              {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' redemptions'}
                            </span>
                            {usagePercent !== null && (
                              <span className={`text-[10px] font-bold ${usagePercent >= 100 ? 'text-red-600' : 'text-slate-500'}`}>
                                {usagePercent}%
                              </span>
                            )}
                          </div>
                          {usagePercent !== null && (
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  usagePercent >= 100 ? 'bg-red-500' : usagePercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Validity */}
                      <td className="py-3 px-4">
                        {coupon.expires_at ? (
                          <div>
                            <div className="flex items-center gap-1 text-slate-700">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatShortDate(coupon.expires_at)}</span>
                            </div>
                            {isExpired ? (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-bold text-red-600 bg-red-50 rounded">
                                Expired
                              </span>
                            ) : (
                              <span className="inline-block mt-0.5 text-[10px] text-slate-400">
                                Active window
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            No expiry
                          </span>
                        )}
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                            coupon.is_active ? 'bg-emerald-600' : 'bg-slate-200'
                          }`}
                          title={`Click to ${coupon.is_active ? 'deactivate' : 'activate'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              coupon.is_active ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`block text-[10px] mt-0.5 font-medium ${
                          isCurrentlyActive ? 'text-emerald-600' : isExpired || isUsageExhausted ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {isCurrentlyActive ? 'Active' : isExpired ? 'Expired' : isUsageExhausted ? 'Limit Met' : 'Paused'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Coupon Rules"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(coupon)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE & EDIT COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Ticket className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Promotional Coupon'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4">
              {/* Code with Generator button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  {!editingCoupon && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, code: generateRandomCode('GUPPY') }))}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Generate Random
                    </button>
                  )}
                </div>
                <input
                  id="admin-coupon-code"
                  type="text"
                  required
                  placeholder="e.g. AQUA10, GUPPY20, FLASH50"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className="w-full font-mono font-bold px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white tracking-wider"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Description / Campaign Name
                </label>
                <input
                  id="admin-coupon-desc"
                  type="text"
                  placeholder="e.g. 10% off for verified hobbyists"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Discount Type
                  </label>
                  <select
                    id="admin-coupon-type"
                    value={formData.discount_type}
                    onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="fixed">Fixed Amount (₹ OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      {formData.discount_type === 'percentage' ? '%' : '₹'}
                    </span>
                    <input
                      id="admin-coupon-value"
                      type="number"
                      min="1"
                      max={formData.discount_type === 'percentage' ? '100' : '99999'}
                      step="any"
                      required
                      value={formData.discount_value}
                      onChange={e => setFormData({ ...formData, discount_value: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Min Order & Max Cap */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = no minimum"
                    value={formData.min_order_amount}
                    onChange={e => setFormData({ ...formData, min_order_amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Optional cap (e.g. 500)"
                    disabled={formData.discount_type === 'fixed'}
                    value={formData.max_discount}
                    onChange={e => setFormData({ ...formData, max_discount: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Usage Limit & Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Usage Limit (Max Uses)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={formData.usage_limit}
                    onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Status active checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Activate coupon immediately for customer checkout
                  </span>
                </label>
              </div>

              {/* Live Preview Card */}
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  Customer Live Preview
                </span>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {formData.code || 'COUPON'}
                    </span>
                    <span className="text-xs text-slate-600">
                      {formData.discount_type === 'percentage' 
                        ? `${formData.discount_value || '0'}% OFF` 
                        : `₹${formData.discount_value || '0'} OFF`}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    {formData.min_order_amount && parseFloat(formData.min_order_amount) > 0 
                      ? `Min ₹${formData.min_order_amount}` 
                      : 'No Minimum'}
                  </span>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow transition-colors"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create & Activate Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK COUPON GENERATOR MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-purple-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bulk Coupon Generator
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batch-generate unique promo vouchers for marketing campaigns and giveaways.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBulkCoupons} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Prefix */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Code Prefix
                  </label>
                  <input
                    id="bulk-coupon-prefix"
                    type="text"
                    required
                    value={bulkConfig.prefix}
                    onChange={e => setBulkConfig({ ...bulkConfig, prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                    placeholder="e.g. VIP, FLASH, FEST"
                    className="w-full font-mono font-bold px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                </div>

                {/* Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Quantity to Generate
                  </label>
                  <select
                    value={bulkConfig.count}
                    onChange={e => setBulkConfig({ ...bulkConfig, count: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
                  >
                    <option value="3">3 Codes</option>
                    <option value="5">5 Codes</option>
                    <option value="10">10 Codes</option>
                    <option value="20">20 Codes</option>
                    <option value="50">50 Codes</option>
                  </select>
                </div>
              </div>

              {/* Discount rules */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Type
                  </label>
                  <select
                    value={bulkConfig.discount_type}
                    onChange={e => setBulkConfig({ ...bulkConfig, discount_type: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white font-medium"
                  >
                    <option value="percentage">% Percentage</option>
                    <option value="fixed">₹ Fixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bulkConfig.discount_value}
                    onChange={e => setBulkConfig({ ...bulkConfig, discount_value: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bulkConfig.min_order_amount}
                    onChange={e => setBulkConfig({ ...bulkConfig, min_order_amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Usage Limit Per Code
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bulkConfig.usage_limit}
                    onChange={e => setBulkConfig({ ...bulkConfig, usage_limit: e.target.value })}
                    placeholder="1 = single-use voucher"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Valid For (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bulkConfig.expires_in_days}
                    onChange={e => setBulkConfig({ ...bulkConfig, expires_in_days: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Codes Preview Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Generated Codes Preview ({bulkPreviewCodes.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAllBulk}
                      className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy All
                    </button>
                    <button
                      type="button"
                      onClick={handleExportBulkCodes}
                      className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Export CSV
                    </button>
                  </div>
                </div>

                <div className="max-h-36 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-xs text-slate-800">
                  {bulkPreviewCodes.map((code, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200/50 last:border-0">
                      <span className="font-bold text-purple-900">{code}</span>
                      <span className="text-slate-400 text-[11px]">
                        {bulkConfig.discount_value}{bulkConfig.discount_type === 'percentage' ? '%' : '₹'} OFF • 1-use
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {isBulkSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Codes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate & Save All ({bulkPreviewCodes.length})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && couponToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Delete Coupon Code?
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Are you sure you want to permanently delete coupon{' '}
              <strong className="text-slate-800 font-mono">{couponToDelete.code}</strong>?
              {couponToDelete.times_used && couponToDelete.times_used > 0 ? (
                <span className="block text-amber-600 font-semibold mt-1">
                  Note: This coupon was redeemed {couponToDelete.times_used} times on historical orders.
                </span>
              ) : null}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Keep Coupon
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow transition-colors"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

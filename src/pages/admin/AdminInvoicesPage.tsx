import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Search, RefreshCw, Printer, 
  CheckCircle2, AlertCircle, Share2, Download, 
  Calendar, IndianRupee, Clock, ArrowUpRight, X, Eye, 
  Check, Phone, Mail, Building2, ShoppingBag, MessageSquare
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { mockDb } from '../../lib/mockDatabase';
import { 
  fetchSupabaseInvoices, 
  saveSupabaseInvoice, 
  fetchSupabaseReceipts, 
  saveSupabaseReceipt 
} from '../../lib/supabaseSync';
import { Invoice, PaymentReceipt, Order } from '../../lib/types';
import { formatCurrency, formatDate, formatShortDate } from '../../lib/utils';
import { BrandLogo } from '../../components/common/BrandLogo';
import { 
  generateInvoiceMessage, 
  generateReceiptMessage, 
  dispatchWhatsAppHandoff 
} from '../../lib/whatsappService';

export const AdminInvoicesPage: React.FC = () => {
  const { showToast } = useToast();
  const { settings } = useStoreSettings();

  const [invoices, setInvoices] = useState<Invoice[]>(() => mockDb.getInvoices());
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => mockDb.getReceipts());
  const [orders, setOrders] = useState<Order[]>(() => mockDb.getOrders());
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'paid' | 'cancelled'>('all');

  // Modal States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Load from Supabase cloud
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [liveInvoices, liveReceipts] = await Promise.all([
        fetchSupabaseInvoices(),
        fetchSupabaseReceipts(),
      ]);
      setInvoices(liveInvoices);
      setReceipts(liveReceipts);
      setOrders(mockDb.getOrders());
    } catch (err) {
      console.warn('Error loading billing records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute orders that don't have invoices yet
  const ordersWithoutInvoice = useMemo(() => {
    const existingOrderIds = new Set(invoices.map(i => i.order_id).filter(Boolean));
    return orders.filter(o => !existingOrderIds.has(o.id) && !existingOrderIds.has(o.order_number));
  }, [orders, invoices]);

  // Handle Generate Invoice from Order
  const handleGenerateInvoiceFromOrder = async (order: Order) => {
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-RG-${year}-${order.order_number.replace(/^BA-|^RG-/, '')}`;

    const itemsSnapshot = order.items.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total_price: item.total_price,
    }));

    const isPaid = order.payment_status === 'verified';
    const amountPaid = isPaid ? order.total_amount : 0;
    const balanceDue = Math.max(0, order.total_amount - amountPaid);

    const newInvoice: Partial<Invoice> = {
      invoice_number: invoiceNumber,
      order_id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone || order.shipping_address?.phone || '',
      billing_address: order.shipping_address,
      items: itemsSnapshot,
      subtotal: order.subtotal,
      shipping_charge: order.delivery_fee,
      packing_charge: order.packing_charge,
      discount_amount: order.discount_amount,
      tax_amount: 0,
      total_amount: order.total_amount,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      status: isPaid ? 'paid' : 'issued',
      issued_at: new Date().toISOString(),
    };

    try {
      const saved = await saveSupabaseInvoice(newInvoice);
      showToast(`Tax Invoice #${saved.invoice_number} generated successfully!`, 'success');
      setIsCreateModalOpen(false);

      // If verified payment, automatically create payment receipt record
      if (isPaid) {
        const receiptNumber = `REC-RG-${year}-${order.order_number.replace(/^BA-|^RG-/, '')}`;
        await saveSupabaseReceipt({
          receipt_number: receiptNumber,
          invoice_id: saved.id,
          order_id: order.id,
          amount_received: order.total_amount,
          payment_method: order.payment_details?.method === 'upi' ? 'UPI Instant Transfer' : 'Direct Payment',
          transaction_reference: order.payment_details?.upi_reference || undefined,
          payment_date: order.payment_details?.verified_at || new Date().toISOString(),
          notes: 'Full payment confirmed at order verification desk.',
        });
      }

      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate invoice', 'error');
    }
  };

  // WhatsApp Share Invoice
  const handleShareInvoiceWhatsApp = (invoice: Invoice) => {
    const msg = generateInvoiceMessage(invoice);
    dispatchWhatsAppHandoff(invoice.customer_phone || '', msg, 'invoice', invoice.order_id);
    showToast('Opened WhatsApp invoice handoff', 'info');
  };

  // WhatsApp Share Receipt
  const handleShareReceiptWhatsApp = (receipt: PaymentReceipt) => {
    const msg = generateReceiptMessage(receipt);
    dispatchWhatsAppHandoff('', msg, 'payment_receipt', receipt.order_id);
    showToast('Opened WhatsApp payment receipt handoff', 'info');
  };

  // Financial Metrics
  const totalInvoicedAmount = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
  const totalCollectedAmount = invoices.reduce((acc, inv) => acc + inv.amount_paid, 0);
  const totalOutstandingBalance = invoices.reduce((acc, inv) => acc + inv.balance_due, 0);
  const totalPaidInvoicesCount = invoices.filter(inv => inv.status === 'paid').length;

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customer_phone && inv.customer_phone.includes(searchTerm));

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter(rec => {
      return (
        rec.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.transaction_reference && rec.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [receipts, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-aquatic-50 text-aquatic-700 flex items-center justify-center font-bold border border-aquatic-100">
              <FileText className="w-5 h-5 text-aquatic-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ocean-950 font-display tracking-tight">
                Billing, Invoices & Payment Receipts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Generate official tax invoices, record verified payment receipts, and dispatch via WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-aquatic-600' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl shadow-glow-cyan"
          >
            <Plus className="w-4 h-4 text-cyan-200" />
            <span>Generate Invoice from Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-aquatic p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Total Invoiced</span>
            <FileText className="w-4 h-4 text-aquatic-600" />
          </div>
          <div className="text-2xl font-bold text-ocean-950 font-mono">{formatCurrency(totalInvoicedAmount)}</div>
          <p className="text-xs text-slate-500 mt-1">{invoices.length} invoices generated</p>
        </div>

        <div className="card-aquatic p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">Payments Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{formatCurrency(totalCollectedAmount)}</div>
          <p className="text-xs text-slate-500 mt-1">{totalPaidInvoicesCount} fully settled</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Outstanding Due</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstandingBalance)}</div>
          <p className="text-xs text-slate-500 mt-1">Pending customer settlement</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Payment Receipts</span>
            <IndianRupee className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{receipts.length}</div>
          <p className="text-xs text-slate-500 mt-1">Official verified receipts</p>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2 border-b md:border-b-0 border-slate-200 pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'invoices'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tax Invoices ({invoices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'receipts'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Payment Receipts ({receipts.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'invoices' ? "Search invoice #, customer name, email..." : "Search receipt # or UTR reference..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {activeTab === 'invoices' && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid & Settled</option>
                <option value="issued">Issued / Unpaid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: TAX INVOICES TABLE */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No invoices generated yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                You can generate official tax invoices from confirmed customer orders with one click.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Generate First Invoice</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Issued Date</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {invoice.invoice_number}
                        </span>
                        {invoice.order_id && (
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            Order Ref: {invoice.order_id.substring(0, 12)}...
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{invoice.customer_name}</div>
                        <div className="text-[11px] text-slate-500">{invoice.customer_email}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {formatShortDate(invoice.issued_at)}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        {formatCurrency(invoice.amount_paid)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {invoice.balance_due > 0 ? (
                          <span className="font-bold text-amber-600">{formatCurrency(invoice.balance_due)}</span>
                        ) : (
                          <span className="text-slate-400 font-mono">Nil</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          invoice.status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800'
                            : invoice.status === 'issued'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View / Print Tax Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleShareInvoiceWhatsApp(invoice)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Share Invoice on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENT RECEIPTS TABLE */}
      {activeTab === 'receipts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredReceipts.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No payment receipts recorded yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Receipts are generated automatically when customer UPI payments are verified.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Receipt Ref</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">UTR / Transaction Ref</th>
                    <th className="py-3 px-4 text-right">Amount Received</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceipts.map(receipt => (
                    <tr key={receipt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {receipt.receipt_number}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(receipt.payment_date)}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800">
                        {receipt.payment_method}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {receipt.transaction_reference || 'UPI Verified'}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatCurrency(receipt.amount_received)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setIsReceiptModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Inspect Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleShareReceiptWhatsApp(receipt)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Send Receipt via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: GENERATE INVOICE FROM ORDER */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Generate Invoice from Order</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-500">
                Select a confirmed order to freeze price snapshots and issue a permanent Tax Invoice:
              </p>

              {ordersWithoutInvoice.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  All current customer orders already have issued Tax Invoices!
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ordersWithoutInvoice.map(order => (
                    <div
                      key={order.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{order.order_number}</span>
                          <span className="text-xs text-slate-500">&bull; {order.customer_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatCurrency(order.total_amount)} &bull; {order.items.length} items &bull; Payment: {order.payment_status}
                        </div>
                      </div>

                      <button
                        onClick={() => handleGenerateInvoiceFromOrder(order)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shrink-0"
                      >
                        Issue Invoice
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE TAX INVOICE PREVIEW */}
      {isPrintModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-4 border border-slate-200">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-400">TAX INVOICE</span>
                <span className="text-xs text-slate-400">| #{selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => handleShareInvoiceWhatsApp(selectedInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Page */}
            <div className="p-6 sm:p-8 text-xs text-slate-800 bg-white">
              {/* Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center overflow-hidden">
                      <BrandLogo variant="invoice" className="w-full h-full" imgClassName="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-black font-display tracking-tight text-slate-900 uppercase">
                      RA GUPPY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {settings.business_address || 'Bengaluru, Karnataka, India'}<br />
                    <strong>Email:</strong> {settings.contact_email || 'raguppies00@gmail.com'} &bull; <strong>WhatsApp:</strong> {settings.whatsapp_number || '+91 89211 90590'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-mono font-bold uppercase mb-1">
                    Original Tax Invoice
                  </span>
                  <div className="font-mono font-bold text-base text-slate-900">{selectedInvoice.invoice_number}</div>
                  <div className="text-[11px] text-slate-500">Date: {formatDate(selectedInvoice.issued_at)}</div>
                </div>
              </div>

              {/* Billed To */}
              <div className="py-4 border-b border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-0.5">Billed To:</span>
                  <div className="font-bold text-slate-900">{selectedInvoice.customer_name}</div>
                  <div className="text-slate-600">{selectedInvoice.customer_email}</div>
                  {selectedInvoice.customer_phone && <div className="text-slate-600">Phone: {selectedInvoice.customer_phone}</div>}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-0.5">Delivery Destination:</span>
                  <div className="text-slate-700">
                    {selectedInvoice.billing_address?.city}, {selectedInvoice.billing_address?.state} - {selectedInvoice.billing_address?.pincode}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-medium text-slate-800">{item.product_name}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                        <td className="py-2 text-right font-mono font-semibold">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculations */}
              <div className="border-t border-slate-200 pt-4 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Courier Delivery Fee:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.shipping_charge)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Thermocol Oxygen Packing:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.packing_charge)}</span>
                  </div>
                  {selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Promotional Discount:</span>
                      <span className="font-mono">-{formatCurrency(selectedInvoice.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                    <span>Total Amount:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.amount_paid)}</span>
                  </div>
                  {selectedInvoice.balance_due > 0 ? (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>Balance Due:</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.balance_due)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>Balance Due:</span>
                      <span className="font-mono">Nil</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PAYMENT RECEIPT PREVIEW */}
      {isReceiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Payment Receipt</h3>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-6 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Amount Received</span>
              <div className="text-3xl font-black text-emerald-700 font-mono">
                {formatCurrency(selectedReceipt.amount_received)}
              </div>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-200 text-emerald-900">
                Verified & Deposited
              </span>
            </div>

            <div className="space-y-2 text-xs border-y border-slate-100 py-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Ref:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="text-slate-800">{formatDate(selectedReceipt.payment_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UTR / Ref:</span>
                <span className="font-mono text-slate-800">{selectedReceipt.transaction_reference || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => handleShareReceiptWhatsApp(selectedReceipt)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Share Receipt on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

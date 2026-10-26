import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Truck, Copy, ExternalLink, ShieldCheck, 
  Clock, AlertCircle, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mockDb } from '../lib/mockDatabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { Order, PaymentStatus, FulfillmentStatus } from '../lib/types';
import { fetchOrdersFromSupabase } from '../lib/supabaseSync';

export const OrdersPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');
  const [allOrders, setAllOrders] = useState<Order[]>(() => mockDb.getOrders());

  useEffect(() => {
    fetchOrdersFromSupabase().then(setAllOrders);
    const handleUpdate = () => {
      fetchOrdersFromSupabase().then(setAllOrders);
    };
    window.addEventListener('ba_orders_updated', handleUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ba_orders') handleUpdate();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('ba_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Strictly isolate orders to the current authenticated customer (or all if admin)
  const userOrders = user?.role === 'admin' 
    ? allOrders 
    : user
      ? allOrders.filter(o => o.user_id === user.id || (user.email && o.customer_email?.toLowerCase() === user.email.toLowerCase()))
      : [];

  const filteredOrders = userOrders.filter((order) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return order.payment_status === 'pending';
    if (statusFilter === 'shipped') return order.fulfillment_status === 'shipped';
    if (statusFilter === 'delivered') return order.fulfillment_status === 'delivered';
    return true;
  });

  const handleCopyAWB = (awb: string) => {
    navigator.clipboard.writeText(awb);
    showToast(`Tracking ID ${awb} copied!`, 'success');
  };

  const renderPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Payment Verified</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Action Required</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            <span>Verification Pending</span>
          </span>
        );
    }
  };

  const renderFulfillmentBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            <Truck className="w-3.5 h-3.5" />
            <span>In Transit (The Professional Couriers Road)</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            <Package className="w-3.5 h-3.5" />
            <span>Packaging in Oxygen Crate</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
            <span>Unfulfilled</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-6 sm:py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Account History</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-950 font-display">
              My Orders & Consignments
            </h1>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['all', 'pending', 'shipped', 'delivered'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-blue-950 text-white shadow-sm border border-blue-900'
                    : 'bg-white text-slate-600 hover:text-blue-950 border border-slate-200'
                }`}
              >
                {tab === 'all' ? 'All Orders' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {isAuthLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Loading your consignments...</p>
          </div>
        ) : !user ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-800 mb-1">Sign In to View Your Consignments</h2>
            <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
              Please sign in with your customer account to track your live fish consignments, view invoices, and copy AWB codes.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/login?redirect=/orders" className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
                Sign In
              </Link>
              <Link to="/catalogue" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">
                Browse Fish
              </Link>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-800 mb-1">No Orders Found</h2>
            <p className="text-xs text-slate-500 mb-6">You have no consignments matching this filter status.</p>
            <Link to="/catalogue" className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors">
              Shop Pure Strain Guppies
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Order ID</span>
                      <strong className="text-blue-950 font-mono text-sm">{order.order_number}</strong>
                    </div>
                    <div className="hidden sm:block text-slate-300">|</div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Placed On</span>
                      <span className="text-slate-700">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="hidden sm:block text-slate-300">|</div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Amount</span>
                      <strong className="text-blue-950 font-display">{formatCurrency(order.total_amount)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderPaymentBadge(order.payment_status)}
                    {renderFulfillmentBadge(order.fulfillment_status)}
                  </div>
                </div>

                {/* Courier Tracking Section (Highlighted when Shipped) */}
                {order.shipment_details && (
                  <div className="p-4 bg-gradient-to-r from-blue-50/70 via-blue-50/40 to-white border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{order.shipment_details.courier_name}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-mono">
                            AWB: <strong>{order.shipment_details.tracking_number}</strong>
                          </span>
                          <button
                            onClick={() => handleCopyAWB(order.shipment_details!.tracking_number)}
                            className="text-blue-700 hover:text-blue-900 p-0.5"
                            title="Copy Tracking ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Dispatched on {formatDate(order.shipment_details.shipped_at)}
                          {order.shipment_details.estimated_delivery && (
                            <> • Expected Arrival: <strong>{order.shipment_details.estimated_delivery}</strong></>
                          )}
                        </div>
                      </div>
                    </div>

                    <a
                      href={order.shipment_details.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors shrink-0"
                    >
                      <span>Track Shipment</span>
                      <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                    </a>
                  </div>
                )}

                {/* Items Preview */}
                <div className="p-4 sm:p-5 divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                        />
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                            {item.product_name}
                          </div>
                          <div className="text-slate-400 text-xs">
                            Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-blue-950 font-display">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer Link */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500">
                    Shipping to: <strong>{order.shipping_address.city}, {order.shipping_address.postal_code}</strong>
                  </div>
                  <Link
                    to={`/account/orders/${order.id}`}
                    className="font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>View Order Details & Invoices</span>
                    <ChevronRight className="w-4 h-4 text-red-500" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

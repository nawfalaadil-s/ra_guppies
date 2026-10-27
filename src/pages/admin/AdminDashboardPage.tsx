import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, ShoppingBag, Clock, Package, 
  ArrowRight, ShieldCheck, AlertCircle, Truck, 
  Sparkles, CheckCircle2, ChevronRight, Eye 
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Order } from '../../lib/types';
import { fetchOrdersFromSupabase } from '../../lib/supabaseSync';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const AdminDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(() => mockDb.getOrders());
  const products = mockDb.getProducts();

  useEffect(() => {
    fetchOrdersFromSupabase().then(setOrders);

    const handleUpdate = () => {
      fetchOrdersFromSupabase().then(setOrders);
    };

    window.addEventListener('ba_orders_updated', handleUpdate);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ba_orders') {
        handleUpdate();
      }
    };
    window.addEventListener('storage', handleStorage);

    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('admin_dashboard_feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          handleUpdate();
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('ba_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const totalRevenue = orders
    .filter(o => o.payment_status === 'verified')
    .reduce((acc, o) => acc + o.total_amount, 0);

  const pendingPayments = orders.filter(o => o.payment_status === 'pending');
  const lowStockProducts = products.filter(p => p.stock_quantity <= 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-aquatic-700 font-mono">
            Control Center
          </span>
          <h1 className="text-2xl sm:text-3.5xl font-extrabold text-ocean-950 font-display tracking-tight">
            Operations & Orders Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry, payment verification queues, and live specimen inventory status.
          </p>
        </div>

        <Link
          to="/admin/orders"
          className="btn-primary shadow-glow-cyan inline-flex items-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl"
        >
          <span>Manage Orders Queue</span>
          <ArrowRight className="w-4 h-4 text-cyan-200" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-aquatic rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Verified UPI Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-aquatic-50 text-aquatic-700 flex items-center justify-center border border-aquatic-100">
              <DollarSign className="w-4 h-4 text-aquatic-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-ocean-950 font-display font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <span className="text-[11px] text-aquatic-700 font-medium mt-1 block">Live Verified Payments</span>
        </div>

        <div className="card-aquatic rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Consignments</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100">
              <ShoppingBag className="w-4 h-4 text-cyan-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-ocean-950 font-display font-mono">
            {orders.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Lifetime Customer Orders</span>
        </div>

        <div className="bg-rose-50/70 rounded-2xl p-5 border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between text-rose-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Pending Verification</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-950 font-display font-mono">
            {pendingPayments.length}
          </div>
          <span className="text-[11px] text-rose-800 font-medium mt-1 block">Requires UTR verification</span>
        </div>

        <div className="card-aquatic rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Live Specimen Catalog</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Package className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-ocean-950 font-display font-mono">
            {products.length}
          </div>
          <span className="text-[11px] text-aquatic-700 font-medium mt-1 block">{lowStockProducts.length} 1-of-1 Specimens</span>
        </div>
      </div>

      {/* Urgent Payment Approval Queue */}
      {pendingPayments.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-red-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-red-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Payment Verification Desk ({pendingPayments.length} Orders Awaiting Review)
                </h2>
                <p className="text-xs text-slate-500">
                  Check UPI payment credit and approve before packing living specimens.
                </p>
              </div>
            </div>
            <Link
              to="/admin/orders?payment=pending"
              className="text-xs text-blue-700 hover:text-blue-800 font-bold underline self-start sm:self-auto"
            >
              Open Full Review Queue
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingPayments.slice(0, 3).map((order) => (
              <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{order.order_number}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="text-slate-600 font-semibold">{order.customer_name}</span>
                    <span className="font-bold text-slate-900">&bull; {formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Method: <strong className="uppercase">{order.payment_details?.method}</strong> &bull; Submitted UTR: <strong className="font-mono text-slate-800">{order.payment_details?.upi_reference || 'N/A'}</strong>
                  </div>
                </div>

                <Link
                  to={`/admin/orders`}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl self-start sm:self-auto transition-colors shadow-xs"
                >
                  Verify Transaction
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Table (Clean White) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Recent Orders & Live Shipments
            </h2>
            <p className="text-xs text-slate-500">Latest orders placed across the store</p>
          </div>
          <Link to="/admin/orders" className="text-xs text-blue-700 hover:underline font-bold inline-flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Recent Customer Orders and Live Shipments</caption>
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="py-2.5 px-3">Order Number</th>
                <th scope="col" className="py-2.5 px-3">Customer</th>
                <th scope="col" className="py-2.5 px-3">Date</th>
                <th scope="col" className="py-2.5 px-3">Amount</th>
                <th scope="col" className="py-2.5 px-3">Payment</th>
                <th scope="col" className="py-2.5 px-3">Fulfillment</th>
                <th scope="col" className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.order_number}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{o.customer_name}</td>
                  <td className="py-3 px-3 text-slate-500">{formatDate(o.created_at)}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 font-mono">{formatCurrency(o.total_amount)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        o.payment_status === 'verified'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : o.payment_status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        o.fulfillment_status === 'shipped'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : o.fulfillment_status === 'delivered'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {o.fulfillment_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to="/admin/orders"
                      aria-label={`Inspect order ${o.order_number} for customer ${o.customer_name}`}
                      className="text-blue-700 hover:text-blue-800 font-bold hover:underline focus-visible:ring-2 focus-visible:ring-blue-900 rounded p-1"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (Screens < 640px) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="py-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{o.order_number}</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(o.total_amount)}</span>
              </div>
              <div className="text-slate-600 font-medium">{o.customer_name} • <span className="text-slate-400">{formatDate(o.created_at)}</span></div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    o.payment_status === 'verified' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {o.payment_status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {o.fulfillment_status}
                  </span>
                </div>
                <Link
                  to="/admin/orders"
                  aria-label={`Inspect order ${o.order_number} for customer ${o.customer_name}`}
                  className="text-blue-700 font-bold hover:underline text-xs"
                >
                  Inspect &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, AlertTriangle, ArrowUpDown, Plus, Minus, 
  Search, RefreshCw, CheckCircle2, History, X, ShieldAlert, 
  Layers, Filter, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { mockDb } from '../../lib/mockDatabase';
import { 
  fetchSupabaseProducts, 
  recordSupabaseStockMovement 
} from '../../lib/supabaseSync';
import { Product, StockMovement, StockMovementType } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';

export const AdminInventoryPage: React.FC = () => {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>(() => mockDb.getProducts());
  const [movements, setMovements] = useState<StockMovement[]>(() => mockDb.getStockMovements());
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out_of_stock' | 'in_stock'>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Stock Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({
    delta: 5,
    type: 'purchase' as StockMovementType,
    notes: 'Farm breeding tank restock',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const liveProducts = await fetchSupabaseProducts();
      setProducts(liveProducts);
      setMovements(mockDb.getStockMovements());
    } catch (err) {
      console.warn('Error loading inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Stock Adjustment
  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const delta = parseInt(String(adjustData.delta), 10);
    if (isNaN(delta) || delta === 0) {
      showToast('Please specify a non-zero stock adjustment quantity', 'error');
      return;
    }

    try {
      await recordSupabaseStockMovement(
        selectedProduct.id,
        delta,
        adjustData.type,
        adjustData.notes
      );

      showToast(`Stock updated for "${selectedProduct.name}" (${delta > 0 ? '+' : ''}${delta})`, 'success');
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update stock', 'error');
    }
  };

  // Inventory Metrics
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStockCount = products.filter(p => !p.stock_quantity || p.stock_quantity === 0).length;
  const activeProductsCount = products.filter(p => p.is_active).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = p.stock_quantity > 0 && p.stock_quantity <= 5;
      } else if (stockFilter === 'out_of_stock') {
        matchesStock = !p.stock_quantity || p.stock_quantity === 0;
      } else if (stockFilter === 'in_stock') {
        matchesStock = p.stock_quantity > 5;
      }

      return matchesSearch && matchesStock;
    });
  }, [products, searchTerm, stockFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Live Inventory & Specimen Reservation
              </h1>
              <p className="text-sm text-slate-500">
                Track breeding pairs, stock movements, low-stock thresholds, and atomic reservation logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Stock Available</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStockUnits} units</div>
          <p className="text-xs text-slate-500 mt-1">Across {products.length} catalog items</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Low Stock Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
          <p className="text-xs text-slate-500 mt-1">5 or fewer specimens remaining</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Out of Stock</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          <p className="text-xs text-slate-500 mt-1">Halted on public storefront</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Movement Audits</span>
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{movements.length}</div>
          <p className="text-xs text-slate-500 mt-1">Logged inventory adjustments</p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-amber-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Specimen Inventory ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-amber-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Movement Audit ({movements.length})</span>
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="flex items-center gap-2 max-w-md flex-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by specimen or SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
            >
              <option value="all">All Levels</option>
              <option value="low">Low Stock (&le; 5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
              <option value="in_stock">Healthy Stock (&gt; 5)</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Specimen Details</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Quick Stock Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(product => {
                  const isLow = product.stock_quantity > 0 && product.stock_quantity <= 5;
                  const isOut = product.stock_quantity === 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images[0] || '/logo.jpeg'}
                            alt={product.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{product.name}</div>
                            <div className="text-[11px] text-slate-500">{product.category_name || 'Guppy Specimen'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {product.sku}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {formatCurrency(product.price)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                          isOut
                            ? 'bg-red-100 text-red-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {product.stock_quantity} in stock
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isOut ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isOut ? 'Sold Out' : 'Active'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setAdjustData({
                              delta: 5,
                              type: 'purchase',
                              notes: 'Farm breeding tank restock',
                            });
                            setIsAdjustModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors"
                        >
                          <span>Adjust Stock</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENT AUDIT TRAIL */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {movements.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No manual stock adjustments recorded yet. Adjustments are logged whenever inventory quantities change.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4 text-right">Delta</th>
                    <th className="py-3 px-4 text-center">Previous &rarr; New</th>
                    <th className="py-3 px-4">Notes / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(m.created_at)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold capitalize text-slate-800">
                          {m.movement_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={m.quantity_delta > 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {m.quantity_delta > 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {m.previous_stock} &rarr; <strong className="text-slate-900">{m.new_stock}</strong>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {m.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Adjust Inventory Stock</h3>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">{selectedProduct.name}</span>
                <span className="text-[11px] text-slate-500 font-mono">SKU: {selectedProduct.sku} &bull; Current Stock: {selectedProduct.stock_quantity}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Quantity Delta (+ to add, - to subtract) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={adjustData.delta}
                  onChange={e => setAdjustData({ ...adjustData, delta: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-base"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  New stock will be: <strong>{Math.max(0, selectedProduct.stock_quantity + (adjustData.delta || 0))}</strong> units
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Movement Reason / Type *
                </label>
                <select
                  value={adjustData.type}
                  onChange={e => setAdjustData({ ...adjustData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="purchase">Purchase / Farm Restock (+)</option>
                  <option value="sale">Offline Sale / Manual Consignment (-)</option>
                  <option value="adjustment">Stock Count Audit Reconciliation</option>
                  <option value="reservation">Breeding Tank Reserve</option>
                  <option value="cancellation">Order Cancellation Return (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Audit Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tank 4 batch restocked with healthy breeding pairs"
                  value={adjustData.notes}
                  onChange={e => setAdjustData({ ...adjustData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-amber-600 hover:bg-amber-700 font-bold rounded-lg shadow-sm"
                >
                  Update Stock Quantity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Edit2, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Category, ProductStatus } from '../../lib/types';
import { applyBulkEdit } from '../../lib/bulkProductService';

export interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: string[];
  onSuccess: () => void;
}

type BulkField = 'price' | 'compare_at_price' | 'stock_quantity' | 'status' | 'category' | 'tags' | 'featured';

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  selectedProductIds,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const categories = mockDb.getCategories();
  const rootCategories = categories.filter(c => !c.parent_id);

  const [field, setField] = useState<BulkField>('price');
  
  // Field-specific state
  // Price
  const [priceOp, setPriceOp] = useState<'set' | 'increase_percent' | 'decrease_percent' | 'increase_amount' | 'decrease_amount'>('increase_percent');
  const [priceValue, setPriceValue] = useState<string>('10');

  // Compare at price
  const [compareOp, setCompareOp] = useState<'set' | 'increase_percent' | 'decrease_percent' | 'clear'>('set');
  const [compareValue, setCompareValue] = useState<string>('');

  // Stock
  const [stockOp, setStockOp] = useState<'set' | 'increase_amount' | 'decrease_amount'>('set');
  const [stockValue, setStockValue] = useState<string>('5');

  // Status
  const [statusValue, setStatusValue] = useState<ProductStatus>('published');

  // Category & Subcategory
  const [selectedCatId, setSelectedCatId] = useState<string>(rootCategories[0]?.id || 'cat-guppy');
  const [selectedSubcatId, setSelectedSubcatId] = useState<string>('');

  // Tags
  const [tagOp, setTagOp] = useState<'add_tags' | 'remove_tags' | 'set'>('add_tags');
  const [tagValue, setTagValue] = useState<string>('');

  // Featured
  const [featuredValue, setFeaturedValue] = useState<boolean>(true);

  // Available subcategories for chosen root
  const subcategories = categories.filter(c => c.parent_id === selectedCatId);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedProductIds.length === 0) {
      showToast('No products selected for bulk editing', 'error');
      return;
    }

    try {
      if (field === 'price') {
        const val = Number(priceValue);
        if (isNaN(val) || val < 0) {
          showToast('Please enter a valid non-negative number for price adjustment', 'error');
          return;
        }
        applyBulkEdit(selectedProductIds, {
          field: 'price',
          operation: priceOp,
          value: val,
        }, user?.email || 'raguppies00@gmail.com');
        showToast(`Updated selling price on ${selectedProductIds.length} products`, 'success');
      } else if (field === 'compare_at_price') {
        if (compareOp === 'clear') {
          applyBulkEdit(selectedProductIds, {
            field: 'compare_at_price',
            operation: 'set',
            value: undefined,
          }, user?.email || 'raguppies00@gmail.com');
          showToast(`Cleared compare price on ${selectedProductIds.length} products`, 'success');
        } else {
          const val = Number(compareValue);
          if (isNaN(val) || val < 0) {
            showToast('Please enter a valid non-negative number for compare price', 'error');
            return;
          }
          applyBulkEdit(selectedProductIds, {
            field: 'compare_at_price',
            operation: compareOp,
            value: val,
          }, user?.email || 'raguppies00@gmail.com');
          showToast(`Updated compare price on ${selectedProductIds.length} products`, 'success');
        }
      } else if (field === 'stock_quantity') {
        const val = Number(stockValue);
        if (isNaN(val) || val < 0 || !Number.isInteger(val)) {
          showToast('Please enter a valid non-negative integer for stock quantity', 'error');
          return;
        }
        applyBulkEdit(selectedProductIds, {
          field: 'stock_quantity',
          operation: stockOp,
          value: val,
        }, user?.email || 'raguppies00@gmail.com');
        showToast(`Updated stock quantity on ${selectedProductIds.length} products`, 'success');
      } else if (field === 'status') {
        applyBulkEdit(selectedProductIds, {
          field: 'status',
          operation: 'set',
          value: statusValue,
        }, user?.email || 'raguppies00@gmail.com');
        showToast(`Updated publishing status to "${statusValue}" on ${selectedProductIds.length} products`, 'success');
      } else if (field === 'category') {
        const cat = categories.find(c => c.id === selectedCatId);
        const subcat = categories.find(c => c.id === selectedSubcatId);
        applyBulkEdit(selectedProductIds, {
          field: 'category_id',
          operation: 'set',
          value: selectedCatId,
        }, user?.email || 'raguppies00@gmail.com');

        if (selectedSubcatId) {
          applyBulkEdit(selectedProductIds, {
            field: 'subcategory_id',
            operation: 'set',
            value: selectedSubcatId,
          }, user?.email || 'raguppies00@gmail.com');
        }
        showToast(`Assigned ${cat?.name || 'Category'} to ${selectedProductIds.length} products`, 'success');
      } else if (field === 'tags') {
        if (!tagValue.trim()) {
          showToast('Please enter one or more semicolon-separated tags', 'error');
          return;
        }
        applyBulkEdit(selectedProductIds, {
          field: 'tags',
          operation: tagOp,
          value: tagValue,
        }, user?.email || 'raguppies00@gmail.com');
        showToast(`Updated tags on ${selectedProductIds.length} products`, 'success');
      } else if (field === 'featured') {
        applyBulkEdit(selectedProductIds, {
          field: 'is_featured',
          operation: 'set',
          value: featuredValue,
        }, user?.email || 'raguppies00@gmail.com');
        showToast(`Updated spotlight featured status on ${selectedProductIds.length} products`, 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error executing bulk edit', 'error');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-edit-title"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto space-y-0">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="bulk-edit-title" className="text-base font-extrabold text-slate-900 font-display">
                Bulk Edit Products
              </h2>
              <p className="text-xs text-slate-500">
                Modifying <strong className="text-blue-900 font-bold">{selectedProductIds.length}</strong> selected specimens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50"
            aria-label="Close Bulk Edit Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Field Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wider text-[11px] font-mono">
              Field to Update
            </label>
            <select
              value={field}
              onChange={(e) => setField(e.target.value as BulkField)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white font-medium"
            >
              <option value="price">Selling Price (₹ INR)</option>
              <option value="compare_at_price">Compare at Price (MRP)</option>
              <option value="stock_quantity">Stock Inventory Level</option>
              <option value="status">Publishing Status (Published / Draft / Archived)</option>
              <option value="category">Category & Subcategory Hierarchy</option>
              <option value="tags">Tags & Keywords</option>
              <option value="featured">Featured Spotlight Flag</option>
            </select>
          </div>

          {/* Conditional Field Controls */}
          {field === 'price' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Adjustment Action</label>
                <select
                  value={priceOp}
                  onChange={(e) => setPriceOp(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="increase_percent">Increase by Percentage (+%)</option>
                  <option value="decrease_percent">Decrease by Percentage (-%)</option>
                  <option value="increase_amount">Increase by Flat Amount (+₹)</option>
                  <option value="decrease_amount">Decrease by Flat Amount (-₹)</option>
                  <option value="set">Set to Exact Fixed Price (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {priceOp.includes('percent') ? 'Percentage (%)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step={priceOp.includes('percent') ? '1' : '10'}
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  placeholder={priceOp.includes('percent') ? 'e.g. 10' : 'e.g. 1499'}
                />
              </div>
            </div>
          )}

          {field === 'compare_at_price' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Adjustment Action</label>
                <select
                  value={compareOp}
                  onChange={(e) => setCompareOp(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="set">Set Exact Compare Price (₹ MRP)</option>
                  <option value="increase_percent">Increase by Percentage (+%)</option>
                  <option value="decrease_percent">Decrease by Percentage (-%)</option>
                  <option value="clear">Clear Strike-through MRP (No Discount)</option>
                </select>
              </div>

              {compareOp !== 'clear' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {compareOp.includes('percent') ? 'Percentage (%)' : 'Amount (₹ MRP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={compareValue}
                    onChange={(e) => setCompareValue(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                    placeholder="e.g. 1999"
                  />
                </div>
              )}
            </div>
          )}

          {field === 'stock_quantity' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Stock Action</label>
                <select
                  value={stockOp}
                  onChange={(e) => setStockOp(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="set">Set to Exact Count</option>
                  <option value="increase_amount">Add to Current Stock (+Units)</option>
                  <option value="decrease_amount">Deduct from Current Stock (-Units)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                  placeholder="e.g. 10"
                />
              </div>
            </div>
          )}

          {field === 'status' && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-slate-700 font-semibold mb-1">New Publishing Status</label>
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value as ProductStatus)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-bold"
              >
                <option value="published">Published (Visible in Catalog)</option>
                <option value="draft">Draft (Hidden from Storefront)</option>
                <option value="out_of_stock">Out of Stock Badge</option>
                <option value="archived">Archived (Soft Deleted)</option>
              </select>
            </div>
          )}

          {field === 'category' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Primary Category</label>
                <select
                  value={selectedCatId}
                  onChange={(e) => {
                    setSelectedCatId(e.target.value);
                    setSelectedSubcatId('');
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                >
                  {rootCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subcategory (Optional)</label>
                <select
                  value={selectedSubcatId}
                  onChange={(e) => setSelectedSubcatId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                >
                  <option value="">None / Keep Direct Category</option>
                  {subcategories.map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {field === 'tags' && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tag Action</label>
                <select
                  value={tagOp}
                  onChange={(e) => setTagOp(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="add_tags">Add Tags (Append)</option>
                  <option value="remove_tags">Remove Specific Tags</option>
                  <option value="set">Replace Entire Tags List</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tags (Semicolon separated)</label>
                <input
                  type="text"
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  placeholder="e.g. Rare; Show Class; Monsoon Special"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {field === 'featured' && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-slate-700 font-semibold mb-1">Featured Spotlight</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="bulk-featured"
                    checked={featuredValue === true}
                    onChange={() => setFeaturedValue(true)}
                    className="accent-blue-900"
                  />
                  <span>Mark as Featured (Showcase on Homepage)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="bulk-featured"
                    checked={featuredValue === false}
                    onChange={() => setFeaturedValue(false)}
                    className="accent-blue-900"
                  />
                  <span>Remove from Featured</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Affects <strong className="text-slate-900">{selectedProductIds.length}</strong> products
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

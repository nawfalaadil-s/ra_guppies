import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, 
  Sparkles, X, Download, Upload,
  Film, Image as ImageIcon, Play, Star,
  ArrowLeft, ArrowRight, Video,
  FileSpreadsheet, FolderTree, Layers,
  CheckCircle2
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { useToast } from '../../contexts/ToastContext';
import { Product, FishGender, CareLevel, ProductVideo, ProductStatus } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MediaPickerModal, SelectedMedia } from '../../components/common/MediaPickerModal';
import { CsvImportModal } from '../../components/admin/CsvImportModal';
import { BulkEditModal } from '../../components/admin/BulkEditModal';
import { BulkDeleteModal } from '../../components/admin/BulkDeleteModal';
import { deleteSupabaseProducts, syncProductToSupabase } from '../../lib/supabaseSync';

export const AdminProductsPage: React.FC = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>(() => mockDb.getProducts());
  const [categoryHierarchy, setCategoryHierarchy] = useState(() => mockDb.getCategoryHierarchy());
  const categories = mockDb.getCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Bulk Selection & Action Modals State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Individual Specimen Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [categoryId, setCategoryId] = useState('9ebb7d17-8998-46b7-8e97-46a0812f7a80');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [status, setStatus] = useState<ProductStatus>('published');
  const [weight, setWeight] = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [isUnique, setIsUnique] = useState(true);
  const [strain, setStrain] = useState('Halfmoon');
  const [gender, setGender] = useState<FishGender>('Male');
  const [careLevel, setCareLevel] = useState<CareLevel>('Moderate');
  const [description, setDescription] = useState('');
  
  // Media Gallery & Videos State
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<ProductVideo[]>([]);

  // Media Picker Modal State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] = useState<'image' | 'video' | 'video-poster'>('image');
  const [targetVideoIndex, setTargetVideoIndex] = useState<number | null>(null);

  // Video Preview Modal State
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewVideoUrl) setPreviewVideoUrl(null);
        else if (isMediaPickerOpen) setIsMediaPickerOpen(false);
        else if (deleteProductTarget) setDeleteProductTarget(null);
        else if (isModalOpen) setIsModalOpen(false);
        else if (isBulkDeleteModalOpen) setIsBulkDeleteModalOpen(false);
        else if (isBulkEditModalOpen) setIsBulkEditModalOpen(false);
        else if (isImportModalOpen) setIsImportModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewVideoUrl, isMediaPickerOpen, deleteProductTarget, isModalOpen, isBulkDeleteModalOpen, isBulkEditModalOpen, isImportModalOpen]);

  const refreshProducts = () => {
    setProducts(mockDb.getProducts());
    setCategoryHierarchy(mockDb.getCategoryHierarchy());
  };

  // Hierarchy-aware catalog filtering
  const filtered = products.filter((p) => {
    if (categoryFilter !== 'all') {
      const matchedRoot = categoryHierarchy.find(r => r.id === categoryFilter);
      if (matchedRoot) {
        const subcatIds = new Set(matchedRoot.children?.map(ch => ch.id) || []);
        const matchesPrimary = p.category_id === categoryFilter;
        const matchesChild = p.subcategory_id ? subcatIds.has(p.subcategory_id) : false;
        if (!matchesPrimary && !matchesChild) return false;
      } else {
        // Filter by specific subcategory
        if (p.subcategory_id !== categoryFilter && p.category_id !== categoryFilter) {
          return false;
        }
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) || 
        p.strain?.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q)) ||
        (p.subcategory_name && p.subcategory_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Select-All Checkbox Synchronization
  const isAllSelected = filtered.length > 0 && filtered.every(p => selectedProductIds.includes(p.id));
  const isSomeSelected = filtered.some(p => selectedProductIds.includes(p.id)) && !isAllSelected;

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filtered.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setComparePrice('');
    setCategoryId('9ebb7d17-8998-46b7-8e97-46a0812f7a80');
    setSubcategoryId('');
    setStatus('published');
    setWeight('');
    setStockQuantity('1');
    setIsUnique(true);
    setStrain('Halfmoon');
    setGender('Male');
    setCareLevel('Moderate');
    setDescription('');
    setImages(['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80']);
    setVideos([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setPrice(String(p.price));
    setComparePrice(p.compare_at_price ? String(p.compare_at_price) : '');
    setCategoryId(p.category_id);
    setSubcategoryId(p.subcategory_id || '');
    setStatus(p.status || 'published');
    setWeight(p.weight !== undefined ? String(p.weight) : '');
    setStockQuantity(String(p.stock_quantity));
    setIsUnique(p.is_unique_specimen);
    setStrain(p.strain || '');
    setGender(p.gender || 'Male');
    setCareLevel(p.care_level || 'Moderate');
    setDescription(p.description);
    setImages(p.images && p.images.length > 0 ? [...p.images] : ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80']);
    setVideos(p.videos ? [...p.videos] : []);
    setIsModalOpen(true);
  };

  // Image Gallery Handlers
  const handleOpenAddImage = () => {
    setMediaPickerMode('image');
    setIsMediaPickerOpen(true);
  };

  const handleOpenAddVideo = () => {
    setMediaPickerMode('video');
    setIsMediaPickerOpen(true);
  };

  const handleOpenSetPoster = (index: number) => {
    setTargetVideoIndex(index);
    setMediaPickerMode('video-poster');
    setIsMediaPickerOpen(true);
  };

  const handleMediaSelected = (media: SelectedMedia) => {
    if (mediaPickerMode === 'image') {
      setImages((prev) => [...prev, media.url]);
      showToast('Image added to gallery', 'success');
    } else if (mediaPickerMode === 'video') {
      const newVid: ProductVideo = {
        id: 'vid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        url: media.url,
        thumbnail_url: media.thumbnail_url,
        title: media.alt_text || 'Swimming Showcase Footage',
        duration: media.duration,
        mime_type: media.mime_type || 'video/mp4',
        file_size_bytes: media.file_size_bytes,
      };
      setVideos((prev) => [...prev, newVid]);
      showToast('Swimming footage attached to specimen', 'success');
    } else if (mediaPickerMode === 'video-poster' && targetVideoIndex !== null) {
      setVideos((prev) => {
        const copy = [...prev];
        if (copy[targetVideoIndex]) {
          copy[targetVideoIndex] = {
            ...copy[targetVideoIndex],
            thumbnail_url: media.url,
          };
        }
        return copy;
      });
      showToast('Video poster updated', 'success');
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
    showToast('Primary product image updated', 'info');
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      showToast('Product must have at least one image', 'error');
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
    showToast('Image removed from gallery', 'info');
  };

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
    showToast('Video removed from specimen', 'info');
  };

  const handleVideoTitleChange = (index: number, title: string) => {
    setVideos((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], title };
      }
      return copy;
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      showToast('Name and price are required', 'error');
      return;
    }

    if (images.length === 0) {
      showToast('Please add at least one product image', 'error');
      return;
    }

    const cat = categories.find(c => c.id === categoryId);
    const subcat = categories.find(c => c.id === subcategoryId);

    const saved = mockDb.saveProduct({
      id: editingProduct?.id,
      name,
      price: Number(price),
      compare_at_price: comparePrice ? Number(comparePrice) : undefined,
      category_id: categoryId,
      category_name: cat?.name,
      subcategory_id: subcategoryId || undefined,
      subcategory_name: subcat?.name || undefined,
      status,
      weight: weight ? Number(weight) : undefined,
      stock_quantity: Number(stockQuantity),
      is_unique_specimen: isUnique,
      strain,
      gender,
      care_level: careLevel,
      description,
      images,
      videos,
    });

    // Sync to Supabase in background
    syncProductToSupabase(saved).catch(console.error);

    refreshProducts();
    setIsModalOpen(false);
    showToast(`Specimen ${saved.name} saved successfully!`, 'success');
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteProductTarget(product);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProductTarget) return;
    const target = deleteProductTarget;
    // 1. Delete locally from mock database
    mockDb.deleteProduct(target.id, { force: true });
    // 2. Delete from live Supabase
    await deleteSupabaseProducts([target.id], target.sku ? [target.sku] : undefined);
    
    refreshProducts();
    showToast(`Specimen "${target.name}" permanently deleted`, 'info');
    setDeleteProductTarget(null);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'SKU', 'Name', 'Category', 'Price', 'Stock', 'Unique_Specimen', 'Images_Count', 'Has_Video'];
    const rows = products.map(p => [
      p.id,
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category_name,
      p.price,
      p.stock_quantity,
      p.is_unique_specimen ? 'YES' : 'NO',
      p.images?.length || 0,
      p.videos && p.videos.length > 0 ? 'YES' : 'NO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ra_guppy_inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory exported as CSV', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono">
            Catalog Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Live Specimen & Inventory Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
            <span>Total active specimens in stock: <strong className="text-slate-800">{products.length}</strong></span>
            <span>·</span>
            <Link to="/admin/bulk-products" className="text-blue-900 hover:underline font-semibold inline-flex items-center gap-1">
              <span>Bulk & CSV Studio</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import CSV */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4 text-blue-900" />
            <span>Import CSV</span>
          </button>

          {/* Bulk Edit */}
          <button
            onClick={() => {
              if (selectedProductIds.length === 0) {
                showToast('Please select at least one product using checkboxes first', 'info');
                return;
              }
              setIsBulkEditModalOpen(true);
            }}
            disabled={selectedProductIds.length === 0}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
              selectedProductIds.length > 0
                ? 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100 cursor-pointer'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Edit2 className="w-4 h-4 text-blue-700" />
            <span>Bulk Edit{selectedProductIds.length > 0 ? ` (${selectedProductIds.length})` : ''}</span>
          </button>

          {/* Bulk Delete */}
          <button
            onClick={() => {
              if (selectedProductIds.length === 0) {
                showToast('Please select at least one product using checkboxes first', 'info');
                return;
              }
              setIsBulkDeleteModalOpen(true);
            }}
            disabled={selectedProductIds.length === 0}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
              selectedProductIds.length > 0
                ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 cursor-pointer'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Bulk Delete{selectedProductIds.length > 0 ? ` (${selectedProductIds.length})` : ''}</span>
          </button>

          {/* Manage Categories */}
          <Link
            to="/admin/categories"
            title="Manage Categories and Category Tree"
            aria-label="Manage Categories and Category Tree"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FolderTree className="w-4 h-4 text-blue-900" />
            <span>Manage Categories</span>
          </Link>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          {/* Add New Specimen */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Specimen</span>
          </button>
        </div>
      </div>

      {/* Active Selection Banner */}
      {selectedProductIds.length > 0 && (
        <div className="bg-blue-900 text-white p-3 px-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
            <span className="font-bold">
              {selectedProductIds.length} specimen{selectedProductIds.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-blue-300">•</span>
            <button
              onClick={toggleSelectAll}
              className="text-blue-200 hover:text-white underline font-medium"
            >
              {isAllSelected ? 'Deselect all' : `Select all ${filtered.length} matching`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkEditModalOpen(true)}
              className="px-3 py-1.5 bg-white text-blue-950 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-1 shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Bulk Edit ({selectedProductIds.length})</span>
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedProductIds.length})</span>
            </button>
            <button
              onClick={() => setSelectedProductIds([])}
              className="p-1.5 text-blue-300 hover:text-white rounded-lg hover:bg-blue-800 transition-colors ml-1"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, strain, SKU, category..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-slate-500 font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer text-xs focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Collections & Categories</option>
            {categoryHierarchy.map((root) => (
              <React.Fragment key={root.id}>
                <option value={root.id} className="font-bold text-slate-900">
                  📁 {root.name} ({root.product_count || 0})
                </option>
                {root.children?.map((sub) => (
                  <option key={sub.id} value={sub.id} className="text-slate-600">
                    &nbsp;&nbsp;↳ {sub.name} ({sub.product_count || 0})
                  </option>
                ))}
              </React.Fragment>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop Table (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Live Ornamental Fish and Aquarium Plants Catalog</caption>
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="p-4 w-12 text-center">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all specimens in current view"
                    className="accent-blue-900 w-4 h-4 rounded cursor-pointer"
                  />
                </th>
                <th scope="col" className="p-4">Specimen / Media</th>
                <th scope="col" className="p-4">Category & Strain</th>
                <th scope="col" className="p-4">Price</th>
                <th scope="col" className="p-4">Stock Level</th>
                <th scope="col" className="p-4">Specimen Type</th>
                <th scope="col" className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filtered.map((product) => {
                const hasVideo = product.videos && product.videos.length > 0;
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <tr 
                    key={product.id} 
                    className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(product.id)}
                        aria-label={`Select specimen ${product.name}`}
                        className="accent-blue-900 w-4 h-4 rounded cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={product.images[0]}
                            alt=""
                            aria-hidden="true"
                            className="w-full h-full object-cover"
                          />
                          {hasVideo && (
                            <span 
                              className="absolute bottom-0 right-0 p-1 bg-red-600 text-white rounded-tl-lg shadow-xs"
                              title="Includes HD swimming footage"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span>SKU: {product.sku}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-slate-400" />
                              {product.images?.length || 1} photo{product.images?.length !== 1 ? 's' : ''}
                            </span>
                            {hasVideo && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                                  <Film className="w-3 h-3" />
                                  {product.videos?.length} video{product.videos?.length !== 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800">{product.category_name || 'Guppies'}</span>
                      <p className="text-[11px] text-slate-500">{product.strain || 'Standard'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{formatCurrency(product.price)}</p>
                      {product.compare_at_price && (
                        <p className="text-[11px] text-slate-400 line-through">
                          {formatCurrency(product.compare_at_price)}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          product.stock_quantity > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {product.stock_quantity > 0 ? `${product.stock_quantity} In Stock` : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="p-4">
                      {product.is_unique_specimen ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-blue-700" />
                          <span>1-of-1 Specimen</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard Batch</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-900"
                          aria-label={`Edit specimen ${product.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-600"
                          aria-label={`Delete specimen ${product.name}`}
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

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            return (
              <div 
                key={product.id} 
                className={`p-4 space-y-3 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectProduct(product.id)}
                    aria-label={`Select specimen ${product.name}`}
                    className="accent-blue-900 w-4 h-4 rounded mt-1 cursor-pointer shrink-0"
                  />
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={product.images[0]}
                    alt=""
                    aria-hidden="true"
                    className="w-full h-full object-cover"
                  />
                  {product.videos && product.videos.length > 0 && (
                    <span className="absolute bottom-0 right-0 p-1 bg-red-600 text-white rounded-tl-lg">
                      <Play className="w-2.5 h-2.5 fill-current" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{product.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {product.category_name} · {product.strain}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-slate-900">{formatCurrency(product.price)}</span>
                    <span className="text-[10px] text-slate-400">
                      📷 {product.images?.length || 1}
                      {product.videos && product.videos.length > 0 ? ` · 🎥 ${product.videos.length}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="flex-1 min-h-[44px] py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-900"
                  aria-label={`Edit specimen ${product.name}`}
                >
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit Specimen</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(product)}
                  className="min-h-[44px] px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-red-200 focus-visible:ring-2 focus-visible:ring-red-600"
                  aria-label={`Delete specimen ${product.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl w-full z-10 text-xs text-slate-700 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold font-mono text-blue-900 uppercase tracking-wider">
                  Live Stock Database
                </span>
                <h2 id="product-modal-title" className="text-base font-bold text-slate-900">
                  {editingProduct ? 'Edit Live Specimen' : 'Add New Aquarium Specimen'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5">
              {/* Basic Specimen Info */}
              <div>
                <label htmlFor="prod-name" className="block text-slate-700 font-semibold mb-1">Specimen Title *</label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Electric Blue Pure Strain Guppy (Pair)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prod-price" className="block text-slate-700 font-semibold mb-1">Price (₹) *</label>
                  <input
                    id="prod-price"
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1499"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="prod-compare-price" className="block text-slate-700 font-semibold mb-1">Compare Price (₹ MRP)</label>
                  <input
                    id="prod-compare-price"
                    type="number"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    placeholder="1899"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prod-category" className="block text-slate-700 font-semibold mb-1">Primary Category</label>
                  <select
                    id="prod-category"
                    value={categoryId}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategoryId(newCat);
                      setSubcategoryId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {categories.filter(c => !c.parent_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prod-subcategory" className="block text-slate-700 font-semibold mb-1">Subcategory (Optional)</label>
                  <select
                    id="prod-subcategory"
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="">None / Direct Category</option>
                    {categories.filter(c => c.parent_id === categoryId).map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prod-stock" className="block text-slate-700 font-semibold mb-1">Stock Quantity</label>
                  <input
                    id="prod-stock"
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="prod-status" className="block text-slate-700 font-semibold mb-1">Publishing Status</label>
                  <select
                    id="prod-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="prod-weight" className="block text-slate-700 font-semibold mb-1">Weight (grams)</label>
                  <input
                    id="prod-weight"
                    type="number"
                    placeholder="e.g. 150"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prod-strain" className="block text-slate-700 font-semibold mb-1">Strain / Variety</label>
                  <input
                    id="prod-strain"
                    type="text"
                    value={strain}
                    onChange={(e) => setStrain(e.target.value)}
                    placeholder="e.g. Halfmoon"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="prod-gender" className="block text-slate-700 font-semibold mb-1">Gender</label>
                  <select
                    id="prod-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as FishGender)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Breeding Pair">Breeding Pair</option>
                    <option value="Unsexed">Unsexed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="prod-care" className="block text-slate-700 font-semibold mb-1">Care Level</label>
                  <select
                    id="prod-care"
                    value={careLevel}
                    onChange={(e) => setCareLevel(e.target.value as CareLevel)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* MULTI-IMAGE GALLERY MANAGER */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-900" />
                      Product Image Gallery ({images.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      The first image is the Primary Catalog Thumbnail. Drag or reorder images using arrow controls.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddImage}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Image</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((imgUrl, idx) => {
                    const isPrimary = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`group relative rounded-xl border-2 overflow-hidden bg-white shadow-xs aspect-square flex flex-col justify-between ${
                          isPrimary ? 'border-blue-900 ring-2 ring-blue-900/20' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Product media #${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Badges */}
                        <div className="absolute top-1.5 left-1.5">
                          {isPrimary ? (
                            <span className="px-2 py-0.5 bg-blue-900 text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-sm">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              Primary
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-semibold rounded backdrop-blur-xs">
                              #{idx + 1}
                            </span>
                          )}
                        </div>

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-end gap-1">
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(idx)}
                                title="Set as primary thumbnail"
                                className="p-1.5 bg-white text-slate-800 hover:text-blue-900 rounded-lg shadow-sm"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              title="Remove photo"
                              className="p-1.5 bg-white text-red-600 hover:bg-red-50 rounded-lg shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex justify-between items-center bg-black/50 p-1 rounded-lg backdrop-blur-xs text-white">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, 'left')}
                              title="Move photo left"
                              className="p-1 hover:bg-white/20 disabled:opacity-30 rounded"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-mono">Pos {idx + 1}</span>
                            <button
                              type="button"
                              disabled={idx === images.length - 1}
                              onClick={() => handleMoveImage(idx, 'right')}
                              title="Move photo right"
                              className="p-1 hover:bg-white/20 disabled:opacity-30 rounded"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VIDEO SHOWCASE MANAGER */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Film className="w-4 h-4 text-red-600" />
                      Live Swimming Video Footage ({videos.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Showcase high-definition swimming footage. Customers can watch in the gallery without leaving the product page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddVideo}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Video Footage</span>
                  </button>
                </div>

                {videos.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-white/60">
                    <Film className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-medium text-slate-600">No swimming videos attached yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Upload an MP4 or WebM video to show this exact fish swimming actively in planted tanks.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {videos.map((vid, vIdx) => (
                      <div
                        key={vid.id || vIdx}
                        className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          {/* Video Thumbnail / Play Trigger */}
                          <div 
                            className="relative w-20 h-14 bg-black rounded-lg overflow-hidden shrink-0 cursor-pointer group"
                            onClick={() => setPreviewVideoUrl(vid.url)}
                            title="Click to preview video"
                          >
                            <img
                              src={vid.thumbnail_url || images[0]}
                              alt="Video poster"
                              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                <Play className="w-3 h-3 ml-0.5 fill-current" />
                              </span>
                            </div>
                            {vid.duration && (
                              <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-white text-[9px] font-mono rounded">
                                {vid.duration}s
                              </span>
                            )}
                          </div>

                          {/* Video Title & Meta */}
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={vid.title || ''}
                              onChange={(e) => handleVideoTitleChange(vIdx, e.target.value)}
                              placeholder="Footage title (e.g. Flare & Fin Spread Test)"
                              className="text-xs font-semibold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-600 w-full sm:w-64"
                            />
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="font-mono">{vid.mime_type || 'video/mp4'}</span>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleOpenSetPoster(vIdx)}
                                className="text-blue-600 hover:text-blue-700 underline font-medium"
                              >
                                {vid.thumbnail_url ? 'Change poster image' : 'Set custom poster'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => setPreviewVideoUrl(vid.url)}
                            className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition-colors"
                          >
                            <Play className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(vIdx)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove video footage"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="prod-desc" className="block text-slate-700 font-semibold mb-1">Description & Pedigree</label>
                <textarea
                  id="prod-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Unique specimen toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label htmlFor="prod-unique" className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="prod-unique"
                    type="checkbox"
                    checked={isUnique}
                    onChange={(e) => setIsUnique(e.target.checked)}
                    className="accent-blue-900 w-4 h-4 rounded"
                  />
                  <span className="font-semibold text-slate-800">
                    Unique Specimen: Exact Fish Pictured (WYSIWYG - Locks Stock to 1)
                  </span>
                </label>
              </div>

              {/* Dialog Footer Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs text-slate-700 font-semibold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md min-h-[44px]"
                >
                  Save Specimen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE MEDIA PICKER MODAL */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelected}
        mediaType={mediaPickerMode === 'video' ? 'video' : 'image'}
        category={mediaPickerMode === 'video' ? 'video' : 'specimen'}
        title={
          mediaPickerMode === 'video'
            ? 'Select or Upload Swimming Video Footage'
            : mediaPickerMode === 'video-poster'
            ? 'Select Video Poster Thumbnail'
            : 'Add Product Gallery Image'
        }
      />

      {/* VIDEO PREVIEW MODAL */}
      {previewVideoUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-preview-title"
        >
          <div className="bg-slate-900 rounded-2xl overflow-hidden max-w-2xl w-full border border-slate-700 shadow-2xl relative">
            <div className="p-3 bg-slate-800 flex justify-between items-center text-white text-sm font-semibold">
              <span id="video-preview-title" className="flex items-center gap-2">
                <Video className="w-4 h-4 text-red-500" />
                Live Swimming Footage Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewVideoUrl(null)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close video preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteProductTarget}
        title="Delete Inventory Specimen"
        message={`Are you sure you want to delete "${deleteProductTarget?.name}" (SKU: ${deleteProductTarget?.sku})? This action will remove the live specimen from stock immediately.`}
        confirmLabel="Delete Specimen"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteProductTarget(null)}
      />

      {/* CSV IMPORT WORKSPACE MODAL */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          refreshProducts();
          setSelectedProductIds([]);
        }}
      />

      {/* BULK EDIT MODAL */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedProductIds={selectedProductIds}
        onSuccess={() => {
          refreshProducts();
          setSelectedProductIds([]);
        }}
      />

      {/* BULK DELETE MODAL WITH ORDER PROTECTION */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        selectedProductIds={selectedProductIds}
        onSuccess={() => {
          refreshProducts();
          setSelectedProductIds([]);
        }}
      />
    </div>
  );
};

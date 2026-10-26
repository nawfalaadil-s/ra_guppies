import React, { useState, useEffect } from 'react';
import { 
  FolderTree, Plus, Edit2, Trash2, ChevronRight, ChevronDown, 
  ArrowUp, ArrowDown, ExternalLink, Image as ImageIcon, Video, 
  Sparkles, AlertTriangle, CheckCircle2, X, Search, ShieldCheck, Tag, Upload
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { useToast } from '../../contexts/ToastContext';
import { Category, Product } from '../../lib/types';
import { MediaPickerModal, SelectedMedia } from '../../components/common/MediaPickerModal';
import { SEO } from '../../components/common/SEO';
import { deleteSupabaseCategory, syncCategoryToSupabase } from '../../lib/supabaseSync';

export const AdminCategoriesPage: React.FC = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>(() => mockDb.getCategories());
  const [hierarchy, setHierarchy] = useState<Category[]>(() => mockDb.getCategoryHierarchy());
  const [products, setProducts] = useState<Product[]>(() => mockDb.getProducts());

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentPresetId, setParentPresetId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Media Picker State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState<'image' | 'banner' | 'video'>('image');

  // Deletion & Dependency Resolution Modal
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [archiveOption, setArchiveOption] = useState<boolean>(true);

  // Storefront Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const refreshData = () => {
    setCategories(mockDb.getCategories());
    setHierarchy(mockDb.getCategoryHierarchy());
    setProducts(mockDb.getProducts());
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMediaPickerOpen) setIsMediaPickerOpen(false);
        else if (deleteTarget) setDeleteTarget(null);
        else if (isPreviewOpen) setIsPreviewOpen(false);
        else if (isEditorOpen) setIsEditorOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMediaPickerOpen, deleteTarget, isPreviewOpen, isEditorOpen]);

  // Toggle parent expansion
  const toggleExpand = (catId: string) => {
    setExpandedParents(prev => ({
      ...prev,
      [catId]: prev[catId] === undefined ? false : !prev[catId]
    }));
  };

  // Open modal for creating category
  const handleOpenCreate = (presetParentId?: string) => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setParentId(presetParentId || '');
    setDisplayOrder(categories.length + 1);
    setImageUrl('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80');
    setBannerUrl('');
    setVideoUrl('');
    setIsActive(true);
    setIsFeatured(false);
    setIsEditorOpen(true);
  };

  // Open modal for editing category
  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setParentId(cat.parent_id || '');
    setDisplayOrder(cat.display_order);
    setImageUrl(cat.image_url || '');
    setBannerUrl(cat.banner_url || '');
    setVideoUrl(cat.video_url || '');
    setIsActive(cat.is_active);
    setIsFeatured(Boolean(cat.is_featured));
    setIsEditorOpen(true);
  };

  // Handle save category
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a category name.', 'error');
      return;
    }

    try {
      const saved = mockDb.saveCategory({
        id: editingCategory?.id,
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        parent_id: parentId ? parentId : null,
        display_order: Number(displayOrder) || 1,
        image_url: imageUrl.trim(),
        banner_url: bannerUrl.trim() || undefined,
        video_url: videoUrl.trim() || undefined,
        is_active: isActive,
        is_featured: isFeatured,
      });

      // Sync to Supabase
      syncCategoryToSupabase(saved).catch(console.error);

      showToast(editingCategory ? `Updated category "${name}"` : `Created category "${name}"`, 'success');
      setIsEditorOpen(false);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    }
  };

  // Handle reordering up/down
  const handleMoveOrder = (catId: string, direction: 'up' | 'down') => {
    const list = [...categories].sort((a, b) => a.display_order - b.display_order);
    const index = list.findIndex(c => c.id === catId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = list[index].display_order;
      list[index].display_order = list[index - 1].display_order;
      list[index - 1].display_order = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index].display_order;
      list[index].display_order = list[index + 1].display_order;
      list[index + 1].display_order = temp;
    }

    mockDb.reorderCategories(list.map(c => c.id));
    refreshData();
    showToast('Category sequence updated.', 'info');
  };

  // Trigger deletion check
  const handlePromptDelete = (cat: Category) => {
    setDeleteTarget(cat);
    // Find candidate categories to reassign to (excluding the delete target)
    const candidates = categories.filter(c => c.id !== cat.id && c.parent_id !== cat.id);
    setReassignTargetId(candidates[0]?.id || '');
    setArchiveOption(true);
  };

  // Execute deletion with resolution
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    try {
      // 1. Delete locally from mock database
      const res = mockDb.deleteCategory(target.id, {
        reassignToId: reassignTargetId || undefined,
        archiveProducts: archiveOption,
      });

      // 2. Delete from live Supabase
      await deleteSupabaseCategory(target.id, reassignTargetId || undefined);

      showToast(res.message, 'success');
      setDeleteTarget(null);
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Error deleting category', 'error');
    }
  };

  // Media Picker Callback
  const handleMediaSelect = (media: SelectedMedia) => {
    if (mediaTargetField === 'image') {
      setImageUrl(media.url);
    } else if (mediaTargetField === 'banner') {
      setBannerUrl(media.url);
    } else if (mediaTargetField === 'video') {
      setVideoUrl(media.url);
    }
    setIsMediaPickerOpen(false);
    showToast(`Attached ${mediaTargetField} media successfully!`, 'success');
  };

  // Filter hierarchy by search query
  const filteredHierarchy = hierarchy.filter(root => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const rootMatches = root.name.toLowerCase().includes(q) || root.slug.toLowerCase().includes(q);
    const childMatches = (root.children || []).some(ch => ch.name.toLowerCase().includes(q) || ch.slug.toLowerCase().includes(q));
    return rootMatches || childMatches;
  });

  // Calculate dependency counts for deleteTarget
  const targetChildCount = deleteTarget ? categories.filter(c => c.parent_id === deleteTarget.id).length : 0;
  const targetProductCount = deleteTarget ? products.filter(p => p.category_id === deleteTarget.id || p.subcategory_id === deleteTarget.id).length : 0;

  return (
    <div className="space-y-6 pb-12">
      <SEO title="Category & Subcategory Hierarchy | Admin" description="Manage hierarchical categories, subcategories, display sequence, and storefront appearance." />

      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
            <FolderTree className="w-4 h-4 text-red-600" />
            <span>Taxonomy & Storefront Catalog Architecture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Category & Subcategory Hierarchy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize root specimen collections, nest specialized strain subcategories, and manage navigation ordering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-900" />
            <span>Storefront Preview</span>
          </button>
          <button
            onClick={() => handleOpenCreate()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-red-400" />
            <span>Add Root Category</span>
          </button>
        </div>
      </div>

      {/* Quick Search & Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Root Categories</span>
          <span className="text-2xl font-bold text-slate-900 font-display mt-0.5 block">{hierarchy.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Subcategories</span>
          <span className="text-2xl font-bold text-slate-900 font-display mt-0.5 block">
            {categories.filter(c => !!c.parent_id).length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Catalog Products</span>
          <span className="text-2xl font-bold text-blue-900 font-display mt-0.5 block">{products.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search taxonomy..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>
      </div>

      {/* Hierarchical Tree Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50/50">
          <span>Catalog Structure & Hierarchy</span>
          <span>{categories.length} total categories registered</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredHierarchy.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No categories match your search criteria.
            </div>
          ) : (
            filteredHierarchy.map((root) => {
              const isExpanded = expandedParents[root.id] !== false; // default open
              const childCount = (root.children || []).length;

              return (
                <div key={root.id} className="transition-colors hover:bg-slate-50/40">
                  {/* Root Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(root.id)}
                        className={`p-1 rounded-lg hover:bg-slate-200 transition-colors ${childCount === 0 ? 'opacity-30 cursor-default' : 'text-slate-700'}`}
                        disabled={childCount === 0}
                        aria-label={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {root.image_url ? (
                          <img src={root.image_url} alt={root.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400 m-2.5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{root.name}</span>
                          <span className="font-mono text-[11px] text-slate-400">/{root.slug}</span>
                          {root.is_featured && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-900 uppercase">Featured</span>
                          )}
                          {!root.is_active && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">Hidden</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span>{childCount} {childCount === 1 ? 'subcategory' : 'subcategories'}</span>
                          <span>&bull;</span>
                          <span className="font-semibold text-blue-900">{root.product_count || 0} specimens assigned</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenCreate(root.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-900 hover:bg-blue-50 border border-blue-200 inline-flex items-center gap-1"
                        title="Add child subcategory under this parent"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Subcategory</span>
                      </button>

                      <button
                        onClick={() => handleMoveOrder(root.id, 'up')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Move sequence up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(root.id, 'down')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Move sequence down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(root)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                        title="Edit category details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePromptDelete(root)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Child Subcategories Rows */}
                  {isExpanded && childCount > 0 && (
                    <div className="bg-slate-50/70 border-t border-slate-100 divide-y divide-slate-100 pl-10 pr-4">
                      {root.children?.map((child) => (
                        <div key={child.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-300 font-mono text-xs">└─</span>
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                              {child.image_url ? (
                                <img src={child.image_url} alt={child.name} className="w-full h-full object-cover" />
                              ) : (
                                <Tag className="w-3.5 h-3.5 text-slate-400 m-1.5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-slate-800">{child.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">/{child.slug}</span>
                                {!child.is_active && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-600">Hidden</span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {child.product_count || 0} specimens assigned
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              onClick={() => handleOpenEdit(child)}
                              className="p-1 rounded-lg hover:bg-slate-200 text-slate-600"
                              title="Edit subcategory"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePromptDelete(child)}
                              className="p-1 rounded-lg hover:bg-red-100 text-red-600"
                              title="Delete subcategory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Category Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            role="dialog" 
            aria-modal="true" 
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 font-display">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category / Subcategory'}
              </h2>
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCategory) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                      }
                    }}
                    placeholder="e.g. Pure Strain Guppies"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. pure-strain-guppies"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Parent Category Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Category</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="">(None — Top-Level Root Collection)</option>
                  {categories
                    .filter(c => c.id !== editingCategory?.id && !c.parent_id)
                    .map(parentCat => (
                      <option key={parentCat.id} value={parentCat.id}>
                        Root: {parentCat.name}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select a root category to make this a nested subcategory, or leave as root collection.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of this collection shown in catalog headers and SEO metadata..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              {/* Media Attachments */}
              <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Visual Media & Banners</span>
                
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400 m-3" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Category Thumbnail Image URL"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs mb-1"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMediaTargetField('image');
                          setIsMediaPickerOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                      >
                        Browse Media Library
                      </button>
                      <label className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer inline-flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Upload from PC</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setImageUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5">Hero Banner URL (Optional)</label>
                    <input
                      type="text"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="Wide header banner URL"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-0.5">Ambient Video URL (Optional)</label>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Category MP4 video loop"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Sequence & Status Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Sequence</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="cat-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-blue-900 w-4 h-4 rounded"
                  />
                  <label htmlFor="cat-active" className="font-semibold text-slate-700">Active / Published</label>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="cat-featured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="accent-blue-900 w-4 h-4 rounded"
                  />
                  <label htmlFor="cat-featured" className="font-semibold text-slate-700">Featured in Navbar</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 shadow-sm"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deletion & Dependency Resolution Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            role="dialog" 
            aria-modal="true" 
            className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Category: {deleteTarget.name}</h3>
                <span className="text-[11px] text-slate-500">Integrity check and dependency resolution</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-600 leading-relaxed">
              {targetChildCount > 0 && (
                <div className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <strong>Warning:</strong> This category contains <strong>{targetChildCount}</strong> child subcategory(s). They will be moved to the top-level root.
                </div>
              )}
              {targetProductCount > 0 ? (
                <div>
                  <p>
                    There are currently <strong className="text-blue-900">{targetProductCount}</strong> live products assigned to this category.
                  </p>
                  <div className="mt-3 space-y-2">
                    <label className="block font-semibold text-slate-800">Choose resolution for assigned products:</label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="product-resolution"
                          checked={!archiveOption}
                          onChange={() => setArchiveOption(false)}
                          className="accent-blue-900"
                        />
                        <span>Reassign products to another category</span>
                      </label>
                      {!archiveOption && (
                        <select
                          value={reassignTargetId}
                          onChange={(e) => setReassignTargetId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs mt-1"
                        >
                          {categories.filter(c => c.id !== deleteTarget.id).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input
                          type="radio"
                          name="product-resolution"
                          checked={archiveOption}
                          onChange={() => setArchiveOption(true)}
                          className="accent-blue-900"
                        />
                        <span>Archive assigned products (Safeguard order history & invoices)</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No products are currently assigned to this category. It is safe to remove.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storefront Navigation Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            role="dialog" 
            aria-modal="true" 
            className="bg-white rounded-3xl max-w-3xl w-full p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-slate-900 text-sm">Live Storefront Hierarchy Appearance</h3>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-500">
                This preview illustrates how categories and subcategories render in the public navigation bar and catalog filters:
              </p>

              {/* Mock Navigation Strip */}
              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Storefront Category Strip</span>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                  <span className="text-blue-900 font-bold">All Fish & Supplies</span>
                  {hierarchy.filter(c => c.is_active).map(root => (
                    <div key={root.id} className="relative group cursor-pointer">
                      <span className="hover:text-blue-900 flex items-center gap-1">
                        {root.name}
                        {(root.children || []).length > 0 && <ChevronDown className="w-3 h-3 text-slate-400" />}
                      </span>
                      {(root.children || []).length > 0 && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2 min-w-[160px] hidden group-hover:block z-10">
                          {root.children?.map(ch => (
                            <div key={ch.id} className="px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-600 text-xs">
                              {ch.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Breadcrumb Simulation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Sample Breadcrumb Trail</span>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <span>Home</span>
                  <span>/</span>
                  <span>Shop</span>
                  <span>/</span>
                  <span className="text-blue-900 font-bold">{hierarchy[0]?.name || 'Guppies & Livebearers'}</span>
                  {hierarchy[0]?.children?.[0] && (
                    <>
                      <span>/</span>
                      <span className="text-blue-900 font-bold">{hierarchy[0].children[0].name}</span>
                    </>
                  )}
                  <span>/</span>
                  <span className="text-slate-800">Electric Blue Pure Strain Guppy (Pair)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        mediaType={mediaTargetField === 'video' ? 'video' : 'image'}
        title={`Select Category ${mediaTargetField.toUpperCase()}`}
      />
    </div>
  );
};

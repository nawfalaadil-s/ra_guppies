import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUp, ArrowDown, Eye, EyeOff, 
  FileText, Plus, History, RotateCcw,
  Megaphone, ExternalLink, Trash2, Save, X,
  Layers, Sliders, Image as ImageIcon, Copy,
  Check, Search, Upload, RefreshCw, AlertCircle,
  LayoutDashboard, Sparkles, CheckCircle2, ChevronRight,
  GripVertical, Play, Palette
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { useToast } from '../../contexts/ToastContext';
import { HomepageSection, CMSPage, StoreSettings, MediaAsset, Category } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MediaPickerModal, SelectedMedia } from '../../components/common/MediaPickerModal';
import { checkMediaUsage, safeDeleteMediaAsset, MediaUsageCheckResult } from '../../lib/mediaService';
import { BrandingThemeEditor } from '../../components/admin/BrandingThemeEditor';
import { 
  fetchSupabaseHomepageSections, 
  syncHomepageSectionsToSupabase, 
  fetchSupabaseCMSPages, 
  syncCMSPageToSupabase, 
  deleteSupabaseCMSPage, 
  syncAnnouncementToSupabase,
  fetchSupabaseCategories,
  syncCategoryToSupabase
} from '../../lib/supabaseSync';

export const AdminCMSPage: React.FC = () => {
  const { showToast } = useToast();

  // Core Data
  const [sections, setSections] = useState<HomepageSection[]>(() => mockDb.getHomepageSections());
  const [pages, setPages] = useState<CMSPage[]>(() => mockDb.getCMSPages());
  const [settings, setSettings] = useState<StoreSettings>(() => mockDb.getStoreSettings());
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => mockDb.getMediaAssets());
  const [cmsCategories, setCmsCategories] = useState<Category[]>(() => mockDb.getCategories());

  // Load live CMS state from Supabase on mount
  useEffect(() => {
    fetchSupabaseHomepageSections().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setSections(fetched);
      }
    });
    fetchSupabaseCMSPages().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setPages(fetched);
        setSelectedPage((prev) => prev || fetched[0]);
      }
    });
    fetchSupabaseCategories().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setCmsCategories(fetched);
      }
    });
  }, []);

  // Real-time categories update listener
  useEffect(() => {
    const handleCatsUpdated = () => {
      setCmsCategories(mockDb.getCategories());
    };
    window.addEventListener('ba_categories_updated', handleCatsUpdated);
    return () => window.removeEventListener('ba_categories_updated', handleCatsUpdated);
  }, []);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'homepage' | 'branding' | 'announcement' | 'pages' | 'media'>('dashboard');

  // Last Saved Indicator
  const [lastSaved, setLastSaved] = useState<string>(() => new Date().toISOString());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Drag and Drop State for Homepage Sections
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Selected section to configure
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionSubtitle, setSectionSubtitle] = useState('');
  const [sectionConfig, setSectionConfig] = useState<Record<string, any>>({});

  // Custom Pages tab states
  const [pageSearch, setPageSearch] = useState('');
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(pages[0] || null);
  const [pageTitle, setPageTitle] = useState(pages[0]?.title || '');
  const [pageSlug, setPageSlug] = useState(pages[0]?.slug || '');
  const [pageStatus, setPageStatus] = useState<boolean>(pages[0]?.is_published ?? true);
  const [pageContent, setPageContent] = useState(pages[0]?.content_html || '');
  const [pageMetaTitle, setPageMetaTitle] = useState(pages[0]?.meta_title || '');
  const [pageMetaDesc, setPageMetaDesc] = useState(pages[0]?.meta_description || '');
  const [isCreatingNewPage, setIsCreatingNewPage] = useState(false);
  const [previewModalPage, setPreviewModalPage] = useState<CMSPage | null>(null);
  const [deleteConfirmPageId, setDeleteConfirmPageId] = useState<string | null>(null);
  const [isResetHomepageDialogOpen, setIsResetHomepageDialogOpen] = useState(false);
  const [deleteMediaTarget, setDeleteMediaTarget] = useState<MediaAsset | null>(null);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState(settings.announcement_text);
  const [announcementCode, setAnnouncementCode] = useState(settings.announcement_code || '');
  const [announcementActive, setAnnouncementActive] = useState(settings.announcement_active);
  const [announcementLink, setAnnouncementLink] = useState(settings.announcement_link || '');

  // Media Library state
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaCategory, setMediaCategory] = useState<string>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [copiedMediaId, setCopiedMediaId] = useState<string | null>(null);
  const [editingAltAsset, setEditingAltAsset] = useState<MediaAsset | null>(null);

  // Unified Media Picker state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerType, setMediaPickerType] = useState<'all' | 'image' | 'video'>('all');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'library-upload' | 'section-bg-image' | 'section-bg-video' | 'page-insert-media' | 'category-image' | null>(null);
  const [categoryMediaTargetId, setCategoryMediaTargetId] = useState<string | null>(null);

  // Video Preview modal state
  const [previewVideoModalUrl, setPreviewVideoModalUrl] = useState<string | null>(null);

  // Safe Deletion with reference check state
  const [mediaUsageWarning, setMediaUsageWarning] = useState<{
    asset: MediaAsset;
    usage: MediaUsageCheckResult;
  } | null>(null);

  // Escape key listener for dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewVideoModalUrl) setPreviewVideoModalUrl(null);
        else if (mediaUsageWarning) setMediaUsageWarning(null);
        else if (isMediaPickerOpen) setIsMediaPickerOpen(false);
        else if (isResetHomepageDialogOpen) setIsResetHomepageDialogOpen(false);
        else if (deleteConfirmPageId) setDeleteConfirmPageId(null);
        else if (deleteMediaTarget) setDeleteMediaTarget(null);
        else if (editingSection) setEditingSection(null);
        else if (previewModalPage) setPreviewModalPage(null);
        else if (editingAltAsset) setEditingAltAsset(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewVideoModalUrl, mediaUsageWarning, isMediaPickerOpen, isResetHomepageDialogOpen, deleteConfirmPageId, deleteMediaTarget, editingSection, previewModalPage, editingAltAsset]);

  // Factory reset homepage sections
  const handleResetHomepageSections = () => {
    setIsResetHomepageDialogOpen(true);
  };

  const confirmResetHomepageSections = async () => {
    const resetList = mockDb.resetHomepageSections();
    setSections(resetList);
    await syncHomepageSectionsToSupabase(resetList);
    setLastSaved(new Date().toISOString());
    setHasUnsavedChanges(false);
    setIsResetHomepageDialogOpen(false);
    showToast('Homepage layout reset to factory default & synced across all browsers!', 'success');
  };

  // Move section UP
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const copy = [...sections];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    copy.forEach((s, idx) => { s.display_order = idx + 1; });
    mockDb.updateHomepageSections(copy);
    setSections([...copy]);
    await syncHomepageSectionsToSupabase(copy);
    setLastSaved(new Date().toISOString());
    showToast(`"${copy[index - 1].title}" moved up & synced!`, 'success');
  };

  // Move section DOWN
  const handleMoveDown = async (index: number) => {
    if (index === sections.length - 1) return;
    const copy = [...sections];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    copy.forEach((s, idx) => { s.display_order = idx + 1; });
    mockDb.updateHomepageSections(copy);
    setSections([...copy]);
    await syncHomepageSectionsToSupabase(copy);
    setLastSaved(new Date().toISOString());
    showToast(`"${copy[index + 1].title}" moved down & synced!`, 'success');
  };

  // Drag and Drop Handlers
  const handleDragStart = (_e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const copy = [...sections];
    const [movedItem] = copy.splice(draggedIndex, 1);
    copy.splice(targetIndex, 0, movedItem);
    copy.forEach((s, idx) => { s.display_order = idx + 1; });

    mockDb.updateHomepageSections(copy);
    setSections(copy);
    await syncHomepageSectionsToSupabase(copy);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setLastSaved(new Date().toISOString());
    showToast(`Reordered "${movedItem.title}" to position ${targetIndex + 1}!`, 'success');
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Toggle section active
  const handleToggleActive = async (index: number) => {
    const copy = [...sections];
    copy[index].is_active = !copy[index].is_active;
    mockDb.updateHomepageSections(copy);
    setSections([...copy]);
    await syncHomepageSectionsToSupabase(copy);
    setLastSaved(new Date().toISOString());
    showToast(`Section "${copy[index].title}" is now ${copy[index].is_active ? 'Live' : 'Hidden'}`, copy[index].is_active ? 'success' : 'info');
  };

  // Open Edit Section modal
  const handleOpenEditSection = (s: HomepageSection) => {
    setEditingSection(s);
    setSectionTitle(s.title);
    setSectionSubtitle(s.subtitle || '');
    setSectionConfig({ ...(s.config || {}) });
  };

  // Save Section Configuration
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    const copy = sections.map((s) => {
      if (s.id === editingSection.id) {
        return { 
          ...s, 
          title: sectionTitle.trim(), 
          subtitle: sectionSubtitle.trim(),
          config: sectionConfig 
        };
      }
      return s;
    });
    mockDb.updateHomepageSections(copy);
    setSections(copy);
    await syncHomepageSectionsToSupabase(copy);
    setEditingSection(null);
    setLastSaved(new Date().toISOString());
    showToast(`Configuration for "${sectionTitle}" saved & synchronized across all users!`, 'success');
  };

  // Announcement Save
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await syncAnnouncementToSupabase({
      announcement_text: announcementText,
      announcement_code: announcementCode,
      announcement_active: announcementActive,
      announcement_link: announcementLink,
    });
    setSettings(mockDb.getStoreSettings());
    setLastSaved(new Date().toISOString());
    showToast('Promotional announcement bar updated across storefront and all devices!', 'success');
  };

  // Select custom page
  const handleSelectPage = (p: CMSPage) => {
    setIsCreatingNewPage(false);
    setSelectedPage(p);
    setPageTitle(p.title);
    setPageSlug(p.slug);
    setPageStatus(p.is_published ?? true);
    setPageContent(p.content_html);
    setPageMetaTitle(p.meta_title || '');
    setPageMetaDesc(p.meta_description || '');
  };

  // Start New Page
  const handleStartNewPage = () => {
    setIsCreatingNewPage(true);
    setSelectedPage(null);
    setPageTitle('');
    setPageSlug('');
    setPageStatus(true);
    setPageContent('<h2>Overview</h2>\n<p>Write your detailed guidelines, quarantine procedures, or policy specifications here...</p>');
    setPageMetaTitle('');
    setPageMetaDesc('');
  };

  // Auto-generate slug from title
  const handleGenerateSlug = () => {
    if (!pageTitle.trim()) return;
    const generated = pageTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setPageSlug(generated);
    showToast('Generated URL slug from page title', 'info');
  };

  // Save Page (Edit or New)
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitle.trim() || !pageSlug.trim()) {
      showToast('Page title and slug are required', 'error');
      return;
    }

    const cleanSlug = pageSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (isCreatingNewPage) {
      const newPage: CMSPage = {
        id: 'page-' + Date.now(),
        slug: cleanSlug,
        title: pageTitle.trim(),
        content_html: pageContent,
        meta_title: pageMetaTitle.trim() || pageTitle.trim(),
        meta_description: pageMetaDesc.trim() || `Official guide: ${pageTitle.trim()}`,
        is_published: pageStatus,
        updated_at: new Date().toISOString(),
        revisions: [{
          id: 'rev-' + Date.now(),
          page_id: 'page-' + Date.now(),
          title: pageTitle.trim(),
          content_html: pageContent,
          created_at: new Date().toISOString(),
          created_by: 'Super Admin',
        }]
      };
      mockDb.saveCMSPage(newPage);
      await syncCMSPageToSupabase(newPage);
      const updatedList = mockDb.getCMSPages();
      setPages(updatedList);
      setSelectedPage(newPage);
      setIsCreatingNewPage(false);
      setLastSaved(new Date().toISOString());
      showToast(`Custom page "${newPage.title}" created & synced across all users!`, 'success');
    } else if (selectedPage) {
      const updated: CMSPage = {
        ...selectedPage,
        slug: cleanSlug,
        title: pageTitle.trim(),
        content_html: pageContent,
        meta_title: pageMetaTitle.trim(),
        meta_description: pageMetaDesc.trim(),
        is_published: pageStatus,
        revisions: [
          ...(selectedPage.revisions || []),
          {
            id: 'rev-' + Date.now(),
            page_id: selectedPage.id,
            title: pageTitle.trim(),
            content_html: pageContent,
            created_at: new Date().toISOString(),
            created_by: 'Super Admin',
          }
        ]
      };
      mockDb.saveCMSPage(updated);
      await syncCMSPageToSupabase(updated);
      const updatedList = mockDb.getCMSPages();
      setPages(updatedList);
      setSelectedPage(updated);
      setLastSaved(new Date().toISOString());
      showToast(`Page "${updated.title}" updated & synced across all browsers!`, 'success');
    }
  };

  // Restore revision
  const handleRestoreRevision = (revTitle: string, revContent: string) => {
    setPageTitle(revTitle);
    setPageContent(revContent);
    showToast('Revision content loaded into editor. Click Save to persist.', 'info');
  };

  // Delete custom page
  const handleDeletePage = async (id: string) => {
    const toDelete = pages.find(p => p.id === id);
    if (!toDelete) return;

    mockDb.deleteCMSPage(id);
    await deleteSupabaseCMSPage(id, toDelete.slug);
    const updatedList = mockDb.getCMSPages();
    setPages(updatedList);
    setDeleteConfirmPageId(null);
    if (selectedPage?.id === id) {
      setSelectedPage(updatedList[0] || null);
      if (updatedList[0]) {
        handleSelectPage(updatedList[0]);
      } else {
        handleStartNewPage();
      }
    }
    setLastSaved(new Date().toISOString());
    showToast(`Deleted page "${toDelete.title}" across all systems`, 'info');
  };

  // Open Media Picker for various CMS targets
  const handleOpenMediaPicker = (
    target: 'library-upload' | 'section-bg-image' | 'section-bg-video' | 'page-insert-media' | 'category-image',
    type: 'all' | 'image' | 'video' = 'all'
  ) => {
    setMediaPickerTarget(target);
    setMediaPickerType(type);
    setIsMediaPickerOpen(true);
  };

  const handleMediaPickerSelect = async (media: SelectedMedia) => {
    if (mediaPickerTarget === 'library-upload') {
      setMediaAssets(mockDb.getMediaAssets());
      setLastSaved(new Date().toISOString());
      showToast('Media asset uploaded to library!', 'success');
    } else if (mediaPickerTarget === 'section-bg-image') {
      setSectionConfig((prev) => ({ ...prev, backgroundImage: media.url }));
      showToast('Hero background image updated!', 'success');
    } else if (mediaPickerTarget === 'section-bg-video') {
      setSectionConfig((prev) => ({ ...prev, backgroundVideo: media.url }));
      showToast('Hero background video footage updated!', 'success');
    } else if (mediaPickerTarget === 'page-insert-media') {
      const isVid = media.mime_type?.startsWith('video/') || media.url.match(/\.(mp4|webm)$/i);
      const tag = isVid
        ? `\n<video controls playsinline preload="metadata" class="w-full rounded-2xl shadow-md my-4" poster="${media.thumbnail_url || ''}">\n  <source src="${media.url}" type="${media.mime_type || 'video/mp4'}">\n</video>\n`
        : `\n<img src="${media.url}" alt="${media.alt_text || 'Aquarium care guide illustration'}" class="w-full rounded-2xl shadow-md my-4" />\n`;
      setPageContent((prev) => prev + tag);
      showToast('Media inserted into guidelines content!', 'success');
    } else if (mediaPickerTarget === 'category-image' && categoryMediaTargetId) {
      await handleUpdateCategoryImage(categoryMediaTargetId, media.url);
      setCategoryMediaTargetId(null);
    }
  };

  // Direct category image & visibility updates inside CMS
  const handleUpdateCategoryImage = async (catId: string, newImageUrl: string) => {
    if (!newImageUrl.trim()) return;
    try {
      const all = mockDb.getCategories();
      const target = all.find(c => c.id === catId);
      if (!target) return;
      const updated = mockDb.saveCategory({
        ...target,
        image_url: newImageUrl.trim(),
        banner_url: newImageUrl.trim(),
      });
      setCmsCategories(mockDb.getCategories());
      await syncCategoryToSupabase(updated);
      setLastSaved(new Date().toISOString());
      showToast(`Category "${target.name}" image updated & synchronized across all users!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update category image', 'error');
    }
  };

  const handleCategoryFileUpload = async (catId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (JPEG, PNG, WEBP)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await handleUpdateCategoryImage(catId, dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleCategoryActive = async (catId: string) => {
    try {
      const all = mockDb.getCategories();
      const target = all.find(c => c.id === catId);
      if (!target) return;
      const updated = mockDb.saveCategory({
        ...target,
        is_active: !target.is_active,
      });
      setCmsCategories(mockDb.getCategories());
      await syncCategoryToSupabase(updated);
      setLastSaved(new Date().toISOString());
      showToast(`Category "${target.name}" is now ${updated.is_active ? 'visible on storefront' : 'hidden from storefront'}!`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update category status', 'error');
    }
  };

  // Copy media asset URL
  const handleCopyMediaUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedMediaId(id);
    showToast('Asset URL copied to clipboard!', 'success');
    setTimeout(() => {
      setCopiedMediaId(null);
    }, 2000);
  };

  // Safe Deletion: Checks if asset is currently referenced across products, CMS sections, pages, or blogs
  const handleDeleteMediaClick = (asset: MediaAsset) => {
    const usage = checkMediaUsage(asset.url);
    if (usage.isUsed) {
      setMediaUsageWarning({ asset, usage });
    } else {
      setDeleteMediaTarget(asset);
    }
  };

  const confirmDeleteMediaAsset = async () => {
    if (!deleteMediaTarget) return;
    const res = await safeDeleteMediaAsset(deleteMediaTarget.id, false);
    if (res.success) {
      setMediaAssets(mockDb.getMediaAssets());
      setLastSaved(new Date().toISOString());
      showToast(`Deleted media asset "${deleteMediaTarget.filename}"`, 'info');
    } else {
      showToast(res.message, 'error');
    }
    setDeleteMediaTarget(null);
  };

  const confirmForceDeleteMediaAsset = async () => {
    if (!mediaUsageWarning) return;
    const res = await safeDeleteMediaAsset(mediaUsageWarning.asset.id, true);
    if (res.success) {
      setMediaAssets(mockDb.getMediaAssets());
      setLastSaved(new Date().toISOString());
      showToast(res.message, 'info');
    }
    setMediaUsageWarning(null);
  };

  // Update alt text for asset
  const handleSaveAltText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAltAsset) return;

    const assets = mockDb.getMediaAssets();
    const index = assets.findIndex(a => a.id === editingAltAsset.id);
    if (index !== -1) {
      assets[index].alt_text = editingAltAsset.alt_text;
      localStorage.setItem('ba_media_assets', JSON.stringify(assets));
      setMediaAssets([...assets]);
      setEditingAltAsset(null);
      setLastSaved(new Date().toISOString());
      showToast('Asset alt text updated!', 'success');
    }
  };

  // Filtered custom pages
  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(pageSearch.toLowerCase()) || 
    p.slug.toLowerCase().includes(pageSearch.toLowerCase())
  );

  // Filtered media assets
  const filteredMedia = mediaAssets.filter(m => {
    const isVideo = m.mime_type.startsWith('video/') || m.category === 'video';
    if (mediaTypeFilter === 'image' && isVideo) return false;
    if (mediaTypeFilter === 'video' && !isVideo) return false;

    const matchesSearch = m.filename.toLowerCase().includes(mediaSearch.toLowerCase()) || 
                          m.alt_text.toLowerCase().includes(mediaSearch.toLowerCase());
    const matchesCategory = mediaCategory === 'all' || m.category === mediaCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate storage usage
  const totalStorageBytes = mediaAssets.reduce((sum, item) => sum + (item.file_size_bytes || 0), 0);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Header & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono">
              Store Content Architecture
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
              Live Synchronized
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-0.5">
            Visual CMS & Administrative Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Configure storefront layout, drag-and-drop block ordering, promotional broadcasts, custom policy guides, and media assets.
          </p>
        </div>

        {/* Status Indicators & Live Storefront Link */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-900" />
            <span>Saved: {formatDate(lastSaved)}</span>
          </div>
          <Link
            to="/"
            target="_blank"
            className="btn-primary inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl"
            title="Preview Live Storefront in new tab"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Unsaved Changes Banner (if applicable) */}
      {hasUnsavedChanges && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-900 shrink-0" />
            <span className="font-semibold">You have uncommitted modifications. Click Save to publish across the store.</span>
          </div>
          <button
            onClick={() => { setHasUnsavedChanges(false); showToast('Changes committed.', 'info'); }}
            className="btn-secondary px-3 py-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation Navigation Bar */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'dashboard'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="CMS Dashboard tab"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('homepage')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'homepage'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Homepage Blocks tab"
        >
          <Layers className="w-4 h-4" />
          <span>Homepage Blocks ({sections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'branding'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Branding and Theme tab"
        >
          <Palette className="w-4 h-4" />
          <span>Branding & Theme</span>
        </button>

        <button
          onClick={() => setActiveTab('announcement')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'announcement'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Announcement Bar tab"
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcement Bar</span>
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'pages'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Policy and Care Pages tab"
        >
          <FileText className="w-4 h-4" />
          <span>Policy & Care Pages ({pages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'media'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Media Asset Library tab"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Media Library ({mediaAssets.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CMS DASHBOARD OVERVIEW
      ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Homepage Sections</span>
                <Layers className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 font-display">
                  {sections.filter(s => s.is_active).length} <span className="text-xs font-normal text-slate-500">of {sections.length} Active</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {sections.length - sections.filter(s => s.is_active).length} sections currently hidden
                </p>
              </div>
              <button
                onClick={() => setActiveTab('homepage')}
                className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
              >
                <span>Reorder & Configure</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Custom Policy Pages</span>
                <FileText className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 font-display">
                  {pages.filter(p => p.is_published).length} <span className="text-xs font-normal text-slate-500">Published</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {pages.filter(p => !p.is_published).length} drafts in progress ({pages.length} total)
                </p>
              </div>
              <button
                onClick={() => setActiveTab('pages')}
                className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
              >
                <span>Edit Policy Guides</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Media Assets</span>
                <ImageIcon className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 font-display">
                  {mediaAssets.length} <span className="text-xs font-normal text-slate-500">Files</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {totalStorageMB} MB calculated asset cache
                </p>
              </div>
              <button
                onClick={() => setActiveTab('media')}
                className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
              >
                <span>Open Media Library</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Announcement Bar</span>
                <Megaphone className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${settings.announcement_active ? 'bg-blue-900 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-xl font-bold text-slate-900">
                    {settings.announcement_active ? 'Broadcasting Live' : 'Disabled'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {settings.announcement_text || 'No message configured'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('announcement')}
                className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
              >
                <span>Manage Announcement</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Actions & Storefront Layout Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Quick Management Operations */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-900" />
                  <span>Content Quick Actions</span>
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab('homepage');
                      const hero = sections.find(s => s.type === 'hero');
                      if (hero) handleOpenEditSection(hero);
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <strong className="text-xs font-bold text-slate-900 group-hover:text-blue-900 block">Edit Hero Carousel Banners</strong>
                      <span className="text-[11px] text-slate-500">Update main tagline, CTA buttons, and background image</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('pages');
                      handleStartNewPage();
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <strong className="text-xs font-bold text-slate-900 group-hover:text-blue-900 block">Publish New Policy / Care Guide</strong>
                      <span className="text-[11px] text-slate-500">Create quarantine manuals, guarantee terms, or guides</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
                  </button>

                  <button
                    onClick={() => {
                      handleOpenMediaPicker('library-upload', 'all');
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <strong className="text-xs font-bold text-slate-900 group-hover:text-blue-900 block">Upload Store Media Asset</strong>
                      <span className="text-[11px] text-slate-500">Add high-definition photos or swimming videos (up to 100MB)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
                  </button>

                  <button
                    onClick={handleResetHomepageSections}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <strong className="text-xs font-bold text-slate-900 group-hover:text-red-700 block">Factory Reset Homepage Blocks</strong>
                      <span className="text-[11px] text-slate-500">Restore default verified layout sequence</span>
                    </div>
                    <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-red-700" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Visual Section Flow Diagram */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Storefront Section Rendering Order
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live visual layout currently served to buyers visiting {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('homepage')}
                  className="btn-secondary px-3 py-1.5 text-xs font-bold"
                >
                  Edit Blocks
                </button>
              </div>

              <div className="space-y-2">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      sec.is_active 
                        ? 'bg-slate-50 border-slate-200' 
                        : 'bg-slate-50/40 border-slate-200/50 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-mono font-bold text-[11px] flex items-center justify-center text-blue-900 shadow-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{sec.title}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {sec.type}
                          </span>
                        </div>
                        {sec.subtitle && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{sec.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sec.is_active 
                          ? 'bg-blue-50 text-blue-900 border border-blue-200' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {sec.is_active ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: GLOBAL BRANDING & DYNAMIC THEME SETTINGS
      ========================================================================= */}
      {activeTab === 'branding' && <BrandingThemeEditor />}

      {/* =========================================================================
          TAB 2: HOMEPAGE VISUAL EDITOR & DRAG-AND-DROP REORDER
      ========================================================================= */}
      {activeTab === 'homepage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Storefront Content Blocks (Drag & Drop Reordering)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Drag handles or use keyboard Up/Down controls to rearrange homepage sections. Changes sync immediately.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {sections.filter(s => s.is_active).length} of {sections.length} active
                </span>
                <button
                  type="button"
                  onClick={handleResetHomepageSections}
                  className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  title="Reset sections to default order"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Reorderable List */}
            <div className="space-y-3">
              {sections.map((section, index) => {
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-move ${
                      isDragging 
                        ? 'opacity-40 border-dashed border-blue-600 bg-blue-50/50' 
                        : isDragOver 
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm' 
                          : section.is_active
                            ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                            : 'bg-slate-50/30 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-1">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <span className="w-8 h-8 rounded-xl bg-white text-blue-900 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 shadow-xs">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{section.title}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {section.type}
                          </span>
                        </div>
                        {section.subtitle && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {section.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="btn-icon min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 shadow-xs flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-900"
                        title="Move Up"
                        aria-label={`Move section ${section.title} Up`}
                      >
                        <ArrowUp className="w-4 h-4" aria-hidden="true" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sections.length - 1}
                        className="btn-icon min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white text-slate-700 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200 shadow-xs flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-900"
                        title="Move Down"
                        aria-label={`Move section ${section.title} Down`}
                      >
                        <ArrowDown className="w-4 h-4" aria-hidden="true" />
                      </button>

                      {/* Toggle Active */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(index)}
                        className={`min-h-[44px] min-w-[44px] p-2 rounded-xl transition-colors flex items-center justify-center border focus-visible:ring-2 focus-visible:ring-blue-900 ${
                          section.is_active 
                            ? 'bg-blue-50 text-blue-900 border-blue-200' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                        title={section.is_active ? 'Hide Section from Storefront' : 'Show Section on Storefront'}
                        aria-label={`Toggle visibility of section ${section.title}. Currently ${section.is_active ? 'Live' : 'Hidden'}`}
                        aria-pressed={section.is_active}
                      >
                        {section.is_active ? <Eye className="w-4 h-4" aria-hidden="true" /> : <EyeOff className="w-4 h-4" aria-hidden="true" />}
                      </button>

                      {/* Configure Section */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditSection(section)}
                        className="btn-secondary min-h-[44px] px-3.5 rounded-xl text-slate-700 hover:text-blue-900 text-xs font-bold flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-900"
                        title="Configure Section Content & Controls"
                        aria-label={`Configure content and settings for section ${section.title}`}
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-900" aria-hidden="true" />
                        <span>Configure</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PROMOTIONAL ANNOUNCEMENT BAR TAB
      ========================================================================= */}
      {activeTab === 'announcement' && (
        <div className="space-y-6 max-w-4xl">
          {/* Live Storefront Announcement Preview Banner */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                Storefront Header Banner Simulation
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                announcementActive ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {announcementActive ? 'Active & Live' : 'Disabled (Hidden)'}
              </span>
            </div>

            {/* Visual Simulated Banner */}
            {announcementActive ? (
              <div className="w-full bg-blue-950 text-white py-2.5 px-4 rounded-xl flex flex-wrap items-center justify-center gap-2 text-xs shadow-inner">
                <span className="font-medium text-center">
                  {announcementText || 'Your promotional broadcast message will display here...'}
                </span>
                {announcementCode && (
                  <span className="bg-blue-900 text-white px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-blue-700">
                    CODE: {announcementCode}
                  </span>
                )}
                {announcementLink && (
                  <span className="underline text-[11px] font-semibold text-blue-200">
                    Explore Now &rarr;
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full bg-slate-100 text-slate-400 py-4 px-4 rounded-xl text-center text-xs font-medium border border-dashed border-slate-200">
                Announcement bar is currently toggled OFF. Toggle it ON below to display at the top of all pages.
              </div>
            )}
          </div>

          {/* Form Editor */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 font-display">
                Promotional Announcement Bar Editor
              </h2>
              <p className="text-xs text-slate-500">
                Broadcast seasonal discounts, live arrival updates, and flash vouchers at the top of every page.
              </p>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 block">Broadcast Announcement Bar</span>
                  <span className="text-[11px] text-slate-500">Turn on or off across the entire customer storefront</span>
                </div>
                <input
                  type="checkbox"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="w-5 h-5 accent-blue-900 rounded cursor-pointer"
                  aria-label="Toggle announcement bar visibility"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Announcement Message *</label>
                <input
                  type="text"
                  required
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. ALL INDIA DISPATCH: Use code LIVE10 for 10% off show specimens!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Discount Coupon Code (Optional)</label>
                  <input
                    type="text"
                    value={announcementCode}
                    onChange={(e) => setAnnouncementCode(e.target.value)}
                    placeholder="e.g. LIVE10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono uppercase outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Click Destination URL (Optional)</label>
                  <input
                    type="text"
                    value={announcementLink}
                    onChange={(e) => setAnnouncementLink(e.target.value)}
                    placeholder="e.g. /shop?category=guppies"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="btn-primary px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish Announcement Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: POLICY & CARE CUSTOM PAGES TAB
      ========================================================================= */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Pages Selector with Search & New Page Button */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pages ({pages.length})
                </span>
                <button
                  type="button"
                  onClick={handleStartNewPage}
                  className="btn-primary flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Page</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  placeholder="Filter pages..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Pages List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredPages.map((p) => {
                  const isSelected = selectedPage?.id === p.id && !isCreatingNewPage;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPage(p)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-600 shadow-xs ring-1 ring-blue-600'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 truncate font-semibold">{p.title}</strong>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            p.is_published ? 'bg-blue-50 text-blue-900' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {p.is_published ? 'Live' : 'Draft'}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px] font-mono block truncate">/page/{p.slug}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          to={`/page/${p.slug}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-slate-400 hover:text-blue-900 rounded-lg hover:bg-slate-200"
                          title="View live page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Page Editor */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {isCreatingNewPage ? 'Create New Custom Page' : `Editing Page: ${pageTitle || 'Untitled'}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Compose HTML/rich text guidelines, configure SEO tags, and restore previous revisions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isCreatingNewPage && selectedPage && (
                  <button
                    type="button"
                    onClick={() => setPreviewModalPage({
                      ...selectedPage,
                      title: pageTitle,
                      content_html: pageContent,
                    })}
                    className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-900" />
                    <span>Live Preview</span>
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSavePage} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Page Title *</label>
                  <input
                    type="text"
                    required
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    placeholder="e.g. Terms of Service & DOA Policy"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">URL Path Slug *</label>
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="text-[11px] text-blue-900 hover:underline font-semibold"
                    >
                      Generate from Title
                    </button>
                  </div>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <span className="text-slate-400 font-mono">/page/</span>
                    <input
                      type="text"
                      required
                      value={pageSlug}
                      onChange={(e) => setPageSlug(e.target.value)}
                      placeholder="live-arrival-guarantee"
                      className="w-full bg-transparent text-xs text-blue-900 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status Toggle & SEO Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Publication State</span>
                    <span className="text-[11px] text-slate-500">Visible to customer storefront</span>
                  </div>
                  <label className="mt-2 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pageStatus}
                      onChange={(e) => setPageStatus(e.target.checked)}
                      className="w-4 h-4 accent-blue-900 rounded cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      {pageStatus ? 'Published (Live)' : 'Draft (Hidden)'}
                    </span>
                  </label>
                </div>

                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">SEO Meta Title</label>
                    <span className={`text-[10px] ${pageMetaTitle.length > 60 ? 'text-red-700' : 'text-slate-400'}`}>
                      {pageMetaTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={pageMetaTitle}
                    onChange={(e) => setPageMetaTitle(e.target.value)}
                    placeholder="Page Title | Store Brand"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">SEO Description</label>
                    <span className={`text-[10px] ${pageMetaDesc.length > 160 ? 'text-red-700' : 'text-slate-400'}`}>
                      {pageMetaDesc.length}/160
                    </span>
                  </div>
                  <input
                    type="text"
                    value={pageMetaDesc}
                    onChange={(e) => setPageMetaDesc(e.target.value)}
                    placeholder="Concise summary for search snippets..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold">HTML / Rich Guidelines Content *</label>
                  <button
                    type="button"
                    onClick={() => handleOpenMediaPicker('page-insert-media', 'all')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Insert Image / Video</span>
                  </button>
                </div>
                <textarea
                  rows={10}
                  required
                  value={pageContent}
                  onChange={(e) => setPageContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono outline-none focus:border-blue-600 focus:bg-white leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isCreatingNewPage ? 'Create & Publish Page' : 'Save Page & Log Revision'}</span>
                  </button>

                  {!isCreatingNewPage && selectedPage && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmPageId(selectedPage.id)}
                      className="btn-accent px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Page</span>
                    </button>
                  )}
                </div>

                {!isCreatingNewPage && selectedPage && (
                  <Link
                    to={`/page/${selectedPage.slug}`}
                    target="_blank"
                    className="text-xs text-blue-900 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View Published Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </form>

            {/* Revision History */}
            {!isCreatingNewPage && selectedPage?.revisions && selectedPage.revisions.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <History className="w-4 h-4" />
                  <span>Revision History ({selectedPage.revisions.length} snapshots)</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedPage.revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-slate-900 font-medium">{rev.title}</span>
                        <span className="text-[11px] text-slate-500 block">{formatDate(rev.created_at)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreRevision(rev.title, rev.content_html)}
                        className="btn-secondary px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: MEDIA ASSET LIBRARY TAB
      ========================================================================= */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Storefront Media Asset Library</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Manage product photography, breeder certification badges, banners, and facility imagery.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">{mediaAssets.length} Assets</span>
                  <span className="text-[10px] text-slate-400 font-mono">{totalStorageMB} MB used</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenMediaPicker('library-upload', 'all')}
                  className="btn-primary px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image / Video</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Type Filter Pills & Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      mediaTypeFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Assets
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter('image')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      mediaTypeFilter === 'image'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Images
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter('video')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      mediaTypeFilter === 'video'
                        ? 'bg-white text-red-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Videos
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {['all', 'specimen', 'video', 'banner', 'breeder', 'blog', 'general'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMediaCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                        mediaCategory === cat
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  placeholder="Search assets by name or alt..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((asset) => {
                const isVideo = asset.mime_type.startsWith('video/') || asset.category === 'video';
                const thumb = asset.thumbnail_url || asset.url;

                return (
                  <div
                    key={asset.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-slate-300 transition-all shadow-xs"
                  >
                    {/* Thumbnail / Video Preview Trigger */}
                    <div 
                      className="aspect-video w-full bg-slate-900 relative overflow-hidden cursor-pointer"
                      onClick={() => {
                        if (isVideo) setPreviewVideoModalUrl(asset.url);
                      }}
                    >
                      <img
                        src={thumb}
                        alt={asset.alt_text}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] uppercase font-mono px-2 py-0.5 rounded">
                          {asset.category}
                        </span>
                        {isVideo && (
                          <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            {asset.duration_seconds ? `${asset.duration_seconds}s` : 'VIDEO'}
                          </span>
                        )}
                      </div>

                      {/* Video Center Play Icon */}
                      {isVideo && (
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                          <span className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-0.5 fill-current" />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block truncate" title={asset.filename}>
                          {asset.filename}
                        </strong>
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5" title={asset.alt_text}>
                          "{asset.alt_text}"
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          {((asset.file_size_bytes || 0) / 1024).toFixed(0)} KB • {asset.mime_type.split('/')[1]?.toUpperCase()}
                          {asset.dimensions ? ` • ${asset.dimensions.width}x${asset.dimensions.height}` : ''}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyMediaUrl(asset.url, asset.id)}
                          className="btn-secondary px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                          title="Copy image URL to clipboard"
                        >
                          {copiedMediaId === asset.id ? (
                            <>
                              <Check className="w-3 h-3 text-blue-900" />
                              <span className="text-blue-900">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          {isVideo && (
                            <button
                              type="button"
                              onClick={() => setPreviewVideoModalUrl(asset.url)}
                              className="p-2 text-slate-500 hover:text-red-600 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-red-600"
                              title="Play video clip"
                              aria-label={`Play video ${asset.filename}`}
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingAltAsset(asset)}
                            className="p-2 text-slate-500 hover:text-blue-900 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-900"
                            title="Edit Alt Text"
                            aria-label={`Edit alternative text for ${asset.filename}`}
                          >
                            <Sliders className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMediaClick(asset)}
                            className="p-2 text-slate-400 hover:text-red-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-red-600"
                            title="Delete asset"
                            aria-label={`Delete media asset ${asset.filename}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredMedia.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                No media assets found matching the selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SECTION CONFIGURATION WITH LIVE PREVIEW
      ========================================================================= */}
      {editingSection && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-5xl bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                  {editingSection.type}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Configure Storefront Content Block</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                aria-label="Close configuration modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Controls */}
              <form onSubmit={handleSaveSection} className="lg:col-span-7 space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Section Display Title</label>
                  <input
                    type="text"
                    required
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subtitle / Supporting Description</label>
                  <input
                    type="text"
                    value={sectionSubtitle}
                    onChange={(e) => setSectionSubtitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                {/* Specific Config Fields based on section type */}
                {editingSection.type === 'hero' && (
                  <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="font-bold text-blue-900 text-xs">Hero Carousel Specifics:</div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">Trust Badge Pill Text</label>
                      <input
                        type="text"
                        value={sectionConfig.badge || ''}
                        onChange={(e) => setSectionConfig({ ...sectionConfig, badge: e.target.value })}
                        placeholder="e.g. Certified Live Arrival Guarantee Across India"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Primary CTA Button</label>
                        <input
                          type="text"
                          value={sectionConfig.ctaPrimary || ''}
                          onChange={(e) => setSectionConfig({ ...sectionConfig, ctaPrimary: e.target.value })}
                          placeholder="e.g. Shop Pure Strains"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Primary CTA Link</label>
                        <input
                          type="text"
                          value={sectionConfig.ctaPrimaryLink || ''}
                          onChange={(e) => setSectionConfig({ ...sectionConfig, ctaPrimaryLink: e.target.value })}
                          placeholder="e.g. /shop?category=guppies"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Secondary CTA Button</label>
                        <input
                          type="text"
                          value={sectionConfig.ctaSecondary || ''}
                          onChange={(e) => setSectionConfig({ ...sectionConfig, ctaSecondary: e.target.value })}
                          placeholder="e.g. Acclimation Guide"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Secondary CTA Link</label>
                        <input
                          type="text"
                          value={sectionConfig.ctaSecondaryLink || ''}
                          onChange={(e) => setSectionConfig({ ...sectionConfig, ctaSecondaryLink: e.target.value })}
                          placeholder="e.g. /page/shipping-acclimation"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-600 text-[11px]">Background Image URL</label>
                        <button
                          type="button"
                          onClick={() => handleOpenMediaPicker('section-bg-image', 'image')}
                          className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Choose / Upload Image</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={sectionConfig.backgroundImage || ''}
                        onChange={(e) => setSectionConfig({ ...sectionConfig, backgroundImage: e.target.value })}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-600 text-[11px]">Background Showcase Video URL (Optional MP4 / WebM)</label>
                        <button
                          type="button"
                          onClick={() => handleOpenMediaPicker('section-bg-video', 'video')}
                          className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Choose / Upload Video</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={sectionConfig.backgroundVideo || ''}
                        onChange={(e) => setSectionConfig({ ...sectionConfig, backgroundVideo: e.target.value })}
                        placeholder="https://.../ambient-planted-tank.mp4"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}

                {editingSection.type === 'breeder_story' && (
                  <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="font-bold text-blue-900 text-xs">Breeder Profile Specifics:</div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">Quote</label>
                      <input
                        type="text"
                        value={sectionConfig.quote || ''}
                        onChange={(e) => setSectionConfig({ ...sectionConfig, quote: e.target.value })}
                        placeholder="e.g. Every guppy pair is conditioned in mineral-balanced water."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Breeder Name</label>
                        <input
                          type="text"
                          value={sectionConfig.breederName || ''}
                          onChange={(e) => setSectionConfig({ ...sectionConfig, breederName: e.target.value })}
                          placeholder="e.g. Anand R."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 text-[11px] mb-1">Experience Years</label>
                        <input
                          type="text"
                          value={sectionConfig.experienceYears || ''}
                          onChange={(e) => setSectionConfig({ ...sectionConfig, experienceYears: e.target.value })}
                          placeholder="e.g. 9+ Years"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">Breeder WhatsApp Number</label>
                      <input
                        type="text"
                        value={sectionConfig.whatsapp || ''}
                        onChange={(e) => setSectionConfig({ ...sectionConfig, whatsapp: e.target.value })}
                        placeholder="+91 98450 12345"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}

                {editingSection.type === 'flash_deal' && (
                  <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="font-bold text-blue-900 text-xs">Flash Deal Specifics:</div>
                    <div>
                      <label className="block text-slate-600 text-[11px] mb-1">Banner Pill Text</label>
                      <input
                        type="text"
                        value={sectionConfig.bannerText || ''}
                        onChange={(e) => setSectionConfig({ ...sectionConfig, bannerText: e.target.value })}
                        placeholder="e.g. Limited Stock - 1 Piece Each"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}

                {editingSection.type === 'categories' && (
                  <div className="space-y-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div>
                        <div className="font-bold text-blue-900 text-xs">Shop By Category Settings</div>
                        <div className="text-[11px] text-slate-500">Configure link destination and individual category thumbnails.</div>
                      </div>
                      <Link
                        to="/admin/categories"
                        className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs"
                      >
                        <span>Full Category Tree</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold text-[11px] mb-1">"View All" Destination Link</label>
                      <input
                        type="text"
                        value={sectionConfig.viewAllLink || ''}
                        onChange={(e) => setSectionConfig({ ...sectionConfig, viewAllLink: e.target.value })}
                        placeholder="/shop"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                      />
                    </div>

                    {/* Category Cards & Thumbnail Image Management */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                          Category Cards & Image Customization ({cmsCategories.length})
                        </label>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                          Auto-syncs to Database
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                        {cmsCategories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`p-3 bg-white rounded-xl border transition-all ${
                              cat.is_active ? 'border-slate-200 shadow-2xs' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group">
                                  <img
                                    src={cat.image_url || '/product_image/afr-flower-dorsal-400.jpeg'}
                                    alt={cat.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/product_image/afr-flower-dorsal-400.jpeg';
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 text-xs truncate">{cat.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono truncate">
                                    Slug: {cat.slug}
                                  </div>
                                </div>
                              </div>

                              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  checked={cat.is_active}
                                  onChange={() => handleToggleCategoryActive(cat.id)}
                                  className="accent-blue-900 w-3.5 h-3.5 rounded"
                                />
                                <span className={`text-[10px] font-bold ${cat.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                                  {cat.is_active ? 'Active' : 'Hidden'}
                                </span>
                              </label>
                            </div>

                            {/* Image Controls */}
                            <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={cat.image_url || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCmsCategories((prev) =>
                                      prev.map((c) => (c.id === cat.id ? { ...c, image_url: val } : c))
                                    );
                                  }}
                                  onBlur={(e) => handleUpdateCategoryImage(cat.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleUpdateCategoryImage(cat.id, (e.target as HTMLInputElement).value);
                                    }
                                  }}
                                  placeholder="Image URL or /product_image/..."
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCategoryImage(cat.id, cat.image_url || '')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200"
                                  title="Save this category image URL"
                                >
                                  Save
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCategoryMediaTargetId(cat.id);
                                    handleOpenMediaPicker('category-image', 'image');
                                  }}
                                  className="flex-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 border border-slate-200"
                                >
                                  <ImageIcon className="w-3 h-3 text-slate-500" />
                                  <span>Choose from Media</span>
                                </button>

                                <label className="flex-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-semibold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer">
                                  <Upload className="w-3 h-3" />
                                  <span>Upload from PC</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleCategoryFileUpload(cat.id, e)}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Save Section Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="btn-secondary px-4 py-2.5 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* Live Preview Panel */}
              <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                      Live Block Preview
                    </span>
                    <span className="text-[10px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200">
                      Synchronized
                    </span>
                  </div>

                  {/* Simulated Card Preview */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
                    {sectionConfig.badge && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                        {sectionConfig.badge}
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {sectionTitle || 'Section Title'}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {sectionSubtitle || 'Supporting description will be displayed here for storefront visitors.'}
                    </p>

                    {editingSection.type === 'hero' && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="btn-primary px-3 py-1 rounded-lg text-[10px] font-bold">
                          {sectionConfig.ctaPrimary || 'Shop Now'}
                        </span>
                        {sectionConfig.ctaSecondary && (
                          <span className="btn-secondary px-3 py-1 rounded-lg text-[10px] font-bold">
                            {sectionConfig.ctaSecondary}
                          </span>
                        )}
                      </div>
                    )}

                    {editingSection.type === 'breeder_story' && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        <strong>{sectionConfig.breederName || 'Breeder'}</strong> • {sectionConfig.experienceYears || 'Years Exp'}
                      </div>
                    )}

                    {editingSection.type === 'categories' && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Storefront Live Preview
                          </span>
                          <span className="text-[10px] text-blue-900 font-semibold">
                            {cmsCategories.filter(c => c.is_active).length} Visible
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {cmsCategories.filter(c => c.is_active).slice(0, 6).map((cat) => (
                            <div key={cat.id} className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-center">
                              <div className="aspect-square rounded-lg overflow-hidden bg-white mb-1 border border-slate-100">
                                <img
                                  src={cat.image_url || '/product_image/afr-flower-dorsal-400.jpeg'}
                                  alt={cat.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/product_image/afr-flower-dorsal-400.jpeg';
                                  }}
                                />
                              </div>
                              <div className="text-[10px] font-bold text-slate-800 line-clamp-1">{cat.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 text-[10px] text-slate-400 text-center">
                  Preview renders updates in real time as you adjust the fields on the left.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CUSTOM PAGE PREVIEW MODAL
      ========================================================================= */}
      {previewModalPage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                  Storefront Page Preview
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{previewModalPage.title}</h3>
                <span className="text-xs text-slate-400 font-mono">/page/{previewModalPage.slug}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalPage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 prose prose-slate max-w-none text-xs">
              <div 
                dangerouslySetInnerHTML={{ __html: previewModalPage.content_html }} 
                className="leading-relaxed space-y-3"
              />
            </div>

            <div className="flex justify-end pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewModalPage(null)}
                className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}



      {/* =========================================================================
          MODAL: EDIT ALT TEXT FOR MEDIA ASSET
      ========================================================================= */}
      {editingAltAsset && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="alt-text-modal-title"
        >
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 id="alt-text-modal-title" className="text-sm font-bold text-slate-900">Edit Asset Alt Text</h3>
              <button
                type="button"
                onClick={() => setEditingAltAsset(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close alt text dialog"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveAltText} className="space-y-3 text-xs">
              <div>
                <label htmlFor="asset-alt-input" className="block text-slate-700 font-bold mb-1">Alt Text (Screen Readers & SEO)</label>
                <input
                  id="asset-alt-input"
                  type="text"
                  required
                  value={editingAltAsset.alt_text}
                  onChange={(e) => setEditingAltAsset({ ...editingAltAsset, alt_text: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="btn-primary flex-1 min-h-[44px] py-2 text-xs font-bold rounded-xl"
                >
                  Save Alt Text
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAltAsset(null)}
                  className="btn-secondary min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CUSTOM PAGE DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteConfirmPageId}
        title="Delete Custom Page"
        message="Are you sure you want to permanently remove this custom page? Any storefront links or navigation menus pointing to this URL slug will return a 404 page."
        confirmLabel="Permanently Delete Page"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirmPageId && handleDeletePage(deleteConfirmPageId)}
        onCancel={() => setDeleteConfirmPageId(null)}
      />

      {/* CONFIRM RESET HOMEPAGE LAYOUT DIALOG */}
      <ConfirmDialog
        isOpen={isResetHomepageDialogOpen}
        title="Reset Homepage Block Layout"
        message="Reset homepage sections to the initial factory default layout? Any custom sequence or block titles will be restored."
        confirmLabel="Reset to Default Layout"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmResetHomepageSections}
        onCancel={() => setIsResetHomepageDialogOpen(false)}
      />

      {/* CONFIRM DELETE MEDIA ASSET DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteMediaTarget}
        title="Delete Media Library Asset"
        message={`Are you sure you want to permanently delete "${deleteMediaTarget?.filename}" from the Media Library?`}
        confirmLabel="Delete Asset"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteMediaAsset}
        onCancel={() => setDeleteMediaTarget(null)}
      />

      {/* REUSABLE UNIFIED MEDIA PICKER MODAL */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaPickerSelect}
        mediaType={mediaPickerType}
        title={
          mediaPickerTarget === 'section-bg-video'
            ? 'Select or Upload Homepage Background Video'
            : mediaPickerTarget === 'section-bg-image'
            ? 'Select or Upload Homepage Hero Banner Image'
            : mediaPickerTarget === 'page-insert-media'
            ? 'Select Media to Insert into Guidelines'
            : 'Upload Media Asset to Library'
        }
      />

      {/* VIDEO PREVIEW MODAL */}
      {previewVideoModalUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cms-video-preview-title"
        >
          <div className="bg-slate-900 rounded-2xl overflow-hidden max-w-3xl w-full border border-slate-700 shadow-2xl relative">
            <div className="p-3 bg-slate-800 flex justify-between items-center text-white text-sm font-semibold">
              <span id="cms-video-preview-title" className="flex items-center gap-2">
                <Play className="w-4 h-4 text-red-500 fill-current" />
                Storefront Media Video Player
              </span>
              <button
                type="button"
                onClick={() => setPreviewVideoModalUrl(null)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close video player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={previewVideoModalUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* SAFE DELETION WARNING MODAL */}
      {mediaUsageWarning && (
        <div 
          className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="usage-warning-title"
        >
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-red-200 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-2xl shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 id="usage-warning-title" className="text-base font-bold text-slate-900">
                  Asset is Currently in Active Use
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  The media asset <strong className="text-slate-900">"{mediaUsageWarning.asset.filename}"</strong> is currently published in <span className="font-bold text-red-600">{mediaUsageWarning.usage.count} storefront location(s)</span>. Deleting it will cause broken image/video links.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Active References:</span>
              {mediaUsageWarning.usage.references.map((ref, rIdx) => (
                <div key={rIdx} className="flex items-center justify-between text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                  <span className="font-medium truncate max-w-xs">{ref.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 shrink-0">
                    {ref.type}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMediaUsageWarning(null)}
                className="btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Keep Media Asset
              </button>
              <button
                type="button"
                onClick={confirmForceDeleteMediaAsset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Force Delete Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

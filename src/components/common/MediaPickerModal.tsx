import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Film, 
  Image as ImageIcon, 
  Search, 
  Check, 
  Loader2, 
  Play, 
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react';
import { MediaAsset } from '../../lib/types';
import { mockDb } from '../../lib/mockDatabase';
import { 
  uploadMediaFile, 
  validateMediaFile, 
  ALLOWED_IMAGE_TYPES, 
  ALLOWED_VIDEO_TYPES
} from '../../lib/mediaService';

export interface SelectedMedia {
  url: string;
  alt_text?: string;
  thumbnail_url?: string;
  mime_type?: string;
  duration?: number;
  width?: number;
  height?: number;
  file_size_bytes?: number;
}

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: SelectedMedia) => void;
  title?: string;
  mediaType?: 'all' | 'image' | 'video';
  category?: MediaAsset['category'];
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Media',
  mediaType = 'all',
  category = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'url'>('upload');
  
  // Library tab state
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>(mediaType);

  // Upload tab state
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadAltText, setUploadAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // URL tab state
  const [externalUrl, setExternalUrl] = useState('');
  const [externalThumbnail, setExternalThumbnail] = useState('');
  const [externalAltText, setExternalAltText] = useState('');
  const [externalIsVideo, setExternalIsVideo] = useState(mediaType === 'video');

  // Preview overlay for playing video inside library
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load library assets
  useEffect(() => {
    if (isOpen) {
      const assets = mockDb.getMediaAssets();
      setLibraryAssets(assets);
      setSelectedAssetId(null);
      setUploadFile(null);
      setUploadPreviewUrl(null);
      setUploadError(null);
      setUploadProgress(0);
      setIsUploading(false);
      setExternalUrl('');
      setTypeFilter(mediaType);
      setActiveTab('upload');
    }
  }, [isOpen, mediaType]);

  // Focus trap & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter library items
  const filteredAssets = libraryAssets.filter((asset) => {
    const isVideo = asset.mime_type.startsWith('video/') || asset.category === 'video';
    
    // Type filtering
    if (typeFilter === 'image' && isVideo) return false;
    if (typeFilter === 'video' && !isVideo) return false;

    // Category filtering
    if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = asset.filename.toLowerCase().includes(query);
      const matchAlt = asset.alt_text.toLowerCase().includes(query);
      if (!matchName && !matchAlt) return false;
    }

    return true;
  });

  // Handle file drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectedFile = (file: File) => {
    setUploadError(null);
    const validation = validateMediaFile(file);

    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format or size.');
      return;
    }

    if (mediaType === 'image' && validation.isVideo) {
      setUploadError('Only image files are allowed in this field.');
      return;
    }

    if (mediaType === 'video' && validation.isImage) {
      setUploadError('Only video files (MP4, WebM) are allowed in this field.');
      return;
    }

    setUploadFile(file);
    setUploadAltText(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));

    // Create preview
    const preview = URL.createObjectURL(file);
    setUploadPreviewUrl(preview);
  };

  const handleExecuteUpload = async () => {
    if (!uploadFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(10);

      const targetCategory = category || (uploadFile.type.startsWith('video/') ? 'video' : 'general');
      const newAsset = await uploadMediaFile(uploadFile, {
        category: targetCategory,
        altText: uploadAltText,
        onProgress: (pct) => setUploadProgress(pct),
      });

      // Update local asset list
      setLibraryAssets((prev) => [newAsset, ...prev]);

      onSelect({
        url: newAsset.url,
        alt_text: newAsset.alt_text,
        thumbnail_url: newAsset.thumbnail_url,
        mime_type: newAsset.mime_type,
        duration: newAsset.duration_seconds,
        width: newAsset.dimensions?.width,
        height: newAsset.dimensions?.height,
        file_size_bytes: newAsset.file_size_bytes,
      });

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectFromLibrary = () => {
    const asset = libraryAssets.find((a) => a.id === selectedAssetId);
    if (!asset) return;

    onSelect({
      url: asset.url,
      alt_text: asset.alt_text,
      thumbnail_url: asset.thumbnail_url,
      mime_type: asset.mime_type,
      duration: asset.duration_seconds,
      width: asset.dimensions?.width,
      height: asset.dimensions?.height,
      file_size_bytes: asset.file_size_bytes,
    });

    onClose();
  };

  const handleSelectExternalUrl = () => {
    if (!externalUrl.trim()) return;

    onSelect({
      url: externalUrl.trim(),
      alt_text: externalAltText.trim() || 'External Media',
      thumbnail_url: externalThumbnail.trim() || undefined,
      mime_type: externalIsVideo ? 'video/mp4' : 'image/jpeg',
    });

    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
      ref={dialogRef}
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 id="media-picker-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mediaType === 'video'
                ? 'Upload or choose high-definition swimming footage (MP4, WebM up to 100MB)'
                : mediaType === 'image'
                ? 'Upload or choose specimen photographs (JPG, PNG, WebP up to 10MB)'
                : 'Upload or choose photos and video clips for your store'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media picker"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload New File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'library'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Media Library ({libraryAssets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'url'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            External URL
          </button>
        </div>

        {/* Body Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {!uploadFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                    dragActive
                      ? 'border-blue-600 bg-blue-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={
                      mediaType === 'image'
                        ? ALLOWED_IMAGE_TYPES.join(',')
                        : mediaType === 'video'
                        ? ALLOWED_VIDEO_TYPES.join(',')
                        : [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')
                    }
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelectedFile(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
                    {mediaType === 'video' ? (
                      <Film className="w-8 h-8" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-slate-800 mb-1">
                    Drag and drop your file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 underline font-medium"
                    >
                      browse files
                    </button>
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                    {mediaType === 'video'
                      ? 'Supported: MP4, WebM up to 100MB. Client-side video poster is automatically extracted.'
                      : mediaType === 'image'
                      ? 'Supported: JPG, PNG, WebP, AVIF, SVG up to 10MB.'
                      : 'Photos up to 10MB (JPG, PNG, WebP). Videos up to 100MB (MP4, WebM).'}
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    {/* Media Preview Box */}
                    <div className="w-full sm:w-56 h-36 bg-black rounded-xl overflow-hidden flex items-center justify-center relative flex-shrink-0">
                      {uploadFile.type.startsWith('video/') ? (
                        <video
                          src={uploadPreviewUrl || ''}
                          className="w-full h-full object-cover"
                          controls
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={uploadPreviewUrl || ''}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded-md font-semibold tracking-wider uppercase backdrop-blur-xs">
                        {uploadFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'}
                      </span>
                    </div>

                    {/* File Details & Alt Text */}
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm truncate max-w-xs sm:max-w-md">
                            {uploadFile.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatFileSize(uploadFile.size)} · {uploadFile.type}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadFile(null);
                            setUploadPreviewUrl(null);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Change file
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Alt Text / Description (Recommended for WCAG AA)
                        </label>
                        <input
                          type="text"
                          value={uploadAltText}
                          onChange={(e) => setUploadAltText(e.target.value)}
                          placeholder="e.g. Electric Blue Pure Strain Guppy pair swimming front profile"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      {/* Progress Bar */}
                      {isUploading && (
                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between text-xs text-slate-600 font-medium">
                            <span>Processing & Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEDIA LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search media by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Type Filter */}
                  {mediaType === 'all' && (
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setTypeFilter('all')}
                        className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                          typeFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeFilter('image')}
                        className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                          typeFilter === 'image' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        Images
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeFilter('video')}
                        className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                          typeFilter === 'video' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        Videos
                      </button>
                    </div>
                  )}

                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="all">All Categories</option>
                    <option value="specimen">Specimens</option>
                    <option value="banner">Hero Banners</option>
                    <option value="video">Videos</option>
                    <option value="breeder">Breeder</option>
                    <option value="blog">Blog Articles</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              {/* Assets Grid */}
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No media found matching criteria</p>
                  <p className="text-xs text-slate-500 mt-1">Upload files or adjust your search filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[46vh] overflow-y-auto p-1">
                  {filteredAssets.map((asset) => {
                    const isSelected = selectedAssetId === asset.id;
                    const isVideo = asset.mime_type.startsWith('video/') || asset.category === 'video';
                    const displayThumb = asset.thumbnail_url || asset.url;

                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer bg-slate-900 aspect-video transition-all ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img
                          src={displayThumb}
                          alt={asset.alt_text}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                          {isVideo ? (
                            <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-xs">
                              <Play className="w-2.5 h-2.5 fill-current" />
                              {asset.duration_seconds ? `${asset.duration_seconds}s` : 'VIDEO'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded backdrop-blur-xs">
                              IMG
                            </span>
                          )}
                        </div>

                        {/* Selected Checkmark */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        {/* Video Preview Play Button */}
                        {isVideo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlayingVideoUrl(asset.url);
                            }}
                            aria-label={`Preview video ${asset.filename}`}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-0.5 fill-current" />
                            </span>
                          </button>
                        )}

                        {/* Bottom Info Bar */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 pt-4 text-white text-[11px] truncate">
                          {asset.filename}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXTERNAL URL */}
          {activeTab === 'url' && (
            <div className="max-w-lg mx-auto space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Media Source URL *
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/fish-video.mp4 or photo.jpg"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-xs font-semibold text-slate-700">Type:</label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="externalType"
                    checked={!externalIsVideo}
                    onChange={() => setExternalIsVideo(false)}
                    className="text-blue-600 focus:ring-blue-600"
                  />
                  Image
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="externalType"
                    checked={externalIsVideo}
                    onChange={() => setExternalIsVideo(true)}
                    className="text-blue-600 focus:ring-blue-600"
                  />
                  Video (MP4 / WebM)
                </label>
              </div>

              {externalIsVideo && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Poster / Thumbnail Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/poster.jpg"
                    value={externalThumbnail}
                    onChange={(e) => setExternalThumbnail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alt Text / Label
                </label>
                <input
                  type="text"
                  placeholder="Descriptive label for screen readers"
                  value={externalAltText}
                  onChange={(e) => setExternalAltText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Video Preview Modal Overlay */}
        {playingVideoUrl && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl overflow-hidden max-w-2xl w-full border border-slate-700 shadow-2xl relative">
              <div className="p-3 bg-slate-800 flex justify-between items-center text-white text-sm font-semibold">
                <span>Video Preview</span>
                <button
                  type="button"
                  onClick={() => setPlayingVideoUrl(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video bg-black">
                <video
                  src={playingVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
          >
            Cancel
          </button>

          {activeTab === 'upload' && (
            <button
              type="button"
              disabled={!uploadFile || isUploading}
              onClick={handleExecuteUpload}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Insert
                </>
              )}
            </button>
          )}

          {activeTab === 'library' && (
            <button
              type="button"
              disabled={!selectedAssetId}
              onClick={handleSelectFromLibrary}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Check className="w-4 h-4" />
              Insert Selected Media
            </button>
          )}

          {activeTab === 'url' && (
            <button
              type="button"
              disabled={!externalUrl.trim()}
              onClick={handleSelectExternalUrl}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Check className="w-4 h-4" />
              Use This URL
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

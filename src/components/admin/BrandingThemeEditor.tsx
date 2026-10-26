import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, Upload, RotateCcw, Save, X, Eye, 
  Check, AlertTriangle, Image as ImageIcon, Sparkles, 
  Layers, CheckCircle2, ShieldCheck, Globe, Loader2
} from 'lucide-react';
import { useBranding } from '../../contexts/BrandingContext';
import { useToast } from '../../contexts/ToastContext';
import { BrandingSettings } from '../../lib/types';
import { 
  isValidHex, 
  normalizeHex, 
  calculateContrastRatio, 
  getAccessibleTextColor, 
  getWcagRating,
  PRIMARY_PRESETS,
  SECONDARY_PRESETS
} from '../../lib/brandingUtils';
import { uploadMediaFile, validateMediaFile } from '../../lib/mediaService';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MediaPickerModal, SelectedMedia } from '../common/MediaPickerModal';

export const BrandingThemeEditor: React.FC = () => {
  const { branding, updateBranding, resetBranding, previewBranding, isSaving } = useBranding();
  const { showToast } = useToast();

  // Form state initialized with active saved branding
  const [form, setForm] = useState<BrandingSettings>({ ...branding });
  const [hasChanges, setHasChanges] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Direct device upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [directUploadTarget, setDirectUploadTarget] = useState<'logo' | 'mobile_logo' | 'footer_logo' | 'favicon'>('logo');
  const [isUploadingDirect, setIsUploadingDirect] = useState(false);

  // Media Picker modal state
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'mobile_logo' | 'footer_logo' | 'favicon' | null>(null);

  // Sync form when saved branding changes externally
  useEffect(() => {
    setForm({ ...branding });
    setHasChanges(false);
  }, [branding]);

  // Update preview whenever form changes
  const handleColorChange = (key: keyof BrandingSettings, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      setHasChanges(true);
      if (isValidHex(value)) {
        previewBranding(updated);
      }
      return updated;
    });
  };

  const handleTextChange = (key: keyof BrandingSettings, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'logo_url') {
        if (!prev.mobile_logo_url || prev.mobile_logo_url === '/logo-fish.svg' || prev.mobile_logo_url === prev.logo_url) {
          updated.mobile_logo_url = value;
        }
        if (!prev.footer_logo_url || prev.footer_logo_url === '/logo-fish.svg' || prev.footer_logo_url === prev.logo_url) {
          updated.footer_logo_url = value;
        }
      }
      setHasChanges(true);
      // Immediately reflect logo, favicon, and brand name changes across active preview
      previewBranding(updated);
      return updated;
    });
  };

  // Direct File Upload from user device (Desktop / Mobile)
  const triggerDirectUpload = (target: 'logo' | 'mobile_logo' | 'footer_logo' | 'favicon') => {
    setDirectUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleDirectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting the exact same file fires onChange
    e.target.value = '';

    const validation = validateMediaFile(file);
    if (!validation.valid || !validation.isImage) {
      showToast(validation.error || 'Please select a valid image (PNG, JPG, SVG, WebP, AVIF).', 'error');
      return;
    }

    try {
      setIsUploadingDirect(true);
      showToast('Uploading brand asset...', 'info');

      const asset = await uploadMediaFile(file, {
        category: 'ui',
        altText: `${form.site_name || 'Ra Guppy'} ${directUploadTarget.replace('_', ' ')}`,
      });

      const targetKeyMap: Record<string, keyof BrandingSettings> = {
        logo: 'logo_url',
        mobile_logo: 'mobile_logo_url',
        footer_logo: 'footer_logo_url',
        favicon: 'favicon_url',
      };
      const key = targetKeyMap[directUploadTarget];

      setForm((prev) => {
        const updated = { ...prev, [key]: asset.url };
        if (directUploadTarget === 'logo') {
          if (!prev.mobile_logo_url || prev.mobile_logo_url === '/logo-fish.svg' || prev.mobile_logo_url === prev.logo_url) {
            updated.mobile_logo_url = asset.url;
          }
          if (!prev.footer_logo_url || prev.footer_logo_url === '/logo-fish.svg' || prev.footer_logo_url === prev.logo_url) {
            updated.footer_logo_url = asset.url;
          }
        }
        setHasChanges(true);
        previewBranding(updated);
        return updated;
      });

      showToast(`Uploaded new ${directUploadTarget.replace('_', ' ')} successfully! Click "Save Changes" to publish.`, 'success');
    } catch (err) {
      console.error('Failed to upload branding image directly:', err);
      showToast('Failed to upload image file. Please try again or choose from media library.', 'error');
    } finally {
      setIsUploadingDirect(false);
    }
  };

  // Open Media Picker for specific logo field
  const handleOpenMediaPicker = (target: 'logo' | 'mobile_logo' | 'footer_logo' | 'favicon') => {
    setMediaPickerTarget(target);
  };

  const handleMediaSelected = (media: SelectedMedia) => {
    if (!mediaPickerTarget) return;

    const targetKeyMap: Record<string, keyof BrandingSettings> = {
      logo: 'logo_url',
      mobile_logo: 'mobile_logo_url',
      footer_logo: 'footer_logo_url',
      favicon: 'favicon_url',
    };

    const key = targetKeyMap[mediaPickerTarget];
    setForm((prev) => {
      const updated = { ...prev, [key]: media.url };
      if (mediaPickerTarget === 'logo') {
        if (!prev.mobile_logo_url || prev.mobile_logo_url === '/logo-fish.svg' || prev.mobile_logo_url === prev.logo_url) {
          updated.mobile_logo_url = media.url;
        }
        if (!prev.footer_logo_url || prev.footer_logo_url === '/logo-fish.svg' || prev.footer_logo_url === prev.logo_url) {
          updated.footer_logo_url = media.url;
        }
      }
      setHasChanges(true);
      previewBranding(updated);
      return updated;
    });

    setMediaPickerTarget(null);
    showToast(`Asset selected for ${mediaPickerTarget.replace('_', ' ')}!`, 'info');
  };

  // Contrast Calculations for Live Feedback
  const primaryHex = normalizeHex(form.primary_color, '#1e3a8a');
  const secondaryHex = normalizeHex(form.secondary_color, '#dc2626');
  const bgHex = normalizeHex(form.background_color || '#f8fafc', '#f8fafc');

  const primaryOnBgRatio = calculateContrastRatio(primaryHex, bgHex);
  const primaryOnBgRating = getWcagRating(primaryOnBgRatio);

  const primaryBtnTextHex = getAccessibleTextColor(primaryHex);
  const primaryBtnRatio = calculateContrastRatio(primaryHex, primaryBtnTextHex);
  const primaryBtnRating = getWcagRating(primaryBtnRatio);

  const secondaryBtnTextHex = getAccessibleTextColor(secondaryHex);
  const secondaryBtnRatio = calculateContrastRatio(secondaryHex, secondaryBtnTextHex);
  const secondaryBtnRating = getWcagRating(secondaryBtnRatio);

  // Save changes to persistent storage
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidHex(form.primary_color)) {
      showToast('Please enter a valid hexadecimal code for Primary Color (e.g. #1e3a8a)', 'error');
      return;
    }
    if (!isValidHex(form.secondary_color)) {
      showToast('Please enter a valid hexadecimal code for Secondary Color (e.g. #dc2626)', 'error');
      return;
    }

    const payload: Partial<BrandingSettings> = {
      ...form,
      mobile_logo_url: (!form.mobile_logo_url || form.mobile_logo_url === '/logo-fish.svg') ? form.logo_url : form.mobile_logo_url,
      footer_logo_url: (!form.footer_logo_url || form.footer_logo_url === '/logo-fish.svg') ? form.logo_url : form.footer_logo_url,
      primary_color: normalizeHex(form.primary_color),
      secondary_color: normalizeHex(form.secondary_color),
      accent_color: form.accent_color ? normalizeHex(form.accent_color) : undefined,
      background_color: form.background_color ? normalizeHex(form.background_color) : undefined,
      text_color: form.text_color ? normalizeHex(form.text_color) : undefined,
      primary_text_color: primaryBtnTextHex,
      secondary_text_color: secondaryBtnTextHex,
    };

    const success = await updateBranding(payload);
    if (success) {
      setHasChanges(false);
      showToast('Global branding and theme colors updated successfully across the entire website!', 'success');
    } else {
      showToast('Failed to save branding settings. Please try again.', 'error');
    }
  };

  // Cancel unsaved changes and revert live preview
  const handleCancel = () => {
    setForm({ ...branding });
    setHasChanges(false);
    previewBranding(null);
    showToast('Unsaved changes reverted.', 'info');
  };

  // Reset to default branding
  const handleConfirmReset = async () => {
    setIsResetDialogOpen(false);
    const success = await resetBranding();
    if (success) {
      setHasChanges(false);
      showToast('Branding and theme colors reset to factory defaults!', 'success');
    } else {
      showToast('Failed to reset branding settings.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono">
            Identity & Styling
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Global Branding & Dynamic Theme
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your store logo, favicon, and primary/secondary colors. Changes apply immediately to every page, header, and button.
          </p>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Live Preview Active</span>
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8 text-xs text-slate-700">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. BRAND ASSETS & LOGOS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-900" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Store Logos & Favicon
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">SVG, PNG, WebP supported</span>
              </div>

              {/* Hidden Direct File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDirectFileChange}
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/avif"
                className="hidden"
                aria-hidden="true"
              />

              {/* Primary Website Logo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="brand-logo-url" className="font-bold text-slate-800">
                    Primary Website Logo *
                  </label>
                  <span className="text-[11px] text-slate-400">Header, Sidebar & Invoices</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl border-2 border-slate-200 bg-white p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    <img
                      src={form.logo_url || '/logo.jpeg'}
                      alt="Primary logo preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.jpeg';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      id="brand-logo-url"
                      type="text"
                      value={form.logo_url}
                      onChange={(e) => handleTextChange('logo_url', e.target.value)}
                      placeholder="/logo.jpeg or https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-900 focus:bg-white"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => triggerDirectUpload('logo')}
                        disabled={isUploadingDirect}
                        className="btn-primary px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                      >
                        {isUploadingDirect ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload from Device</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenMediaPicker('logo')}
                        className="btn-secondary px-3 py-1.5 text-xs font-semibold"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-900" />
                        <span>Media Library</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Logos Grid (Mobile, Footer, Favicon) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Mobile Header Logo */}
                <div className="space-y-1.5 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <label htmlFor="brand-mobile-logo" className="font-semibold text-slate-800 block text-[11px]">
                    Mobile Header Logo (Optional)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="brand-mobile-logo"
                      type="text"
                      value={form.mobile_logo_url || ''}
                      onChange={(e) => handleTextChange('mobile_logo_url', e.target.value)}
                      placeholder="Uses primary if empty"
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none focus:border-blue-900"
                    />
                    <button
                      type="button"
                      onClick={() => triggerDirectUpload('mobile_logo')}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 shrink-0"
                      title="Upload mobile logo directly"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-900" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenMediaPicker('mobile_logo')}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 shrink-0"
                      title="Choose mobile logo from media library"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-900" />
                    </button>
                  </div>
                </div>

                {/* Footer Logo */}
                <div className="space-y-1.5 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <label htmlFor="brand-footer-logo" className="font-semibold text-slate-800 block text-[11px]">
                    Footer Logo (Optional)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="brand-footer-logo"
                      type="text"
                      value={form.footer_logo_url || ''}
                      onChange={(e) => handleTextChange('footer_logo_url', e.target.value)}
                      placeholder="Uses primary if empty"
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none focus:border-blue-900"
                    />
                    <button
                      type="button"
                      onClick={() => triggerDirectUpload('footer_logo')}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 shrink-0"
                      title="Upload footer logo directly"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-900" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenMediaPicker('footer_logo')}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 shrink-0"
                      title="Choose footer logo from media library"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-900" />
                    </button>
                  </div>
                </div>

                {/* Favicon */}
                <div className="space-y-1.5 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <label htmlFor="brand-favicon" className="font-semibold text-slate-800 block text-[11px]">
                    Browser Favicon *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={form.favicon_url || '/favicon.svg'}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.svg'; }}
                      />
                    </div>
                    <input
                      id="brand-favicon"
                      type="text"
                      value={form.favicon_url}
                      onChange={(e) => handleTextChange('favicon_url', e.target.value)}
                      placeholder="/favicon.svg"
                      className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none focus:border-blue-900"
                    />
                    <button
                      type="button"
                      onClick={() => triggerDirectUpload('favicon')}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 shrink-0"
                      title="Upload favicon directly"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-900" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenMediaPicker('favicon')}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 shrink-0"
                      title="Choose favicon from media library"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-900" />
                    </button>
                  </div>
                </div>

                {/* Brand Name */}
                <div className="space-y-1.5 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <label htmlFor="brand-site-name" className="font-semibold text-slate-800 block text-[11px]">
                    Brand Name *
                  </label>
                  <input
                    id="brand-site-name"
                    type="text"
                    value={form.site_name}
                    onChange={(e) => handleTextChange('site_name', e.target.value)}
                    placeholder="Ra Guppy"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none focus:border-blue-900"
                  />
                </div>
              </div>
            </div>

            {/* 2. DYNAMIC COLOR PALETTE */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-blue-900" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Dynamic Brand Colors & Design Tokens
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">CSS Tokens with WCAG Validation</span>
              </div>

              {/* Primary Color Control */}
              <div className="space-y-3 p-4 rounded-2xl bg-blue-50/30 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="primary-hex-input" className="font-bold text-slate-900 text-xs">
                      Primary Brand Color *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Applied to main CTA buttons, header accents, active tabs, and focus rings.
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${primaryBtnRating.badgeClass}`}>
                    Button: {primaryBtnRatio}:1 ({primaryBtnRating.passAA ? 'Pass' : 'Warn'})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      aria-label="Pick primary brand color"
                      value={isValidHex(form.primary_color) ? normalizeHex(form.primary_color) : '#1e3a8a'}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      className="w-12 h-12 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shadow-2xs"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      id="primary-hex-input"
                      type="text"
                      maxLength={7}
                      value={form.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      placeholder="#1e3a8a"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-900 outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                {/* Primary Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
                  {PRIMARY_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleColorChange('primary_color', preset.hex)}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-colors ${
                        form.primary_color.toLowerCase() === preset.hex.toLowerCase()
                          ? 'bg-blue-100 text-blue-950 border-blue-400 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.hex }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Color Control */}
              <div className="space-y-3 p-4 rounded-2xl bg-red-50/30 border border-red-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="secondary-hex-input" className="font-bold text-slate-900 text-xs">
                      Secondary Brand Color *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Applied to secondary action buttons ("Adopt Now"), discount pills, and sale badges.
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${secondaryBtnRating.badgeClass}`}>
                    Button: {secondaryBtnRatio}:1 ({secondaryBtnRating.passAA ? 'Pass' : 'Warn'})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      aria-label="Pick secondary brand color"
                      value={isValidHex(form.secondary_color) ? normalizeHex(form.secondary_color) : '#dc2626'}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      className="w-12 h-12 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white shadow-2xs"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      id="secondary-hex-input"
                      type="text"
                      maxLength={7}
                      value={form.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      placeholder="#dc2626"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-mono text-xs text-slate-900 outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                {/* Secondary Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
                  {SECONDARY_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleColorChange('secondary_color', preset.hex)}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-colors ${
                        form.secondary_color.toLowerCase() === preset.hex.toLowerCase()
                          ? 'bg-red-100 text-red-950 border-red-400 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.hex }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Supporting Colors: Accent, Background, Text */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label htmlFor="accent-hex" className="block text-slate-700 mb-1 font-semibold text-[11px]">
                    Accent Color (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Pick accent color"
                      value={isValidHex(form.accent_color || '#0284c7') ? normalizeHex(form.accent_color || '#0284c7') : '#0284c7'}
                      onChange={(e) => handleColorChange('accent_color', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      id="accent-hex"
                      type="text"
                      maxLength={7}
                      value={form.accent_color || ''}
                      onChange={(e) => handleColorChange('accent_color', e.target.value)}
                      placeholder="#0284c7"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bg-hex" className="block text-slate-700 mb-1 font-semibold text-[11px]">
                    Site Background (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Pick background color"
                      value={isValidHex(form.background_color || '#f8fafc') ? normalizeHex(form.background_color || '#f8fafc') : '#f8fafc'}
                      onChange={(e) => handleColorChange('background_color', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      id="bg-hex"
                      type="text"
                      maxLength={7}
                      value={form.background_color || ''}
                      onChange={(e) => handleColorChange('background_color', e.target.value)}
                      placeholder="#f8fafc"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="text-hex" className="block text-slate-700 mb-1 font-semibold text-[11px]">
                    Base Text Color (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label="Pick text color"
                      value={isValidHex(form.text_color || '#0f172a') ? normalizeHex(form.text_color || '#0f172a') : '#0f172a'}
                      onChange={(e) => handleColorChange('text_color', e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      id="text-hex"
                      type="text"
                      maxLength={7}
                      value={form.text_color || ''}
                      onChange={(e) => handleColorChange('text_color', e.target.value)}
                      placeholder="#0f172a"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Interactive Preview & Contrast Audit (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Interactive Preview Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-900" />
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                    Live UI Component Preview
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
              </div>

              {/* 1. Header & Navigation Preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Desktop Header Simulation</span>
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      <img
                        src={form.logo_url || '/logo.jpeg'}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpeg'; }}
                      />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs font-display">
                        {form.site_name || 'Ra Guppy'}
                      </div>
                      <div className="text-[9px] text-slate-400">{form.tagline || 'Pure Strain Guppies & Aquatic Life'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className="text-xs font-bold border-b-2 pb-0.5"
                      style={{ color: primaryHex, borderColor: primaryHex }}
                    >
                      Shop
                    </span>
                    <span className="text-xs text-slate-500">Care</span>
                    <span 
                      className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: primaryHex, color: primaryBtnTextHex }}
                    >
                      2
                    </span>
                  </div>
                </div>
              </div>

              {/* 1b. Admin Sidebar & Header Simulation */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Admin Sidebar & Header Preview</span>
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                      <img
                        src={form.logo_url || '/logo.jpeg'}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpeg'; }}
                      />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-xs tracking-wider uppercase font-display">
                        {(form.site_name || 'RA GUPPY').split(' ')[0]} <span className="text-red-500">ADMIN</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">Single Source of Truth</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 font-semibold px-2 py-0.5 rounded-lg border border-blue-700/50 font-mono">
                    Synchronized
                  </span>
                </div>
              </div>

              {/* 2. Interactive Button Pair Preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Storefront Buttons</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2.5">
                    {/* Primary Button */}
                    <button
                      type="button"
                      className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: primaryHex,
                        color: primaryBtnTextHex,
                      }}
                    >
                      <span>Add to Tank</span>
                    </button>

                    {/* Secondary Button */}
                    <button
                      type="button"
                      className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: secondaryHex,
                        color: secondaryBtnTextHex,
                      }}
                    >
                      <span>Adopt Now</span>
                    </button>
                  </div>

                  {/* Badges & Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: primaryHex + '18',
                        color: primaryHex,
                        borderColor: primaryHex + '40',
                      }}
                    >
                      ★ Bestseller Specimen
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: secondaryHex + '18',
                        color: secondaryHex,
                      }}
                    >
                      🔥 15% OFF
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Browser Tab Simulation */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Browser Tab Simulation</span>
                <div className="bg-slate-200/70 p-2 rounded-xl flex items-center gap-2">
                  <div className="bg-white rounded-lg px-3 py-1.5 shadow-xs flex items-center gap-2 flex-1 max-w-[240px]">
                    <img
                      src={form.favicon_url || '/favicon.svg'}
                      alt=""
                      className="w-4 h-4 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.svg'; }}
                    />
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {form.site_name || 'Ra Guppy'} | Store
                    </span>
                    <X className="w-3 h-3 text-slate-400 ml-auto shrink-0" />
                  </div>
                </div>
              </div>

              {/* 4. WCAG Accessibility & Contrast Audit Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>WCAG 2.2 AA Contrast Audit</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Target: ≥ 4.5:1</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Primary Button Text ({primaryBtnTextHex}):</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${primaryBtnRating.badgeClass}`}>
                      {primaryBtnRatio}:1 ({primaryBtnRating.passAA ? 'Pass' : 'Low'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Secondary Button Text ({secondaryBtnTextHex}):</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${secondaryBtnRating.badgeClass}`}>
                      {secondaryBtnRatio}:1 ({secondaryBtnRating.passAA ? 'Pass' : 'Low'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Primary on Site Background:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${primaryOnBgRating.badgeClass}`}>
                      {primaryOnBgRatio}:1 ({primaryOnBgRating.passAA ? 'Pass' : 'Low'})
                    </span>
                  </div>
                </div>

                {(!primaryBtnRating.passAA || !secondaryBtnRating.passAA) && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Notice: Low contrast detected. Our engine automatically adjusts button text color to ensure accessibility, but you may want to choose a slightly darker or more saturated shade.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION TOOLBAR */}
        <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset to Factory Defaults</span>
          </button>

          <div className="flex items-center gap-2.5">
            {hasChanges && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                <span>Cancel Changes</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-900 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Branding Changes'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* CONFIRM RESET DIALOG */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="Reset Branding & Theme Colors to Defaults?"
        message="This will restore the factory default logo (/logo-fish.svg), favicon, and default color palette. Your product catalog and orders will not be affected."
        confirmLabel="Yes, Reset Branding"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />

      {/* MEDIA PICKER MODAL */}
      <MediaPickerModal
        isOpen={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={handleMediaSelected}
        mediaType="image"
        title={
          mediaPickerTarget === 'favicon' 
            ? 'Select or Upload Favicon (SVG / ICO / PNG)'
            : `Select or Upload ${mediaPickerTarget ? mediaPickerTarget.replace('_', ' ') : 'Logo'}`
        }
      />
    </div>
  );
};

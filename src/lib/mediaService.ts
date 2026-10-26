// RA GUPPY: SECURE MEDIA UPLOAD & STORAGE ENGINE
// Handles image & video validation, client-side thumbnail generation,
// metadata extraction, Supabase Storage integration, and local persistence.

import { supabase, isSupabaseConfigured } from './supabase';
import { mockDb } from './mockDatabase';
import { MediaAsset } from './types';

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/gif',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  isVideo: boolean;
  isImage: boolean;
  mimeType: string;
}

export function validateMediaFile(file: File): MediaValidationResult {
  const mimeType = file.type.toLowerCase();
  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Unsupported file format (${mimeType || 'unknown'}). Please upload JPG, PNG, WebP, AVIF, SVG, MP4, or WebM.`,
      isImage: false,
      isVideo: false,
      mimeType,
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Image file is too large (${sizeMb}MB). Maximum allowed image size is 10MB.`,
      isImage: true,
      isVideo: false,
      mimeType,
    };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Video file is too large (${sizeMb}MB). Maximum allowed video size is 100MB.`,
      isImage: false,
      isVideo: true,
      mimeType,
    };
  }

  return {
    valid: true,
    isImage,
    isVideo,
    mimeType,
  };
}

/**
 * Generates an automatic video poster thumbnail and measures duration/dimensions using HTML5 video & canvas
 */
export async function extractVideoMetadata(file: File): Promise<{
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        thumbnailUrl: '',
        duration: 0,
        width: 1280,
        height: 720,
      });
    }, 6000);

    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration || 0);
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      // Seek to 1 second or half duration to capture clean frame
      video.currentTime = Math.min(1.0, duration > 1 ? duration / 2 : 0.1);
    };

    video.onseeked = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(objectUrl);
          resolve({
            thumbnailUrl,
            duration: Math.round(video.duration || 0),
            width: video.videoWidth || 1280,
            height: video.videoHeight || 720,
          });
          return;
        }
      } catch (err) {
        console.warn('Could not extract canvas video frame:', err);
      }
      URL.revokeObjectURL(objectUrl);
      resolve({
        thumbnailUrl: '',
        duration: Math.round(video.duration || 0),
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
      });
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      resolve({
        thumbnailUrl: '',
        duration: 0,
        width: 1280,
        height: 720,
      });
    };
  });
}

/**
 * Measures dimensions of an uploaded image file
 */
export async function extractImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0 });
    };
  });
}

export interface UploadOptions {
  category?: MediaAsset['category'];
  altText?: string;
  onProgress?: (percent: number) => void;
}

/**
 * Primary Upload Method:
 * Uploads media file to Supabase Storage if configured, or persists in local storage engine.
 */
export async function uploadMediaFile(
  file: File,
  options: UploadOptions = {}
): Promise<MediaAsset> {
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const category = options.category || (validation.isVideo ? 'video' : 'general');
  const altText = options.altText?.trim() || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  options.onProgress?.(15);

  let durationSeconds: number | undefined;
  let dimensions: { width: number; height: number } | undefined;
  let thumbnailUrl: string | undefined;

  if (validation.isVideo) {
    options.onProgress?.(25);
    const meta = await extractVideoMetadata(file);
    durationSeconds = meta.duration;
    dimensions = { width: meta.width, height: meta.height };
    thumbnailUrl = meta.thumbnailUrl;
  } else {
    options.onProgress?.(25);
    dimensions = await extractImageDimensions(file);
  }

  options.onProgress?.(45);

  let fileUrl = '';

  // 1. Live Supabase Storage Integration
  if (isSupabaseConfigured && supabase) {
    try {
      const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
      const storagePath = `${category}/${Date.now()}-${sanitizedName}`;

      options.onProgress?.(60);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media-assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.warn('Supabase storage upload error, falling back to local engine:', uploadError.message);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('media-assets')
        .getPublicUrl(uploadData.path);

      fileUrl = publicUrlData.publicUrl;
      options.onProgress?.(85);
    } catch (supabaseErr) {
      console.warn('Falling back to local persistent engine:', supabaseErr);
      fileUrl = await readFileAsDataUrl(file);
    }
  } else {
    // 2. Local Persistent Storage Engine (Mock / Offline Mode)
    options.onProgress?.(70);
    fileUrl = await readFileAsDataUrl(file);
  }

  options.onProgress?.(95);

  const newAsset: MediaAsset = {
    id: 'med-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    filename: file.name,
    url: fileUrl,
    alt_text: altText,
    file_size_bytes: file.size,
    mime_type: file.type,
    category,
    thumbnail_url: thumbnailUrl,
    duration_seconds: durationSeconds,
    dimensions,
    created_at: new Date().toISOString(),
  };

  mockDb.saveMediaAsset(newAsset);
  options.onProgress?.(100);

  return newAsset;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file locally'));
    reader.readAsDataURL(file);
  });
}

export interface MediaUsageReference {
  type: 'Product' | 'CMS Section' | 'Policy Page' | 'Blog Article';
  id: string;
  title: string;
}

export interface MediaUsageCheckResult {
  isUsed: boolean;
  count: number;
  references: MediaUsageReference[];
}

/**
 * Checks if a media asset URL is currently referenced by any products, CMS sections, pages, or blogs.
 * Prevents accidental 404 broken images or missing videos across the storefront.
 */
export function checkMediaUsage(assetUrl: string): MediaUsageCheckResult {
  if (!assetUrl) return { isUsed: false, count: 0, references: [] };

  const references: MediaUsageReference[] = [];

  // 1. Check Products (images and videos)
  const products = mockDb.getProducts();
  for (const prod of products) {
    const hasImage = prod.images?.some((img) => img === assetUrl);
    const hasVideo = prod.videos?.some((vid) => vid.url === assetUrl || vid.thumbnail_url === assetUrl);
    if (hasImage || hasVideo) {
      references.push({
        type: 'Product',
        id: prod.id,
        title: prod.name,
      });
    }
  }

  // 2. Check Homepage CMS Sections
  const sections = mockDb.getHomepageSections();
  for (const sec of sections) {
    const cfg = sec.config || {};
    const matchesConfig = Object.values(cfg).some((val) => typeof val === 'string' && val.includes(assetUrl));
    if (matchesConfig) {
      references.push({
        type: 'CMS Section',
        id: sec.id,
        title: `Homepage: ${sec.title}`,
      });
    }
  }

  // 3. Check Policy & Care CMS Pages
  const pages = mockDb.getCMSPages();
  for (const pg of pages) {
    if (pg.content_html?.includes(assetUrl)) {
      references.push({
        type: 'Policy Page',
        id: pg.id,
        title: pg.title,
      });
    }
  }

  // 4. Check Blog Articles
  const blogs = mockDb.getBlogPosts();
  for (const post of blogs) {
    const matchesFeatured = post.featured_image === assetUrl;
    const matchesContent = post.content_html?.includes(assetUrl);
    if (matchesFeatured || matchesContent) {
      references.push({
        type: 'Blog Article',
        id: post.id,
        title: post.title,
      });
    }
  }

  return {
    isUsed: references.length > 0,
    count: references.length,
    references,
  };
}

/**
 * Safe Deletion Handler:
 * Rejects deletion if asset is in active use unless force=true.
 */
export async function safeDeleteMediaAsset(
  assetId: string,
  force: boolean = false
): Promise<{ success: boolean; message: string; usage?: MediaUsageCheckResult }> {
  const assets = mockDb.getMediaAssets();
  const asset = assets.find((a) => a.id === assetId);

  if (!asset) {
    return { success: false, message: 'Media asset not found.' };
  }

  const usage = checkMediaUsage(asset.url);
  if (usage.isUsed && !force) {
    const refNames = usage.references.map((r) => `${r.type}: "${r.title}"`).join(', ');
    return {
      success: false,
      message: `Asset cannot be deleted because it is currently published in ${usage.count} location(s): ${refNames}.`,
      usage,
    };
  }

  // If Supabase is configured and URL is a Supabase bucket path, remove from bucket
  if (isSupabaseConfigured && supabase && asset.url.includes('/media-assets/')) {
    try {
      const parts = asset.url.split('/media-assets/');
      if (parts[1]) {
        await supabase.storage.from('media-assets').remove([parts[1]]);
      }
    } catch (e) {
      console.warn('Could not remove file from Supabase storage:', e);
    }
  }

  mockDb.deleteMediaAsset(assetId);

  return {
    success: true,
    message: `Media asset "${asset.filename}" successfully deleted.`,
    usage,
  };
}

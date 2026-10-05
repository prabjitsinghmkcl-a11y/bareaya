// Every image on the site is served from Cloudinary. Rather than uploading
// pre-sized assets, we ask Cloudinary for a right-sized derivative at render
// time: it re-encodes to WebP/AVIF, picks the quality, and the URLs stay
// immutable and cacheable for a year.
//
// The originals are untouched, so a full-resolution version is always one
// transformation away if it is ever needed.

const CLOUDINARY_IMAGE_HOST = 'res.cloudinary.com';
const UPLOAD_MARKER = '/image/upload/';

// A Cloudinary public_id may itself contain slashes (e.g. "bareaya/site/logo"),
// so the transformation segment has to be peeled off from the front. Every
// transformation parameter is prefixed with a known key, which is what we key
// on. Only the leading contiguous run is stripped.
const KNOWN_TRANSFORM_PREFIX = /^(w|h|c|q|f|dpr|g|ar|fl|e|so|l|o|x|y|vc|abr|r|x_|y_)_/;

/** Remove any transformations already present, returning the bare public_id. */
const stripTransformations = (afterUpload) => {
  const segments = afterUpload.split('/');
  const firstPublicIdSegment = segments.findIndex((segment) => !KNOWN_TRANSFORM_PREFIX.test(segment));
  return segments.slice(firstPublicIdSegment === -1 ? 0 : firstPublicIdSegment).join('/');
};

const clamp = (value) => Math.max(1, Math.round(value));

/**
 * Build an optimised Cloudinary delivery URL.
 * Non-Cloudinary or missing URLs are returned untouched so the caller can
 * still fall back to whatever it had before.
 *
 * Idempotent: calling it twice does not stack transformations, so an already
 * optimised URL (say one carried over in cart state) is re-sized cleanly.
 */
export const cloudinaryImage = (url, options = {}) => {
  if (typeof url !== 'string' || url.length === 0) return '';
  if (!url.includes(CLOUDINARY_IMAGE_HOST)) return url;
  if (url.includes('/video/upload/')) return url;

  const {
    width,
    height,
    crop = 'fill',
    gravity = 'auto',
    quality = 'auto',
    format = 'auto',
    dpr = 'auto',
  } = options;

  const hasWidth = Number.isFinite(width) && width > 0;
  const hasHeight = Number.isFinite(height) && height > 0;
  if (!hasWidth && !hasHeight) return url;

  const parts = [
    `f_${format}`,
    `q_${quality}`,
    hasWidth ? `w_${clamp(width)}` : null,
    hasHeight ? `h_${clamp(height)}` : null,
    hasWidth && hasHeight ? `c_${crop}` : null,
    hasWidth && hasHeight && crop === 'fill' ? `g_${gravity}` : null,
    dpr ? `dpr_${dpr}` : null,
  ].filter(Boolean);

  const transform = parts.join(',');
  const base = url.split(UPLOAD_MARKER)[0];
  const rest = url.split(UPLOAD_MARKER)[1] || '';
  const publicId = stripTransformations(rest);
  return `${base}${UPLOAD_MARKER}${transform}/${publicId}`;
};

// Presets tuned to the size each image is actually rendered at, times 2 for
// high-density screens. Asking for more just inflates the download.
export const IMAGE_PRESETS = {
  // 4-up product grid, ~236px per card
  productCard: { width: 480 },
  // cart line items, small thumbnails
  thumb: { width: 160 },
  // product detail hero
  productDetail: { width: 900 },
  // founder split-panel, full column width. The upload is square (1280x1275)
  // and the reference design relies on the face being framed tightly while the
  // shoulders remain visible. Force face-aware cropping here so the portrait is
  // centered on the subject instead of arbitrarily cutting through the head.
  founder: { width: 900, height: 1125, crop: 'fill', gravity: 'faces' },
  // 3-up skin story cards
  skinStory: { width: 620 },
  // 3-up instagram grid
  gallery: { width: 420 },
  // 5-up ingredient slider tiles
  ingredient: { width: 460 },
  // square 32px favicon
  favicon: { width: 64, height: 64, crop: 'fill' },
  // 180px apple touch icon
  appleTouchIcon: { width: 180, height: 180, crop: 'fill' },
};

/**
 * Convenience wrapper: `optimised(url, 'productCard')`
 */
export const optimised = (url, preset) => {
  const options = IMAGE_PRESETS[preset];
  return options ? cloudinaryImage(url, options) : url || '';
};

// Shared image assets. Exported pre-optimised so the same URL is reused
// everywhere instead of being re-typed (and re-fetched) in each component.
const RAW_LOGO =
  'https://res.cloudinary.com/aao6ldeb/image/upload/v1789571534/bareaya/site/logo.png';

export const SITE_LOGO = optimised(RAW_LOGO, 'thumb');
export const SITE_FAVICON = optimised(RAW_LOGO, 'favicon');
export const SITE_APPLE_TOUCH_ICON = optimised(RAW_LOGO, 'appleTouchIcon');

// Hero video. The 1080px source renders into a box capped at 360x560 CSS px, so
// a 720px encode covers a 2x display for roughly half the bytes (4.17 MB ->
// 2.16 MB). The poster is a still grabbed from the clip so the hero is never a
// black box while the video buffers. Note: Cloudinary generates a derived asset
// on first request, so the very first hit on a new URL can 404 — these two
// URLs have been pre-warmed.
const RAW_HERO_VIDEO =
  'https://res.cloudinary.com/aao6ldeb/video/upload/v1790749111/bareaya/videos/hero-video.mp4';

export const HERO_VIDEO = RAW_HERO_VIDEO.replace('/upload/', '/upload/w_720,q_auto:eco/');
export const HERO_POSTER = RAW_HERO_VIDEO.replace(
  '/upload/',
  '/upload/so_2,w_720,f_jpg,q_auto:eco/'
).replace(/\.mp4$/, '.jpg');

export default cloudinaryImage;

const PLACEHOLDER = '/logo.png';

const buildProductPlaceholder = (productName = 'Bareaya') => {
  const safeName = String(productName || 'Bareaya').trim() || 'Bareaya';
  const initials = safeName
    .split(/\s+/)
    .map((segment) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'B';

  const palette = ['#171717', '#7A5C3C', '#5C6C57', '#8E8E8E', '#1F2B24'];
  const index = safeName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  const bg = palette[index];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="${bg}" />
      <circle cx="400" cy="400" r="240" fill="#f6f3ee" />
      <text x="400" y="465" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="240" fill="#111111" font-weight="700">${initials}</text>
      <text x="400" y="630" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#111111" letter-spacing="6">BAREAYA</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const isSafeImageUrl = (url) => {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('/')) return true;
  if (/^https:\/\//i.test(trimmed)) return true;
  return false;
};

const normalizeImageUrl = (product) => {
  if (product) {
    if (!isSafeImageUrl(product.imageUrl)) {
      product.imageUrl = buildProductPlaceholder(product.name);
    }
  }
  return product;
};

module.exports = { normalizeImageUrl, PLACEHOLDER, buildProductPlaceholder };
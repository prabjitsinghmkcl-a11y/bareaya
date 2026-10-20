// Order items only store a productId, so thumbnails anywhere in the app are
// resolved against the public product list. The result is cached for the
// session (including a failed lookup, so a network error cannot restart the
// fetch on every render) and shared by every page that needs it — the order
// tracking page and the profile's order history both build their thumbnails
// from this one map.
let cache = null;

export const fetchProductImages = async () => {
  if (cache) return cache;
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    cache = Array.isArray(data)
      ? new Map(data.map((p) => [p._id, p.imageUrl || p.image || '']))
      : new Map();
  } catch {
    // Negative cache: a failed lookup must not restart on every render.
    cache = new Map();
  }
  return cache;
};

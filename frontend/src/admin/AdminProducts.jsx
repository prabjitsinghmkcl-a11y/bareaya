import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import {
  ArrowLeft,
  PlusCircle,
  Search,
  X,
  Edit3,
  Trash2,
  RefreshCw,
  Package
} from 'lucide-react';
import { optimised, SITE_LOGO } from '../utils/cloudinary';
import { adminFetch, resolveAdminError } from '../utils/adminApi';
import '../styles/admin.css';

const AdminProducts = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(() => {
    try {
      return user || JSON.parse(localStorage.getItem('userInfo')) || null;
    } catch {
      return user || null;
    }
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user) setUserInfo(user);
  }, [user]);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, navigate]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(resolveAdminError(fetchError, logout, navigate) || '');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name || 'this product'}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await adminFetch(`/api/products/${id}`, { token: userInfo.token, method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(resolveAdminError(err, logout, navigate) || '');
    } finally {
      setDeletingId(null);
    }
  };

  // Derive categories
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category && typeof p.category === 'string') set.add(p.category.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== 'All') {
      list = list.filter((p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.tag || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  if (!userInfo || userInfo.role !== 'admin') return null;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Link to="/admin" className="admin-back">
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <h2>Manage Products</h2>
          <span className="admin-badge admin-badge--count">{products.length} products</span>
        </div>

        <div className="admin-page-actions">
          <Link to="/admin/add-product" className="admin-btn admin-btn--primary">
            <PlusCircle size={16} />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {/* Toolbar: Search & Category Filter */}
      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search products by name, tag, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="admin-search-clear"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="admin-toolbar-right">
          {categories.length > 1 && (
            <div className="admin-select-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="admin-filter-select"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={fetchProducts}
            className="admin-btn admin-btn--ghost admin-btn--icon"
            title="Refresh product catalogue"
          >
            <RefreshCw size={14} className={loading ? 'admin-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="admin-loading-card">
          <div className="admin-spinner" />
          <p>Loading catalogue items…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="admin-empty">
          <Package size={36} className="admin-empty-icon" />
          <p>No products yet in your catalogue.</p>
          <Link to="/admin/add-product" className="admin-btn admin-btn--primary" style={{ marginTop: '14px' }}>
            <PlusCircle size={15} /> Add First Product
          </Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="admin-empty">
          <p>No products match your search or filter.</p>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            style={{ marginTop: '10px' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="admin-products-grid">
          {filteredProducts.map((product) => {
            const stock = Number(product.stock) || 0;
            const isOutOfStock = stock === 0;
            const isLowStock = stock > 0 && stock <= 10;

            return (
              <div key={product._id} className="admin-product-card">
                <div className="admin-product-card-img-wrap">
                  <img
                    className="admin-product-card-img"
                    src={optimised(product.imageUrl, 'thumb') || SITE_LOGO}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    width={160}
                    height={160}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = SITE_LOGO;
                    }}
                  />
                  {product.tag && (
                    <span className="admin-product-tag-chip">{product.tag}</span>
                  )}
                </div>

                <div className="admin-product-card-body">
                  <div className="admin-product-card-top">
                    <span className="admin-product-category">{product.category || 'Skincare'}</span>
                    <span
                      className={`admin-stock-badge ${
                        isOutOfStock
                          ? 'admin-stock-badge--out'
                          : isLowStock
                          ? 'admin-stock-badge--low'
                          : 'admin-stock-badge--ok'
                      }`}
                    >
                      {isOutOfStock ? 'Out of stock' : isLowStock ? `${stock} left (Low)` : `${stock} in stock`}
                    </span>
                  </div>

                  <h3 className="admin-product-card-name" title={product.name}>
                    {product.name}
                  </h3>

                  <p className="admin-product-card-price">
                    ₹{Number(product.price || 0).toFixed(2)}
                  </p>

                  <div className="admin-product-card-actions">
                    <Link
                      to={`/admin/edit-product/${product._id}`}
                      className="admin-btn admin-btn--secondary admin-btn--sm"
                    >
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(product._id, product.name)}
                      className="admin-btn admin-btn--danger-ghost admin-btn--sm"
                      disabled={deletingId === product._id}
                      title="Delete product"
                    >
                      <Trash2 size={14} />
                      <span>{deletingId === product._id ? 'Deleting…' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import { ArrowLeft } from 'lucide-react';
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminFetch(`/api/products/${id}`, { token: userInfo.token, method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(resolveAdminError(err, logout, navigate) || '');
    }
  };

  if (!userInfo || userInfo.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Link to="/admin" className="admin-back"><ArrowLeft size={16} /> Back</Link>
          <h2>Manage Products</h2>
        </div>
        <Link to="/admin/add-product" className="admin-btn">+ Add Product</Link>
      </div>

      {error && <p className="admin-error" style={{ marginBottom: '16px' }}>{error}</p>}
      {loading && <p className="admin-muted">Loading products...</p>}

      {!loading && products.length === 0 && (
        <div className="admin-empty">No products yet. Add your first product.</div>
      )}

      {!loading && products.length > 0 && (
        <div className="admin-list">
          {products.map((product) => (
            <div key={product._id} className="admin-row">
              <div className="admin-row-info">
                <img
                  className="admin-row-img"
                  src={optimised(product.imageUrl, 'thumb') || SITE_LOGO}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  width={160}
                  height={160}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = SITE_LOGO; }}
                />

                <div>
                  <p className="admin-row-title">{product.name}</p>
                  <p className="admin-row-sub">
                    ₹{Number(product.price || 0).toFixed(2)} · {product.category || 'Uncategorized'} · Stock: {product.stock ?? 0}
                  </p>
                </div>
              </div>
              <div className="admin-actions">
                <Link to={`/admin/edit-product/${product._id}`} className="admin-btn admin-btn--ghost admin-btn--sm">Edit</Link>
                <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleDelete(product._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
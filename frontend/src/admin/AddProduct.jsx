import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import { ArrowLeft } from 'lucide-react';
import { resolveAdminError } from '../utils/adminApi';
import '../styles/admin.css';

const AddProduct = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(() => {
    try {
      return user || JSON.parse(localStorage.getItem('userInfo')) || null;
    } catch {
      return user || null;
    }
  });
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    tag: '',
    stock: ''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setUserInfo(user);
  }, [user]);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') navigate('/admin/login');
  }, [userInfo, navigate]);

  // Blob URLs created for the preview were never released, so every selected
  // image stayed pinned in memory for the lifetime of the page.
  useEffect(() => {
    return () => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!userInfo || userInfo.role !== 'admin') return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    setImage(file || null);
    setPreview((prev) => {
      if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : '';
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.price || !form.category.trim() || form.stock === '') {
      setError('Please fill in all fields: name, description, price, category and stock.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      if (image) fd.append('image', image);

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userInfo.token}` },
        body: fd
      });
      if (res.status === 401) {
        logout();
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not add product.');
      }
      navigate('/admin/products');
    } catch (err) {
      setError(resolveAdminError(err, logout, navigate) || 'Could not add product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Link to="/admin/products" className="admin-back"><ArrowLeft size={16} /> Back</Link>
          <h2>Add Product</h2>
        </div>
      </div>

      <form className="admin-form admin-card" onSubmit={handleSubmit}>
        <label>
          Product Name
          <input type="text" name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} required />
        </label>
        <label>
          Price (₹)
          <input type="number" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" />
        </label>
        <label>
          Category
          <input type="text" name="category" value={form.category} onChange={handleChange} placeholder="e.g. Skincare, Clothing" required />
        </label>
        <label>
          Home Filter Tag
          <select name="tag" value={form.tag} onChange={handleChange}>
            <option value="">None</option>
            <option value="Hydration">Hydration</option>
            <option value="Clarity">Clarity</option>
            <option value="Protection">Protection</option>
          </select>
        </label>
        <label>
          Stock
          <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0" required />
        </label>
        <label>
          Product Image
          {preview && (
            <img
              src={preview}
              alt="Selected file preview"
              className="admin-image-preview"
            />
          )}
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-actions">
          <button type="submit" className="admin-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
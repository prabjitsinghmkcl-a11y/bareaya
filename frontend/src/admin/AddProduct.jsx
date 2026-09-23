import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import { ArrowLeft } from 'lucide-react';
import '../styles/admin.css';

const AddProduct = () => {
  const { user } = useContext(AuthContext);
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

  if (!userInfo || userInfo.role !== 'admin') return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    setImage(file || null);
    setPreview(file ? URL.createObjectURL(file) : '');
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not add product.');
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.message);
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
          Stock
          <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0" required />
        </label>
        <label>
          Product Image
          {preview && (
            <img
              src={preview}
              alt="Selected product image"
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
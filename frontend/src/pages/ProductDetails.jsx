import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import { optimised, SITE_LOGO } from '../utils/cloudinary';
import '../styles/product.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const inStock = Number(product?.stock) > 0;

  const handleAddToCart = () => {
    if (product && inStock) {
      dispatch(addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: Number(product.stock) || 0,
        qty: 1
      }));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', margin: '100px', color: '#f97316' }}>Loading Product...</div>;
  if (!product || product.message) return <div style={{ textAlign: 'center', margin: '100px', color: '#ef4444' }}>Product Not Found</div>;

  return (
    <div className="product-detail-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* Breadcrumb Navigation */}
      <div style={{ color: '#a1a1aa', marginBottom: '20px', fontSize: '0.95rem' }} data-reveal>
        <Link to="/" style={{ color: '#f97316' }}>Home</Link> / <Link to="/shop" style={{ color: '#f97316' }}>Shop</Link> / {product.category} / <span style={{ color: '#fff' }}>{product.name}</span>
      </div>

      <div className="product-detail">
        {/* Left Side: Image */}
        <div className="detail-image-container" data-reveal>
          <img src={optimised(product.imageUrl, 'productDetail')} alt={product.name} className="detail-image" loading="eager" decoding="async" width={900} height={1125} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = SITE_LOGO; }} />
        </div>

        {/* Right Side: Information Block */}
        <div className="detail-info" data-reveal style={{ '--reveal-delay': '140ms' }}>
          
          <h2 style={{ fontSize: '2.8rem', marginBottom: '10px' }}>{product.name}</h2>

          <p className="detail-price" style={{ fontSize: '2.5rem', margin: '15px 0' }}>₹{product.price.toFixed(2)}</p>

          {/* Description */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#fff', marginBottom: '10px' }}>Product Description</h4>
            <p style={{ color: '#a1a1aa', lineHeight: '1.8' }}>{product.description}</p>
          </div>

          {/* Cart & Stock Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={handleAddToCart} className="btn" disabled={!inStock} style={{ flexGrow: '1', padding: '18px', fontSize: '1.2rem' }}>
              {inStock ? 'Add to Shopping Cart' : 'Out of Stock'}
            </button>
            {inStock && <span style={{ color: '#a1a1aa' }}>{product.stock} in stock</span>}
          </div>
          
          </div>
      </div>
    </div>
  );
};

export default ProductDetail;
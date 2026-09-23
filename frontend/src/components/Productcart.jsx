import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import "../styles/productCart.css"; // Import the CSS file for styling

const ProductCart = ({ product, hideImage = false }) => {
  const dispatch = useDispatch();

  const buildProductPlaceholder = (name = 'Bareaya') => {
    const safeName = String(name || 'Bareaya').trim() || 'Bareaya';
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

  const fallbackImage = product.imageUrl || product.image || buildProductPlaceholder(product.name);

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      imageUrl: fallbackImage,
      qty: 1,
    }));
  };

    return (
        <div className={`product-cart${hideImage ? ' product-cart--no-image' : ''}`}>
          {!hideImage && (
          <img
            src={fallbackImage}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = buildProductPlaceholder(product.name);
            }}
          />
          )}
            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
            <div className="product-price-row">
              <p className="product-price">₹{product.price.toFixed(2)}</p>
              <Link to={`/product/${product._id}`} className="product-details-link">View Details</Link>
            </div>
            <button type="button" onClick={handleAddToCart} className="btn">Add to Cart</button>
            </div>
        </div>
    );
};

export default ProductCart;
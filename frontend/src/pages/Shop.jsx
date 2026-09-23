import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/Productcart';
import '../styles/shop.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').toLowerCase();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');

        if (!response.ok) {
          throw new Error('Unable to load products');
        }

        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = query
    ? products.filter((product) =>
        `${product.name} ${product.description || ''} ${product.category || ''}`
          .toLowerCase()
          .includes(query)
      )
    : products;

  return (
    <main className="shop-container">
      <header className="shop-header">
        <p className="shop-eyebrow" data-reveal>Bareaya collection</p>
        <h1 data-reveal style={{ '--reveal-delay': '90ms' }}>Shop all products</h1>
        <p data-reveal style={{ '--reveal-delay': '180ms' }}>Discover thoughtful skincare made for simple, everyday rituals.</p>
      </header>

      {loading && <p className="shop-status" data-reveal>Loading products...</p>}

      {!loading && error && <p className="shop-status shop-status--error" data-reveal>{error}</p>}

      {!loading && !error && products.length === 0 && !query && (
        <p className="shop-status" data-reveal>No products are available right now.</p>
      )}

      {!loading && !error && query && filteredProducts.length === 0 && (
        <p className="shop-status" data-reveal>No products found for "{query}".</p>
      )}

      {!loading && !error && filteredProducts.length > 0 && (
        <section className="product-grid" aria-label="All products">
          {filteredProducts.map((product, index) => (
            <div key={product._id} className="br-product-reveal" data-reveal style={{ '--reveal-delay': `${index * 70}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </section>
      )}
    </main>
  );
};

export default Shop;

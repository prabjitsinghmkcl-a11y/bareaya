import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import { useSelector } from 'react-redux';
import { Heart, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import '../styles/navbar.css';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const skinAnalysisUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeQt9H4-6SGsb-wW-2vwgv00LfRmeon7P8M7ec0BrzCjqxE1Q/viewform';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideSearchClick = (event) => {
      if (!event.target.closest('.navbar-search') && !event.target.closest('.navbar-search-trigger')) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideSearchClick);
    return () => document.removeEventListener('click', handleOutsideSearchClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = query.trim();
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setQuery('');
    setIsSearchOpen(false);
  };

  return (
    <nav className={`navbar${isScrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar-main">
        <div className="navbar-brand">
          <Link to="/" aria-label="Bareaya home">
            <img src="https://res.cloudinary.com/aao6ldeb/image/upload/v1789571534/bareaya/site/logo.png" alt="Bareaya" className="navbar-logo-image" />
          </Link>
        </div>
        {isSearchOpen && (
          <form className="navbar-search navbar-search--open" role="search" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search products..."
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" aria-label="Submit search">Search</button>
          </form>
        )}
        <div className="navbar-actions">
          <button
            type="button"
            className="navbar-search-trigger"
            aria-label={isSearchOpen ? 'Close search' : 'Open product search'}
            aria-expanded={isSearchOpen}
            onClick={() => setIsSearchOpen((open) => !open)}
          >
            <Search />
          </button>
          <Link to={user ? '/profile' : '/login'} aria-label={user ? 'Profile' : 'Login'}><UserRound /></Link>
          <button type="button" aria-label="Wishlist" onClick={() => navigate('/shop')}><Heart /></button>
          <Link to="/cart" className="navbar-cart-icon" aria-label={`Cart with ${cartItems.length} items`}><ShoppingBag /><span>{cartItems.length}</span></Link>
        </div>
      </div>
      <button
        type="button"
        className="navbar-toggle"
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`navbar-menu${isMenuOpen ? ' navbar-menu--open' : ''}`}>
        <ul className="navbar-links">
          {!isHomePage && <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>}
          <li><Link to="/shop" onClick={() => setIsMenuOpen(false)}>Shop</Link></li>
          <li><a href={skinAnalysisUrl} target="_blank" rel="noreferrer">Consultation</a></li>
          <li><Link to="/about" onClick={() => setIsMenuOpen(false)}>About</Link></li>
          <li><Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link></li>
        </ul>
      </div>
      {isMenuOpen && <button type="button" className="navbar-menu-close" aria-label="Close navigation menu" onClick={() => setIsMenuOpen(false)}><X /></button>}
    </nav>
  );
};

export default Navbar;
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/Authcontext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { User, Package, LifeBuoy, LogOut, ChevronRight } from 'lucide-react';
import { optimised, SITE_LOGO } from '../utils/cloudinary';
import { fetchProductImages } from '../utils/productImages';
import '../styles/profile.css';

// Flipkart-style account page: a sticky sidebar (Personal Information,
// Order History, Support, Logout) on the left and white content cards on the
// right. The order rows mirror Flipkart's order list — thumbnail, item, order
// number/date, price and a coloured status pill.

const STATUS_COLORS = {
  delivered: { bg: 'rgba(16,185,129,0.12)', color: '#0f8a5f' },
  shipped: { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#dc2626' },
  paid: { bg: 'rgba(16,185,129,0.12)', color: '#0f8a5f' },
  pending: { bg: 'rgba(245,158,11,0.14)', color: '#b45309' }
};

const STATUS_LABELS = {
  pending: 'Order Placed',
  paid: 'Order Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const OrderRow = ({ order, images }) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const first = items[0] || {};
  const extra = items.length - 1;
  const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const thumb = (images && first.productId && images.get(first.productId)) || '';

  return (
    <div className="pf-order">
      <div className="pf-order-thumb">
        <img src={optimised(thumb, 'thumb') || SITE_LOGO} alt={first.name || 'Order item'} />
      </div>
      <div className="pf-order-main">
        <p className="pf-order-title">
          {first.name || 'Product'}
          {extra > 0 && <span className="pf-order-more"> + {extra} more item{extra === 1 ? '' : 's'}</span>}
        </p>
        <p className="pf-order-meta">
          Order #{String(order._id || '').slice(-8).toUpperCase()} · Placed on {formatDate(order.createdAt)}
        </p>
        <Link className="pf-order-track" to={`/orders/${order._id}`}>
          View &amp; track details <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="pf-order-right">
        <strong className="pf-order-total">₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
        <span className="pf-order-status" style={{ background: statusColor.bg, color: statusColor.color }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  // 'orders' is the default so existing "view my orders" flows land where they
  // always did; the tracking page can also deep-link straight to either tab.
  const [tab, setTab] = useState(() => (location.state?.tab === 'profile' ? 'profile' : 'orders'));
  const [images, setImages] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    const fetchMyOrders = async () => {
      try {
        const res = await fetch('/api/orders/myorders', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(Array.isArray(data) ? data : []);
        } else {
          // Token obsolete or 401: clear and bounce
          if (res.status === 401) {
             logout();
             navigate('/login');
          }
          setOrders([]);
        }
      } catch (err) {
        // A network or server failure must NOT be reported as "you have no
        // orders" — that state is indistinguishable from a genuinely empty
        // order history and hides a real problem from the customer.
        console.error(err);
        setError('Could not load your orders. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
    fetchProductImages().then(setImages);
  }, [user, navigate, logout, reloadKey]);

  // Navigated here again (e.g. from another order's tracking page) — honour
  // the requested tab instead of keeping the stale one.
  useEffect(() => {
    if (location.state?.tab === 'profile' || location.state?.tab === 'orders') {
      setTab(location.state.tab);
    }
  }, [location.state]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const initial = (user.name || '?').trim().charAt(0).toUpperCase();

  // Shared body for the orders list — reused by the full Order History tab
  // and the compact "Recent Orders" card on the Personal Information tab.
  const ordersBody = loading ? (
    <p className="pf-muted">Fetching your orders...</p>
  ) : error ? (
    <div className="pf-empty">
      <p>Your order history could not be loaded.</p>
      <button className="pf-action" onClick={() => setReloadKey((k) => k + 1)}>
        Retry <span aria-hidden="true">→</span>
      </button>
    </div>
  ) : orders.length === 0 ? (
    <div className="pf-empty">
      <p>You haven't placed any orders yet.</p>
      <Link to="/shop" className="pf-action">Start Shopping <span aria-hidden="true">→</span></Link>
    </div>
  ) : (
    <div className="pf-orders">
      {(tab === 'orders' ? orders : orders.slice(0, 3)).map((order) => (
        <OrderRow key={order._id} order={order} images={images} />
      ))}
    </div>
  );

  return (
    <div className="pf-page">
      <div className="pf-layout">
        <aside className="pf-side" data-reveal>
          <div className="pf-user">
            <span className="pf-avatar" aria-hidden="true">{initial}</span>
            <div className="pf-user-text">
              <p className="pf-user-name">{user.name}</p>
              <p className="pf-user-sub">{user.phone || user.email}</p>
            </div>
          </div>

          <nav className="pf-nav" aria-label="Account">
            <p className="pf-nav-heading">Account</p>
            <button
              type="button"
              className={`pf-nav-item${tab === 'profile' ? ' is-active' : ''}`}
              onClick={() => setTab('profile')}
            >
              <User size={17} aria-hidden="true" />
              <span>Personal Information</span>
              <ChevronRight size={15} className="pf-nav-arrow" aria-hidden="true" />
            </button>

            <p className="pf-nav-heading">My Orders</p>
            <button
              type="button"
              className={`pf-nav-item${tab === 'orders' ? ' is-active' : ''}`}
              onClick={() => setTab('orders')}
            >
              <Package size={17} aria-hidden="true" />
              <span>Order History</span>
              <ChevronRight size={15} className="pf-nav-arrow" aria-hidden="true" />
            </button>

            <p className="pf-nav-heading">Support</p>
            <Link className="pf-nav-item" to="/contact">
              <LifeBuoy size={17} aria-hidden="true" />
              <span>Contact Us</span>
              <ChevronRight size={15} className="pf-nav-arrow" aria-hidden="true" />
            </Link>
          </nav>

          <button type="button" className="pf-nav-logout" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" /> Logout
          </button>
        </aside>

        <main className="pf-content">
          {error && tab === 'orders' && <p className="pf-error" role="alert">{error}</p>}

          {tab === 'profile' ? (
            <>
              <section className="pf-card" data-reveal style={{ '--reveal-delay': '80ms' }}>
                <h2 className="pf-card-title">Personal Information</h2>
                <div className="pf-info-row">
                  <span className="pf-info-label">Name</span>
                  <span className="pf-info-value">{user.name}</span>
                </div>
                <div className="pf-info-row">
                  <span className="pf-info-label">Phone Number</span>
                  <span className="pf-info-value">{user.phone || '—'}</span>
                </div>
                {user.email && (
                  <div className="pf-info-row">
                    <span className="pf-info-label">Email</span>
                    <span className="pf-info-value">{user.email}</span>
                  </div>
                )}
                <div className="pf-info-row">
                  <span className="pf-info-label">Account Type</span>
                  <span className="pf-info-value">{String(user.role || '').toUpperCase()}</span>
                </div>
              </section>

              <section className="pf-card" data-reveal style={{ '--reveal-delay': '140ms' }}>
                <div className="pf-card-head">
                  <h2 className="pf-card-title">Recent Orders</h2>
                  {!loading && !error && orders.length > 0 && (
                    <span className="pf-count">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
                  )}
                </div>
                {ordersBody}
                {!loading && !error && orders.length > 3 && (
                  <button type="button" className="pf-viewall" onClick={() => setTab('orders')}>
                    View all orders <span aria-hidden="true">→</span>
                  </button>
                )}
              </section>
            </>
          ) : (
            <section className="pf-card" data-reveal style={{ '--reveal-delay': '80ms' }}>
              <div className="pf-card-head">
                <h2 className="pf-card-title">Order History</h2>
                {!loading && !error && (
                  <span className="pf-count">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
                )}
              </div>
              {ordersBody}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;

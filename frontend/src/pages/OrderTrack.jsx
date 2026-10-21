import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import { optimised, SITE_LOGO } from '../utils/cloudinary';
import { fetchProductImages } from '../utils/productImages';
import '../styles/order-track.css';

// The customer-facing tracking milestones. Backed by the real status enum
// (pending → paid → shipped → delivered) — no invented dates or promises.
const TRACK_STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Order Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }
];

// How many milestones are complete per stored status. `cancelled` freezes the
// timeline right after placement and shows a cancellation banner instead.
const STATUS_PROGRESS = {
  pending: 1,
  paid: 2,
  shipped: 3,
  delivered: 4,
  cancelled: 1
};

const STATUS_META = {
  pending: { label: 'Order Placed', bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
  paid: { label: 'Order Confirmed', bg: 'rgba(16,185,129,0.12)', color: '#047857' },
  shipped: { label: 'Shipped', bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  delivered: { label: 'Delivered', bg: 'rgba(16,185,129,0.12)', color: '#047857' },
  cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.12)', color: '#dc2626' }
};

const formatDate = (value, withTime = false) => {
  if (!value) return '—';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Date(value).toLocaleString('en-IN', options);
};

const OrderTrack = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [cancelError, setCancelError] = useState('');

  const justPlaced = Boolean(location.state?.justPlaced);

  const fetchOrder = useCallback(async (silent = false) => {
    if (!user?.token) return;
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError('');
    }
    try {
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.status === 401) {
        logout();
        navigate('/login', {
          state: {
            from: `/orders/${id}`,
            message: 'Your session has expired. Please log in again to view your order.'
          }
        });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not load this order.');
      setOrder(data);
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Could not load this order. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user?.token, logout, navigate]);

  // Hard refresh of the confirmation link lands on login first — come straight
  // back to THIS order after the OTP.
  useEffect(() => {
    if (!user) {
      navigate('/login', {
        state: { from: `/orders/${id}`, message: 'Please log in to view your order.' }
      });
    }
  }, [user, navigate, id]);

  useEffect(() => {
    if (!user) return undefined;
    fetchOrder(false);
    fetchProductImages().then(setImages);
  }, [user, fetchOrder]);

  // The status is owned by the store (admin flips it), so quietly re-check it
  // while the customer watches — the timeline updates without any click.
  useEffect(() => {
    if (!user || !order) return undefined;
    const timer = setInterval(() => fetchOrder(true), 60000);
    return () => clearInterval(timer);
  }, [user, order, fetchOrder]);

  // Customer-side cancellation. The server re-checks ownership + status, so a
  // stale button (order already shipped) just surfaces its message inline.
  const handleCancel = async () => {
    if (cancelling) return;
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`/api/orders/${order._id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.status === 401) {
        logout();
        navigate('/login', {
          state: {
            from: `/orders/${id}`,
            message: 'Your session has expired. Please log in again to manage your order.'
          }
        });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not cancel this order. Please try again.');
      // The endpoint returns the updated document — the banner, greyed timeline
      // and Cancelled badge all follow from its status with no extra state.
      setOrder(data);
    } catch (err) {
      setCancelError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  if (!user) return null;

  if (loading && !order) {
    return (
      <div className="ot-page">
        <div className="ot-skeleton" role="status" aria-live="polite" aria-label="Loading order details">
          <div className="ot-skel ot-skel-hero" />
          <div className="ot-skel ot-skel-timeline" />
          <div className="ot-skel-row">
            <div className="ot-skel ot-skel-main" />
            <div className="ot-skel ot-skel-side" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="ot-page">
        <section className="ot-card ot-error-card" data-reveal>
          <h1>We couldn't load this order</h1>
          <p>{error}</p>
          <div className="ot-actions">
            <button type="button" className="ot-btn" onClick={() => fetchOrder(false)}>Try again</button>
            <Link to="/shop" className="ot-btn ot-btn-ghost">Continue Shopping</Link>
          </div>
        </section>
      </div>
    );
  }

  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsSubtotal = items.reduce(
    (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const gstAmount = Math.max((Number(order.totalAmount) || 0) - itemsSubtotal, 0);
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const doneCount = STATUS_PROGRESS[order.status] ?? 1;
  const cancelled = order.status === 'cancelled';
  const address = order.address || {};
  const isCod = order.paymentMethod === 'cod';
  // Customers may cancel only what the store hasn't shipped yet — the server
  // enforces the same ['pending', 'paid'] rule.
  const canCancel = ['pending', 'paid'].includes(order.status);

  return (
    <div className="ot-page">
      <section className="ot-hero" data-reveal>
        <span className="ot-hero-check" aria-hidden="true">✓</span>
        <div className="ot-hero-body">
          <p className="ot-hero-eyebrow">{justPlaced ? 'Thank you' : 'Bareaya'}</p>
          <h1>{justPlaced ? 'Order placed successfully' : 'Order details'}</h1>
          <p className="ot-hero-meta">
            Order <strong>#{String(order._id).slice(-8).toUpperCase()}</strong>
            <span className="ot-hero-sep" aria-hidden="true">·</span>
            Placed on {formatDate(order.createdAt, true)}
          </p>
        </div>
        <span className="ot-badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
      </section>

      {cancelled && (
        <p className="ot-banner ot-banner-danger" role="alert" data-reveal>
          This order was cancelled. If you made a payment, a refund will be initiated shortly.
        </p>
      )}

      <section className="ot-card ot-timeline-card" data-reveal style={{ '--reveal-delay': '80ms' }}>
        <div className="ot-card-head">
          <h2>Track your order</h2>
          <button
            type="button"
            className="ot-refresh"
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Updating…' : 'Refresh status'}
          </button>
        </div>
        <ol className={`ot-timeline${cancelled ? ' ot-timeline-cancelled' : ''}`}>
          {TRACK_STEPS.map((s, i) => {
            const done = i < doneCount;
            const active = i === doneCount && !cancelled;
            return (
              <li key={s.key} className={`ot-step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}>
                <span className="ot-step-dot" aria-hidden="true">{done ? '✓' : ''}</span>
                <span className="ot-step-line" aria-hidden="true" />
                <div className="ot-step-body">
                  <p className="ot-step-label">{s.label}</p>
                  {i === 0 && <p className="ot-step-date">{formatDate(order.createdAt, true)}</p>}
                  {active && <p className="ot-step-hint">In progress</p>}
                  {done && i === TRACK_STEPS.length - 1 && order.status === 'delivered' && (
                    <p className="ot-step-hint ot-step-hint-done">Delivered</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="ot-grid">
        <div className="ot-main">
          <section className="ot-card" data-reveal style={{ '--reveal-delay': '120ms' }}>
            <h2>Order summary</h2>
            <div className="ot-items">
              {items.map((item, index) => {
                const image = (images && images.get(item.productId)) || '';
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 1;
                return (
                  <div key={item.productId || index} className="ot-item">
                    <img
                      src={optimised(image, 'thumb') || SITE_LOGO}
                      alt={item.name || 'Product'}
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = SITE_LOGO; }}
                    />
                    <div className="ot-item-info">
                      <p className="ot-item-name">{item.name || 'Product'}</p>
                      <p className="ot-item-meta">Qty {qty} · ₹{price.toFixed(2)} each</p>
                    </div>
                    <span className="ot-item-price">₹{(price * qty).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="ot-prices">
              <div className="ot-price-row">
                <span>Price ({items.length} item{items.length === 1 ? '' : 's'})</span>
                <span>₹{itemsSubtotal.toFixed(2)}</span>
              </div>
              <div className="ot-price-row">
                <span>GST (18%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="ot-price-row ot-price-total">
                <span>Total Amount</span>
                <span>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </section>

          <section className="ot-card" data-reveal style={{ '--reveal-delay': '160ms' }}>
            <h2>Payment</h2>
            <dl className="ot-details">
              <div>
                <dt>Method</dt>
                <dd>{isCod ? 'Cash on Delivery' : 'Online payment (Razorpay)'}</dd>
              </div>
              <div>
                <dt>Payment status</dt>
                <dd>
                  {cancelled
                    ? 'Cancelled'
                    : isCod
                    ? 'Pay when your order is delivered'
                    : order.status === 'pending'
                    ? 'Confirmation pending'
                    : 'Paid'}
                </dd>
              </div>
              {order.orderNotes && (
                <div>
                  <dt>Order notes</dt>
                  <dd>{order.orderNotes}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <aside className="ot-side">
          <section className="ot-card" data-reveal style={{ '--reveal-delay': '200ms' }}>
            <h2>Delivery address</h2>
            <div className="ot-address">
              <p className="ot-address-name">
                {[address.firstName, address.lastName].filter(Boolean).join(' ') || '—'}
              </p>
              <p>{[address.street, address.apartment].filter(Boolean).join(', ')}</p>
              <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}</p>
              <p>{address.country}</p>
              {address.phone && <p className="ot-address-phone">Phone: {address.phone}</p>}
              {address.email && <p className="ot-address-phone">Email: {address.email}</p>}
            </div>
          </section>

          <section className="ot-card" data-reveal style={{ '--reveal-delay': '240ms' }}>
            <h2>Need help?</h2>
            <p className="ot-help-text">Questions about your order? We're here to help.</p>
            <Link className="ot-card-link" to="/contact">Contact us <span aria-hidden="true">→</span></Link>
            {canCancel ? (
              <button
                type="button"
                className="ot-cancel-btn"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            ) : (
              <Link className="ot-card-link" to="/profile" state={{ tab: 'orders' }}>View all your orders <span aria-hidden="true">→</span></Link>
            )}
            {cancelError && <p className="ot-cancel-error" role="alert">{cancelError}</p>}
          </section>
        </aside>
      </div>

      <div className="ot-actions ot-actions-footer" data-reveal style={{ '--reveal-delay': '280ms' }}>
        <Link to="/shop" className="ot-btn">Continue Shopping</Link>
        <Link to="/profile" state={{ tab: 'orders' }} className="ot-btn ot-btn-ghost">Track all orders</Link>
      </div>
    </div>
  );
};

export default OrderTrack;

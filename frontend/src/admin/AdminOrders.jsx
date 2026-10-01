import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { adminFetch, resolveAdminError } from '../utils/adminApi';
import '../styles/admin.css';

// Which status each order may move to next. The server enforces the same rules
// and rejects anything not listed here, so the dropdown cannot offer a
// transition that is guaranteed to fail (e.g. un-cancelling a cancelled order).
const ALLOWED_NEXT_STATUS = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

const AdminOrders = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(() => {
    try {
      return user || JSON.parse(localStorage.getItem('userInfo')) || null;
    } catch {
      return user || null;
    }
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (user) setUserInfo(user);
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await adminFetch('/api/orders', { token: userInfo.token });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(resolveAdminError(err, logout, navigate) || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, navigate]);

  if (!userInfo || userInfo.role !== 'admin') return null;

  const handleStatusChange = async (orderId, status) => {
    setError('');
    try {
      await adminFetch(`/api/orders/${orderId}/status`, {
        token: userInfo.token,
        method: 'PUT',
        body: { status }
      });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    } catch (err) {
      setError(resolveAdminError(err, logout, navigate) || '');
      // The server may have refused the transition; re-read the real status.
      if (err?.name !== 'SessionExpiredError') fetchOrders();
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Link to="/admin" className="admin-back"><ArrowLeft size={16} /> Back</Link>
          <h2>Manage Orders</h2>
        </div>
      </div>

      {error && <p className="admin-error" style={{ marginBottom: '16px' }}>{error}</p>}
      {loading && <p className="admin-muted">Loading orders...</p>}

      {!loading && orders.length === 0 && (
        <div className="admin-empty">No orders yet.</div>
      )}

      {!loading && orders.length > 0 && (
        <div className="admin-list">
          {orders.map((order) => {
            const isOpen = expandedId === order._id;
            const addr = order.address || {};
            const customerName =
              [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim() ||
              (order.userId && order.userId.name) ||
              'Customer';
            // The delivery phone on the order wins; fall back to the phone on the
            // customer's account for orders placed before the checkout captured one.
            const customerPhone = (addr.phone || (order.userId && order.userId.phone) || '').trim();
            const customerEmail =
              (addr.email || (order.userId && order.userId.email) || '').trim();
            const addressLines = [
              [addr.street, addr.apartment].filter(Boolean).join(', '),
              [addr.city, addr.state].filter(Boolean).join(', '),
              [addr.postalCode, addr.country].filter(Boolean).join(', ')
            ].filter(Boolean);

            return (
              <div key={order._id} className="admin-order">
                <button
                  type="button"
                  className={`admin-order-head${isOpen ? ' admin-order-head--open' : ''}`}
                  onClick={() => setExpandedId(isOpen ? null : order._id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <p className="admin-row-title">
                      {customerName} · {order.items?.length || 0} item(s)
                    </p>
                    <p className="admin-row-sub" style={{ wordBreak: 'break-all' }}>
                      Order {order._id}
                    </p>
                    <p className="admin-row-sub">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                    </p>
                    {customerPhone && (
                      <p className="admin-row-sub">Phone: {customerPhone}</p>
                    )}
                  </div>
                  <div className="admin-actions admin-actions--head">
                    <span className="admin-badge" style={{ alignSelf: 'center', background: 'rgba(255,255,255,0.08)', color: '#e4e4e7' }}>
                      ₹{Number(order.totalAmount || 0).toFixed(2)}
                    </span>
                    {isOpen ? <ChevronUp size={18} className="admin-order-chevron" /> : <ChevronDown size={18} className="admin-order-chevron" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="admin-order-detail">
                    <div className="admin-order-block">
                      <h4>Ordered items</h4>
                      <div className="admin-order-items">
                        {Array.isArray(order.items) && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={item.productId || idx} className="admin-order-item">
                              <span className="admin-order-item-name">{item.name || 'Product'}</span>
                              <span className="admin-order-item-qty">Qty: {item.quantity}</span>
                              <span className="admin-order-item-price">₹{Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="admin-muted">No items recorded.</p>
                        )}
                        <div className="admin-order-total">
                          <span>Total</span>
                          <span>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-order-block">
                      <h4>Customer & delivery details</h4>
                      <p className="admin-row-sub"><strong style={{ color: '#fff' }}>Name:</strong> {customerName}</p>
                      <p className="admin-row-sub">
                        <strong style={{ color: '#fff' }}>Phone:</strong>{' '}
                        {customerPhone ? (
                          <a href={`tel:${customerPhone}`} className="admin-phone-link">
                            {customerPhone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </p>
                      <p className="admin-row-sub"><strong style={{ color: '#fff' }}>Email:</strong> {customerEmail || '—'}</p>
                      <p className="admin-row-sub"><strong style={{ color: '#fff' }}>Address:</strong> {addressLines.length ? addressLines.join(', ') : '—'}</p>
                    </div>

                    <div className="admin-order-block">
                      <h4>Order info</h4>
                      <p className="admin-row-sub"><strong style={{ color: '#fff' }}>Payment:</strong> {order.paymentMethod || '—'} {order.paymentId ? `(${order.paymentId})` : ''}</p>
                      <p className="admin-row-sub"><strong style={{ color: '#fff' }}>Status:</strong> {order.status || '—'}</p>
                      {order.orderNotes ? <p className="admin-row-sub"><strong style={{ color: '#fff' }}>Notes:</strong> {order.orderNotes}</p> : null}
                    </div>
                  </div>
                )}

                <div className="admin-order-status">
                  <select
                    className="admin-select"
                    value={order.status || 'pending'}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    disabled={(ALLOWED_NEXT_STATUS[order.status] || []).length === 0}
                  >
                    {/* The current status stays as a disabled placeholder so the
                        control still renders its value, followed by only the
                        transitions the server accepts. */}
                    <option value={order.status || 'pending'} disabled>
                      {order.status || 'pending'}
                    </option>
                    {(ALLOWED_NEXT_STATUS[order.status] || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
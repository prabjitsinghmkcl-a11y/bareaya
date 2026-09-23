import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/admin.css';

const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const AdminOrders = () => {
  const { user } = useContext(AuthContext);
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

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not load orders');
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, navigate]);

  if (!userInfo || userInfo.role !== 'admin') return null;

  const handleStatusChange = async (orderId, status) => {
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not update status');
      }
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    } catch (err) {
      setError(err.message);
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
                      <p className="admin-row-sub"><strong style={{ color: '#fff' }}>Email:</strong> {addr.email || '—'}</p>
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
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s} disabled={s === order.status}>{s}</option>
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
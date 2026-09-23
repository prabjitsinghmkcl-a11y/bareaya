import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/Authcontext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/profile.css';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
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
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canCancel = (status) => ['pending', 'paid'].includes(status);

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Could not cancel the order. Please try again.');
        return;
      }
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: 'cancelled' } : o)));
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setCancellingId('');
    }
  };

  if (!user) return null;

  return (
    <div className="profile-container">
      <div className="profile-header" data-reveal>
        <div>
          <p className="profile-eyebrow">Account overview</p>
          <h2 className="profile-title">My Profile</h2>
          <p className="profile-detail"><strong>Name</strong><span>{user.name}</span></p>
          <p className="profile-detail"><strong>Phone</strong><span>{user.phone || user.email}</span></p>
          <span className="profile-role">Account Type: {user.role.toUpperCase()}</span>
        </div>
        <button onClick={handleLogout} className="profile-logout">Logout</button>
      </div>

      <div className="profile-section-heading" data-reveal style={{ '--reveal-delay': '120ms' }}>
        <div>
          <p className="profile-eyebrow">Your activity</p>
          <h3 className="profile-section-title">Order History</h3>
        </div>
        <span className="profile-order-count">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span>
      </div>
      {error && <p className="profile-error" data-reveal>{error}</p>}
      {loading ? (
        <p className="profile-muted" data-reveal>Fetching your orders...</p>
      ) : orders.length === 0 ? (
        <div className="profile-empty" data-reveal>
          <p className="profile-empty-icon">+</p>
          <p>You haven't placed any orders yet.</p>
          <Link to="/shop" className="profile-action">Start Shopping <span aria-hidden="true">→</span></Link>
        </div>
      ) : (
        <div className="profile-orders">
          {orders.map((order, index) => {
            const statusColor = {
              delivered: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
              shipped: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
              cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
              paid: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
              pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
            }[order.status] || { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
            const statusLabel = {
              pending: 'Order Placed',
              paid: 'Paid',
              shipped: 'Shipped',
              delivered: 'Delivered',
              cancelled: 'Cancelled'
            }[order.status] || order.status;
            return (
            <div key={order._id} className="profile-order" data-reveal style={{ '--reveal-delay': `${index * 90}ms` }}>
              <div className="profile-order-info">
                <p className="profile-order-label">Ordered Items</p>
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item, i) => (
                    <p key={i} className="profile-order-item">{item.name || 'Product'} <em>× {item.quantity || 1}</em></p>
                  ))
                ) : (
                  <p className="profile-order-id">No items recorded</p>
                )}
                <p className="profile-order-date">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="profile-order-right">
                <strong className="profile-order-total">₹{order.totalAmount.toFixed(2)}</strong>
                <span className="profile-order-status" style={{ background: statusColor.bg, color: statusColor.color }}>
                  {statusLabel}
                </span>
                {canCancel(order.status) && (
                  <button
                    className="profile-cancel"
                    onClick={() => handleCancel(order._id)}
                    disabled={cancellingId === order._id}
                  >
                    {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Profile;
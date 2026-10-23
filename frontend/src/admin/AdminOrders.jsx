import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  RefreshCw,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { adminFetch, resolveAdminError } from '../utils/adminApi';
import '../styles/admin.css';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const STATUS_FLOW = {
  paid: { run: 'Confirming your order…', done: 'Order confirmed' },
  shipped: { run: 'Marking as shipped…', done: 'Order is on its way' },
  delivered: { run: 'Marking as delivered…', done: 'Order delivered' },
  cancelled: { run: 'Cancelling the order…', done: 'Order cancelled' }
};

const ALLOWED_NEXT_STATUS = {
  pending: ['paid', 'shipped', 'delivered', 'cancelled'],
  paid: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

const STATUS_LABELS = {
  pending: 'Order Placed',
  paid: 'Order Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const STATUS_BADGE_CLASS = {
  pending: 'admin-status-badge--pending',
  paid: 'admin-status-badge--paid',
  shipped: 'admin-status-badge--shipped',
  delivered: 'admin-status-badge--delivered',
  cancelled: 'admin-status-badge--cancelled'
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
  const [statusFlow, setStatusFlow] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  const location = useLocation();

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

  useEffect(() => {
    const highlight = location.state && location.state.highlightId;
    if (highlight) setExpandedId(highlight);
  }, [location.state]);

  // Status counts for tab chips
  const counts = useMemo(() => {
    const map = { all: orders.length, pending: 0, paid: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach((o) => {
      if (map[o.status] !== undefined) map[o.status] += 1;
    });
    return map;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (selectedStatus !== 'all') {
      list = list.filter((o) => o.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((o) => {
        const idMatch = (o._id || '').toLowerCase().includes(q);
        const nameMatch = (o.userId?.name || o.address?.firstName || '').toLowerCase().includes(q);
        const phoneMatch = (o.address?.phone || o.userId?.phone || '').includes(q);
        const emailMatch = (o.address?.email || o.userId?.email || '').toLowerCase().includes(q);
        const itemMatch = Array.isArray(o.items) && o.items.some((it) => (it.name || '').toLowerCase().includes(q));
        return idMatch || nameMatch || phoneMatch || emailMatch || itemMatch;
      });
    }

    return list;
  }, [orders, selectedStatus, searchQuery]);

  const handleStatusChange = async (orderId, status) => {
    setError('');
    const started = Date.now();
    setStatusFlow({ status, stage: 0 });
    try {
      await adminFetch(`/api/orders/${orderId}/status`, {
        token: userInfo.token,
        method: 'PUT',
        body: { status }
      });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
      const elapsed = Date.now() - started;
      if (elapsed < 650) await sleep(650 - elapsed);
      setStatusFlow({ status, stage: 1 });
      await sleep(1400);
      setStatusFlow(null);
    } catch (err) {
      setStatusFlow(null);
      setError(resolveAdminError(err, logout, navigate) || '');
      if (err?.name !== 'SessionExpiredError') fetchOrders();
    }
  };

  if (!userInfo || userInfo.role !== 'admin') return null;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Link to="/admin" className="admin-back">
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <h2>Customer Orders</h2>
          <span className="admin-badge admin-badge--count">{orders.length} total</span>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="admin-btn admin-btn--ghost admin-btn--icon"
          title="Refresh orders list"
        >
          <RefreshCw size={15} className={loading ? 'admin-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {/* Filter Tabs & Search Bar */}
      <div className="admin-toolbar">
        <div className="admin-status-tabs">
          {[
            { key: 'all', label: 'All Orders' },
            { key: 'pending', label: 'Pending' },
            { key: 'paid', label: 'Confirmed' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'delivered', label: 'Delivered' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`admin-tab-btn ${selectedStatus === tab.key ? 'admin-tab-btn--active' : ''}`}
              onClick={() => setSelectedStatus(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="admin-tab-counter">{counts[tab.key] || 0}</span>
            </button>
          ))}
        </div>

        <div className="admin-search-wrapper">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search by customer, phone, or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="admin-search-clear"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="admin-loading-card">
          <div className="admin-spinner" />
          <p>Retrieving order logs…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-empty">No orders found in database.</div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-empty">
          <p>No orders match the current filter criteria.</p>
          {(selectedStatus !== 'all' || searchQuery) && (
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--sm"
              onClick={() => {
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              style={{ marginTop: '12px' }}
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="admin-list">
          {filteredOrders.map((order) => {
            const isOpen = expandedId === order._id;
            const addr = order.address || {};
            const customerName =
              [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim() ||
              (order.userId && order.userId.name) ||
              'Customer';
            const customerPhone = (addr.phone || (order.userId && order.userId.phone) || '').trim();
            const customerEmail =
              (addr.email || (order.userId && order.userId.email) || '').trim();
            const addressLines = [
              [addr.street, addr.apartment].filter(Boolean).join(', '),
              [addr.city, addr.state].filter(Boolean).join(', '),
              [addr.postalCode, addr.country].filter(Boolean).join(', ')
            ].filter(Boolean);

            const statusClass = STATUS_BADGE_CLASS[order.status] || 'admin-status-badge--pending';

            return (
              <div key={order._id} className={`admin-order ${isOpen ? 'admin-order--open' : ''}`}>
                <div
                  className="admin-order-head"
                  onClick={() => setExpandedId(isOpen ? null : order._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setExpandedId(isOpen ? null : order._id)}
                >
                  <div className="admin-order-head-left">
                    <div className="admin-order-ref-group">
                      <strong className="admin-order-code">#{order._id.slice(-8).toUpperCase()}</strong>
                      <span className="admin-order-item-count">
                        {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <p className="admin-order-customer-title">
                      {customerName}
                      {customerPhone && <span className="admin-order-phone-sub"> · {customerPhone}</span>}
                    </p>

                    <div className="admin-order-meta-row">
                      <span className="admin-meta-cell">
                        <Calendar size={13} />
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                      <span className="admin-meta-cell">
                        <CreditCard size={13} />
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
                      </span>
                    </div>
                  </div>

                  <div className="admin-order-head-right">
                    <div className="admin-order-amount">
                      <span className="admin-order-amount-label">Amount</span>
                      <strong className="admin-order-amount-value">
                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                      </strong>
                    </div>

                    <div className="admin-order-actions-wrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        className={`admin-status-select ${statusClass}`}
                        value={order.status || 'pending'}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={Boolean(statusFlow) || (ALLOWED_NEXT_STATUS[order.status] || []).length === 0}
                      >
                        <option value={order.status || 'pending'} disabled>
                          {STATUS_LABELS[order.status] || order.status || 'Order Placed'}
                        </option>
                        {(ALLOWED_NEXT_STATUS[order.status] || []).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      className="admin-chevron-btn"
                      aria-label={isOpen ? 'Collapse order' : 'Expand order'}
                    >
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="admin-order-detail">
                    {/* Items Column */}
                    <div className="admin-order-block">
                      <h4>Ordered Products</h4>
                      <div className="admin-order-items">
                        {Array.isArray(order.items) && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={item.productId || idx} className="admin-order-item">
                              <div className="admin-order-item-left">
                                <span className="admin-order-item-name">{item.name || 'Botanical Product'}</span>
                                <span className="admin-order-item-qty">Qty: {item.quantity}</span>
                              </div>
                              <span className="admin-order-item-price">
                                ₹{Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="admin-muted">No items recorded.</p>
                        )}
                        <div className="admin-order-total-row">
                          <span>Total Settled</span>
                          <strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Customer & Shipping Column */}
                    <div className="admin-order-block">
                      <h4>Delivery Destination</h4>
                      <div className="admin-order-dest-box">
                        <p className="admin-dest-name">
                          <strong>{customerName}</strong>
                        </p>
                        {customerPhone && (
                          <p className="admin-dest-contact">
                            <Phone size={13} />
                            <a href={`tel:${customerPhone}`}>{customerPhone}</a>
                          </p>
                        )}
                        {customerEmail && (
                          <p className="admin-dest-contact">
                            <Mail size={13} />
                            <a href={`mailto:${customerEmail}`}>{customerEmail}</a>
                          </p>
                        )}
                        <div className="admin-dest-address">
                          <MapPin size={14} className="admin-dest-pin" />
                          <span>{addressLines.length ? addressLines.join(', ') : 'No address provided'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta / Notes Column */}
                    <div className="admin-order-block">
                      <h4>Order Metadata</h4>
                      <div className="admin-order-meta-box">
                        <div className="admin-meta-item">
                          <span>Payment Mode</span>
                          <strong>{order.paymentMethod ? order.paymentMethod.toUpperCase() : 'ONLINE'}</strong>
                        </div>
                        {order.razorpayOrderId && (
                          <div className="admin-meta-item">
                            <span>Gateway Ref</span>
                            <code>{order.razorpayOrderId}</code>
                          </div>
                        )}
                        <div className="admin-meta-item">
                          <span>Current Status</span>
                          <span className={`admin-status-pill ${statusClass}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        {order.orderNotes && (
                          <div className="admin-meta-notes">
                            <span>Customer Notes:</span>
                            <p>{order.orderNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Staged status animation modal */}
      {statusFlow && (
        <div className="admin-status-overlay" role="status" aria-live="polite">
          <div className="admin-status-card">
            {statusFlow.stage === 0 ? (
              <>
                <span className="admin-status-ring" aria-hidden="true" />
                <h3>{(STATUS_FLOW[statusFlow.status] || {}).run || 'Saving order update…'}</h3>
                <p>Updating database and synchronizing status with customer tracking…</p>
              </>
            ) : (
              <>
                <span className="admin-status-check" aria-hidden="true">✓</span>
                <h3>{(STATUS_FLOW[statusFlow.status] || {}).done || 'Order updated'}</h3>
                <p>The customer's order tracking page now displays this milestone.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/Authcontext';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart,
  IndianRupee,
  Package,
  Users,
  TrendingUp,
  PlusCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import '../styles/admin-dashboard.css';

const STATUS_META = {
  pending: { label: 'Pending', color: '#b45309', bg: '#fef3c7' },
  paid: { label: 'Paid', color: '#1d4ed8', bg: '#dbeafe' },
  shipped: { label: 'Shipped', color: '#6d28d9', bg: '#ede9fe' },
  delivered: { label: 'Delivered', color: '#047857', bg: '#d1fae5' },
  cancelled: { label: 'Cancelled', color: '#b91c1c', bg: '#fee2e2' }
};

const fmtMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/analytics', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          if (res.status === 401) navigate('/admin/login');
          setError(data.message || 'Failed to load dashboard data');
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      }
    };
    fetchStats();
  }, [user, navigate]);

  const cardData = stats
    ? [
        { label: 'Total Revenue', value: fmtMoney(stats.totalRevenue), sub: 'Lifetime sales', icon: IndianRupee, tone: 'adl-stat--revenue' },
        { label: 'Total Orders', value: String(stats.totalOrders), sub: 'All time orders', icon: ShoppingCart, tone: 'adl-stat--orders' },
        { label: 'Products', value: String(stats.totalProducts), sub: 'In catalogue', icon: Package, tone: 'adl-stat--products' },
        { label: 'Customers', value: String(stats.totalUsers), sub: 'Registered users', icon: Users, tone: 'adl-stat--users' }
      ]
    : [];

  const recentOrders = stats?.recentOrders || [];
  const lowStock = stats?.lowStockProducts || [];
  const monthly = stats?.monthlyRevenue || [];
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total));
  const statusCounts = stats?.orderStatusCounts || {};
  const statusTotal = (statusCounts.pending || 0) + (statusCounts.paid || 0) + (statusCounts.shipped || 0) + (statusCounts.delivered || 0) + (statusCounts.cancelled || 0);

  return (
    <div className="adl-dashboard">
      <div className="adl-dash-head">
        <div>
          <p className="adl-eyebrow">Dashboard</p>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="adl-dash-sub">Here&apos;s what&apos;s happening across your store today.</p>
        </div>
        <Link to="/admin/add-product" className="adl-dash-cta">
          <PlusCircle size={18} />
          Add Product
        </Link>
      </div>

      {error && <div className="adl-alert">{error}</div>}

      {!stats ? (
        !error && <div className="adl-loading">Loading store metrics...</div>
      ) : (
        <>
          <div className="adl-stats">
            {cardData.map(({ label, value, sub, icon: Icon, tone }) => (
              <div key={label} className={`adl-stat ${tone}`}>
                <div className="adl-stat-icon"><Icon size={22} /></div>
                <p className="adl-stat-label">{label}</p>
                <p className="adl-stat-value">{value}</p>
                <p className="adl-stat-sub">{sub}</p>
              </div>
            ))}
          </div>

          <div className="adl-grid">
            <section className="adl-panel adl-panel--grow">
              <div className="adl-panel-head">
                <div>
                  <h2>Revenue</h2>
                  <p>Last 6 months</p>
                </div>
                <TrendingUp size={20} />
              </div>
              <div className="adl-chart">
                {monthly.map((m) => {
                  const height = Math.max(4, (m.total / maxMonthly) * 100);
                  return (
                    <div key={m.label} className="adl-chart-col">
                      <div className="adl-chart-track">
                        <div className="adl-chart-bar" style={{ height: `${height}%` }} title={fmtMoney(m.total)} />
                      </div>
                      <span className="adl-chart-label">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="adl-panel">
              <div className="adl-panel-head">
                <div>
                  <h2>Order Status</h2>
                  <p>Current distribution</p>
                </div>
              </div>
              <div className="adl-status-list">
                {Object.keys(STATUS_META).map((key) => {
                  const meta = STATUS_META[key];
                  const count = statusCounts[key] || 0;
                  const pct = statusTotal > 0 ? Math.round((count / statusTotal) * 100) : 0;
                  return (
                    <div key={key} className="adl-status-row">
                      <div className="adl-status-top">
                        <span className="adl-status-dot" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                        <strong>{count}</strong>
                      </div>
                      <div className="adl-status-track">
                        <div className="adl-status-fill" style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="adl-grid">
            <section className="adl-panel adl-panel--grow">
              <div className="adl-panel-head">
                <div>
                  <h2>Recent Orders</h2>
                  <p>Latest 5 orders</p>
                </div>
                <Link to="/admin/orders" className="adl-panel-link">View all <ArrowRight size={15} /></Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="adl-panel-empty">No orders yet.</div>
              ) : (
                <div className="adl-table-wrap">
                  <table className="adl-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => {
                        const meta = STATUS_META[o.status] || STATUS_META.pending;
                        return (
                          <tr key={o._id}>
                            <td>{o.userId?.name || 'Customer'}</td>
                            <td>{fmtMoney(o.totalAmount)}</td>
                            <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                            <td>
                              <span className="adl-status-pill" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="adl-panel">
              <div className="adl-panel-head">
                <div>
                  <h2>Low Stock</h2>
                  <p>Running low (≤ 10)</p>
                </div>
                <AlertTriangle size={20} />
              </div>
              {lowStock.length === 0 ? (
                <div className="adl-panel-empty">All products are well stocked.</div>
              ) : (
                <div className="adl-stock-list">
                  {lowStock.map((p) => (
                    <div key={p._id} className="adl-stock-row">
                      <img src={p.imageUrl || '/logo.png'} alt={p.name} className="adl-stock-img" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }} />
                      <div className="adl-stock-meta">
                        <p className="adl-stock-name">{p.name}</p>
                        <span className={`adl-stock-count ${p.stock === 0 ? 'adl-stock-count--out' : ''}`}>
                          {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
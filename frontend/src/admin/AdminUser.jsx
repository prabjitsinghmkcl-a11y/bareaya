import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import {
  ArrowLeft,
  Search,
  X,
  RefreshCw,
  ShieldCheck,
  Phone,
  Mail,
  Users
} from 'lucide-react';
import { adminFetch, resolveAdminError } from '../utils/adminApi';
import '../styles/admin.css';

const AdminUsers = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(() => {
    try {
      return user || JSON.parse(localStorage.getItem('userInfo')) || null;
    } catch {
      return user || null;
    }
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (user) setUserInfo(user);
  }, [user]);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch('/api/auth/user', { token: userInfo.token });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(resolveAdminError(err, logout, navigate) || '');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.phone || '').includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, roleFilter, searchQuery]);

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
          <h2>Customer Directory</h2>
          <span className="admin-badge admin-badge--count">{users.length} registered</span>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="admin-btn admin-btn--ghost admin-btn--icon"
          title="Refresh customer records"
        >
          <RefreshCw size={14} className={loading ? 'admin-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
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

        <div className="admin-toolbar-right">
          <div className="admin-select-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="user">Patrons / Customers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="admin-loading-card">
          <div className="admin-spinner" />
          <p>Loading user directory…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="admin-empty">
          <Users size={36} className="admin-empty-icon" />
          <p>No customer records found.</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-empty">
          <p>No customers match the current search filter.</p>
          <button
            type="button"
            className="admin-btn admin-btn--ghost admin-btn--sm"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
            }}
            style={{ marginTop: '10px' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Account Tier</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const initial = (u.name || 'C').charAt(0).toUpperCase();
                const isAdmin = u.role === 'admin';

                return (
                  <tr key={u._id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className={`admin-user-avatar ${isAdmin ? 'admin-user-avatar--admin' : ''}`}>
                          {initial}
                        </div>
                        <div className="admin-user-meta">
                          <strong className="admin-user-name">{u.name || 'Customer'}</strong>
                          <span className="admin-user-id">ID: {u._id.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {u.phone ? (
                        <a href={`tel:${u.phone}`} className="admin-link-inline">
                          <Phone size={13} />
                          <span>+91 {u.phone}</span>
                        </a>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </td>

                    <td>
                      {u.email ? (
                        <a href={`mailto:${u.email}`} className="admin-link-inline">
                          <Mail size={13} />
                          <span>{u.email}</span>
                        </a>
                      ) : (
                        <span className="admin-muted">SMS Only</span>
                      )}
                    </td>

                    <td>
                      <span className={`admin-badge ${isAdmin ? 'admin-badge--admin' : 'admin-badge--user'}`}>
                        {isAdmin ? 'Administrator' : 'Customer'}
                      </span>
                    </td>

                    <td>
                      <span className="admin-verified-chip">
                        <ShieldCheck size={14} />
                        <span>Verified</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import { ArrowLeft } from 'lucide-react';
import '../styles/admin.css';

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
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

  useEffect(() => {
    if (user) setUserInfo(user);
  }, [user]);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/auth/user', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not load users');
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, navigate]);

  if (!userInfo || userInfo.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Link to="/admin" className="admin-back"><ArrowLeft size={16} /> Back</Link>
          <h2>Users Directory</h2>
        </div>
      </div>

      {error && <p className="admin-error" style={{ marginBottom: '16px' }}>{error}</p>}
      {loading && <p className="admin-muted">Loading users...</p>}

      {!loading && users.length === 0 && (
        <div className="admin-empty">No users found.</div>
      )}

      {!loading && users.length > 0 && (
        <div className="admin-list">
          {users.map((u) => (
            <div key={u._id} className="admin-row">
              <div className="admin-row-info">
                <div style={{ width: 60, height: 60 }}>
                  <div
                    style={{
                      alignItems: 'center',
                      background: '#f97316',
                      borderRadius: '50%',
                      color: '#ffffff',
                      display: 'flex',
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      height: 44,
                      justifyContent: 'center',
                      width: 44
                    }}
                  >
                    {(u.name || '?').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <p className="admin-row-title">{u.name}</p>
                  <p className="admin-row-sub">{u.phone || u.email}</p>
                </div>
              </div>
              <span className={`admin-badge ${u.role === 'admin' ? 'admin-badge--admin' : 'admin-badge--user'}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
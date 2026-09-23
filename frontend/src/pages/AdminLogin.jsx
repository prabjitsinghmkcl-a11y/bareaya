import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import '../styles/auth.css';

// Dedicated admin login — runs on its own port (admin app), never visible on the customer site.
const AdminLogin = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        if (data.role !== 'admin') {
          setError('This account does not have admin access.');
          return;
        }
        login(data);
        navigate('/admin');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Admin Login</h2>
        <input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
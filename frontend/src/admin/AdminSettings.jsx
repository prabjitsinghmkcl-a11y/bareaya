import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AtSign, CheckCircle2, Clock, MapPin, Phone, Save } from 'lucide-react';
import { AuthContext } from '../context/Authcontext';
import { DEFAULT_SITE_SETTINGS } from '../context/SiteSettingsContext';
import { adminFetch, resolveAdminError } from '../utils/adminApi';
import '../styles/admin.css';

const SETTINGS_FIELDS = [
  'addressLine1',
  'addressLine2',
  'phone',
  'email',
  'weekdayHours',
  'weekendHours',
  'instagramHandle',
  'instagramUrl',
];

const AdminSettings = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(() => {
    try {
      return user || JSON.parse(localStorage.getItem('userInfo')) || null;
    } catch {
      return user || null;
    }
  });
  const [form, setForm] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) setUserInfo(user);
  }, [user]);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    const loadSettings = async () => {
      try {
        const data = await adminFetch('/api/settings');
        const next = SETTINGS_FIELDS.reduce(
          (result, field) => ({
            ...result,
            [field]: data[field] || DEFAULT_SITE_SETTINGS[field],
          }),
          {}
        );
        setForm(next);
      } catch (err) {
        setError(resolveAdminError(err, logout, navigate) || 'Could not load site settings.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, navigate]);

  if (!userInfo || userInfo.role !== 'admin') return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await adminFetch('/api/settings', {
        method: 'PUT',
        token: userInfo.token,
        body: form,
      });
      if (data.settings) {
        setForm((prev) => ({ ...prev, ...data.settings }));
      }
      setSuccess(data.message || 'Site details updated successfully.');
    } catch (err) {
      setError(resolveAdminError(err, logout, navigate) || 'Could not save site settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Link to="/admin" className="admin-back">
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
          <h2>Site Settings</h2>
        </div>
      </div>

      <p className="admin-settings-intro">
        These details appear on the storefront&apos;s Contact page and footer. Changes go live as soon as you save.
      </p>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}
      {success && (
        <div className="admin-alert admin-alert--success">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="admin-loading-card">
          <div className="admin-spinner" />
          <p>Loading site details…</p>
        </div>
      ) : (
        <form className="admin-form admin-card admin-settings-form" onSubmit={handleSubmit}>
          <section className="admin-settings-section">
            <div className="admin-settings-heading">
              <MapPin size={18} />
              <div>
                <h3>Find Us</h3>
                <p>The address shown on the Contact page and as the Head Office in the footer.</p>
              </div>
            </div>
            <div className="admin-settings-grid">
              <label>
                Address line 1
                <input
                  type="text"
                  name="addressLine1"
                  value={form.addressLine1}
                  onChange={handleChange}
                  maxLength={200}
                  required
                />
              </label>
              <label>
                Address line 2
                <input
                  type="text"
                  name="addressLine2"
                  value={form.addressLine2}
                  onChange={handleChange}
                  maxLength={200}
                  required
                />
              </label>
            </div>
          </section>

          <section className="admin-settings-section">
            <div className="admin-settings-heading">
              <Phone size={18} />
              <div>
                <h3>Support</h3>
                <p>Phone and email shown to customers. The email also receives Contact form messages.</p>
              </div>
            </div>
            <div className="admin-settings-grid">
              <label>
                Phone number
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={30}
                  placeholder="+91 92661 45378"
                  required
                />
              </label>
              <label>
                Support email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  maxLength={120}
                  placeholder="care@bareya.in"
                  required
                />
              </label>
            </div>
          </section>

          <section className="admin-settings-section">
            <div className="admin-settings-heading">
              <Clock size={18} />
              <div>
                <h3>Working hours</h3>
                <p>Two lines of opening hours shown on the Contact page.</p>
              </div>
            </div>
            <div className="admin-settings-grid">
              <label>
                Weekdays
                <input
                  type="text"
                  name="weekdayHours"
                  value={form.weekdayHours}
                  onChange={handleChange}
                  maxLength={120}
                  required
                />
              </label>
              <label>
                Weekend
                <input
                  type="text"
                  name="weekendHours"
                  value={form.weekendHours}
                  onChange={handleChange}
                  maxLength={120}
                  required
                />
              </label>
            </div>
          </section>

          <section className="admin-settings-section">
            <div className="admin-settings-heading">
              <AtSign size={18} />
              <div>
                <h3>Instagram</h3>
                <p>The handle and profile link used across the storefront.</p>
              </div>
            </div>
            <div className="admin-settings-grid">
              <label>
                Handle
                <input
                  type="text"
                  name="instagramHandle"
                  value={form.instagramHandle}
                  onChange={handleChange}
                  maxLength={60}
                  placeholder="@bareaya.skin"
                  required
                />
              </label>
              <label>
                Profile URL
                <input
                  type="url"
                  name="instagramUrl"
                  value={form.instagramUrl}
                  onChange={handleChange}
                  maxLength={300}
                  placeholder="https://instagram.com/bareaya.skin"
                  required
                />
              </label>
            </div>
          </section>

          <div className="admin-settings-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettings;

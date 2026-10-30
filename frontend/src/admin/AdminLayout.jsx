import React, { useContext, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/Authcontext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  PlusCircle,
  Users,
  LogOut,
  Menu,
  X,
  Leaf,
  Globe,
  ExternalLink,
  Settings
} from 'lucide-react';
import AdminOrderToasts from './AdminOrderToasts';
import '../styles/admin-dashboard.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/add-product', label: 'Add Product', icon: PlusCircle },
  { to: '/admin/users', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Site Settings', icon: Settings }
];

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const initial = (user.name || 'Admin').charAt(0).toUpperCase();

  return (
    <div className="adl">
      <div
        className={`adl-overlay ${sidebarOpen ? 'adl-overlay--open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`adl-sidebar ${sidebarOpen ? 'adl-sidebar--open' : ''}`}>
        <div className="adl-brand">
          <span className="adl-brand-mark">
            <Leaf size={20} />
          </span>
          <div className="adl-brand-text">
            <strong>Bareaya</strong>
            <span>Admin Console</span>
          </div>
          <button className="adl-close" onClick={closeSidebar} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="adl-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeSidebar}
                className={({ isActive }) => `adl-link ${isActive ? 'adl-link--active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="adl-sidebar-footer">
          <Link to="/" target="_blank" rel="noreferrer" className="adl-store-link" title="Open storefront in new tab">
            <Globe size={16} />
            <span>View Live Store</span>
            <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
          </Link>
          <button className="adl-logout" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Surface */}
      <div className="adl-main">
        <header className="adl-topbar">
          <button className="adl-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>

          <div className="adl-topbar-breadcrumbs">
            <span className="adl-badge-environment">Store Management</span>
          </div>

          <div className="adl-topbar-actions">
            <Link to="/" target="_blank" rel="noreferrer" className="adl-topbar-store-btn" title="View customer storefront">
              <Globe size={15} />
              <span>Visit Store</span>
            </Link>

            <div className="adl-topbar-user">
              <span className="adl-avatar">{initial}</span>
              <div className="adl-topbar-meta">
                <strong>{user.name}</strong>
                <span>{user.email || 'Administrator'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="adl-content">
          <Outlet />
        </main>
      </div>

      {/* Live "new order received" notifications */}
      <AdminOrderToasts />
    </div>
  );
};

export default AdminLayout;

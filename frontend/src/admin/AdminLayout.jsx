import React, { useContext, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
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
  Leaf
} from 'lucide-react';
import '../styles/admin-dashboard.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/add-product', label: 'Add Product', icon: PlusCircle },
  { to: '/admin/users', label: 'Customers', icon: Users }
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

  return (
    <div className="adl">
      <div className={`adl-overlay ${sidebarOpen ? 'adl-overlay--open' : ''}`} onClick={closeSidebar} aria-hidden="true" />

      <aside className={`adl-sidebar ${sidebarOpen ? 'adl-sidebar--open' : ''}`}>
        <div className="adl-brand">
          <span className="adl-brand-mark"><Leaf size={20} /></span>
          <div className="adl-brand-text">
            <strong>Bareaya</strong>
            <span>Admin Console</span>
          </div>
          <button className="adl-close" onClick={closeSidebar} aria-label="Close menu"><X size={20} /></button>
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
          <button className="adl-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="adl-main">
        <header className="adl-topbar">
          <button className="adl-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="adl-topbar-user">
            <span className="adl-avatar">{(user.name || 'A').charAt(0).toUpperCase()}</span>
            <div className="adl-topbar-meta">
              <strong>{user.name}</strong>
              <span>{user.email || 'Administrator'}</span>
            </div>
          </div>
        </header>

        <main className="adl-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
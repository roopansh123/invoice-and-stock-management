import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', icon: '📊', to: '/dashboard' },
  { label: 'New Bill', icon: '🧾', to: '/billing/new' },
  { section: 'Manage' },
  { label: 'Invoices', icon: '📑', to: '/billing' },
  { label: 'Inventory', icon: '👟', to: '/inventory' },
  { label: 'Customers', icon: '👥', to: '/customers' },
  { section: 'Procurement' },
  { label: 'Purchases', icon: '📦', to: '/purchases' },
  { label: 'Suppliers', icon: '🏭', to: '/suppliers' },
  { section: 'Analytics' },
  { label: 'Reports', icon: '📈', to: '/reports' },
  { section: 'Config' },
  { label: 'Company Settings', icon: '⚙️', to: '/settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-row">
            <div className="brand-icon">👟</div>
            <div>
              <div className="brand-name">DURGA FOOTWEAR</div>
              <div className="brand-sub">Footware Mgmt</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section-label">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                end={item.to === '/billing'}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '6px' }} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import Icon from './Icon';

const links = [
  { to: '/app', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/app/animals', label: 'Animals', icon: 'cow' },
  { to: '/app/milk', label: 'Milk Records', icon: 'milk' },
  { to: '/app/health', label: 'Health & Medicine', icon: 'health' },
  { to: '/app/breeding', label: 'Breeding & Pregnancy', icon: 'heart' },
  { to: '/app/reports', label: 'Reports', icon: 'chart' },
  { to: '/app/settings', label: 'Settings', icon: 'settings' },
];

export default function Layout({ children }) {
  const { session } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const email = session?.user?.email || '';

  async function logout() {
    await supabase.auth.signOut();
    nav('/login');
  }

  return (
    <div className="shell">
      <aside className={`sidebar glass ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-logo"><Icon name="drop" size={22} /></span>
          <div><strong>DairyFarm</strong><small>Herd Manager</small></div>
        </div>
        <nav>
          {links.map((l, i) => (
            <motion.div key={l.to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <NavLink to={l.to} end={l.end} className="nav-link" onClick={() => setOpen(false)}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
                    <Icon name={l.icon} /><span>{l.label}</span>
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar">{email.slice(0, 1).toUpperCase()}</span>
            <span className="user-email" title={email}>{email}</span>
          </div>
          <button className="btn neu full" onClick={logout}><Icon name="logout" /> Log out</button>
        </div>
      </aside>
      <AnimatePresence>
        {open && <motion.div className="scrim" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      </AnimatePresence>
      <div className="main">
        <div className="topbar glass">
          <button className="neu-icon menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <span className="topbar-title">DairyFarm</span>
          <span className="topbar-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

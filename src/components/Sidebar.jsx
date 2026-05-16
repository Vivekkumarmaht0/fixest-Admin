import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Wrench,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Wrench className="w-6 h-6 text-white" />
        </div>
        <span>Fixest Admin</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <ClipboardList className="w-5 h-5" />
          <span>Bookings</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <BarChart3 className="w-5 h-5" />
          <span>Analytics</span>
        </NavLink>
        <NavLink to="/services" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Settings className="w-5 h-5" />
          <span>Services</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const navItems = [
  { to: '/',              icon: 'home',                    label: 'Home' },
  { to: '/rider/tasks',   icon: 'event_note',              label: 'Bookings' },
  { to: '/rider/earnings',icon: 'account_balance_wallet',  label: 'Earnings' },
  { to: '/rider/settings',icon: 'person',                  label: 'Profile' },
];

export default function RiderSidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  /* Lock body scroll when sidebar drawer is open on mobile */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay — blurred backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} lg:hidden`}
      />

      {/* Sidebar panel */}
      <nav
        className={`glass-nav fixed left-0 top-0 h-screen w-[260px] z-50 flex flex-col py-5 gap-0
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand + mobile close */}
        <div className="px-5 pb-5 mb-1 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img src="/fixest-logo.png" alt="Fixest Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-[16px] bg-gradient-to-br from-[#004ac6] to-[#006591] bg-clip-text text-transparent tracking-tight leading-tight truncate">
                Fixest Rider
              </h1>
              <p className="text-[10px] text-[#737686] uppercase tracking-wider mt-0.5">Rider Portal</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-[#737686] hover:bg-white/40 active:bg-white/60 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex flex-col gap-0.5 px-3 flex-1 pt-2 overflow-y-auto">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[13px] font-medium tracking-wide
                ${isActive
                  ? 'bg-gradient-to-r from-[#004ac6]/12 to-transparent text-[#004ac6] border-l-4 border-[#004ac6] font-bold'
                  : 'text-[#434655] hover:bg-white/40 active:bg-white/60 hover:translate-x-0.5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-[22px] flex-shrink-0 ${isActive ? 'icon-fill' : ''}`}>{icon}</span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 pt-3 border-t border-white/20 flex flex-col gap-0.5 safe-bottom">
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#434655] hover:bg-white/40 active:bg-white/60 transition-all text-[12px] tracking-wide">
            <span className="material-symbols-outlined text-[20px]">help</span>
            Support
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6]/40 active:bg-[#ffdad6]/70 transition-all text-[12px] tracking-wide w-full cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}

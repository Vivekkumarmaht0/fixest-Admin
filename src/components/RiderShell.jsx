import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import RiderSidebar from './RiderSidebar';

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {}
}

export default function RiderShell({ children }) {
  const [profile, setProfile] = useState({ name: 'Rider', initial: 'R', id: null });
  const [isOnline, setIsOnline] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
          .from('profiles')
          .select('full_name, is_online')
          .eq('id', user.id)
          .maybeSingle();
          
        if (data) {
          const name = data.full_name || user.email?.split('@')[0] || 'Rider';
          setProfile({ name, initial: name.charAt(0).toUpperCase(), id: user.id });
          setIsOnline(data.is_online ?? true);
        }
      } catch (err) {
        console.error('Error fetching rider profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const toggleOnline = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (profile.id) {
      await supabase.from('profiles').update({ is_online: nextState }).eq('id', profile.id);
    }
  };

  useEffect(() => {
    if (!profile.id) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();

    const channel = supabase
      .channel(`rider-notifications-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        setNotifications(prev => {
          if (prev.some(n => n.id === payload.new.id)) return prev;
          return [payload.new, ...prev].slice(0, 10);
        });
        setUnreadCount(prev => prev + 1);

        playNotificationChime();

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.new.title, {
            body: payload.new.message,
            tag: payload.new.id,
            icon: '/pwa-192.png',
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  const markNotificationsAsRead = async () => {
    if (unreadCount === 0 || notifications.length === 0) return;
    
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  return (
    <div className="ambient-bg min-h-screen flex bg-[#f8fafc] font-sans">
      
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <RiderSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:ml-[260px] relative z-10 pb-[72px] lg:pb-0">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#c3c6d7]/30 shadow-sm px-4 lg:px-6 py-3 flex items-center justify-between">
          {/* Logo and Menu button */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-800 focus:outline-none flex items-center"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <h2 className="text-[20px] lg:text-[22px] font-extrabold text-[#004ac6] tracking-tight">Fixest</h2>
          </div>

        <div className="flex items-center gap-4">
          {/* Online Toggle */}
          <button 
            onClick={toggleOnline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
              isOnline ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`}></span>
            <span className={`text-[12px] font-bold ${isOnline ? 'text-green-700' : 'text-slate-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (!notificationsOpen) markNotificationsAsRead();
              }}
              className="text-slate-500 hover:text-slate-700 relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-[300px] sm:w-[340px] bg-white border border-[#c3c6d7]/30 shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col max-h-[400px]">
                <div className="px-4 py-3 border-b border-[#c3c6d7]/30 bg-slate-50/50 flex justify-between items-center">
                  <span className="font-bold text-[14px] text-[#0b1c30]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-[#004ac6] text-white px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                
                <div className="overflow-y-auto flex-1 overscroll-contain">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center flex flex-col items-center">
                      <span className="material-symbols-outlined text-[#c3c6d7] text-[40px] mb-2">notifications_off</span>
                      <p className="text-[12px] text-[#737686] font-medium">No new notifications.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#c3c6d7]/20">
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate('/rider/tasks');
                          }}
                          className={`p-4 transition-colors cursor-pointer ${n.is_read ? 'bg-white hover:bg-slate-50' : 'bg-[#f0f5ff] hover:bg-[#e5eeff]'}`}
                        >
                          <p className="text-[13px] font-bold text-[#0b1c30] mb-0.5">{n.title}</p>
                          <p className="text-[12px] text-[#434655] leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-[#737686] mt-2 font-medium">
                            {new Date(n.created_at).toLocaleString('en-IN', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <div className="relative">
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-10 h-10 rounded-full bg-[#004ac6] text-white flex items-center justify-center font-bold text-[16px] shadow-sm uppercase focus:outline-none"
            >
              {profile.initial}
            </button>
            
            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#c3c6d7]/30 shadow-2xl rounded-2xl z-50 overflow-hidden py-1">
                <button 
                  onClick={async () => {
                    setProfileDropdownOpen(false);
                    await supabase.auth.signOut();
                    navigate('/login');
                  }}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[14px] text-[#ba1a1a] hover:bg-red-50 transition-all font-semibold"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 lg:px-8 pt-5 pb-8 overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-[#c3c6d7]/30 flex items-center justify-between px-4 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        
        {/* Home */}
        <NavLink to="/" end className={({ isActive }) => 
          `flex flex-col items-center justify-center w-16 h-full transition-all duration-150
          ${isActive ? 'text-[#004ac6] font-bold' : 'text-[#737686] font-medium hover:text-[#004ac6]'}`
        }>
          <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/' ? 'icon-fill' : ''}`}>home</span>
          <span className="text-[10px] mt-0.5">Home</span>
        </NavLink>

        {/* Bookings */}
        <NavLink to="/rider/tasks" className={({ isActive }) => 
          `flex flex-col items-center justify-center w-16 h-full transition-all duration-150
          ${isActive ? 'text-[#004ac6] font-bold' : 'text-[#737686] font-medium hover:text-[#004ac6]'}`
        }>
          <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/rider/tasks' ? 'icon-fill' : ''}`}>event_note</span>
          <span className="text-[10px] mt-0.5">Bookings</span>
        </NavLink>

        {/* Earnings */}
        <NavLink to="/rider/earnings" className={({ isActive }) => 
          `flex flex-col items-center justify-center w-16 h-full transition-all duration-150
          ${isActive ? 'text-[#004ac6] font-bold' : 'text-[#737686] font-medium hover:text-[#004ac6]'}`
        }>
          <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/rider/earnings' ? 'icon-fill' : ''}`}>account_balance_wallet</span>
          <span className="text-[10px] mt-0.5">Earnings</span>
        </NavLink>

        {/* Profile */}
        <NavLink to="/rider/settings" className={({ isActive }) => 
          `flex flex-col items-center justify-center w-16 h-full transition-all duration-150
          ${isActive ? 'text-[#004ac6] font-bold' : 'text-[#737686] font-medium hover:text-[#004ac6]'}`
        }>
          <span className={`material-symbols-outlined text-[26px] ${location.pathname === '/rider/settings' ? 'icon-fill' : ''}`}>person</span>
          <span className="text-[10px] mt-0.5">Profile</span>
        </NavLink>

      </div>
      
      </div> {/* End Main area wrapper */}
    </div>
  );
}

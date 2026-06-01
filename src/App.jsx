import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from './utils/supabase';
import Login    from './pages/Login';
import Signup   from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Bookings  from './pages/Bookings';
import Team      from './pages/Team';
import Settings  from './pages/Settings';
import Sidebar   from './components/Sidebar';
import CookieConsent from './components/CookieConsent';

/* ── Page title lookup ─────────────────────────────── */
const PAGE_LABELS = {
  '/':         { title: 'Dashboard',   icon: 'dashboard'  },
  '/bookings': { title: 'Bookings',    icon: 'event_note' },
  '/team':     { title: 'Team',        icon: 'group'      },
  '/settings': { title: 'Settings',    icon: 'settings'   },
};

const ProtectedRoute = ({ children, isAdmin }) =>
  isAdmin ? <AdminShell>{children}</AdminShell> : <Navigate to="/login" replace />;

/* ── Authenticated shell with sidebar + header ─────── */
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
    
    // Premium dual-tone chime
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
  } catch (err) {
    console.error('Audio chime error:', err);
  }
}

function AdminShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const [profile, setProfile] = useState({ name: 'Admin', initial: 'A' });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const page = PAGE_LABELS[location.pathname] || { title: 'Dashboard', icon: 'dashboard' };

  const VAPID_PUBLIC_KEY = 'BEt668tZ2aTzRrwzk44AUm3NKhFht10l_jTg5N54ifuDmVBszYK-rIvydKBReGJVQh2tS23pMGiaY9Gdw8r14U4';

  const subscribeToWebPush = async (userId) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      if (subscription) {
        const subData = JSON.parse(JSON.stringify(subscription));
        await supabase.from('push_subscriptions').upsert({
          user_id: userId,
          endpoint: subData.endpoint,
          auth_key: subData.keys.auth,
          p256dh_key: subData.keys.p256dh
        }, { onConflict: 'user_id, endpoint' });
      }
    } catch (err) {
      console.error('Error subscribing to push:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      subscribeToWebPush(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
        
      if (data && data.full_name) {
        const name = data.full_name;
        const initial = name.charAt(0).toUpperCase();
        setProfile({ name, initial });
      } else if (user.email) {
        const emailName = user.email.split('@')[0];
        setProfile({ name: emailName, initial: emailName.charAt(0).toUpperCase() });
      }
    } catch (err) {
      console.error('Error fetching profile in AdminShell:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
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

  useEffect(() => {
    // Request permission for system browser notification popup
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    fetchNotifications();
    fetchProfile();

    const channel = supabase
      .channel('realtime-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => {
            if (prev.some(n => n.id === payload.new.id)) return prev;
            return [payload.new, ...prev].slice(0, 10);
          });
          setUnreadCount(prev => prev + 1);

          // 1. Play premium audio chime
          playNotificationChime();

          // 2. Trigger native OS/Phone browser notification popup
          if ('Notification' in window && Notification.permission === 'granted') {
            const title = payload.new.title;
            const options = {
              body: payload.new.message,
              tag: payload.new.id,
              icon: '/pwa-192.png',
              badge: '/favicon.svg',
              requireInteraction: false,
              vibrate: [200, 100, 200, 100, 200, 100, 200],
              silent: false,
              data: { url: '/bookings' }
            };

            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options).catch(swErr => {
                  console.error('SW notification error, falling back:', swErr);
                  try { new Notification(title, options); } catch (e) { }
                });
              });
            } else {
              try { new Notification(title, options); } catch (err) {
                console.error('System notification error:', err);
              }
            }
          }

          // 3. Trigger premium visual floating toast
          setActiveToast({
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type
          });
        } else {
          fetchNotifications();
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.notification-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.profile-container')) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [profileDropdownOpen]);

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (!error) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      if (!error) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    const match = (n.message + " " + (n.title || '')).match(/FIX-[A-Z0-9]+/i);
    if (match) {
      navigate('/bookings', { state: { searchBookingId: match[0] } });
    } else if (n.type === 'new_booking') {
      navigate('/bookings');
    }
    setDropdownOpen(false);
  };

  function timeAgo(dateStr) {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_booking':
        return { icon: 'fiber_new', bg: 'bg-[#004ac6]/10 text-[#004ac6]' };
      default:
        return { icon: 'info', bg: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="ambient-bg min-h-screen flex">
      {/* Ambient blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#004ac6]/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-[#39b8fd]/6 blur-[120px]" />
      </div>

      {/* Sidebar - hidden on mobile, visible on desktop */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:ml-[260px] relative z-10 pb-16 lg:pb-0">

        {/* Top Header */}
        <header className="bg-white border-b border-[#c3c6d7]/30 lg:bg-white/70 lg:backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-5 md:px-8 h-16">
          {/* Left Side: "Fixest" on mobile, Breadcrumb on desktop */}
          <div className="flex items-center gap-3">
            <h1 className="lg:hidden text-[26px] font-extrabold text-[#004ac6] tracking-tight">Fixest</h1>
            
            <div className="hidden lg:flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ac6] text-[20px] icon-fill">{page.icon}</span>
              <h2 className="text-[16px] font-bold text-[#0b1c30] tracking-tight">{page.title}</h2>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            {/* Notification bell and dropdown */}
            <div className="relative notification-container">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative p-2 rounded-full text-[#434655] hover:bg-slate-100 transition-all focus:outline-none"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 min-w-[16px] min-h-[16px] flex items-center justify-center bg-[#ba1a1a] text-white text-[9px] font-extrabold rounded-full animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="fixed md:absolute top-16 md:top-auto right-4 left-4 md:right-0 md:left-auto mt-2.5 md:w-[380px] w-auto bg-white border border-[#c3c6d7]/30 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                  {/* Dropdown Header */}
                  <div className="px-4 py-3 border-b border-[#c3c6d7]/20 flex items-center justify-between bg-slate-50/50">
                    <span className="font-bold text-[14px] text-[#0b1c30]">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-[#004ac6] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Dropdown List */}
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-[#c3c6d7]/10">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-8 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-[#c3c6d7] text-[40px] mb-2">notifications_off</span>
                        <p className="text-[13px] font-medium text-[#737686]">All caught up!</p>
                        <p className="text-[11px] text-[#acb0c0]">No new notifications.</p>
                      </div>
                    ) : (
                      notifications.map(n => {
                        const iconData = getNotificationIcon(n.type);
                        return (
                          <div 
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-all cursor-pointer relative ${!n.is_read ? 'bg-[#004ac6]/5' : ''}`}
                          >
                            {/* Icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconData.bg}`}>
                              <span className="material-symbols-outlined text-[18px]">{iconData.icon}</span>
                            </div>

                            {/* Message content */}
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                                <span className={`text-[12px] font-bold truncate ${!n.is_read ? 'text-[#0b1c30]' : 'text-[#434655]'}`}>
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-[#acb0c0] shrink-0 font-medium">
                                  {timeAgo(n.created_at)}
                                </span>
                              </div>
                              <p className={`text-[11px] leading-relaxed break-words ${!n.is_read ? 'text-[#0b1c30]' : 'text-[#737686]'}`}>
                                {n.message}
                              </p>
                            </div>

                            {/* Unread Indicator Dot */}
                            {!n.is_read && (
                              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#ba1a1a] rounded-full shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-7 w-px bg-[#c3c6d7]/50 mx-1 hidden lg:block" />
            
            {/* Profile Dropdown Container */}
            <div className="relative profile-container flex items-center">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-white/50 transition-all border border-transparent hover:border-white/50 focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-[#004ac6] flex items-center justify-center text-white text-[14px] font-bold shadow-sm uppercase shrink-0">
                  {profile.initial}
                </div>
                <span className="text-[13px] font-medium text-[#0b1c30] hidden lg:block">{profile.name}</span>
                <span className="material-symbols-outlined text-[#737686] text-[18px] hidden lg:block">
                  {profileDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#c3c6d7]/30 shadow-2xl rounded-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-3 duration-200">
                  <NavLink 
                    to="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#434655] hover:bg-slate-50 hover:text-[#0b1c30] transition-all font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Settings
                  </NavLink>
                  <button 
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      await supabase.auth.signOut();
                    }}
                    className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[13px] text-[#ba1a1a] hover:bg-red-50 transition-all font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-white border-t border-[#c3c6d7]/30 flex items-center justify-around z-40 pb-[env(safe-area-inset-bottom)]">
        <NavLink to="/" end className={({ isActive }) => 
          `flex flex-col items-center justify-center w-full h-full relative transition-all duration-150
          ${isActive 
            ? 'text-[#004ac6] border-t-2 border-[#004ac6] bg-gradient-to-b from-[#004ac6]/8 to-transparent font-bold' 
            : 'text-[#737686]'}`
        }>
          <span className="material-symbols-outlined text-[22px]">grid_view</span>
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => 
          `flex flex-col items-center justify-center w-full h-full relative transition-all duration-150
          ${isActive 
            ? 'text-[#004ac6] border-t-2 border-[#004ac6] bg-gradient-to-b from-[#004ac6]/8 to-transparent font-bold' 
            : 'text-[#737686]'}`
        }>
          <span className="material-symbols-outlined text-[22px]">event_note</span>
          <span className="text-[10px] mt-0.5">Bookings</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => 
          `flex flex-col items-center justify-center w-full h-full relative transition-all duration-150
          ${isActive 
            ? 'text-[#004ac6] border-t-2 border-[#004ac6] bg-gradient-to-b from-[#004ac6]/8 to-transparent font-bold' 
            : 'text-[#737686]'}`
        }>
          <span className="material-symbols-outlined text-[22px]">inventory</span>
          <span className="text-[10px] mt-0.5">Inventory</span>
        </NavLink>
        <NavLink to="/team" className={({ isActive }) => 
          `flex flex-col items-center justify-center w-full h-full relative transition-all duration-150
          ${isActive 
            ? 'text-[#004ac6] border-t-2 border-[#004ac6] bg-gradient-to-b from-[#004ac6]/8 to-transparent font-bold' 
            : 'text-[#737686]'}`
        }>
          <span className="material-symbols-outlined text-[22px]">group</span>
          <span className="text-[10px] mt-0.5">Team</span>
        </NavLink>
      </div>

      {/* Premium Visual Toast Notification */}
      {activeToast && (
        <div 
          onClick={() => { handleNotificationClick(activeToast); setActiveToast(null); }}
          className="fixed top-4 right-4 z-[9999] max-w-[360px] w-full bg-white/95 backdrop-blur-lg border border-[#004ac6]/20 shadow-[0_20px_50px_rgba(0,74,198,0.15)] rounded-2xl p-4 flex items-start gap-3.5 transition-all duration-300 animate-in fade-in slide-in-from-top-5 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-[#004ac6] flex items-center justify-center text-white shrink-0 shadow-md animate-bounce">
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-extrabold text-[13px] text-[#0b1c30] leading-tight">
                {activeToast.title}
              </h4>
              <button onClick={(e) => { e.stopPropagation(); setActiveToast(null); }} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <p className="text-[11.5px] leading-relaxed text-[#434655] mt-1 pr-2 break-words font-medium">
              {activeToast.message}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Root App ──────────────────────────────────────── */
function App() {
  const [session, setSession] = useState(null);
  const [role,    setRole]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else { setRole(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (uid) => {
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
      if (data) setRole(data.role);
    } catch (err) {
      console.error('Role fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="flex flex-col items-center gap-3">
          Loading Fixest Admin…
        </div>
      </div>
    );
  }

  const isAdmin = session && (role === 'admin' || role === 'staff');

  return (
    <Router>
      <Routes>
        <Route path="/login"    element={!isAdmin ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/signup"   element={!isAdmin ? <Signup /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!isAdmin ? <ForgotPassword /> : <Navigate to="/" replace />} />
        <Route path="/"         element={<ProtectedRoute isAdmin={isAdmin}><Dashboard /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute isAdmin={isAdmin}><Bookings  /></ProtectedRoute>} />
        <Route path="/team"     element={<ProtectedRoute isAdmin={isAdmin}><Team      /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute isAdmin={isAdmin}><Settings  /></ProtectedRoute>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsent />
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { Link, useNavigate } from 'react-router-dom';

export default function RiderDashboard() {
  const [profileName, setProfileName] = useState('Rider');
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, cancelled: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
        if (profile?.full_name) {
          setProfileName(profile.full_name.split(' ')[0]);
        }

        // Fetch bookings assigned to rider
        const { data: bookings, error } = await supabase
          .from('bookings')
          .select('id, service_id, status, created_at, full_name, brand, model')
          .eq('assigned_rider', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Calculate stats
        const counts = (bookings || []).reduce((acc, b) => {
          acc.total++;
          if (b.status === 'Cancelled') acc.cancelled++;
          else if (['Device Picked Up', 'Delivered', 'Diagnosing'].includes(b.status)) acc.completed++;
          else acc.active++;
          return acc;
        }, { total: 0, active: 0, completed: 0, cancelled: 0 });

        setStats(counts);
        setRecentTasks((bookings || []).slice(0, 5));

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-5 sm:space-y-6 animate-pulse">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 sm:w-64 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-64 sm:w-80"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-3.5 sm:p-6 border border-[#e5e7eb]">
              <div className="h-9 w-9 bg-slate-200 rounded-lg mb-3"></div>
              <div className="h-4 w-20 bg-slate-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e5e7eb] min-h-[300px]">
          <div className="h-6 bg-slate-200 rounded w-32 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Bookings',  value: stats.total,     icon: 'book_online',  iconBg: 'bg-[#e5eeff]',       iconColor: 'text-[#004ac6]', trend: '+12%', trendUp: true },
    { label: 'Active Repairs',  value: stats.active,    icon: 'engineering',  iconBg: 'bg-[#585be6]/15',    iconColor: 'text-[#3e3fcc]' },
    { label: 'Completed',       value: stats.completed, icon: 'check_circle', iconBg: 'bg-[#39b8fd]/15',   iconColor: 'text-[#006591]', trend: '+5%',  trendUp: true },
    { label: 'Cancelled',       value: stats.cancelled, icon: 'cancel',       iconBg: 'bg-[#ffdad6]',       iconColor: 'text-[#93000a]', trend: '-2%',  trendUp: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hero Banner */}
      <div 
        className="rounded-2xl text-white shadow-lg relative overflow-hidden flex items-center justify-between aspect-[2.1/1] sm:aspect-auto sm:min-h-[240px] lg:min-h-[320px] xl:min-h-[380px] bg-cover bg-right sm:bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/rider-hero-bg.png')" }}
      >
        <div className="relative z-10 w-[60%] sm:w-[70%] pl-5 sm:pl-8 lg:pl-12 xl:pl-16">
          <p className="text-[11px] sm:text-[16px] lg:text-[18px] text-white/95 font-semibold mb-0.5 sm:mb-2">Hello, {profileName} 👋</p>
          <h2 className="text-[17px] sm:text-[28px] lg:text-[36px] xl:text-[42px] font-extrabold leading-tight mb-1 sm:mb-4 tracking-tight">Ready to take<br/>new bookings?</h2>
          <p className="text-[9px] sm:text-[14px] lg:text-[16px] text-white/80 leading-relaxed font-medium">You're doing great! Keep it up.</p>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pr-4 sm:pr-8 lg:pr-12 xl:pr-16 translate-y-3 sm:translate-y-0">
          <button 
            onClick={() => navigate('/rider/tasks')}
            className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full bg-white text-[#004ac6] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[24px] lg:text-[28px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Dashboard Overview */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-[20px] sm:text-[28px] font-bold tracking-tight text-[#0b1c30] leading-tight">Dashboard Overview</h2>
            <p className="text-[13px] text-[#434655] mt-0.5 sm:mt-1">Real-time metrics and recent activities.</p>
          </div>
          <button onClick={() => navigate('/rider/tasks')} className="text-[12px] font-bold text-[#004ac6] flex items-center gap-0.5">
            View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Metric Cards — 2 cols mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {metricCards.map((c, i) => (
            <div key={i} className="glass-card rounded-2xl p-3.5 sm:p-6 group hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              {/* Ambient glow blob */}
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#004ac6]/5 rounded-full blur-2xl group-hover:bg-[#004ac6]/10 transition-colors" />

              {/* Top row: icon + trend */}
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-symbols-outlined ${c.iconColor} icon-fill text-[20px]`}>{c.icon}</span>
                </div>
                {c.trend && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5
                    ${c.trendUp ? 'text-[#004ac6] bg-[#004ac6]/10' : 'text-[#434655] bg-[#d3e4fe]'}`}>
                    <span className="material-symbols-outlined text-[11px]">{c.trendUp ? 'trending_up' : 'trending_down'}</span>
                    {c.trend}
                  </span>
                )}
              </div>

              {/* Value section */}
              <div className="relative z-10">
                <p className="text-[11px] font-medium text-[#434655] mb-0.5 tracking-wide leading-tight truncate">{c.label}</p>
                <h3 className="text-[28px] sm:text-[40px] font-bold text-[#0b1c30] leading-none tracking-tight">{c.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[16px] font-extrabold text-[#0b1c30]">Recent Activity</h3>
          <button 
            onClick={() => navigate('/rider/tasks')}
            className="text-[12px] font-bold text-[#004ac6] flex items-center gap-0.5"
          >
            View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#c3c6d7]/40 overflow-hidden divide-y divide-[#c3c6d7]/30">
          {recentTasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[13px] font-medium text-[#737686]">No recent tasks available.</p>
            </div>
          ) : (
            recentTasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => navigate('/rider/tasks')}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e5eeff] text-[#004ac6] font-bold text-[14px] flex items-center justify-center shrink-0">
                    {getInitials(task.full_name)}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold text-[#0b1c30] leading-tight">{task.full_name || 'Customer'}</h4>
                    <p className="text-[11px] text-[#737686] mt-0.5">{task.brand} {task.model}</p>
                    <p className="text-[10px] text-[#737686] mt-1">{new Date(task.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[11px] font-extrabold text-[#004ac6]">{task.service_id || task.id.substring(0, 8)}</span>
                    <span className="px-2 py-0.5 rounded bg-[#e5eeff] text-[#004ac6] text-[9px] font-bold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[#004ac6]"></span>
                      Booking
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-slate-400">chevron_right</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

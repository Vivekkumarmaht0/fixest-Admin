import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE = {
  'Booking Received': 'bg-[#d3e4fe] text-[#0b1c30] border-[#c3c6d7]/30',
  'Device Picked Up': 'bg-[#e1e0ff] text-[#3e3fcc] border-[#585be6]/20',
  'Diagnosing':       'bg-[#fff3cd] text-[#7a5a00] border-[#ffc107]/20',
  'Repaired':         'bg-[#e5eeff] text-[#004ac6] border-[#004ac6]/20',
  'Out for Delivery': 'bg-[#c9e6ff]/60 text-[#004666] border-[#39b8fd]/30',
  'Delivered':        'bg-emerald-50 text-emerald-700 border-emerald-300/30',
  'Cancelled':        'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/20',
};

const STATUS_DOT = {
  'Booking Received': 'bg-[#737686]',
  'Device Picked Up': 'bg-[#3e3fcc] animate-pulse',
  'Diagnosing':       'bg-amber-500 animate-pulse',
  'Repaired':         'bg-[#004ac6] animate-pulse',
  'Out for Delivery': 'bg-[#006591]',
  'Delivered':        'bg-emerald-600',
  'Cancelled':        'bg-[#ba1a1a]',
};

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, cancelled: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (!data) return;
      const counts = data.reduce((acc, b) => {
        acc.total++;
        if (b.status === 'Cancelled') acc.cancelled++;
        else if (b.status === 'Delivered') acc.completed++;
        else acc.active++;
        return acc;
      }, { total: 0, active: 0, completed: 0, cancelled: 0 });
      setStats(counts);
      setRecent(data.slice(0, 7));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-[#434655]">
        <span className="material-symbols-outlined text-[48px] text-[#004ac6] animate-spin">progress_activity</span>
        <p className="text-[14px] font-medium">Loading Dashboard…</p>
      </div>
    </div>
  );

  const metricCards = [
    { label: 'Total Bookings',  value: stats.total,     icon: 'book_online',  iconBg: 'bg-[#e5eeff]',       iconColor: 'text-[#004ac6]', trend: '+12%', trendUp: true },
    { label: 'Active Repairs',  value: stats.active,    icon: 'engineering',  iconBg: 'bg-[#585be6]/15',    iconColor: 'text-[#3e3fcc]' },
    { label: 'Completed',       value: stats.completed, icon: 'check_circle', iconBg: 'bg-[#39b8fd]/15',   iconColor: 'text-[#006591]', trend: '+5%',  trendUp: true },
    { label: 'Cancelled',       value: stats.cancelled, icon: 'cancel',       iconBg: 'bg-[#ffdad6]',       iconColor: 'text-[#93000a]', trend: '-2%',  trendUp: false },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[20px] sm:text-[28px] font-bold tracking-tight text-[#0b1c30] leading-tight">Dashboard Overview</h2>
        <p className="text-[13px] text-[#434655] mt-0.5 sm:mt-1">Real-time metrics and recent repair activities.</p>
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

      {/* Recent Activity — mobile-optimized card list + desktop table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-white/40 flex justify-between items-center bg-white/30">
          <h3 className="text-[15px] sm:text-[18px] font-semibold text-[#0b1c30]">Recent Activity</h3>
          <button
            onClick={() => navigate('/bookings')}
            className="text-[12px] font-medium text-[#004ac6] hover:text-[#2563eb] flex items-center gap-1 transition-colors"
          >
            View All <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        </div>

        {/* ── Mobile: Card-based list (< sm) ── */}
        <div className="sm:hidden">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-[#434655]">
              <span className="material-symbols-outlined text-[40px] text-[#c3c6d7]">inbox</span>
              <p className="font-semibold text-[#0b1c30]">No Bookings Yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/20">
              {recent.map((b, i) => {
                const sc = STATUS_BADGE[b.status] || STATUS_BADGE['Booking Received'];
                const dc = STATUS_DOT[b.status]   || 'bg-[#737686]';
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate('/bookings')}
                    className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors active:bg-white/60 ${i % 2 === 1 ? 'bg-white/30' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[11px] font-bold text-[#0b1c30] flex-shrink-0">
                      {initials(b.full_name)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[13px] text-[#0b1c30] truncate">{b.full_name || '—'}</span>
                        <span className="font-mono text-[10px] font-bold text-[#004ac6] flex-shrink-0">
                          #{(b.service_id || b.id.substring(0,6)).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[11px] text-[#737686] truncate">{b.brand} {b.model}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap flex-shrink-0 ${sc}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dc}`} />
                          {(b.status || 'Received').split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Desktop: Table (≥ sm) ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: '500px' }}>
            <thead>
              <tr className="border-b border-[#c3c6d7]/40 bg-[#e5eeff]/40">
                <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider">ID</th>
                <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider">Customer</th>
                <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider">Device</th>
                <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-[#0b1c30]">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#434655]">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-[40px] text-[#c3c6d7]">inbox</span>
                      <p className="font-semibold text-[#0b1c30]">No Bookings Yet</p>
                    </div>
                  </td>
                </tr>
              ) : recent.map((b, i) => {
                const sc = STATUS_BADGE[b.status] || STATUS_BADGE['Booking Received'];
                const dc = STATUS_DOT[b.status]   || 'bg-[#737686]';
                return (
                  <tr
                    key={b.id}
                    onClick={() => navigate('/bookings')}
                    className={`border-b border-white/20 hover:bg-white/60 transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-white/40' : ''}`}
                  >
                    <td className="py-3 px-6 font-mono font-bold text-[#004ac6] text-[13px] whitespace-nowrap">
                      #{(b.service_id || b.id.substring(0, 8)).toUpperCase()}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[10px] font-bold text-[#0b1c30] flex-shrink-0">
                          {initials(b.full_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[13px] truncate">{b.full_name || '—'}</div>
                          <div className="text-[11px] text-[#737686]">{b.phone_number || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-[#434655] text-[13px]">
                      {b.brand} {b.model}
                    </td>
                    <td className="py-3 px-6 text-[#434655] text-[12px] hidden md:table-cell whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${sc} whitespace-nowrap`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dc}`} />
                        {b.status || 'Received'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

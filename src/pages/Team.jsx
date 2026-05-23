import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { SkeletonTable, SkeletonCard } from '../components/ui/SkeletonVariants';

const ROLE_BADGE = {
  admin:      'bg-[#e5eeff] text-[#004ac6] border-[#004ac6]/20',
  technician: 'bg-[#c9e6ff]/60 text-[#006591] border-[#39b8fd]/20',
  manager:    'bg-[#e1e0ff] text-[#3e3fcc] border-[#585be6]/20',
  rider:      'bg-[#fff4e5] text-[#e65100] border-[#ffb74d]/20',
};

const STATUS_DOT = {
  Active:  'bg-[#4caf50]',
  Away:    'bg-amber-400',
  Offline: 'bg-[#737686]',
};

const TABS = ['All Staff', 'Admin', 'Technician', 'Manager', 'Rider'];

// Helper to calculate time ago
function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 5) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Generate an avatar background deterministically
function getAvatarBg(str) {
  const bgs = [
    'from-[#004ac6] to-[#2563eb]',
    'from-[#006591] to-[#39b8fd]',
    'from-[#3e3fcc] to-[#585be6]',
    'from-[#b81d13] to-[#ef5350]'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgs[Math.abs(hash) % bgs.length];
}

export default function Team() {
  const [tab, setTab]         = useState('All Staff');
  const [search, setSearch]   = useState('');
  const [team, setTeam]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('role', 'customer')
          .order('full_name');

        if (error) throw error;
        
        // Map data to UI format
        const mappedTeam = data.map(profile => {
          const name = profile.full_name || 'Unnamed';
          const avatar = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          
          let status = 'Offline';
          if (profile.is_online) status = 'Active';
          else if (profile.is_active) status = 'Away';

          return {
            id: profile.id,
            name: name,
            email: profile.email || 'No email',
            phone: profile.phone || 'No phone',
            role: profile.role,
            status: status,
            last: timeAgo(profile.updated_at),
            avatar: avatar,
            avatarBg: getAvatarBg(name)
          };
        });

        setTeam(mappedTeam);
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  const filtered = team.filter(m => {
    const matchRole = tab === 'All Staff' || m.role.toLowerCase() === tab.toLowerCase();
    const q = search.toLowerCase();
    return matchRole && (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="text-[20px] sm:text-[28px] font-bold tracking-tight text-[#0b1c30] leading-tight">Team Management</h2>
          <p className="text-[13px] text-[#434655] mt-0.5">Manage access, roles, and view active staff.</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-card rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-white/40 bg-white/30 space-y-2.5 sm:space-y-3">
          {/* Filter tabs — horizontal scroll on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[13px] font-semibold transition-all whitespace-nowrap flex-shrink-0 border
                  ${tab === t ? 'bg-[#004ac6] text-white border-[#004ac6] shadow-sm' : 'text-[#434655] bg-white/50 border-white/50 hover:bg-white/80 active:bg-white/90'}`}>
                {t}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[18px] pointer-events-none">search</span>
            <input type="text" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)}
              className="glass-input w-full pl-9 sm:pl-10 pr-4 py-2 rounded-xl text-[13px] text-[#0b1c30] placeholder:text-[#737686]" />
          </div>
        </div>

        {loading ? (
          <>
            <div className="sm:hidden space-y-4 p-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="hidden sm:block p-4">
              <SkeletonTable columns={5} rows={5} />
            </div>
          </>
        ) : (
          <>
            {/* ── Mobile: Card-based member list (< sm) ── */}
            <div className="sm:hidden divide-y divide-white/20">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-[#434655]">
                  <span className="material-symbols-outlined text-[40px] text-[#c3c6d7]">group_off</span>
                  <p className="font-semibold text-[#0b1c30]">No members found</p>
                </div>
              ) : filtered.map((m, i) => (
                <div key={m.id} className={`px-3.5 py-3 flex items-center gap-3 ${i%2===1 ? 'bg-white/30' : ''}`}>
                  {/* Avatar with status dot */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${m.avatarBg} flex items-center justify-center text-white text-[12px] font-bold shadow-sm`}>
                      {m.avatar}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${STATUS_DOT[m.status]}`} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[13px] text-[#0b1c30] truncate">{m.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 uppercase ${ROLE_BADGE[m.role] || 'bg-slate-100 text-slate-600'}`}>
                        {m.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[11px] text-[#737686] truncate">{m.email}</span>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-[#434655] flex-shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[m.status]}`} />
                        {m.status}
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[#737686] hover:bg-white/60 active:bg-white/80 transition-colors flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  </button>
                </div>
              ))}
            </div>

            {/* ── Desktop: Data table (≥ sm) ── */}
            <div className="hidden sm:block overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse" style={{ minWidth: '500px' }}>
                <thead>
                  <tr className="bg-[#e5eeff]/40 border-b border-[#c3c6d7]/40">
                    <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider">Member</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider">Role</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider hidden md:table-cell">Last Active</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-[#434655] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-[#0b1c30]">
                  {filtered.map((m, i) => (
                    <tr key={m.id} className={`border-b border-white/20 hover:bg-white/60 transition-colors ${i%2===1?'bg-white/30':''}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${m.avatarBg} flex items-center justify-center text-white text-[12px] font-bold shadow-sm`}>
                              {m.avatar}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${STATUS_DOT[m.status]}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[14px] truncate">{m.name}</div>
                            <div className="text-[12px] text-[#737686] truncate">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-bold border uppercase ${ROLE_BADGE[m.role] || 'bg-slate-100 text-slate-600'}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#0b1c30]">
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[m.status]}`} />
                          {m.status}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[12px] text-[#737686] hidden md:table-cell">{m.last}</td>
                      <td className="py-4 px-6 text-right">
                        <button className="p-1.5 rounded-lg text-[#737686] hover:bg-white/60 hover:text-[#0b1c30] transition-colors">
                          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-[#434655]">
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-[40px] text-[#c3c6d7]">group_off</span>
                        <p className="font-semibold text-[#0b1c30]">No members found</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {filtered.length > 0 && (
              <div className="px-3.5 sm:px-6 py-3 border-t border-white/30 bg-white/20 flex items-center justify-between mt-auto">
                <p className="text-[11px] sm:text-[12px] text-[#737686]">Showing {filtered.length} of {team.length} members</p>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg text-[#737686] hover:bg-white/60 transition-colors disabled:opacity-30" disabled>
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <span className="px-3 py-1.5 rounded-lg bg-[#004ac6] text-white text-[12px] font-bold">1</span>
                  <button className="p-1.5 rounded-lg text-[#737686] hover:bg-white/60 transition-colors disabled:opacity-30" disabled>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

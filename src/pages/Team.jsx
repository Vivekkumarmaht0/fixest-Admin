import React, { useState, useEffect } from 'react';

const TEAM = [
  { id:1, name:'Sarah Jenkins',   email:'s.jenkins@fixest.com',  role:'Admin',      status:'Active',  last:'Just now',   avatar:'SJ', avatarBg:'from-[#004ac6] to-[#2563eb]' },
  { id:2, name:'Marcus Chen',     email:'m.chen@fixest.com',     role:'Technician', status:'Active',  last:'2 hours ago', avatar:'MC', avatarBg:'from-[#006591] to-[#39b8fd]' },
  { id:3, name:'Elena Rodriguez', email:'elena.r@fixest.com',    role:'Manager',    status:'Offline', last:'Yesterday',   avatar:'ER', avatarBg:'from-[#3e3fcc] to-[#585be6]' },
  { id:4, name:'David Kim',       email:'dkim@fixest.com',       role:'Technician', status:'Away',    last:'45 mins ago', avatar:'DK', avatarBg:'from-[#006591] to-[#39b8fd]' },
  { id:5, name:'Priya Sharma',    email:'p.sharma@fixest.com',   role:'Technician', status:'Active',  last:'10 mins ago', avatar:'PS', avatarBg:'from-[#006591] to-[#39b8fd]' },
  { id:6, name:'Raj Patel',       email:'raj.p@fixest.com',      role:'Manager',    status:'Active',  last:'1 hour ago',  avatar:'RP', avatarBg:'from-[#3e3fcc] to-[#585be6]' },
];

const ROLE_BADGE = {
  Admin:      'bg-[#e5eeff] text-[#004ac6] border-[#004ac6]/20',
  Technician: 'bg-[#c9e6ff]/60 text-[#006591] border-[#39b8fd]/20',
  Manager:    'bg-[#e1e0ff] text-[#3e3fcc] border-[#585be6]/20',
};

const STATUS_DOT = {
  Active:  'bg-[#4caf50]',
  Away:    'bg-amber-400',
  Offline: 'bg-[#737686]',
};

const TABS = ['All Staff', 'Admins', 'Technicians', 'Managers'];

export default function Team() {
  const [tab, setTab]         = useState('All Staff');
  const [search, setSearch]   = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('Technician');
  const [inviteSent, setInviteSent]   = useState(false);

  /* Lock body scroll when invite modal is open */
  useEffect(() => {
    if (showInvite) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showInvite]);

  const filtered = TEAM.filter(m => {
    const matchRole = tab === 'All Staff' || m.role === tab.slice(0, -1);
    const q = search.toLowerCase();
    return matchRole && (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  });

  const handleInvite = (e) => {
    e.preventDefault();
    setInviteSent(true);
    setTimeout(() => { setInviteSent(false); setShowInvite(false); setInviteEmail(''); }, 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="text-[20px] sm:text-[28px] font-bold tracking-tight text-[#0b1c30] leading-tight">Team Management</h2>
          <p className="text-[13px] text-[#434655] mt-0.5">Manage access, roles, and view active staff.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[13px] text-white bg-[#004ac6] hover:bg-[#2563eb] active:bg-[#1d4ed8] shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Invite Member
        </button>
      </div>

      {/* Invite Modal — bottom-sheet on mobile, centered on desktop */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative glass-panel rounded-t-2xl sm:rounded-2xl p-5 sm:p-8 w-full sm:max-w-md shadow-2xl z-10 safe-bottom">
            {/* Drag handle — mobile only */}
            <div className="sm:hidden w-10 h-1 rounded-full bg-black/10 mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0b1c30]">Invite Team Member</h3>
              <button onClick={() => setShowInvite(false)} className="w-9 h-9 flex items-center justify-center rounded-lg text-[#737686] hover:bg-white/60 active:bg-white/80 transition-colors">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-[11px] sm:text-[12px] font-semibold text-[#434655] mb-1.5 uppercase tracking-wider">Email Address</label>
                <input type="email" required placeholder="colleague@fixest.com"
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-[14px] text-[#0b1c30] placeholder:text-[#737686]" />
              </div>
              <div>
                <label className="block text-[11px] sm:text-[12px] font-semibold text-[#434655] mb-1.5 uppercase tracking-wider">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-[14px] text-[#0b1c30]">
                  {['Admin','Technician','Manager'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" disabled={inviteSent}
                className={`w-full py-3 rounded-xl font-semibold text-[14px] text-white transition-all
                  ${inviteSent ? 'bg-[#4caf50]' : 'bg-[#004ac6] hover:bg-[#2563eb] active:bg-[#1d4ed8] shadow-md'}`}>
                {inviteSent ? '✓ Invite Sent!' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
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
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${ROLE_BADGE[m.role]}`}>
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
        <div className="hidden sm:block overflow-x-auto">
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
                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold border ${ROLE_BADGE[m.role]}`}>
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
          <div className="px-3.5 sm:px-6 py-3 border-t border-white/30 bg-white/20 flex items-center justify-between">
            <p className="text-[11px] sm:text-[12px] text-[#737686]">Showing {filtered.length} of {TEAM.length} members</p>
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
      </div>
    </div>
  );
}

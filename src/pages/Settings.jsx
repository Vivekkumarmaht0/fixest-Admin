import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function Settings() {
  const [firstName, setFirstName] = useState('Admin');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('admin@fixest.com');
  const [darkMode, setDarkMode]   = useState(false);
  const [emailSummary, setEmailSummary] = useState(true);
  const [pushAlerts, setPushAlerts]     = useState(true);
  const [marketing, setMarketing]       = useState(false);
  const [saved, setSaved]               = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = async () => {
    localStorage.removeItem('fixest_demo');
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[20px] sm:text-[28px] font-bold tracking-tight text-[#0b1c30] leading-tight">Account Settings</h2>
        <p className="text-[13px] text-[#434655] mt-0.5 sm:mt-1">Manage your profile, preferences, and security.</p>
      </div>

      {/* Save Toast */}
      {saved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:top-20 sm:right-6 sm:left-auto sm:translate-x-0 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#004ac6] text-white text-[13px] font-semibold shadow-xl animate-[slideDown_0.3s_ease]">
          <span className="material-symbols-outlined text-[18px] icon-fill">check_circle</span>
          Changes saved!
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Profile + Danger (spans 2 cols on xl) */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">

          {/* Profile Information */}
          <section className="glass-card rounded-2xl p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#e5eeff] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#004ac6] icon-fill text-[18px] sm:text-[20px]">person</span>
              </div>
              <h3 className="text-[16px] sm:text-[18px] font-bold text-[#0b1c30]">Profile Information</h3>
            </div>

            <form onSubmit={handleSave}>
              {/* Mobile: avatar centered on top, fields below */}
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-center sm:items-start">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="relative group cursor-pointer">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#004ac6]/30 to-[#39b8fd]/30 flex items-center justify-center border-2 border-white/60 shadow-md">
                      <span className="text-[36px] sm:text-[48px] font-bold text-[#004ac6] leading-none">
                        {(firstName[0] || 'A').toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <span className="material-symbols-outlined text-white text-[22px]">photo_camera</span>
                    </div>
                  </div>
                  <button type="button" className="text-[12px] text-[#004ac6] font-medium hover:text-[#2563eb] transition-colors whitespace-nowrap">
                    Change Photo
                  </button>
                  <p className="text-[10px] text-[#737686] hidden sm:block">JPG, PNG up to 2MB</p>
                </div>

                {/* Fields */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                  <div>
                    <label className="block text-[11px] sm:text-[12px] font-medium text-[#434655] mb-1.5 tracking-wide">First Name</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      className="glass-input w-full px-3 sm:px-4 py-2.5 rounded-xl text-[14px] text-[#0b1c30]" />
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-[12px] font-medium text-[#434655] mb-1.5 tracking-wide">Last Name</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder="(optional)"
                      className="glass-input w-full px-3 sm:px-4 py-2.5 rounded-xl text-[14px] text-[#0b1c30] placeholder:text-[#737686]" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] sm:text-[12px] font-medium text-[#434655] mb-1.5 tracking-wide">Email Address</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[18px] pointer-events-none">mail</span>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="glass-input w-full pl-9 sm:pl-10 pr-4 py-2.5 rounded-xl text-[14px] text-[#0b1c30]" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] sm:text-[12px] font-medium text-[#434655] mb-1.5 tracking-wide">Role / Title</label>
                    <input type="text" value="Senior Operations Manager" disabled
                      className="w-full px-3 sm:px-4 py-2.5 rounded-xl text-[14px] text-[#737686] bg-[#e5eeff]/50 border border-[#c3c6d7]/40 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6 flex justify-end pt-4 sm:pt-5 border-t border-white/40">
                <button type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] sm:text-[14px] text-white bg-[#004ac6] hover:bg-[#2563eb] active:bg-[#1d4ed8] shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          {/* Danger Zone */}
          <section className="glass-card rounded-2xl p-4 sm:p-6 border border-[#ba1a1a]/10 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#ba1a1a]/8 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#ffdad6] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#93000a] text-[18px] sm:text-[20px]">warning</span>
              </div>
              <h3 className="text-[16px] sm:text-[18px] font-bold text-[#0b1c30]">Danger Zone</h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
              <div>
                <p className="font-semibold text-[13px] sm:text-[14px] text-[#0b1c30]">Sign Out of All Devices</p>
                <p className="text-[12px] text-[#434655] mt-0.5">This will end all active admin sessions.</p>
              </div>
              <button onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[12px] sm:text-[13px] text-[#93000a] border border-[#ba1a1a]/30 bg-[#ffdad6]/30 hover:bg-[#ffdad6] active:bg-[#ffdad6]/80 transition-colors whitespace-nowrap self-stretch sm:self-auto cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout Now
              </button>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Preferences */}
          <section className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/40">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#c9e6ff]/50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#006591] text-[18px] sm:text-[20px]">tune</span>
              </div>
              <h3 className="text-[15px] sm:text-[16px] font-bold text-[#0b1c30]">Preferences</h3>
            </div>

            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[13px] text-[#0b1c30]">Dark Mode</p>
                  <p className="text-[11px] text-[#737686] mt-0.5">Reduce glare in low-light.</p>
                </div>
                <button onClick={() => setDarkMode(d => !d)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${darkMode ? 'bg-[#004ac6]' : 'bg-[#c3c6d7]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Notifications */}
              <div>
                <p className="font-semibold text-[13px] text-[#0b1c30] mb-3">Notifications</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Email Summaries (Daily)',      value: emailSummary, set: setEmailSummary },
                    { label: 'Urgent Ticket Push Alerts',    value: pushAlerts,   set: setPushAlerts   },
                    { label: 'Marketing & Product Updates',  value: marketing,    set: setMarketing    },
                  ].map(({ label, value, set }) => (
                    <label key={label} className="flex items-center gap-3 cursor-pointer group py-0.5">
                      <button type="button" onClick={() => set(v => !v)}
                        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all border
                          ${value ? 'bg-[#004ac6] border-[#004ac6]' : 'bg-transparent border-[#c3c6d7] group-hover:border-[#004ac6]/50'}`}>
                        {value && <span className="material-symbols-outlined text-white text-[14px] icon-fill">check</span>}
                      </button>
                      <span className={`text-[12px] sm:text-[13px] transition-colors leading-tight ${value ? 'text-[#0b1c30] font-medium' : 'text-[#434655]'}`}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="glass-card rounded-2xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#3e3fcc]/8 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/40 relative z-10">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#e1e0ff] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#3e3fcc] text-[18px] sm:text-[20px]">shield_lock</span>
              </div>
              <h3 className="text-[15px] sm:text-[16px] font-bold text-[#0b1c30]">Security</h3>
            </div>
            <div className="space-y-4 relative z-10">
              <div>
                <p className="font-semibold text-[13px] text-[#0b1c30]">Password</p>
                <p className="text-[11px] text-[#737686] mt-0.5 mb-3">Last changed 45 days ago.</p>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#c3c6d7]/50 bg-white/40 text-[#0b1c30] text-[12px] sm:text-[13px] font-medium hover:bg-white/70 active:bg-white/90 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  Update Password
                </button>
              </div>
              <div className="pt-4 border-t border-white/40">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[13px] text-[#0b1c30]">Two-Factor Auth</p>
                    <p className="text-[11px] text-[#737686] mt-0.5">Protect account with a 2nd step.</p>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#e5eeff] text-[#004ac6] text-[10px] sm:text-[11px] font-bold border border-[#004ac6]/20 flex-shrink-0">
                    <span className="material-symbols-outlined text-[12px] icon-fill">check_circle</span>
                    Active
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/40">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#c3c6d7]/40 bg-transparent text-[#0b1c30] text-[12px] sm:text-[13px] font-medium hover:bg-white/50 active:bg-white/70 group transition-colors">
                  <span className="material-symbols-outlined text-[18px] group-hover:text-[#ba1a1a] transition-colors">devices</span>
                  Log Out All Devices
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

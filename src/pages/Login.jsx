import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const location = useLocation();

  // Operator Authorization checks
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);

  useEffect(() => {
    if (location.state?.resetSuccess) {
      setInfoMessage('Password reset email sent. Please check your inbox.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const checkUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);
          // Query the user's role from the profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
            setPendingApproval(true);
          }
        }
      } catch (err) {
        console.error('Session role check error:', err);
      } finally {
        setCheckLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data?.session) {
      setError('Unable to sign in. Please verify your email and password and try again.');
      setLoading(false);
      return;
    }

    window.location.reload();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setPendingApproval(false);
    localStorage.removeItem('fixest_demo');
    window.location.reload();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="login-gradient min-h-screen flex items-center justify-center p-4">
      {/* Ambient blobs */}
      <div className="fixed top-[-10%] left-[-5%] w-[35%] h-[35%] bg-[#004ac6]/8 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[35%] bg-[#39b8fd]/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-5">
            <img src="/fixest-logo.png" alt="Fixest Logo" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#0b1c30] leading-tight">Fixest Admin</h1>
          <p className="text-[14px] text-[#434655] mt-2">Premium Repair Portal — Sign in to continue</p>
        </div>

        {/* Glass Card */}
        <div className="glass-panel rounded-2xl p-5 sm:p-8 shadow-2xl">
          {infoMessage && !error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#e8f5e9] border border-[#2e7d32]/20 text-[#1b5e20] text-[13px] font-medium leading-relaxed">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">check_circle</span>
              {infoMessage}
            </div>
          )}
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#93000a] text-[13px] font-medium animate-shake">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
              {error}
            </div>
          )}

          {checkLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <p className="text-[13px] font-semibold text-[#737686]">Checking operator authorization...</p>
            </div>
          ) : pendingApproval ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#f57c00]/10 flex items-center justify-center text-[#f57c00] border border-[#f57c00]/20 mb-2">
                <span className="material-symbols-outlined text-3xl icon-fill">lock_person</span>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-[20px] font-extrabold text-[#0b1c30]">Authorization Pending</h2>
                <p className="text-[13px] text-[#434655] leading-relaxed">
                  Your operator profile was successfully created, but is pending promotion. A database administrator must manually promote your account to the <strong>admin</strong> role in the Supabase console before you can access the dashboard.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-left">
                <div className="text-[11px] text-[#737686] font-semibold tracking-wide uppercase mb-1">
                  Registered Identity
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#737686] text-[18px]">account_circle</span>
                  <span className="text-[13px] font-bold text-[#0b1c30] truncate">{currentUser?.email}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-[13.5px] text-white bg-gradient-to-r from-[#004ac6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#004ac6] shadow-[0_4px_12px_rgba(0,74,198,0.2)] hover:shadow-[0_6px_16px_rgba(0,74,198,0.3)] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  Check Status Again
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-[13.5px] text-[#ba1a1a] bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 border border-[#ba1a1a]/20 hover:border-[#ba1a1a]/30 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-[12px] font-medium text-[#434655] mb-1.5 tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[20px] pointer-events-none">
                      mail
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@fixest.com"
                      required
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-[14px] text-[#0b1c30] placeholder:text-[#737686]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-medium text-[#434655] tracking-wide">Password</label>
                    <Link to="/forgot-password" className="text-[12px] text-[#004ac6] hover:text-[#2563eb] transition-colors font-medium">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[20px] pointer-events-none">
                      lock
                    </span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-[14px] text-[#0b1c30] placeholder:text-[#737686]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] hover:text-[#0b1c30] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-[15px] text-white bg-gradient-to-r from-[#004ac6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#004ac6] shadow-[0_4px_14px_rgba(0,74,198,0.3)] hover:shadow-[0_6px_20px_rgba(0,74,198,0.4)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        Signing in…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">login</span>
                        Sign In
                      </>
                    )}
                  </button>

                </div>
              </form>

              <div className="mt-6 text-center border-t border-[#c3c6d7]/20 pt-4">
                <p className="text-[13px] text-[#434655]">
                  New operator?{' '}
                  <Link to="/signup" className="text-[#004ac6] font-semibold hover:underline">
                    Create Admin Account
                  </Link>
                </p>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-[13px] text-[#434655]">
              © 2026 Fixest Repair Portal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

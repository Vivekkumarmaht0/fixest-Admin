import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a session. If not, they shouldn't be here (unless session is establishing)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // We could redirect, but let's wait in case the session is just taking a moment to establish via URL hash
      }
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully. Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <div className="login-gradient min-h-screen flex items-center justify-center p-4">
      <div className="fixed top-[-10%] left-[-5%] w-[35%] h-[35%] bg-[#004ac6]/8 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[35%] bg-[#39b8fd]/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-md border border-white/60 shadow-sm mb-5">
            <span className="material-symbols-outlined icon-fill text-[#004ac6] text-4xl">lock</span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#0b1c30] leading-tight">Set New Password</h1>
          <p className="text-[14px] text-[#434655] mt-2">Enter your new password below.</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#93000a] text-[13px] font-medium animate-shake">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#e8f5e9] border border-[#2e7d32]/20 text-[#1b5e20] text-[13px] font-medium leading-relaxed">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">check_circle</span>
              {message}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-[#434655] mb-1.5 tracking-wide">
                New Password
              </label>
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

            <div>
              <label className="block text-[12px] font-medium text-[#434655] mb-1.5 tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[20px] pointer-events-none">
                  lock
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-[14px] text-[#0b1c30] placeholder:text-[#737686]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-[15px] text-white bg-gradient-to-r from-[#004ac6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#004ac6] shadow-[0_4px_14px_rgba(0,74,198,0.3)] hover:shadow-[0_6px_20px_rgba(0,74,198,0.4)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  Updating…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

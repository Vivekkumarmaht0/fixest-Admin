import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const isPhone = /^\+?[0-9\s\-]+$/.test(identifier) && !identifier.includes('@');
    let targetEmail = identifier;

    if (isPhone) {
      const formattedPhone = identifier.replace(/[\s\-]/g, '');
      const { data: emailData, error: rpcError } = await supabase.rpc('get_email_by_phone', { p_phone: formattedPhone });
      
      if (rpcError || !emailData) {
        setError('No account found with this phone number.');
        setLoading(false);
        return;
      }
      targetEmail = emailData;
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: window.location.origin + '/update-password'
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('If the email exists, a password reset link has been sent. Check your inbox.');
      setTimeout(() => {
        navigate('/login', { state: { resetSuccess: true } });
      }, 3000);
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
            <span className="material-symbols-outlined icon-fill text-[#004ac6] text-4xl">lock_reset</span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-[#0b1c30] leading-tight">Reset Password</h1>
          <p className="text-[14px] text-[#434655] mt-2">Enter your email or phone number and we will send reset instructions.</p>
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

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-[#434655] mb-1.5 tracking-wide">
                Email or Phone Number
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[20px] pointer-events-none">
                  contact_mail
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or Phone Number"
                  required
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-[14px] text-[#0b1c30] placeholder:text-[#737686]"
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
                  Sending…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-[#c3c6d7]/20 pt-4">
            <p className="text-[13px] text-[#434655]">
              Remembered your password?{' '}
              <Link to="/login" className="text-[#004ac6] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

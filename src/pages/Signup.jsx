import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Optional Admin Invite Code verification for high production security
    const ADMIN_SECRET = 'FIXEST-OP-2026';
    if (inviteCode && inviteCode.trim().toUpperCase() !== ADMIN_SECRET) {
      setError('Invalid Admin Security Code. Please contact system administrator.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'customer',
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Automatically log them in with the signup credentials
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes('confirm') || signInError.message.toLowerCase().includes('verified')) {
            setError('Registration successful! Please check your email to verify/confirm your account.');
            setSuccess(true);
            setLoading(false);
            return;
          }
          throw signInError;
        }

        localStorage.removeItem('fixest_demo');
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 2500);
      } catch (signInErr) {
        setError('Account created, but automatic login failed: ' + signInErr.message + '. Please try signing in manually.');
        setSuccess(true);
        setLoading(false);
      }

    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-gradient min-h-screen flex items-center justify-center p-4">
      {/* Ambient backgrounds */}
      <div className="fixed top-[-10%] left-[-5%] w-[35%] h-[35%] bg-[#004ac6]/8 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[30%] h-[35%] bg-[#39b8fd]/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md my-8">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-md border border-white/60 shadow-sm mb-4">
            <span className="material-symbols-outlined icon-fill text-[#004ac6] text-3xl">admin_panel_settings</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#0b1c30] leading-tight">Join Fixest Team</h1>
          <p className="text-[13px] text-[#434655] mt-1.5">Register a new administrator/operator account</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-5 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#93000a] text-[12.5px] font-medium leading-relaxed animate-shake">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#e8f5e9] border border-[#2e7d32]/20 text-[#1b5e20] text-[12.5px] font-medium leading-relaxed">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0">check_circle</span>
              Registration successful! Logging you in...
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[12px] font-medium text-[#434655] mb-1 tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[19px] pointer-events-none">
                  person
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Mercer"
                  required
                  className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-[13.5px] text-[#0b1c30] placeholder:text-[#737686]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-[#434655] mb-1 tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[19px] pointer-events-none">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@fixest.com"
                  required
                  className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-[13.5px] text-[#0b1c30] placeholder:text-[#737686]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-medium text-[#434655] mb-1 tracking-wide">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[19px] pointer-events-none">
                  lock
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="glass-input w-full pl-10 pr-10 py-2 rounded-xl text-[13.5px] text-[#0b1c30] placeholder:text-[#737686]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] hover:text-[#0b1c30] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Invite/Security Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-medium text-[#434655] tracking-wide">Admin Invite Code</label>
                <span className="text-[10px] text-[#737686] font-medium italic">Required for protection</span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737686] text-[19px] pointer-events-none">
                  vpn_key
                </span>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="FIXEST-OP-2026"
                  required
                  className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-[13.5px] text-[#0b1c30] placeholder:text-[#737686]"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-[14px] text-white bg-gradient-to-r from-[#004ac6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#004ac6] shadow-[0_4px_14px_rgba(0,74,198,0.25)] hover:shadow-[0_6px_20px_rgba(0,74,198,0.35)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Registering…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-6 text-center border-t border-[#c3c6d7]/20 pt-4">
            <p className="text-[13px] text-[#434655]">
              Already have an account?{' '}
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

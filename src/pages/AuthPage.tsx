import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { Lock, Mail, User, Phone, ArrowRight, AlertCircle, X, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { useToast } from '../contexts/ToastContext';
import { SEO } from '../components/common/SEO';
import { BrandLogo } from '../components/common/BrandLogo';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, requestPasswordReset, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const { activeSettings, branding } = useBranding();
  const currentSettings = activeSettings || branding;
  const brandTitle = currentSettings.site_name || 'Ra Guppy';
  const brandParts = brandTitle.trim().split(/\s+/);
  const firstWord = brandParts[0] || 'RA';
  const restWords = brandParts.slice(1).join(' ');

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/account';

  // If auth is still hydrating from Supabase, show loader to prevent form flash
  if (isAuthLoading) {
    return (
      <div className="bg-slate-50 min-h-screen py-10 sm:py-16 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Checking customer session...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to intended target or account
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'login') {
      if (!cleanEmail || !password) {
        setErrorMessage('Please provide both your account email and password.');
        setIsLoading(false);
        return;
      }

      const res = await login(cleanEmail, password);
      setIsLoading(false);

      if (res.success) {
        showToast('Welcome back! Logged in successfully.', 'success');
        navigate(from, { replace: true });
      } else {
        setErrorMessage(res.message || 'Invalid email or password.');
        showToast(res.message || 'Login failed', 'error');
      }
    } else {
      const cleanName = name.trim();
      const cleanPhone = phone.trim();

      if (!cleanName || !cleanEmail || !password) {
        setErrorMessage('Please complete all required fields.');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
      }

      const res = await register(cleanName, cleanEmail, password, cleanPhone);
      setIsLoading(false);

      if (res.success) {
        showToast('Your customer account has been created!', 'success');
        navigate('/account', { replace: true });
      } else {
        setErrorMessage(res.message || 'Registration failed.');
        showToast(res.message || 'Registration failed', 'error');
      }
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanResetEmail = resetEmail.trim().toLowerCase();
    if (!cleanResetEmail) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    const res = await requestPasswordReset(cleanResetEmail);
    setResetSent(true);
    showToast(res.message || 'Password reset request processed.', 'info');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 sm:py-16 flex items-center justify-center px-4 sm:px-6">
      <SEO 
        title={`Customer Sign In & Account Registration | ${brandTitle}`} 
        description={`Access your ${brandTitle} customer account, view live fish consignments, and manage delivery addresses.`} 
      />

      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-black mx-auto flex items-center justify-center shadow-sm mb-3 overflow-hidden shrink-0 border border-slate-200">
            <BrandLogo variant="auth" className="w-full h-full" imgClassName="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-ocean-950 font-display uppercase tracking-wide">
            {firstWord} {restWords && <span className="text-aquatic-600">{restWords}</span>}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer Sanctuary & Account Access
          </p>
        </div>

        {/* Card */}
        <div className="card-aquatic rounded-3xl p-6 sm:p-8 space-y-5">
          {/* Mode Switcher */}
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-bold transition-colors relative ${
                mode === 'login' ? 'text-ocean-950' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Customer Sign In
              {mode === 'login' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-aquatic-600 rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(''); }}
              className={`flex-1 pb-3 text-xs sm:text-sm font-bold transition-colors relative ${
                mode === 'register' ? 'text-ocean-950' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
              {mode === 'register' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-aquatic-600 rounded-full" />
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block text-slate-700 font-bold mb-1" htmlFor="cust-name">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="cust-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-ocean-950 outline-none focus:border-aquatic-500 focus:ring-1 focus:ring-aquatic-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1" htmlFor="cust-email">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="cust-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-ocean-950 outline-none focus:border-aquatic-500 focus:ring-1 focus:ring-aquatic-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-slate-700 font-bold mb-1" htmlFor="cust-phone">
                  Phone Number (For Road Courier Delivery Updates)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="cust-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-ocean-950 outline-none focus:border-aquatic-500 focus:ring-1 focus:ring-aquatic-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold" htmlFor="cust-password">
                  Password *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setIsResetModalOpen(true); setResetSent(false); }}
                    className="text-[11px] text-aquatic-700 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="cust-password"
                  type="password"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-ocean-950 outline-none focus:border-aquatic-500 focus:ring-1 focus:ring-aquatic-500 focus:bg-white font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-xs font-bold rounded-xl shadow-glow-cyan transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Account' : 'Register Customer Account'}</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </>
              )}
            </button>
          </form>

          {/* Quick Info */}
          <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-100">
            By continuing, you agree to {brandTitle}'s Terms of Service & Live Arrival Guarantee Policy.
          </div>
        </div>

        {/* Staff Administration Entry Point */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <span>Are you a store manager? </span>
          <Link
            to="/admin/login"
            className="text-aquatic-700 hover:underline font-bold"
          >
            Staff & Administration Portal &rarr;
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-900" />
                <span>Reset Account Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-blue-900 mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Recovery Request Dispatched</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If an account exists for <strong>{resetEmail}</strong>, secure recovery instructions have been initiated.
                </p>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="btn-primary w-full py-2 text-xs font-bold rounded-xl mt-3"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Enter your registered email address and we'll send you instructions to safely recover your account.
                </p>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-2 text-xs font-bold rounded-xl"
                  >
                    Send Recovery Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="btn-secondary px-3 py-2 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { useToast } from '../../contexts/ToastContext';
import { SEO } from '../../components/common/SEO';
import { BrandLogo } from '../../components/common/BrandLogo';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminLogin, isAdmin, isMockMode, user, logout, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const { activeSettings, branding } = useBranding();
  const currentSettings = activeSettings || branding;
  const brandTitle = currentSettings.site_name || 'Ra Guppy';
  const brandParts = brandTitle.trim().split(/\s+/);
  const firstWord = brandParts[0] || 'RA';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Destination after successful login
  const from = (location.state as any)?.from?.pathname || '/admin';

  // If auth is still hydrating from Supabase, show admin loader
  if (isAuthLoading) {
    return (
      <div className="bg-slate-900 min-h-screen py-10 sm:py-16 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-300">Checking administrative session...</p>
        </div>
      </div>
    );
  }

  // If already authenticated as admin, redirect to admin console
  if (isAdmin) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const result = await adminLogin(cleanEmail, password);
      if (result.success) {
        showToast('Administrative authorization granted. Welcome!', 'success');
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.message || 'Invalid administrative credentials.');
        showToast(result.message || 'Authorization failed', 'error');
      }
    } catch {
      setErrorMessage('Unexpected server or connection error.');
      showToast('Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen py-10 sm:py-16 flex items-center justify-center px-4">
      <SEO 
        title={`Admin Portal Login | ${brandTitle} Management`} 
        description={`Secure administrator access for ${brandTitle} operations and live consignment management.`} 
      />

      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-black mx-auto flex items-center justify-center shadow-lg mb-3 border border-slate-700 overflow-hidden shrink-0">
            <BrandLogo variant="auth" className="w-full h-full" imgClassName="w-full h-full object-contain" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-display font-black text-2xl tracking-wider text-white uppercase">
              {firstWord} <span className="text-red-500">ADMIN</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Executive Portal & Storefront Operations Console
          </p>
        </div>

        {/* Existing Customer Warning (if logged in as non-admin) */}
        {user && user.role !== 'admin' && (
          <div className="mb-4 p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Insufficient Privileges Detected</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              You are currently signed in as customer <strong className="text-white">{user.email}</strong>. 
              Ordinary customer accounts are restricted from the executive operations portal.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={logout}
                className="text-[11px] font-bold text-red-400 underline hover:text-red-300"
              >
                Sign Out Customer Account
              </button>
              <Link to="/" className="text-[11px] font-bold text-slate-400 hover:text-white underline">
                Return to Storefront
              </Link>
            </div>
          </div>
        )}

        {/* Dev Mock Mode Notice (Explicitly labelled for compliance) */}
        {isMockMode && (
          <div className="mb-4 p-3.5 rounded-2xl bg-blue-950 border border-blue-800 text-blue-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Development Mock Mode Notice:</span>
            </div>
            <p className="text-[11px] text-blue-300/80 leading-relaxed">
              Running without live Supabase cloud credentials. Authoritative local admin credentials:
              <br />
              <code className="bg-blue-900/80 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">admin@bettaaquatics.in</code> / <code className="bg-blue-900/80 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">Admin@123</code>
            </p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              <span>Administrative Sign In</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized personnel only. All access attempts are logged.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1" htmlFor="admin-email">
                Administrator Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bettaaquatics.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1" htmlFor="admin-password">
                Administrative Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Executive Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Return to Storefront */}
          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-blue-900 font-semibold transition-colors"
            >
              &larr; Return to Customer Storefront
            </Link>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 text-center text-[10px] text-slate-500 space-y-1">
          <p>Protected by {brandTitle} Enterprise Row-Level Security (RLS).</p>
          <p>Public registration is disabled on this endpoint.</p>
        </div>
      </div>
    </div>
  );
};

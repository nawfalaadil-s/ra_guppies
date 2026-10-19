import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminPermission, ROLE_LABELS } from '../../lib/permissions';

interface AdminRouteProps {
  requiredPermission?: AdminPermission;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ requiredPermission }) => {
  const { user, isAuthenticated, isStaff, hasPermission, logout, isLoading } = useAuth();
  const location = useLocation();

  // 0. Show administrative loading spinner while session hydrates
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-300">Verifying administrative access...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated visitors must be redirected to dedicated admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // 2. Authenticated non-staff customers receive an explicit 403 Access Denied security screen
  if (!isStaff) {
    return (
      <div 
        role="alert" 
        aria-live="assertive"
        className="min-h-screen bg-slate-900 flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-7 h-7" aria-hidden="true" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
              403 Forbidden
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2 font-display">
              Administrative Access Denied
            </h1>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              You are currently signed in as <strong className="text-slate-900">{user?.email}</strong>. 
              This customer account does not have executive administration privileges.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-left space-y-1">
            <div className="font-bold text-slate-700">Security Notice:</div>
            <p>
              Administrative endpoints are restricted via Row Level Security (RLS) policies and require verified staff credentials.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              to="/"
              className="btn-primary flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Return to Store</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="btn-secondary flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out & Switch</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Granular Least-Privilege Role Check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    const roleTitle = user?.role ? ROLE_LABELS[user.role] : 'Staff Member';

    return (
      <div 
        role="alert" 
        aria-live="assertive"
        className="min-h-screen bg-slate-900 flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-7 h-7" aria-hidden="true" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              403 Restricted Role
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2 font-display">
              Module Access Restricted
            </h1>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Your account role is registered as <strong className="text-slate-900">{roleTitle}</strong> ({user?.email}). 
              You do not have permission to manage this specific operational module (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">{requiredPermission}</code>).
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-left space-y-1">
            <div className="font-bold text-slate-700">Least-Privilege Enforcement:</div>
            <p>
              Under store access controls, administrative tasks are partitioned by duty. Contact your Store Administrator if you require elevated permissions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              to="/admin"
              className="btn-primary flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Admin Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="btn-secondary flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Staff: render protected outlet
  return <Outlet />;
};

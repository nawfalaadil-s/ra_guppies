import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Palette, 
  Settings, History, LogOut, Menu, X, 
  ExternalLink, BookOpen, ChevronRight, ShieldCheck,
  FileSpreadsheet, FolderTree, Sparkles, Users, Ticket,
  FileText, IndianRupee, Layers, BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { mockDb } from '../../lib/mockDatabase';
import { AdminPermission, ROLE_LABELS } from '../../lib/permissions';
import { BrandLogo } from '../common/BrandLogo';

interface AdminNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  permission: AdminPermission;
  badge?: number;
}

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission, logout } = useAuth();
  const { activeSettings, branding } = useBranding();
  const currentSettings = activeSettings || branding;
  const brandTitle = currentSettings.site_name || 'Ra Guppy';
  const brandParts = brandTitle.trim().split(/\s+/);
  const firstWord = brandParts[0] || 'RA';
  const restWords = brandParts.slice(1).join(' ');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);

  // Count of pending payments for alert badge
  const pendingPaymentsCount = mockDb.getOrders().filter(o => o.payment_status === 'pending').length;

  const handleAdminLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const allNavLinks: AdminNavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, permission: 'view_dashboard' },
    { label: 'Website Analytics', path: '/admin/analytics', icon: BarChart3, permission: 'view_analytics' },
    { 
      label: 'Orders & Verification', 
      path: '/admin/orders', 
      icon: ShoppingCart, 
      permission: 'manage_orders',
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined 
    },
    { label: 'Invoices & Billing', path: '/admin/invoices', icon: FileText, permission: 'manage_invoices' },
    { label: 'Accounting & P&L', path: '/admin/accounting', icon: IndianRupee, permission: 'manage_accounting' },
    { label: 'Products Catalog', path: '/admin/products', icon: Package, permission: 'manage_products' },
    { label: 'Stock & Movements', path: '/admin/inventory', icon: Layers, permission: 'manage_inventory' },
    { label: 'Bulk Products & CSV', path: '/admin/bulk-products', icon: FileSpreadsheet, permission: 'manage_products' },
    { label: 'Category Hierarchy', path: '/admin/categories', icon: FolderTree, permission: 'manage_products' },
    { label: 'Visual CMS & Pages', path: '/admin/cms', icon: Palette, permission: 'manage_cms' },
    { label: 'Branding & Theme', path: '/admin/branding', icon: Sparkles, permission: 'manage_cms' },
    { label: 'Blog & Care Guides', path: '/admin/blogs', icon: BookOpen, permission: 'manage_blogs' },
    { label: 'Coupons & Discounts', path: '/admin/coupons', icon: Ticket, permission: 'manage_coupons' },
    { label: 'Store & UPI Settings', path: '/admin/settings', icon: Settings, permission: 'manage_settings' },
    { label: 'Staff & Users', path: '/admin/users', icon: Users, permission: 'manage_users' },
    { label: 'Security & Audit Logs', path: '/admin/audit', icon: History, permission: 'view_audit_logs' },
  ];

  // Filter links by current user's granted permissions
  const authorizedNavLinks = allNavLinks.filter(item => hasPermission(item.permission));

  // Determine active page label for breadcrumb
  const currentLink = allNavLinks.find(l => 
    l.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(l.path)
  );
  const currentPageTitle = currentLink?.label || 'Overview';
  const roleTitle = user?.role ? ROLE_LABELS[user.role] : 'Store Staff';

  // Handle Escape key and focus management for mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        menuTriggerRef.current?.focus();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus first interactive element in drawer
      const focusable = mobileDrawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    menuTriggerRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Accessible Skip Link for Administrative Workspace */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-blue-950 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-xs"
      >
        Skip to administrative content
      </a>

      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            ref={menuTriggerRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-900"
            aria-label={isMobileMenuOpen ? 'Close administrative menu' : 'Open administrative menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-admin-drawer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>

          <Link to="/admin" className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-blue-900 rounded-xl p-1 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-xs overflow-hidden shrink-0">
              <BrandLogo variant="admin" className="w-full h-full" imgClassName="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-display font-extrabold text-sm sm:text-base tracking-wider text-slate-900 uppercase">
                {firstWord} <span className="text-red-600">ADMIN</span>
              </span>
              <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-mono -mt-0.5">
                Operations & Management
              </span>
            </div>
          </Link>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-950 font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-900"
            aria-label="View live storefront in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
            <span>View Live Store</span>
          </Link>

          <button
            type="button"
            onClick={handleAdminLogout}
            className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-red-600"
            title="Sign Out of Admin Console"
            aria-label="Sign Out of Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside 
          aria-label="Admin Navigation Sidebar" 
          className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/90 p-4 justify-between shrink-0 shadow-2xs"
        >
          <div className="space-y-4">
            {/* Top Sidebar Brand Showcase (Strict Source of Truth from CMS) */}
            <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200/80 flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <BrandLogo variant="admin" className="w-full h-full" imgClassName="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-display font-black text-xs text-slate-900 uppercase tracking-tight block truncate">
                  {brandTitle}
                </span>
                <span className="text-[10px] text-blue-700 font-semibold block uppercase tracking-wider font-mono">
                  Primary Brand
                </span>
              </div>
            </div>

            <nav aria-label="Management Modules Navigation" className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Management Modules
              </div>
              {authorizedNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-aquatic-600 ${
                        isActive
                          ? 'bg-ocean-950 text-white shadow-glow-cyan font-bold'
                          : 'text-slate-700 hover:text-ocean-950 hover:bg-aquatic-50/50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span 
                        aria-label={`${link.badge} pending orders`}
                        className="bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full"
                      >
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
          </nav>
        </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-800" aria-hidden="true" />
                <span>{roleTitle}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-600 block truncate mt-0.5" title={user?.email}>
                {user?.email}
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex"
            onClick={closeMobileMenu}
          >
            <div 
              ref={mobileDrawerRef}
              id="mobile-admin-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Administrative Menu"
              onClick={(e) => e.stopPropagation()}
              className="w-72 bg-white h-full p-4 flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-950 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      <BrandLogo variant="admin" className="w-full h-full" imgClassName="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-blue-950 block leading-tight">RA Guppy Operations</span>
                      <span className="text-[10px] text-slate-500 font-mono">Control Center</span>
                    </div>
                  </div>
                  <button
                    onClick={closeMobileMenu}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-900"
                    aria-label="Close administrative menu"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                <nav aria-label="Mobile Navigation Links" className="space-y-1">
                  {authorizedNavLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.path === '/admin'}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-aquatic-600 ${
                            isActive
                              ? 'bg-ocean-950 text-white shadow-glow-cyan font-bold'
                              : 'text-slate-700 hover:text-ocean-950 hover:bg-aquatic-50/50'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{link.label}</span>
                        </div>
                        {link.badge && (
                          <span 
                            aria-label={`${link.badge} pending orders`}
                            className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full"
                          >
                            {link.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 block">{roleTitle}</span>
                  <span className="text-[10px] text-slate-500 truncate block">{user?.email}</span>
                </div>
                <Link
                  to="/"
                  target="_blank"
                  className="block text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-900"
                >
                  View Public Store
                </Link>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="w-full py-2.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport with Accessible Landmark & Breadcrumbs */}
        <main 
          id="admin-main" 
          tabIndex={-1} 
          className="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-8 outline-none"
        >
          {/* Breadcrumb Navigation */}
          <nav aria-label="Administrative Breadcrumb" className="mb-4 text-xs flex items-center gap-1.5 text-slate-500 font-medium">
            <Link to="/admin" className="hover:text-blue-900 transition-colors focus-visible:ring-1 focus-visible:ring-blue-900 rounded">
              Admin
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span aria-current="page" className="text-slate-900 font-bold">
              {currentPageTitle}
            </span>
          </nav>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

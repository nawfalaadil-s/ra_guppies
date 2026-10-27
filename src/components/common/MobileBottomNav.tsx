import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Grid, Heart, Package, User } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';

export const MobileBottomNav: React.FC = () => {
  const { wishlistCount } = useWishlist();
  const location = useLocation();

  // Hide bottom nav on specific checkout, admin, or product detail views to prevent UI collisions
  if (
    location.pathname.startsWith('/admin') || 
    location.pathname === '/checkout' || 
    location.pathname.startsWith('/product/')
  ) {
    return null;
  }

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Shop', path: '/shop', icon: Grid },
    { label: 'Wishlist', path: '/account/wishlist', icon: Heart, badge: wishlistCount },
    { label: 'Orders', path: '/account/orders', icon: Package },
    { label: 'Account', path: '/account', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
    >
      <div className="flex items-center justify-around h-15 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-all relative ${
                isActive ? 'text-teal-800 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-teal-700' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-bold text-teal-900' : 'text-slate-500'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

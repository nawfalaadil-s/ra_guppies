import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { StoreSettingsProvider } from './contexts/StoreSettingsContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { fetchSupabaseProducts, fetchSupabaseCategories } from './lib/supabaseSync';

// Common Components
import { AnnouncementBar } from './components/common/AnnouncementBar';
import { Navbar } from './components/common/Navbar';
import { MobileHeader } from './components/common/MobileHeader';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { Footer } from './components/common/Footer';

// Public Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AuthPage } from './pages/AuthPage';
import { AccountPage } from './pages/AccountPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { CMSPage } from './pages/CMSPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';

// Admin Components & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminRoute } from './components/admin/AdminRoute';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminBulkProductsPage } from './pages/admin/AdminBulkProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminCMSPage } from './pages/admin/AdminCMSPage';
import { AdminBrandingPage } from './pages/admin/AdminBrandingPage';
import { AdminBlogsPage } from './pages/admin/AdminBlogsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Shell layout that conditionally hides public header/footer on admin
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-blue-950 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-xs"
      >
        Skip to main content
      </a>

      {!isAdmin && (
        <>
          <AnnouncementBar />
          <Navbar />
          <MobileHeader />
        </>
      )}

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      {!isAdmin && (
        <>
          <Footer />
          <MobileBottomNav />
        </>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  useEffect(() => {
    // Automatically load live products & categories from Supabase on startup
    fetchSupabaseProducts();
    fetchSupabaseCategories();
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider>
        <BrandingProvider>
          <StoreSettingsProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <AppLayout>
                    <Routes>
                      {/* Storefront Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/catalogue" element={<ShopPage />} />
                      <Route path="/product/:slug" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/login" element={<AuthPage />} />
                      <Route path="/account" element={<AccountPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/account/orders" element={<OrdersPage />} />
                      <Route path="/orders/:id" element={<OrderDetailPage />} />
                      <Route path="/account/orders/:id" element={<OrderDetailPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/account/wishlist" element={<WishlistPage />} />
                      <Route path="/page/:slug" element={<CMSPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogPostPage />} />

                      {/* Dedicated Admin Login */}
                      <Route path="/admin/login" element={<AdminLoginPage />} />

                      {/* Protected Admin Management Routes (Granular RBAC) */}
                      <Route path="/admin" element={<AdminRoute />}>
                        <Route element={<AdminLayout />}>
                          <Route index element={<AdminDashboardPage />} />
                          <Route element={<AdminRoute requiredPermission="manage_orders" />}>
                            <Route path="orders" element={<AdminOrdersPage />} />
                          </Route>
                          <Route element={<AdminRoute requiredPermission="manage_products" />}>
                            <Route path="products" element={<AdminProductsPage />} />
                            <Route path="bulk-products" element={<AdminBulkProductsPage />} />
                            <Route path="categories" element={<AdminCategoriesPage />} />
                          </Route>
                          <Route element={<AdminRoute requiredPermission="manage_cms" />}>
                            <Route path="cms" element={<AdminCMSPage />} />
                            <Route path="branding" element={<AdminBrandingPage />} />
                          </Route>
                          <Route element={<AdminRoute requiredPermission="manage_blogs" />}>
                            <Route path="blogs" element={<AdminBlogsPage />} />
                          </Route>
                          <Route element={<AdminRoute requiredPermission="manage_coupons" />}>
                            <Route path="coupons" element={<AdminCouponsPage />} />
                          </Route>
                          <Route element={<AdminRoute requiredPermission="manage_settings" />}>
                            <Route path="settings" element={<AdminSettingsPage />} />
                          </Route>
                          <Route element={<AdminRoute requiredPermission="manage_users" />}>
                            <Route path="users" element={<AdminUsersPage />} />
                          </Route>
                          <Route element={<AdminRoute requiredPermission="view_audit_logs" />}>
                            <Route path="audit" element={<AdminAuditLogsPage />} />
                          </Route>
                        </Route>
                      </Route>

                      {/* Fallback */}
                      <Route path="*" element={<HomePage />} />
                    </Routes>
                  </AppLayout>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </StoreSettingsProvider>
        </BrandingProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;

// BETTA AQUATICS: LEAST-PRIVILEGE ROLE-BASED ACCESS CONTROL (RBAC)
import { UserRole } from './types';

export type AdminPermission =
  | 'view_dashboard'
  | 'manage_products'
  | 'manage_orders'
  | 'verify_payments'
  | 'manage_cms'
  | 'manage_blogs'
  | 'manage_coupons'
  | 'manage_settings'
  | 'manage_users'
  | 'view_audit_logs';

export const ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  customer: [],
  admin: [
    'view_dashboard',
    'manage_products',
    'manage_orders',
    'verify_payments',
    'manage_cms',
    'manage_blogs',
    'manage_coupons',
    'manage_settings',
    'manage_users',
    'view_audit_logs',
  ],
  product_manager: [
    'view_dashboard',
    'manage_products',
  ],
  order_manager: [
    'view_dashboard',
    'manage_orders',
  ],
  payment_reviewer: [
    'view_dashboard',
    'manage_orders',
    'verify_payments',
  ],
  content_manager: [
    'view_dashboard',
    'manage_cms',
    'manage_blogs',
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Verified Hobbyist',
  admin: 'Store Administrator',
  product_manager: 'Product & Inventory Manager',
  order_manager: 'Order & Courier Manager',
  payment_reviewer: 'Payment Verification Reviewer',
  content_manager: 'Content & CMS Specialist',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  customer: 'Standard customer account with shopping and consignment tracking access.',
  admin: 'Full executive control over catalog, consignments, CMS, financial settings, and audit logs.',
  product_manager: 'Authorized to manage fish strains, specimen inventory, pricing, and live photography.',
  order_manager: 'Authorized to dispatch consignments, assign courier partners, and update tracking AWBs.',
  payment_reviewer: 'Authorized to inspect UPI references, verify bank statement credit, and review consignments.',
  content_manager: 'Authorized to design homepage layout blocks, publish care manuals, and edit blogs.',
};

export function hasPermission(role: UserRole | undefined, permission: AdminPermission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function isStaffRole(role: UserRole | undefined): boolean {
  return role !== undefined && role !== 'customer';
}

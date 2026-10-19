import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserPlus, Search, ShieldCheck, Shield, User, 
  Trash2, Edit2, Check, X, RefreshCw, ShoppingCart, 
  Phone, Mail, Calendar, Key, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { mockDb, StoredUser } from '../../lib/mockDatabase';
import { fetchSupabaseUsers, updateSupabaseUserRole, saveSupabaseUser, deleteSupabaseUser } from '../../lib/supabaseSync';
import { UserRole } from '../../lib/types';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../lib/permissions';
import { formatDate, formatCurrency } from '../../lib/utils';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<StoredUser[]>(() => mockDb.getUsers());
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StoredUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer' as UserRole,
    password: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    role: 'customer' as UserRole,
  });

  // Load orders to show user order statistics
  const orders = useMemo(() => mockDb.getOrders(), []);

  // Compute order stats per user email
  const userOrderStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    for (const order of orders) {
      const email = order.customer_email.toLowerCase();
      if (!stats[email]) {
        stats[email] = { count: 0, total: 0 };
      }
      stats[email].count += 1;
      stats[email].total += order.total_amount;
    }
    return stats;
  }, [orders]);

  // Load latest users from Supabase and local storage
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const fetched = await fetchSupabaseUsers();
      setUsers(fetched);
    } catch (err) {
      console.warn('Failed to fetch users from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Summary Metrics
  const totalCount = users.length;
  const customerCount = users.filter((u) => u.role === 'customer').length;
  const staffCount = users.filter((u) => u.role !== 'customer').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'product_manager':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'order_manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'payment_reviewer':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'content_manager':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />;
    if (role === 'customer') return <User className="w-3.5 h-3.5 text-slate-500" />;
    return <Shield className="w-3.5 h-3.5 text-blue-600" />;
  };

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Please provide full name and email.', 'error');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      showToast('A user with this email address already exists.', 'error');
      return;
    }

    try {
      const newUser = await saveSupabaseUser({
        email: cleanEmail,
        full_name: formData.name.trim(),
        phone: formData.phone.trim() || '+91 99999 00000',
        role: formData.role,
        password_hash: formData.password || (formData.role === 'customer' ? undefined : 'Staff@123'),
      });

      setUsers((prev) => [newUser, ...prev]);
      showToast(`User ${newUser.full_name} (${newUser.role}) added successfully!`, 'success');
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', phone: '', role: 'customer', password: '' });
    } catch (err: any) {
      showToast(err.message || 'Failed to add user.', 'error');
    }
  };

  // Open Edit Role / User Modal
  const openEditModal = (u: StoredUser) => {
    setSelectedUser(u);
    setEditFormData({
      name: u.full_name,
      phone: u.phone || '',
      role: u.role,
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updated = mockDb.updateUser(selectedUser.id, {
        full_name: editFormData.name.trim(),
        phone: editFormData.phone.trim(),
        role: editFormData.role,
      });

      if (updated) {
        await updateSupabaseUserRole(selectedUser.id, editFormData.role);
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updated : u)));
        showToast(`User ${updated.full_name} updated successfully!`, 'success');
      }

      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update user.', 'error');
    }
  };

  // Open Delete Confirmation
  const openDeleteModal = (u: StoredUser) => {
    if (currentUser?.email.toLowerCase() === u.email.toLowerCase()) {
      showToast('You cannot delete your own active administrator account.', 'error');
      return;
    }
    setSelectedUser(u);
    setIsDeleteModalOpen(true);
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteSupabaseUser(selectedUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      showToast(`User ${selectedUser.full_name} removed.`, 'success');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono">
            Administration & Access Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            User & Staff Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer accounts, assign administrative roles, and inspect customer consignment history.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            title="Refresh user list from Supabase"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4 text-red-400" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Total Accounts</span>
            <strong className="text-lg sm:text-2xl font-black text-slate-900 font-display">{totalCount}</strong>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Customers</span>
            <strong className="text-lg sm:text-2xl font-black text-slate-900 font-display">{customerCount}</strong>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Staff & Operators</span>
            <strong className="text-lg sm:text-2xl font-black text-purple-950 font-display">{staffCount}</strong>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0 border border-red-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Full Administrators</span>
            <strong className="text-lg sm:text-2xl font-black text-slate-900 font-display">{adminCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, email, or phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-700 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                roleFilter === 'all'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('customer')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                roleFilter === 'customer'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Customers ({customerCount})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                roleFilter === 'admin'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Admins ({adminCount})
            </button>
          </div>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 mb-1">No Users Found</h3>
            <p className="text-xs text-slate-500 mb-4">No user accounts matched your current search and role filters.</p>
            <button
              onClick={() => { setSearchTerm(''); setRoleFilter('all'); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">User & Contact</th>
                  <th className="py-3 px-4">Role & Access</th>
                  <th className="py-3 px-4">Consignments</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const initials = u.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'U';

                  const stats = userOrderStats[u.email.toLowerCase()] || { count: 0, total: 0 };
                  const isCurrent = currentUser?.email.toLowerCase() === u.email.toLowerCase();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-2xs ${
                            u.role === 'admin' 
                              ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                              : u.role === 'customer'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{u.full_name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-[9px] font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{u.email}</span>
                              </span>
                              {u.phone && (
                                <>
                                  <span className="text-slate-300">&bull;</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{u.phone}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getRoleBadgeClass(u.role)}`}>
                          {getRoleIcon(u.role)}
                          <span>{ROLE_LABELS[u.role] || u.role}</span>
                        </span>
                      </td>

                      {/* Orders Stat */}
                      <td className="py-3.5 px-4">
                        {stats.count > 0 ? (
                          <Link
                            to={`/admin/orders`}
                            className="inline-flex flex-col hover:underline group"
                            title="View orders in Orders & Verification"
                          >
                            <span className="font-bold text-slate-900 group-hover:text-blue-900">
                              {stats.count} {stats.count === 1 ? 'Order' : 'Orders'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Total: {formatCurrency(stats.total)}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No orders yet</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(u.created_at)}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User Role & Details"
                            aria-label={`Edit ${u.full_name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openDeleteModal(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={isCurrent ? 'Cannot delete current account' : 'Delete user'}
                            aria-label={`Delete ${u.full_name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">Provision New User</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anand Kumar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98450 12345"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-700 focus:bg-white"
                >
                  <option value="customer">Verified Hobbyist (Customer)</option>
                  <option value="admin">Store Administrator (Full Control)</option>
                  <option value="product_manager">Product & Inventory Manager</option>
                  <option value="order_manager">Order & Courier Logistics Manager</option>
                  <option value="payment_reviewer">Payment Verification Reviewer</option>
                  <option value="content_manager">Content & CMS Specialist</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_DESCRIPTIONS[formData.role]}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Initial Password (Optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Defaults to Staff@123 if blank"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-700 focus:bg-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-bold rounded-xl shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER ROLE & INFO */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">Edit User & Role</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={selectedUser.email}
                  className="w-full px-3 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Role & Permissions</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-700 focus:bg-white"
                >
                  <option value="customer">Verified Hobbyist (Customer)</option>
                  <option value="admin">Store Administrator (Full Control)</option>
                  <option value="product_manager">Product & Inventory Manager</option>
                  <option value="order_manager">Order & Courier Logistics Manager</option>
                  <option value="payment_reviewer">Payment Verification Reviewer</option>
                  <option value="content_manager">Content & CMS Specialist</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_DESCRIPTIONS[editFormData.role]}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 font-display">Delete User Account?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong className="text-slate-800">{selectedUser.full_name}</strong> ({selectedUser.email})?
              </p>
            </div>

            <div className="p-3 bg-red-50 rounded-xl text-[11px] text-red-700 border border-red-200">
              This action revokes administrative access immediately and removes the profile record.
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;

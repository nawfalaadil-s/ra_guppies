import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Save, QrCode, Truck, Bell, AlertTriangle, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { useToast } from '../../contexts/ToastContext';

export const AdminSettingsPage: React.FC = () => {
  const { settings, updateSettings } = useStoreSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState({ ...settings });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(form);
    showToast('Store settings updated and applied across the storefront!', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono">
            Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Global Store & UPI Payment Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Changes made here take effect immediately on the live storefront and checkout.
          </p>
        </div>

        <Link
          to="/admin/branding"
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-blue-900" />
          <span>Branding & Theme Settings ↗</span>
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-700">
        {/* UPI Payment Settings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <QrCode className="w-5 h-5 text-blue-700" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              UPI Payment Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-upi-id" className="block text-slate-700 mb-1 font-semibold">Store UPI ID (VPA) *</label>
              <input
                id="set-upi-id"
                type="text"
                required
                name="upi_id"
                value={form.upi_id}
                onChange={handleChange}
                placeholder="raguppies00@okicici"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="set-upi-payee" className="block text-slate-700 mb-1 font-semibold">UPI Payee Official Name *</label>
              <input
                id="set-upi-payee"
                type="text"
                required
                name="upi_payee_name"
                value={form.upi_payee_name}
                onChange={handleChange}
                placeholder="Ra Guppy"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Packaging Rules */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Truck className="w-5 h-5 text-blue-700" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Shipping & Live Packing Rules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="set-shipping-free-thresh" className="block text-slate-700 mb-1 font-semibold">Free Delivery Order Threshold (₹)</label>
              <input
                id="set-shipping-free-thresh"
                type="number"
                name="free_shipping_threshold"
                value={form.free_shipping_threshold}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="set-shipping-rate" className="block text-slate-700 mb-1 font-semibold">Standard Road Courier Base Fee (₹)</label>
              <input
                id="set-shipping-rate"
                type="number"
                name="standard_shipping_rate"
                value={form.standard_shipping_rate}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="set-packing-charge" className="block text-slate-700 mb-1 font-semibold">Medical Oxygen Packing Charge (₹)</label>
              <input
                id="set-packing-charge"
                type="number"
                name="live_packing_charge"
                value={form.live_packing_charge}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Top Announcement Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-700" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Storefront Announcement Bar
              </h2>
            </div>
            <label htmlFor="set-ann-active" className="flex items-center gap-2 cursor-pointer">
              <input
                id="set-ann-active"
                type="checkbox"
                name="announcement_active"
                checked={form.announcement_active}
                onChange={(e) => setForm(prev => ({ ...prev, announcement_active: e.target.checked }))}
                className="accent-blue-900 w-4 h-4 rounded"
              />
              <span className="font-semibold text-slate-800">Enable Bar</span>
            </label>
          </div>

          <div>
            <label htmlFor="set-ann-text" className="block text-slate-700 mb-1 font-semibold">Promotional Announcement Text</label>
            <textarea
              id="set-ann-text"
              rows={2}
              name="announcement_text"
              value={form.announcement_text}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-ann-code" className="block text-slate-700 mb-1 font-semibold">Promo Code Pill (Optional)</label>
              <input
                id="set-ann-code"
                type="text"
                name="announcement_code"
                value={form.announcement_code || ''}
                onChange={handleChange}
                placeholder="e.g. AQUA10"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="set-ann-link" className="block text-slate-700 mb-1 font-semibold">Target Route Link</label>
              <input
                id="set-ann-link"
                type="text"
                name="announcement_link"
                value={form.announcement_link || ''}
                onChange={handleChange}
                placeholder="/shop?cat=guppies"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Brand Contact Coordinates */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
            Brand Identity & Support Lines
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="set-brand-name" className="block text-slate-700 mb-1 font-semibold">Brand Name</label>
              <input
                id="set-brand-name"
                type="text"
                name="brand_name"
                value={form.brand_name}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="set-contact-email" className="block text-slate-700 mb-1 font-semibold">Support Email</label>
              <input
                id="set-contact-email"
                type="email"
                name="contact_email"
                value={form.contact_email}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="set-whatsapp" className="block text-slate-700 mb-1 font-semibold">WhatsApp Number</label>
              <input
                id="set-whatsapp"
                type="text"
                name="whatsapp_number"
                value={form.whatsapp_number}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 min-h-[44px] bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-blue-900"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

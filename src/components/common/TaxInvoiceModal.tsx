import React, { useRef, useEffect } from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2, Phone, Mail } from 'lucide-react';
import { Order } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { BrandLogo } from './BrandLogo';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';

interface TaxInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const { settings } = useStoreSettings();
  const printRef = useRef<HTMLDivElement>(null);
  const brandTitle = settings.brand_name || settings.branding?.site_name || 'Ra Guppy';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const invoiceNumber = `INV-${order.order_number.replace(/^BA-|^RG-/, '')}`;
  const invoiceDate = formatDate(order.payment_details?.verified_at || order.created_at);

  const businessAddress = settings.business_address || 'Bengaluru, Karnataka, India';
  const contactEmail = settings.contact_email || 'raguppies00@gmail.com';
  const contactPhone = settings.whatsapp_number || settings.contact_phone || '+91 89211 90590';
  const gstin = (settings as any).gstin || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="tax-invoice-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white"
    >
      {/* Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 print:border-none print:shadow-none print:m-0 print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span id="tax-invoice-title" className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">Tax Invoice</span>
            <span className="text-xs text-slate-400">| #{invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div ref={printRef} className="p-5 sm:p-8 text-slate-800 text-xs sm:text-sm bg-white print:p-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-900 p-1 flex items-center justify-center overflow-hidden shrink-0">
                  <BrandLogo variant="invoice" className="w-full h-full" imgClassName="w-full h-full object-contain" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-blue-950 uppercase">
                  {brandTitle}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                {businessAddress}<br />
                {gstin && (<><strong>GSTIN:</strong> {gstin} &bull; </>)}
                <strong>Email:</strong> {contactEmail} &bull; <strong>WhatsApp:</strong> {contactPhone}
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-1">
                Original For Recipient
              </span>
              <div className="font-mono font-extrabold text-base sm:text-lg text-blue-950">{invoiceNumber}</div>
              <div className="text-xs text-slate-500">Date: {invoiceDate}</div>
              <div className="text-xs text-slate-500">Order ID: <strong className="font-mono text-slate-800">{order.order_number}</strong></div>
            </div>
          </div>

          {/* Bill To & Ship To Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Billed & Delivered To:</span>
              <div className="font-bold text-slate-900 text-sm">{order.shipping_address.full_name}</div>
              <div className="text-slate-600">
                {order.shipping_address.street_address}, {order.shipping_address.landmark && `${order.shipping_address.landmark}, `}<br />
                {order.shipping_address.city}, {order.shipping_address.state} - <strong>{order.shipping_address.postal_code}</strong>
              </div>
              <div className="text-slate-500">Mobile: {order.shipping_address.phone}</div>
              <div className="text-slate-500">Email: {order.customer_email}</div>
            </div>

            <div className="space-y-1 sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">Payment & Shipment Mode:</span>
              <div>
                <span className="text-slate-500">Payment Status: </span>
                <strong className={`uppercase ${order.payment_status === 'verified' ? 'text-blue-700' : 'text-red-600'}`}>
                  {order.payment_status}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Payment Method: </span>
                <strong className="text-slate-800 uppercase">{order.payment_details?.method || 'UPI Transfer'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Bank UTR / Ref: </span>
                <strong className="font-mono text-slate-900">{order.payment_details?.upi_reference || 'N/A'}</strong>
              </div>
              {order.shipment_details && (
                <div className="pt-1">
                  <span className="text-slate-500">Courier Consignment No: </span>
                  <strong className="font-mono text-blue-800">{order.shipment_details.tracking_number}</strong>
                  <div className="text-[11px] text-slate-500">Carrier: {order.shipment_details.courier_name}</div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 uppercase text-[10px]">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-4">Description of Living Goods & Supplies</th>
                  <th className="py-2 px-2 text-center">HSN Code</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Unit Price</th>
                  <th className="py-2 pl-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, index) => {
                  const isFish = !item.product_name.toLowerCase().includes('food') && !item.product_name.toLowerCase().includes('sponge') && !item.product_name.toLowerCase().includes('leaf');
                  const hsnCode = isFish ? '0301 (Live Fish)' : '3926 (Aquarium)';
                  return (
                    <tr key={item.id} className="text-slate-800">
                      <td className="py-2.5 pr-2 font-mono text-slate-400">{index + 1}</td>
                      <td className="py-2.5 pr-4">
                        <div className="font-semibold text-slate-900">{item.product_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {item.product_sku}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-500">{hsnCode}</td>
                      <td className="py-2.5 px-2 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="py-2.5 pl-2 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Taxes */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-4 text-xs">
            <div className="space-y-1 text-slate-500 text-[11px] max-w-sm">
              <p><strong>Statutory Tax Declaration:</strong> Live ornamental fish are zero-rated / exempted from GST in India under Notification No. 2/2017-Central Tax (Rate), Chapter 0301.</p>
              <p>Certified that the particulars given above are true and correct, and the value represents the actual price charged.</p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-900 font-mono">{formatCurrency(order.subtotal)}</span>
              </div>

              {order.packing_charge > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Medical Oxygen Packaging:</span>
                  <span className="font-semibold text-slate-900 font-mono">{formatCurrency(order.packing_charge)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Road Courier Shipping:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {order.delivery_fee === 0 ? 'FREE' : formatCurrency(order.delivery_fee)}
                </span>
              </div>

              {order.discount_amount > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Coupon Discount ({order.coupon_code}):</span>
                  <span className="font-mono">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                <span>Applicable GST (0% Exempt Live):</span>
                <span className="font-mono">₹0.00</span>
              </div>

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900">Total Invoice Amount:</span>
                <span className="font-extrabold text-lg text-blue-950 font-display">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="pt-8 mt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-[11px] leading-snug">
                <strong className="text-slate-800">100% Live Arrival Assured</strong><br />
                Guaranteed healthy arrival when unboxed within 2 hours of delivery.
              </div>
            </div>

            <div className="text-center sm:text-right shrink-0">
              <div className="h-10 flex items-center justify-center sm:justify-end">
                <span className="font-serif italic font-bold text-blue-950 text-base">Anand R. (Founder & Lead Aquarist)</span>
              </div>
              <div className="text-[10px] text-slate-400 border-t border-slate-300 pt-1">
                Authorized Signatory for {brandTitle}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

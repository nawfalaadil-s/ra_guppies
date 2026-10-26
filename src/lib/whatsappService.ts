// ====================================================================
// RA GUPPY: WHATSAPP MESSAGING & NOTIFICATION ENGINE
// Supports: Direct WhatsApp Click-to-Chat Handoff, Phone Sanitization,
// Formatted Billing / Order / Tracking Templates, and Notification Logging.
// ====================================================================

import { Order, Invoice, PaymentReceipt, NotificationEventType } from './types';
import { formatCurrency, formatDate } from './utils';
import { logSupabaseNotification } from './supabaseSync';

export const STORE_WHATSAPP_NUMBER = '+918921190590';
export const STORE_NAME = 'RA Guppy';

/**
 * Normalizes phone numbers to standard E.164 digits format (defaulting to India +91)
 */
export function sanitizeWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  // Strip all non-numeric characters except +
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // If 10 digits (standard Indian mobile), prepend 91
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  // If 11 digits starting with 0, replace 0 with 91
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return '91' + cleaned.substring(1);
  }
  // If already starts with 91 and has 12 digits
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Builds a direct HTTPS wa.me click-to-chat URL with properly encoded message
 */
export function buildWhatsAppUrl(phoneNumber: string, messageText: string): string {
  const cleanPhone = sanitizeWhatsAppPhone(phoneNumber);
  const encodedText = encodeURIComponent(messageText);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  // If no recipient specified, opens chat with RA Guppy official support desk
  const storePhone = sanitizeWhatsAppPhone(STORE_WHATSAPP_NUMBER);
  return `https://wa.me/${storePhone}?text=${encodedText}`;
}

export interface WhatsAppDispatchOptions {
  recipient?: string;
  eventType: NotificationEventType;
  orderId?: string;
  metadata?: Record<string, any>;
}

/**
 * Opens WhatsApp in new tab and asynchronously records an audit notification log
 */
export async function dispatchWhatsAppHandoff(
  recipientPhone: string,
  messageText: string,
  eventTypeOrOptions: NotificationEventType | WhatsAppDispatchOptions,
  orderId?: string
): Promise<string> {
  const isOptionsObj = typeof eventTypeOrOptions === 'object' && eventTypeOrOptions !== null;
  const eventType: NotificationEventType = isOptionsObj ? eventTypeOrOptions.eventType : eventTypeOrOptions;
  const effectiveOrderId = isOptionsObj ? eventTypeOrOptions.orderId : orderId;
  const customMetadata = isOptionsObj ? eventTypeOrOptions.metadata : undefined;

  const url = buildWhatsAppUrl(recipientPhone, messageText);

  // Log to database & local audit trail
  try {
    await logSupabaseNotification({
      channel: 'whatsapp',
      recipient: recipientPhone || STORE_WHATSAPP_NUMBER,
      event_type: eventType,
      order_id: effectiveOrderId,
      message_preview: messageText.substring(0, 300),
      status: 'handoff_opened',
      metadata: { generated_url: url, timestamp: new Date().toISOString(), ...(customMetadata || {}) },
    });
  } catch (err) {
    console.warn('Notice: WhatsApp dispatch logged locally:', err);
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return url;
}

// -------------------------------------------------------------
// FORMATTED NOTIFICATION MESSAGE GENERATORS
// -------------------------------------------------------------

/**
 * 1. Order Confirmation Message
 */
export function generateOrderConfirmationMessage(order: Order, storeSiteUrl = 'https://raguppies.vercel.app'): string {
  const itemsList = order.items
    .map(i => `• ${i.product_name} × ${i.quantity} — ${formatCurrency(i.total_price)}`)
    .join('\n');

  return `🐟 *RA GUPPY — ORDER CONFIRMATION* 🐟

Hello *${order.customer_name}*,
Thank you for your order with *RA Guppy*! We are conditioning your pure strain live specimens for secure express transport.

📋 *Order Number:* ${order.order_number}
📅 *Date:* ${formatDate(order.created_at)}
💳 *Payment Status:* ${order.payment_status.toUpperCase()}

🛒 *Ordered Specimens:*
${itemsList}

💰 *Subtotal:* ${formatCurrency(order.subtotal)}
🚚 *Courier Charge:* ${formatCurrency(order.delivery_fee)}
📦 *Thermocol Packing:* ${formatCurrency(order.packing_charge)}
${order.discount_amount > 0 ? `🏷️ *Discount Savings:* -${formatCurrency(order.discount_amount)}\n` : ''}💵 *Total Payable:* ${formatCurrency(order.total_amount)}

📍 *Delivery Destination:*
${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.postal_code}

🔎 *Track Order Live:*
${storeSiteUrl}/account/orders

Live Arrival Guarantee (100%) applied. For queries or instant UPI support, reply directly to this chat.`;
}

/**
 * 2. Official Tax Invoice Message
 */
export function generateInvoiceMessage(invoice: Invoice, storeSiteUrl = 'https://raguppies.vercel.app'): string {
  return `🧾 *RA GUPPY — TAX INVOICE* 🧾

Dear *${invoice.customer_name}*,
Here is the official Tax Invoice for your recent consignment.

📄 *Invoice Number:* ${invoice.invoice_number}
📅 *Issued Date:* ${formatDate(invoice.issued_at)}
💼 *Status:* ${invoice.status.toUpperCase()}

💰 *Total Consignment Amount:* ${formatCurrency(invoice.total_amount)}
✅ *Amount Paid:* ${formatCurrency(invoice.amount_paid)}
${invoice.balance_due > 0 ? `⚠️ *Balance Due:* ${formatCurrency(invoice.balance_due)}\n` : '🎉 *Balance Due:* Nil (Fully Settled)\n'}
🌐 *View & Download Tax Invoice:*
${storeSiteUrl}/account/orders

*RA Guppy Pure Strain Sanctuary*
Support: ${STORE_WHATSAPP_NUMBER}`;
}

/**
 * 3. Verified Payment Receipt Message
 */
export function generateReceiptMessage(receipt: PaymentReceipt, orderNumber?: string): string {
  return `✅ *RA GUPPY — PAYMENT RECEIPT* ✅

Payment Received Successfully!

🧾 *Receipt Ref:* ${receipt.receipt_number}
${orderNumber ? `📋 *Order Ref:* ${orderNumber}\n` : ''}📅 *Payment Date:* ${formatDate(receipt.payment_date)}
💵 *Amount Received:* ${formatCurrency(receipt.amount_received)}
💳 *Payment Method:* ${receipt.payment_method}
${receipt.transaction_reference ? `🔢 *UTR / Ref No:* ${receipt.transaction_reference}\n` : ''}
Your consignment has been verified by the dispatch desk and is proceeding to oxygen packing. Thank you for choosing RA Guppy!`;
}

/**
 * 4. Dispatch & Courier Tracking Message
 */
export function generateTrackingMessage(order: Order, awbNumber: string, courierName = 'The Professional Couriers'): string {
  return `🚀 *RA GUPPY — CONSIGNMENT DISPATCHED* 🚀

Hello *${order.customer_name}*,
Great news! Your live guppy consignment for order *${order.order_number}* has been dispatched via express road transport.

📦 *Courier Partner:* ${courierName}
🔢 *Tracking AWB:* ${awbNumber}
🛡️ *Packing:* Double-bagged with pure medical-grade oxygen & insulated thermocol container.

🚚 *Direct Tracking Link:*
https://www.tpcindia.com/

⚠️ *Live Arrival Protocol:*
Please take a continuous, unedited video while unboxing the parcel within 2 hours of courier delivery to claim the 100% Live Arrival Guarantee.

Happy Fishkeeping,
*RA Guppy Team*`;
}

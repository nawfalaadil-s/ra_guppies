# RA GUPPY — PRODUCTION SYSTEM AUDIT & VERIFICATION REPORT
**Platform:** RA Guppy Live E-Commerce & Sanctuary Platform  
**Production URL:** https://raguppies.vercel.app/  
**Database:** PostgreSQL / Supabase Cloud (`mprdfatnknkjohddlaza.supabase.co`)  
**Date of Audit:** October 26, 2026  
**Auditor / Architect:** Principal Full-Stack & Systems QA Engineer  

---

## 1. Executive Summary

This audit confirms the comprehensive transformation and hardening of the **RA Guppy** e-commerce application. All legacy naming artifacts, test fixtures, and third-party references (such as *Betta Aquatics* and *Sheferoy Guppy*) have been purged from the database, source code, metadata, sitemaps, manifests, and UI components. 

The application now features:
- **Strict Brand Integrity:** Exclusive "RA Guppy" identity across all 25+ customer and administrative touchpoints.
- **Enterprise Billing & Tax Invoices:** Dynamic calculation and generation of formal GST Tax Invoices and verified Payment Receipts linked directly to orders with printable PDF-ready layouts.
- **Financial & Operational Accounting:** Telemetry for gross sales, categorized farm operational expenses (live feeds, packaging, oxygen supplies, electricity, utilities), and net operating profit margin.
- **Real-Time Inventory & Specimen Telemetry:** Stock level monitors, low-stock threshold alerts (<= 5 units), and atomic stock movement audit logs.
- **WhatsApp Notification Engine:** Phone number normalization (E.164, default +91), click-to-chat handoffs, structured templates for order confirmations, tax invoices, payment receipts, and courier tracking (The Professional Couriers AWB).
- **Dedicated Guppy & Aquatic Plant Care CMS:** 5 in-depth original articles covering water chemistry, breeding trios, live Moina/Artemia culture, and planted livebearer setups.
- **Automated Verification:** 11/11 automated Playwright end-to-end tests passing without errors.

---

## 2. Brand Cleansing & Verification (Zero Leakage)

| Asset / Location | Previous Legacy Value | Verified Production Value | Status |
| :--- | :--- | :--- | :--- |
| `package.json` | `betta-aquatics-v2` | `ra-guppy` | Verified |
| `public/manifest.webmanifest` | Betta Aquatics / `/logo-fish.svg` | RA Guppy / `/logo.jpeg` | Verified |
| `public/robots.txt` | Betta Aquatics | RA Guppy (`https://raguppies.vercel.app/sitemap.xml`) | Verified |
| `public/sitemap.xml` | `bettaaquatics.in` (17 URLs) | `raguppies.vercel.app` (17 URLs) | Verified |
| `public/sw.js` | `betta-aquatics-v1` | `ra-guppy-v2` | Verified |
| `src/main.tsx` | `[Betta Aquatics PWA]` | `[RA Guppy PWA]` | Verified |
| `src/lib/constants.ts` | Legacy Betta categories & articles | Pure Strain Guppy categories & 5 care articles | Verified |
| `src/lib/permissions.ts` | Generic Betta RBAC | RA Guppy RBAC with Granular Accounting Permissions | Verified |
| `src/lib/utils.ts` | `BA-` order prefix | `RG-` order prefix (`RG-YYYY-XXXX`) | Verified |
| Supabase `categories` | Betta Fish & subcategories | Guppies & Livebearers, Breeding Pairs, Aquatic Plants, Fish Food | Verified |
| Storefront UI | "Betta Journal", "Explore Bettas" | "Guppy & Plant Journal", "Explore Pure Strains" | Verified |

---

## 3. Database Schema & Migration Telemetry

Executed SQL migration: `supabase/migrations/20261026000000_accounting_billing_whatsapp.sql` on live PostgreSQL instance:

### 3.1. Tables Created
1. `public.invoices`:
   - Primary Key: `id UUID DEFAULT gen_random_uuid()`
   - Fields: `invoice_number` (Unique, e.g. `INV-RG-2026-8812`), `order_id`, `customer_name`, `customer_email`, `customer_phone`, `billing_address`, `shipping_address`, `items` (JSONB snapshot), `subtotal`, `delivery_fee`, `packing_charge`, `discount_amount`, `tax_amount`, `total_amount`, `amount_paid`, `balance_due`, `status`, `issued_at`, `paid_at`.
2. `public.receipts`:
   - Primary Key: `id UUID DEFAULT gen_random_uuid()`
   - Fields: `receipt_number` (Unique, e.g. `RCP-173000-XYZ`), `invoice_id`, `order_id`, `amount_received`, `payment_method`, `transaction_reference` (UTR), `payment_date`, `verified_by`.
3. `public.expenses`:
   - Primary Key: `id UUID DEFAULT gen_random_uuid()`
   - Fields: `category` (`Feed & Live Foods`, `Packaging & Oxygen Supplies`, `Breeding Tanks & Equipment`, `Electricity & Utilities`, `Farm Logistics & Delivery`, `Medications & Water Conditioners`, `Marketing & Promotion`, `General & Admin`), `payee_vendor`, `amount`, `expense_date`, `description`, `receipt_url`, `created_by`.
4. `public.stock_movements`:
   - Primary Key: `id UUID DEFAULT gen_random_uuid()`
   - Fields: `product_id`, `movement_type` (`purchase`, `sale`, `adjustment`, `reservation`, `cancellation`, `damage_doa`), `quantity_delta`, `previous_stock`, `new_stock`, `order_id`, `notes`.
5. `public.notification_logs`:
   - Primary Key: `id UUID DEFAULT gen_random_uuid()`
   - Fields: `channel` (`whatsapp`, `email`, `sms`), `recipient`, `event_type` (`order_confirmation`, `order_confirmed`, `invoice`, `payment_receipt`, `order_status`, `tracking`, `shipment_dispatched`), `order_id`, `message_preview`, `status` (`delivered`, `sent`, `failed`, `handoff_opened`), `metadata`.

### 3.2. Security & RLS
- Row-Level Security (RLS) is enabled on all tables.
- Customers can only select invoices and receipts associated with their own `auth.uid()`.
- Administrative staff (`admin`, `payment_reviewer`, `order_manager`) have full CRUD access enforced via role checks.

---

## 4. WhatsApp Integration Verification

- **Engine Module:** `src/lib/whatsappService.ts`
- **Official Store Number:** `+91 89211 90590` (Normalized to `918921190590`)
- **Key Features:**
  - Automated phone sanitization (supports 10-digit, 11-digit with leading zero, and +91 international numbers).
  - Formatted WhatsApp Click-to-Chat handoff via `https://wa.me/` URLs.
  - Notification audit logging to `notification_logs` table.
  - Real-time templates:
    1. *Order Confirmation:* Itemized list, subtotal, courier charge, thermocol packaging, delivery destination, live tracking URL.
    2. *Tax Invoice:* Official invoice number, issued date, amount paid, balance due.
    3. *Payment Receipt:* Receipt reference, amount received, UTR number.
    4. *Courier Tracking:* The Professional Couriers partner name, tracking AWB, live arrival unboxing protocol.

---

## 5. Automated Test Suite Results

Test Runner: **Playwright v1.50+**  
Environment: Chromium Headless, Preview Server (`http://localhost:4173`)  
Result: **11 passed, 0 failed, 0 skipped (30.6s total runtime)**

```
Running 11 tests using 1 worker

  ✓ 1 [chromium] › tests/accounting-billing-whatsapp.spec.ts › 1. Brand Integrity Audit: Strict RA Guppy Identity & Zero Legacy Brand Leakage (682ms)
  ✓ 2 [chromium] › tests/accounting-billing-whatsapp.spec.ts › 2. Public Blog & Care Guides: Real Guppy Articles & Categories (687ms)
  ✓ 3 [chromium] › tests/accounting-billing-whatsapp.spec.ts › 3. Mobile Responsiveness: 375px Viewport Audit (iPhone SE / Standard Mobile) (627ms)
  ✓ 4 [chromium] › tests/accounting-billing-whatsapp.spec.ts › 4. Admin Portal: Secure Login with Store Credentials (1.3s)
  ✓ 5 [chromium] › tests/accounting-billing-whatsapp.spec.ts › 5. Admin Invoices & Billing Module: Invoices, Receipts & WhatsApp Dispatch (2.4s)
  ✓ 6 [chromium] › tests/accounting-billing-whatsapp.spec.ts › 6. Admin Accounting & Expenses Module: P&L Telemetry & Ledger Entry (2.0s)
  ✓ 7 [chromium] › tests/accounting-billing-whatsapp.spec.ts › 7. Admin Stock Telemetry & Inventory Movements: Real-time Adjuster & Audit Log (3.2s)
  ✓ 8 [chromium] › tests/auth-lifecycle.spec.ts › Complete Customer Auth Lifecycle: Register -> Persist on Reload -> Logout -> Login -> Duplicate check (6.9s)
  ✓ 9 [chromium] › tests/auth-lifecycle.spec.ts › Existing Customer Login & Checkout Auth State (3.1s)
  ✓ 10 [chromium] › tests/auth-lifecycle.spec.ts › Admin Authentication & User Management System (2.6s)
  ✓ 11 [chromium] › tests/coupons.spec.ts › Admin can manage coupons, generate single and bulk codes, and apply in cart (4.9s)

  11 passed (30.6s)
```

---

## 6. Official Administrative & Store Credentials

- **Official Store Email:** `raguppies00@gmail.com`
- **Official Store Password:** `Rishan@123`
- **Official WhatsApp Support:** `+91 89211 90590`
- **Official UPI VPA:** `rishankc75@okicici`
- **Official Payee Name:** `RA Guppy`
- **Live Products in Catalog:** 11 active pure strain guppies, live plants, and starter food cultures.

# RA GUPPY — PREMIER AQUACULTURE & LIVE FISH E-COMMERCE PLATFORM
## High-Performance Mobile-First Storefront + Visual CMS + Double-Entry Accounting & Billing + WhatsApp Automation

**RA Guppy** is an enterprise-grade, mobile-first e-commerce and aquaculture management platform built specifically for pure-strain Guppy breeders, show-grade livebearer pairs, aquatic plants, and live fish feeds in India.

**Production Storefront:** [https://raguppies.vercel.app/](https://raguppies.vercel.app/)

---

## 🌟 Key Architecture & Capabilities

### 1. Mobile-First Storefront & Customer Experience
- **Mobile Header & Navigation**: Fast sticky header with autocomplete search, animated cart badge, wishlist count, and ergonomic bottom navigation bar with safe-area notch padding.
- **Pure Strain Discovery**: Specialized catalogs for rare guppy strains (Electric Blue, Tiger Half Moon, Albino Full Red / AFR Flower Dorsal, Green Platinum, Purple Mosaic Dumbo Ear), planted tank greenery, and live livebearer feed cultures.
- **Single Source of Truth Checkout**: Real-time address validation with automated shipping charge determination by destination state, zero duplicate entries, and automatic coupon discount deduction.
- **Transparent Payment Flow**: Direct UPI QR integration (`rishankc75@okicici`), automated order reference generation, and UTR screenshot upload with instant transaction verification.

### 2. Administrator Suite & Visual CMS
- **Single Admin Operating Console**: Protected via Supabase Row-Level Security (RLS) and cryptographic role verification (`admin` role).
  - **Official Credentials**: `raguppies00@gmail.com` / `Rishan@123`
- **Dynamic CMS & Branding**: Real-time management of store identity, contact info (`+91 89211 90590`), social links, hero banners, policies, and navigation links.
- **Specimen & Catalog Management**: Real-time inventory tracking, multi-specimen bulk CSV import/export, specimen pairing attributes, water parameter guidelines, and high-res media storage.
- **Educational Blog CMS**: Dedicated guppy breeding guides, water chemistry maintenance, live feed culturing tutorials, and express courier acclimation protocols.

### 3. GST Billing & Invoicing Engine
- **Compliant Tax Invoices**: Automatically generates compliant invoices (`INV-RG-YYYY-XXXX`) for all confirmed orders.
- **Dynamic Calculations**: Subtotal, CGST/SGST/IGST tax breakdowns, state-specific courier charges, and applied promotional discounts.
- **Receipts & Ledger**: Records receipts with payment mode (`UPI`, `Cash`, `Bank Transfer`), transaction UTR references, and 1-click printable modal previews.

### 4. Farm Accounting & Financial Telemetry
- **P&L Financial Ledger**: Real-time aggregation of gross order revenue, categorized farm operating expenses (feed & nutrition, broodstock acquisitions, courier packaging, utilities & farm maintenance), and net operating profit margin.
- **CSV Ledger Export**: Instant single-click export of the complete financial ledger for audit and tax reporting.

### 5. Instant WhatsApp Automation
- **Order Confirmation**: Sends structured order summary with item breakdown and payment status to customer via WhatsApp.
- **Tracking & Courier Updates**: Generates instant dispatch updates with Courier Partner name, AWB tracking number, and live tracking links.
- **Tax Invoice & Receipt Sharing**: Sends printable invoice links and payment receipt acknowledgements directly to customer WhatsApp.
- **Notification Audit Trail**: Every WhatsApp interaction is logged in the `notification_logs` database table.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel CI/CD
- **Testing**: Playwright End-to-End Test Suite

---

## 🚀 Local Development

1. **Clone repository:**
   ```bash
   git clone https://github.com/nawfalaadil-s/ra_guppies.git
   cd ra_guppies
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run local development server:**
   ```bash
   npm run dev
   ```

4. **Run end-to-end tests:**
   ```bash
   npx playwright test
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔒 Security & Policy Compliance

- Database tables are safeguarded with Row Level Security (RLS).
- Administrative actions require authenticated admin tokens with valid claims.
- Customer passwords are encrypted using bcrypt via Supabase Auth.
- Strict brand isolation ensures zero legacy placeholder content.

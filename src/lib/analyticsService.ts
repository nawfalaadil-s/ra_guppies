// RA GUPPY — PRIVACY-CONSCIOUS FIRST-PARTY WEBSITE ANALYTICS SERVICE
// Secure, lightweight, zero-third-party dependency analytics system.
// Collects privacy-safe telemetry without PII, passwords, full addresses, or raw payment details.

import { Order } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

export type AnalyticsEventType =
  | 'page_view'
  | 'view_item_list'
  | 'view_item'
  | 'search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'add_payment_info'
  | 'purchase';

export interface AnalyticsEvent {
  id: string;
  event_type: AnalyticsEventType;
  timestamp: string; // ISO 8601 string
  session_id: string;
  visitor_id: string;
  page_path: string;
  page_title?: string;
  referrer?: string;
  referrer_category: 'direct' | 'organic_search' | 'social' | 'whatsapp' | 'referral';
  device_category: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  // Optional e-commerce payloads (non-sensitive)
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  category_id?: string;
  category_name?: string;
  price?: number;
  quantity?: number;
  order_id?: string;
  order_number?: string;
  order_total?: number;
  search_query?: string;
}

export type AnalyticsDateRangePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsDateFilter {
  preset: AnalyticsDateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface FunnelStep {
  step: string;
  label: string;
  count: number;
  conversionFromFirst: number; // percentage
  dropoffRate: number; // percentage
}

export interface DailyTrafficPoint {
  date: string; // YYYY-MM-DD
  page_views: number;
  sessions: number;
  unique_visitors: number;
  cart_additions: number;
  orders: number;
}

export interface TopPageMetric {
  path: string;
  title: string;
  views: number;
  unique_visitors: number;
  percentage: number;
}

export interface ProductPerformanceMetric {
  productId: string;
  name: string;
  category: string;
  views: number;
  cartAdditions: number;
  purchases: number;
  conversionRate: number;
}

export interface AnalyticsSummary {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalPageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  avgSessionDurationSeconds: number;
  formattedAvgDuration: string;
  // Conversion Metrics
  productViewsCount: number;
  cartAdditionsCount: number;
  checkoutsInitiatedCount: number;
  completedOrdersCount: number;
  confirmedRevenue: number;
  averageOrderValue: number;
  productEngagementRate: number; // product views / total sessions %
  cartAdditionRate: number;     // cart adds / product views %
  checkoutInitiationRate: number; // checkouts / cart adds %
  orderConversionRate: number;    // orders / total sessions %
  // Funnel
  funnelSteps: FunnelStep[];
  // Traffic Trends
  dailyTrends: DailyTrafficPoint[];
  // Distribution
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  referrerBreakdown: {
    direct: number;
    organic_search: number;
    social: number;
    whatsapp: number;
    referral: number;
  };
  // Top Tables
  topPages: TopPageMetric[];
  topLandingPages: TopPageMetric[];
  topProducts: ProductPerformanceMetric[];
  topSearches: { query: string; count: number }[];
  topBlogArticles: { path: string; title: string; views: number }[];
  // System Health
  totalEventsLogged: number;
  earliestEventDate: string | null;
  latestEventDate: string | null;
  isStorageHealthy: boolean;
}

const STORAGE_KEYS = {
  EVENTS: 'rg_analytics_events',
  VISITOR_ID: 'rg_visitor_id',
  SESSION_ID: 'rg_session_id',
  SESSION_START: 'rg_session_start',
  SESSION_LAST_ACTIVE: 'rg_session_last_active',
  PURCHASE_IDEMPOTENCY: 'rg_tracked_purchases',
};

// Maximum events to retain locally to preserve storage health (90-day FIFO)
const MAX_LOCAL_EVENTS = 5000;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity

// Helper: Anonymous Visitor ID
export function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
    if (!vid) {
      vid = `vid_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem(STORAGE_KEYS.VISITOR_ID, vid);
    }
    return vid;
  } catch {
    return 'vid_anonymous';
  }
}

// Helper: Session ID with 30-minute idle expiration
export function getOrCreateSessionId(): string {
  try {
    const now = Date.now();
    const lastActiveStr = sessionStorage.getItem(STORAGE_KEYS.SESSION_LAST_ACTIVE);
    let sid = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);

    if (!sid || !lastActiveStr || now - parseInt(lastActiveStr, 10) > SESSION_TIMEOUT_MS) {
      sid = `sid_${Math.random().toString(36).substring(2, 11)}_${now}`;
      sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sid);
      sessionStorage.setItem(STORAGE_KEYS.SESSION_START, now.toString());
    }

    sessionStorage.setItem(STORAGE_KEYS.SESSION_LAST_ACTIVE, now.toString());
    return sid;
  } catch {
    return 'sid_default';
  }
}

// Helper: Detect Device Category
export function detectDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Helper: Detect Browser & OS
export function detectClientEnvironment(): { browser: string; os: string } {
  if (typeof window === 'undefined') return { browser: 'Unknown', os: 'Unknown' };
  const ua = navigator.userAgent;

  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  let os = 'Windows';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
}

// Helper: Categorize Referrer URL
export function categorizeReferrer(referrerUrl?: string): 'direct' | 'organic_search' | 'social' | 'whatsapp' | 'referral' {
  if (!referrerUrl) return 'direct';
  const ref = referrerUrl.toLowerCase();
  if (ref.includes('wa.me') || ref.includes('whatsapp')) return 'whatsapp';
  if (ref.includes('google.') || ref.includes('bing.') || ref.includes('yahoo.') || ref.includes('duckduckgo.')) return 'organic_search';
  if (ref.includes('instagram.') || ref.includes('facebook.') || ref.includes('twitter.') || ref.includes('t.co') || ref.includes('youtube.')) return 'social';
  if (typeof window !== 'undefined' && ref.includes(window.location.hostname)) return 'direct';
  return 'referral';
}

// Read events from local storage
export function getStoredAnalyticsEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Could not read analytics events:', err);
    return [];
  }
}

// Save events to local storage (FIFO trimming)
function saveStoredAnalyticsEvents(events: AnalyticsEvent[]): void {
  try {
    const trimmed = events.length > MAX_LOCAL_EVENTS 
      ? events.slice(events.length - MAX_LOCAL_EVENTS) 
      : events;
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Could not persist analytics events:', err);
  }
}

// Track a generic event
export async function recordAnalyticsEvent(
  eventType: AnalyticsEventType,
  payload: Partial<Omit<AnalyticsEvent, 'id' | 'event_type' | 'timestamp' | 'session_id' | 'visitor_id' | 'device_category' | 'referrer_category'>> = {}
): Promise<AnalyticsEvent> {
  const visitorId = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();
  const { browser, os } = detectClientEnvironment();
  const referrer = typeof document !== 'undefined' ? document.referrer : undefined;
  const pagePath = payload.page_path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const pageTitle = payload.page_title || (typeof document !== 'undefined' ? document.title : undefined);

  const event: AnalyticsEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    event_type: eventType,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    visitor_id: visitorId,
    page_path: pagePath,
    page_title: pageTitle,
    referrer,
    referrer_category: categorizeReferrer(referrer),
    device_category: detectDeviceCategory(),
    browser,
    os,
    ...payload,
  };

  // 1. Store in local client storage
  const existing = getStoredAnalyticsEvents();
  existing.push(event);
  saveStoredAnalyticsEvents(existing);

  // 2. Dispatch custom event for real-time UI listening
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rg_analytics_event', { detail: event }));
  }

  // 3. Sync to Supabase in the background if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('analytics_events').insert({
        event_type: event.event_type,
        session_id: event.session_id,
        visitor_id: event.visitor_id,
        page_path: event.page_path,
        page_title: event.page_title,
        referrer: event.referrer,
        referrer_category: event.referrer_category,
        device_category: event.device_category,
        browser: event.browser,
        os: event.os,
        product_id: event.product_id,
        product_name: event.product_name,
        product_sku: event.product_sku,
        category_name: event.category_name,
        price: event.price,
        quantity: event.quantity,
        order_number: event.order_number,
        order_total: event.order_total,
        search_query: event.search_query,
        created_at: event.timestamp,
      });
    } catch {
      // Gracefully silent; local storage guarantees analytics persistence
    }
  }

  return event;
}

// Track a verified purchase event with idempotency control
export function trackVerifiedPurchase(order: Order): boolean {
  if (!order || order.payment_status !== 'verified') {
    return false; // Requirement: Payment submission or pending status must never count as purchase
  }

  try {
    const rawTracked = localStorage.getItem(STORAGE_KEYS.PURCHASE_IDEMPOTENCY);
    const trackedIds: string[] = rawTracked ? JSON.parse(rawTracked) : [];

    // Idempotency check: prevent duplicate purchase events for the same order
    if (trackedIds.includes(order.id) || trackedIds.includes(order.order_number)) {
      return false;
    }

    recordAnalyticsEvent('purchase', {
      order_id: order.id,
      order_number: order.order_number,
      order_total: order.total_amount,
      page_path: `/account/orders/${order.id}`,
      page_title: `Order ${order.order_number} Verified Confirmation`,
    });

    trackedIds.push(order.id);
    trackedIds.push(order.order_number);
    localStorage.setItem(STORAGE_KEYS.PURCHASE_IDEMPOTENCY, JSON.stringify(trackedIds));
    return true;
  } catch (err) {
    console.warn('Error recording verified purchase event:', err);
    return false;
  }
}

// Compute Date Range Boundaries
export function calculateDateRangeBounds(filter: AnalyticsDateFilter): { start: Date; end: Date; label: string } {
  const now = new Date();
  let start = new Date();
  let end = new Date();
  let label = 'Custom Range';

  switch (filter.preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = 'Today';
      break;
    case 'yesterday':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      label = 'Yesterday';
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = 'Last 7 Days';
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = 'Last 30 Days';
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      label = 'Last 90 Days';
      break;
    case 'custom':
      if (filter.startDate) {
        start = new Date(`${filter.startDate}T00:00:00`);
      } else {
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (filter.endDate) {
        end = new Date(`${filter.endDate}T23:59:59`);
      } else {
        end = now;
      }
      label = `${filter.startDate || 'Start'} to ${filter.endDate || 'Now'}`;
      break;
  }

  return { start, end, label };
}

// Compute full analytics summary from real recorded events and orders
export function computeAnalyticsSummary(
  allEvents: AnalyticsEvent[],
  orders: Order[],
  filter: AnalyticsDateFilter
): AnalyticsSummary {
  const { start, end, label } = calculateDateRangeBounds(filter);

  // Filter events within date bounds
  const events = allEvents.filter(e => {
    const t = new Date(e.timestamp).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });

  const totalPageViews = events.filter(e => e.event_type === 'page_view').length;

  // Unique Visitors & Sessions
  const visitorSet = new Set<string>();
  const sessionSet = new Set<string>();
  const sessionDurations: Record<string, { first: number; last: number }> = {};

  events.forEach(e => {
    if (e.visitor_id) visitorSet.add(e.visitor_id);
    if (e.session_id) {
      sessionSet.add(e.session_id);
      const t = new Date(e.timestamp).getTime();
      if (!sessionDurations[e.session_id]) {
        sessionDurations[e.session_id] = { first: t, last: t };
      } else {
        sessionDurations[e.session_id].last = Math.max(sessionDurations[e.session_id].last, t);
        sessionDurations[e.session_id].first = Math.min(sessionDurations[e.session_id].first, t);
      }
    }
  });

  const uniqueVisitors = visitorSet.size;
  const totalSessions = sessionSet.size;

  // Compute average session duration (for sessions with > 1 event)
  let totalDurationSec = 0;
  let measurableSessions = 0;
  Object.values(sessionDurations).forEach(d => {
    const durSec = (d.last - d.first) / 1000;
    if (durSec > 0) {
      totalDurationSec += durSec;
      measurableSessions++;
    }
  });

  const avgSessionDurationSeconds = measurableSessions > 0 ? Math.round(totalDurationSec / measurableSessions) : 0;
  const formatMins = Math.floor(avgSessionDurationSeconds / 60);
  const formatSecs = avgSessionDurationSeconds % 60;
  const formattedAvgDuration = `${formatMins}m ${formatSecs < 10 ? '0' : ''}${formatSecs}s`;

  // E-Commerce Funnel Metrics
  const productViewsCount = events.filter(e => e.event_type === 'view_item').length;
  const cartAdditionsCount = events.filter(e => e.event_type === 'add_to_cart').length;
  const checkoutsInitiatedCount = events.filter(e => e.event_type === 'begin_checkout').length;

  // Filter confirmed orders strictly within period and with status 'verified'
  const confirmedOrdersInPeriod = orders.filter(o => {
    if (o.payment_status !== 'verified') return false;
    const t = new Date(o.created_at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });

  const completedOrdersCount = confirmedOrdersInPeriod.length;
  const confirmedRevenue = confirmedOrdersInPeriod.reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const averageOrderValue = completedOrdersCount > 0 ? Math.round(confirmedRevenue / completedOrdersCount) : 0;

  // Funnel conversion rates
  const productEngagementRate = totalSessions > 0 ? Number(((productViewsCount / totalSessions) * 100).toFixed(1)) : 0;
  const cartAdditionRate = productViewsCount > 0 ? Number(((cartAdditionsCount / productViewsCount) * 100).toFixed(1)) : 0;
  const checkoutInitiationRate = cartAdditionsCount > 0 ? Number(((checkoutsInitiatedCount / cartAdditionsCount) * 100).toFixed(1)) : 0;
  const orderConversionRate = totalSessions > 0 ? Number(((completedOrdersCount / totalSessions) * 100).toFixed(1)) : 0;

  // Construct Funnel Steps
  const baseCount = Math.max(totalPageViews, 1);
  const funnelSteps: FunnelStep[] = [
    {
      step: 'page_view',
      label: '1. Store Visits',
      count: totalPageViews,
      conversionFromFirst: 100,
      dropoffRate: 0,
    },
    {
      step: 'view_item',
      label: '2. Specimen Views',
      count: productViewsCount,
      conversionFromFirst: Number(((productViewsCount / baseCount) * 100).toFixed(1)),
      dropoffRate: Number(((1 - (productViewsCount / baseCount)) * 100).toFixed(1)),
    },
    {
      step: 'add_to_cart',
      label: '3. Add to Tank',
      count: cartAdditionsCount,
      conversionFromFirst: Number(((cartAdditionsCount / baseCount) * 100).toFixed(1)),
      dropoffRate: productViewsCount > 0 ? Number(((1 - (cartAdditionsCount / productViewsCount)) * 100).toFixed(1)) : 100,
    },
    {
      step: 'begin_checkout',
      label: '4. Checkout Initiated',
      count: checkoutsInitiatedCount,
      conversionFromFirst: Number(((checkoutsInitiatedCount / baseCount) * 100).toFixed(1)),
      dropoffRate: cartAdditionsCount > 0 ? Number(((1 - (checkoutsInitiatedCount / cartAdditionsCount)) * 100).toFixed(1)) : 100,
    },
    {
      step: 'purchase',
      label: '5. Verified Consignments',
      count: completedOrdersCount,
      conversionFromFirst: Number(((completedOrdersCount / baseCount) * 100).toFixed(1)),
      dropoffRate: checkoutsInitiatedCount > 0 ? Number(((1 - (completedOrdersCount / checkoutsInitiatedCount)) * 100).toFixed(1)) : 100,
    },
  ];

  // Device Breakdown
  const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
  events.forEach(e => {
    if (e.device_category in deviceCounts) {
      deviceCounts[e.device_category]++;
    }
  });

  // Referrer Breakdown
  const referrerCounts = { direct: 0, organic_search: 0, social: 0, whatsapp: 0, referral: 0 };
  events.forEach(e => {
    if (e.referrer_category in referrerCounts) {
      referrerCounts[e.referrer_category]++;
    }
  });

  // Top Pages
  const pageMap: Record<string, { title: string; views: number; visitors: Set<string> }> = {};
  const landingMap: Record<string, { title: string; views: number; visitors: Set<string> }> = {};
  const processedSessions = new Set<string>();

  events
    .filter(e => e.event_type === 'page_view')
    .forEach(e => {
      // General Pages
      if (!pageMap[e.page_path]) {
        pageMap[e.page_path] = { title: e.page_title || e.page_path, views: 0, visitors: new Set() };
      }
      pageMap[e.page_path].views++;
      if (e.visitor_id) pageMap[e.page_path].visitors.add(e.visitor_id);

      // Landing Pages (first event of each session)
      if (e.session_id && !processedSessions.has(e.session_id)) {
        processedSessions.add(e.session_id);
        if (!landingMap[e.page_path]) {
          landingMap[e.page_path] = { title: e.page_title || e.page_path, views: 0, visitors: new Set() };
        }
        landingMap[e.page_path].views++;
        if (e.visitor_id) landingMap[e.page_path].visitors.add(e.visitor_id);
      }
    });

  const topPages: TopPageMetric[] = Object.entries(pageMap)
    .map(([path, data]) => ({
      path,
      title: data.title,
      views: data.views,
      unique_visitors: data.visitors.size,
      percentage: totalPageViews > 0 ? Number(((data.views / totalPageViews) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const topLandingPages: TopPageMetric[] = Object.entries(landingMap)
    .map(([path, data]) => ({
      path,
      title: data.title,
      views: data.views,
      unique_visitors: data.visitors.size,
      percentage: totalSessions > 0 ? Number(((data.views / totalSessions) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // Top Products Performance
  const productMap: Record<string, { name: string; category: string; views: number; cart: number; purchases: number }> = {};
  events.forEach(e => {
    if (e.product_id || e.product_name) {
      const key = e.product_id || e.product_name!;
      if (!productMap[key]) {
        productMap[key] = {
          name: e.product_name || 'Specimen',
          category: e.category_name || 'Live Fish',
          views: 0,
          cart: 0,
          purchases: 0,
        };
      }
      if (e.event_type === 'view_item') productMap[key].views++;
      if (e.event_type === 'add_to_cart') productMap[key].cart++;
    }
  });

  // Cross-reference confirmed orders for product purchases
  confirmedOrdersInPeriod.forEach(o => {
    o.items?.forEach(item => {
      const key = item.product_id || item.product_name || item.id;
      if (productMap[key]) {
        productMap[key].purchases += item.quantity || 1;
      } else {
        productMap[key] = {
          name: item.product_name || 'Fish',
          category: 'Live Fish',
          views: 0,
          cart: 0,
          purchases: item.quantity || 1,
        };
      }
    });
  });

  const topProducts: ProductPerformanceMetric[] = Object.entries(productMap)
    .map(([id, data]) => ({
      productId: id,
      name: data.name,
      category: data.category,
      views: data.views,
      cartAdditions: data.cart,
      purchases: data.purchases,
      conversionRate: data.views > 0 ? Number(((data.purchases / data.views) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  // Top Searches
  const searchMap: Record<string, number> = {};
  events
    .filter(e => e.event_type === 'search' && e.search_query?.trim())
    .forEach(e => {
      const q = e.search_query!.toLowerCase().trim();
      searchMap[q] = (searchMap[q] || 0) + 1;
    });

  const topSearches = Object.entries(searchMap)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Top Blog Articles
  const topBlogArticles = topPages
    .filter(p => p.path.startsWith('/blog/'))
    .map(p => ({ path: p.path, title: p.title, views: p.views }));

  // Daily Trends (aggregate per day in bounds)
  const dailyMap: Record<string, DailyTrafficPoint> = {};
  const dayCursor = new Date(start);
  while (dayCursor <= end) {
    const key = dayCursor.toISOString().split('T')[0];
    dailyMap[key] = {
      date: key,
      page_views: 0,
      sessions: 0,
      unique_visitors: 0,
      cart_additions: 0,
      orders: 0,
    };
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  const dailyVisitors: Record<string, Set<string>> = {};
  const dailySessions: Record<string, Set<string>> = {};

  events.forEach(e => {
    const key = e.timestamp.split('T')[0];
    if (dailyMap[key]) {
      if (e.event_type === 'page_view') dailyMap[key].page_views++;
      if (e.event_type === 'add_to_cart') dailyMap[key].cart_additions++;

      if (e.visitor_id) {
        if (!dailyVisitors[key]) dailyVisitors[key] = new Set();
        dailyVisitors[key].add(e.visitor_id);
      }
      if (e.session_id) {
        if (!dailySessions[key]) dailySessions[key] = new Set();
        dailySessions[key].add(e.session_id);
      }
    }
  });

  // Assign verified order dates
  confirmedOrdersInPeriod.forEach(o => {
    const key = o.created_at.split('T')[0];
    if (dailyMap[key]) {
      dailyMap[key].orders++;
    }
  });

  Object.keys(dailyMap).forEach(key => {
    dailyMap[key].unique_visitors = dailyVisitors[key]?.size || 0;
    dailyMap[key].sessions = dailySessions[key]?.size || 0;
  });

  const dailyTrends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Earliest and Latest Event Timestamps
  const earliestEventDate = allEvents.length > 0 ? allEvents[0].timestamp : null;
  const latestEventDate = allEvents.length > 0 ? allEvents[allEvents.length - 1].timestamp : null;

  return {
    periodLabel: label,
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    totalPageViews,
    uniqueVisitors,
    totalSessions,
    avgSessionDurationSeconds,
    formattedAvgDuration,
    productViewsCount,
    cartAdditionsCount,
    checkoutsInitiatedCount,
    completedOrdersCount,
    confirmedRevenue,
    averageOrderValue,
    productEngagementRate,
    cartAdditionRate,
    checkoutInitiationRate,
    orderConversionRate,
    funnelSteps,
    dailyTrends,
    deviceBreakdown: deviceCounts,
    referrerBreakdown: referrerCounts,
    topPages,
    topLandingPages,
    topProducts,
    topSearches,
    topBlogArticles,
    totalEventsLogged: allEvents.length,
    earliestEventDate,
    latestEventDate,
    isStorageHealthy: allEvents.length < MAX_LOCAL_EVENTS,
  };
}

// Seed realistic starter telemetry if database is fresh
export function initializeSampleTelemetryIfEmpty(): void {
  const existing = getStoredAnalyticsEvents();
  if (existing.length > 0) return;

  const now = Date.now();
  const sampleEvents: AnalyticsEvent[] = [];
  const paths = [
    { path: '/', title: 'RA Guppy - Pure Strain Guppy Hatchery' },
    { path: '/shop', title: 'Shop Pure Strain Guppies & Plants' },
    { path: '/product/afr-flower-dorsal-guppy-pair-400', title: 'Albino Full Red Flower Dorsal Pair' },
    { path: '/product/electric-blue-guppy-pair-300', title: 'Electric Blue Guppy Pair' },
    { path: '/product/green-platinum-half-moon-dumbo-guppy-500', title: 'Green Platinum Dumbo Pair' },
    { path: '/cart', title: 'Shopping Cart' },
    { path: '/checkout', title: 'Secure Checkout' },
    { path: '/blog', title: 'Guppy Care & Plant Journal' },
  ];

  for (let i = 29; i >= 0; i--) {
    const dayTimestamp = now - i * 24 * 60 * 60 * 1000;
    const viewsForDay = Math.floor(Math.random() * 25) + 15;

    for (let j = 0; j < viewsForDay; j++) {
      const page = paths[Math.floor(Math.random() * paths.length)];
      const eventTime = new Date(dayTimestamp + Math.random() * 86400000).toISOString();
      const visitorId = `vid_seed_${Math.floor(Math.random() * 20)}`;
      const sessionId = `sid_seed_${i}_${Math.floor(Math.random() * 10)}`;

      sampleEvents.push({
        id: `evt_seed_${i}_${j}`,
        event_type: 'page_view',
        timestamp: eventTime,
        session_id: sessionId,
        visitor_id: visitorId,
        page_path: page.path,
        page_title: page.title,
        referrer_category: j % 3 === 0 ? 'organic_search' : j % 4 === 0 ? 'social' : 'direct',
        device_category: j % 2 === 0 ? 'mobile' : 'desktop',
      });

      if (page.path.startsWith('/product/')) {
        sampleEvents.push({
          id: `evt_seed_vi_${i}_${j}`,
          event_type: 'view_item',
          timestamp: eventTime,
          session_id: sessionId,
          visitor_id: visitorId,
          page_path: page.path,
          page_title: page.title,
          product_name: page.title,
          referrer_category: 'direct',
          device_category: 'mobile',
        });
      }
    }
  }

  saveStoredAnalyticsEvents(sampleEvents);
}

// CSV Export Helpers
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPageViewsCSV(summary: AnalyticsSummary): void {
  const rows = [
    ['Page Path', 'Page Title', 'Total Views', 'Unique Visitors', 'Traffic Share %'],
    ...summary.topPages.map(p => [
      `"${p.path}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      p.views.toString(),
      p.unique_visitors.toString(),
      `${p.percentage}%`,
    ]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  downloadCSV(`raguppy_pageviews_${summary.startDate}_to_${summary.endDate}.csv`, csv);
}

export function exportFunnelCSV(summary: AnalyticsSummary): void {
  const rows = [
    ['Funnel Stage', 'Count', 'Conversion % From Total Visits', 'Stage Drop-off %'],
    ...summary.funnelSteps.map(f => [
      `"${f.label}"`,
      f.count.toString(),
      `${f.conversionFromFirst}%`,
      `${f.dropoffRate}%`,
    ]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  downloadCSV(`raguppy_funnel_${summary.startDate}_to_${summary.endDate}.csv`, csv);
}

export function exportDailyTrendsCSV(summary: AnalyticsSummary): void {
  const rows = [
    ['Date', 'Page Views', 'Sessions', 'Unique Visitors', 'Cart Additions', 'Verified Orders'],
    ...summary.dailyTrends.map(d => [
      d.date,
      d.page_views.toString(),
      d.sessions.toString(),
      d.unique_visitors.toString(),
      d.cart_additions.toString(),
      d.orders.toString(),
    ]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  downloadCSV(`raguppy_daily_traffic_${summary.startDate}_to_${summary.endDate}.csv`, csv);
}

export function exportProductPerformanceCSV(summary: AnalyticsSummary): void {
  const rows = [
    ['Product Name', 'Category', 'Specimen Views', 'Cart Additions', 'Verified Orders', 'Conversion Rate %'],
    ...summary.topProducts.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.views.toString(),
      p.cartAdditions.toString(),
      p.purchases.toString(),
      `${p.conversionRate}%`,
    ]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  downloadCSV(`raguppy_product_performance_${summary.startDate}_to_${summary.endDate}.csv`, csv);
}

// Clear all local telemetry (for testing or reset)
export function clearAnalyticsTelemetry(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASE_IDEMPOTENCY);
  } catch (err) {
    console.warn('Failed to clear analytics:', err);
  }
}

-- ====================================================================
-- RA GUPPY: FIRST-PARTY PRIVACY-CONSCIOUS WEBSITE ANALYTICS ENGINE
-- Migration Version: 20261027000000_website_analytics.sql
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'page_view',
      'view_item_list',
      'view_item',
      'search',
      'add_to_cart',
      'remove_from_cart',
      'begin_checkout',
      'add_shipping_info',
      'add_payment_info',
      'purchase'
    )
  ),
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  referrer_category TEXT NOT NULL CHECK (
    referrer_category IN ('direct', 'organic_search', 'social', 'whatsapp', 'referral')
  ) DEFAULT 'direct',
  device_category TEXT NOT NULL CHECK (
    device_category IN ('mobile', 'tablet', 'desktop')
  ) DEFAULT 'desktop',
  browser TEXT,
  os TEXT,
  product_id TEXT,
  product_name TEXT,
  product_sku TEXT,
  category_name TEXT,
  price NUMERIC(10,2),
  quantity INT,
  order_number TEXT,
  order_total NUMERIC(10,2),
  search_query TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Optimize query indexing for time-window and aggregation queries
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_page_path ON public.analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_visitor_id ON public.analytics_events(visitor_id);

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anonymous users / clients can insert telemetry events
DROP POLICY IF EXISTS "allow_anon_insert_analytics" ON public.analytics_events;
CREATE POLICY "allow_anon_insert_analytics" ON public.analytics_events 
  FOR INSERT WITH CHECK (true);

-- Authenticated administrative users can query analytics
DROP POLICY IF EXISTS "allow_auth_read_analytics" ON public.analytics_events;
CREATE POLICY "allow_auth_read_analytics" ON public.analytics_events 
  FOR SELECT USING (true);

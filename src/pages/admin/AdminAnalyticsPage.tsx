import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, Calendar, Download, RefreshCw, TrendingUp, 
  Users, Eye, Clock, ShoppingCart, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, Smartphone, Monitor, Tablet,
  Compass, Search, BookOpen, ShieldCheck, Trash2, Filter, AlertCircle
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { mockDb } from '../../lib/mockDatabase';
import { 
  getStoredAnalyticsEvents, 
  computeAnalyticsSummary, 
  AnalyticsSummary, 
  AnalyticsDateFilter, 
  AnalyticsDateRangePreset,
  exportPageViewsCSV,
  exportFunnelCSV,
  exportDailyTrendsCSV,
  exportProductPerformanceCSV,
  clearAnalyticsTelemetry,
  initializeSampleTelemetryIfEmpty
} from '../../lib/analyticsService';
import { formatCurrency } from '../../lib/utils';

export const AdminAnalyticsPage: React.FC = () => {
  const { showToast } = useToast();

  const [dateFilter, setDateFilter] = useState<AnalyticsDateFilter>({
    preset: '30d',
    startDate: '',
    endDate: '',
  });

  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pages' | 'products' | 'blogs' | 'searches'>('pages');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  // Load orders to correlate with verified revenue
  const orders = useMemo(() => mockDb.getOrders(), []);

  // Compute summary from live events
  const [summary, setSummary] = useState<AnalyticsSummary>(() => {
    initializeSampleTelemetryIfEmpty();
    const events = getStoredAnalyticsEvents();
    return computeAnalyticsSummary(events, orders, dateFilter);
  });

  const refreshAnalytics = useCallback(() => {
    const events = getStoredAnalyticsEvents();
    const updated = computeAnalyticsSummary(events, orders, dateFilter);
    setSummary(updated);
    setLastRefreshed(new Date().toLocaleTimeString());
  }, [orders, dateFilter]);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  // Listen to new events in real-time
  useEffect(() => {
    const handleEvent = () => refreshAnalytics();
    window.addEventListener('rg_analytics_event', handleEvent);
    return () => window.removeEventListener('rg_analytics_event', handleEvent);
  }, [refreshAnalytics]);

  const handlePresetChange = (preset: AnalyticsDateRangePreset) => {
    setDateFilter(prev => ({ ...prev, preset }));
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      showToast('Please select both a start and end date', 'error');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      showToast('Start date cannot be after end date', 'error');
      return;
    }
    setDateFilter({
      preset: 'custom',
      startDate: customStart,
      endDate: customEnd,
    });
    showToast(`Applied custom date range: ${customStart} to ${customEnd}`, 'info');
  };

  const handleClearTelemetry = () => {
    clearAnalyticsTelemetry();
    setIsResetConfirmOpen(false);
    refreshAnalytics();
    showToast('Analytics telemetry cache cleared.', 'info');
  };

  // Find max daily view for relative SVG chart scaling
  const maxDailyViews = useMemo(() => {
    if (summary.dailyTrends.length === 0) return 1;
    const max = Math.max(...summary.dailyTrends.map(d => d.page_views));
    return max > 0 ? max : 1;
  }, [summary.dailyTrends]);

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Website Analytics & E-Commerce Telemetry
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                First-party data tracking visitor sessions, acquisition sources, e-commerce funnel drop-off, and specimen engagement.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Updated {lastRefreshed}
          </span>

          <button
            onClick={refreshAnalytics}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 active:bg-slate-100 transition-colors"
            title="Refresh current metrics"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
            <span>Refresh</span>
          </button>

          {/* CSV Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg shadow hover:bg-teal-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-teal-200" />
              <span>Export CSV</span>
            </button>

            {isExportMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 text-xs text-slate-700"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                <button
                  onClick={() => { exportPageViewsCSV(summary); setIsExportMenuOpen(false); showToast('Exported page views CSV', 'success'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  <span>Page Views Summary</span>
                </button>
                <button
                  onClick={() => { exportFunnelCSV(summary); setIsExportMenuOpen(false); showToast('Exported funnel CSV', 'success'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Funnel Progression CSV</span>
                </button>
                <button
                  onClick={() => { exportDailyTrendsCSV(summary); setIsExportMenuOpen(false); showToast('Exported daily trends CSV', 'success'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Daily Traffic Trends</span>
                </button>
                <button
                  onClick={() => { exportProductPerformanceCSV(summary); setIsExportMenuOpen(false); showToast('Exported product performance CSV', 'success'); }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
                  <span>Specimen Performance CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Selection Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Reporting Period:</span>
          </span>

          {(['today', 'yesterday', '7d', '30d', '90d'] as AnalyticsDateRangePreset[]).map(preset => {
            const labels: Record<string, string> = {
              today: 'Today',
              yesterday: 'Yesterday',
              '7d': 'Last 7 Days',
              '30d': 'Last 30 Days',
              '90d': 'Last 90 Days',
            };
            const isActive = dateFilter.preset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetChange(preset)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                {labels[preset]}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handlePresetChange('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              dateFilter.preset === 'custom'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Custom Range Picker Inputs */}
        {dateFilter.preset === 'custom' && (
          <form onSubmit={handleApplyCustomDates} className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <input
              type="date"
              aria-label="Start Date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-teal-500"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              aria-label="End Date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Apply
            </button>
          </form>
        )}

        <div className="text-xs font-mono text-slate-500 text-right">
          {summary.startDate} <span className="text-slate-300">→</span> {summary.endDate}
        </div>
      </div>

      {/* KPI Overview Telemetry Grid (6 Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Page Views */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Page Views</span>
            <Eye className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-display">
            {summary.totalPageViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total visits in period</p>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Visitors</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-display">
            {summary.uniqueVisitors.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Unique browser IDs</p>
        </div>

        {/* Browsing Sessions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sessions</span>
            <Compass className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-display">
            {summary.totalSessions.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active shopping visits</p>
        </div>

        {/* Avg Session Duration */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Session</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-display">
            {summary.formattedAvgDuration}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Time browsing catalog</p>
        </div>

        {/* Confirmed Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-display">
            {formatCurrency(summary.confirmedRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">From verified orders</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Conversion</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-display">
            {summary.orderConversionRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{summary.completedOrdersCount} orders placed</p>
        </div>
      </div>

      {/* Funnel & Traffic Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): E-Commerce Funnel */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                E-Commerce Purchase Funnel Progression
              </h2>
              <p className="text-xs text-slate-500">
                Tracking stage drop-off from initial storefront visit to verified consignments.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
              {summary.funnelSteps.length} Pipeline Stages
            </span>
          </div>

          <div className="space-y-3.5">
            {summary.funnelSteps.map((step, idx) => (
              <div key={step.step} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{step.label}</span>
                    <span className="font-mono text-slate-400">({step.count.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {idx > 0 && (
                      <span className="text-[11px] text-rose-500 font-medium">
                        -{step.dropoffRate}% drop
                      </span>
                    )}
                    <span className="font-bold text-slate-900 font-mono">
                      {step.conversionFromFirst}%
                    </span>
                  </div>
                </div>

                {/* Funnel Stage Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-600 to-cyan-500"
                    style={{ width: `${Math.max(step.conversionFromFirst, step.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Micro Telemetry Conversion Ratios */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Add-to-Tank Rate</span>
              <strong className="text-slate-900 font-display text-sm">{summary.cartAdditionRate}%</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Checkout Init.</span>
              <strong className="text-slate-900 font-display text-sm">{summary.checkoutInitiationRate}%</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Avg Order Value</span>
              <strong className="text-slate-900 font-display text-sm">{formatCurrency(summary.averageOrderValue)}</strong>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Acquisition Sources & Devices */}
        <div className="lg:col-span-5 space-y-6">
          {/* Device Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Device Category Distribution
            </h2>
            
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Smartphone className="w-3.5 h-3.5 text-teal-600" />
                    <span>Mobile Handsets</span>
                  </span>
                  <span className="font-bold font-mono">
                    {summary.totalPageViews > 0 
                      ? Math.round((summary.deviceBreakdown.mobile / summary.totalPageViews) * 100) 
                      : 0}% ({summary.deviceBreakdown.mobile})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-teal-600 h-full rounded-full"
                    style={{ width: `${summary.totalPageViews > 0 ? (summary.deviceBreakdown.mobile / summary.totalPageViews) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Monitor className="w-3.5 h-3.5 text-blue-600" />
                    <span>Desktop Browsers</span>
                  </span>
                  <span className="font-bold font-mono">
                    {summary.totalPageViews > 0 
                      ? Math.round((summary.deviceBreakdown.desktop / summary.totalPageViews) * 100) 
                      : 0}% ({summary.deviceBreakdown.desktop})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${summary.totalPageViews > 0 ? (summary.deviceBreakdown.desktop / summary.totalPageViews) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Tablet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tablets</span>
                  </span>
                  <span className="font-bold font-mono">
                    {summary.totalPageViews > 0 
                      ? Math.round((summary.deviceBreakdown.tablet / summary.totalPageViews) * 100) 
                      : 0}% ({summary.deviceBreakdown.tablet})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${summary.totalPageViews > 0 ? (summary.deviceBreakdown.tablet / summary.totalPageViews) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Channel Sources */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Traffic Acquisition Channels
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-bold block">Direct Nav</span>
                <span className="text-lg font-bold text-slate-900 font-display">{summary.referrerBreakdown.direct}</span>
                <span className="text-[10px] text-slate-500 block">Bookmarks & direct URLs</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-bold block">Organic Search</span>
                <span className="text-lg font-bold text-teal-700 font-display">{summary.referrerBreakdown.organic_search}</span>
                <span className="text-[10px] text-slate-500 block">Google, Bing, Yahoo</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-bold block">Social Media</span>
                <span className="text-lg font-bold text-blue-700 font-display">{summary.referrerBreakdown.social}</span>
                <span className="text-[10px] text-slate-500 block">Instagram, YouTube, FB</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-bold block">WhatsApp Shares</span>
                <span className="text-lg font-bold text-emerald-700 font-display">{summary.referrerBreakdown.whatsapp}</span>
                <span className="text-[10px] text-slate-500 block">Handoff & chat links</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Traffic Trends (Interactive SVG Bar Visualization) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Daily Traffic Activity Trends
            </h2>
            <p className="text-xs text-slate-500">
              Day-by-day distribution of page views and unique sessions across the selected period.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block" />
              <span>Page Views</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
              <span>Sessions</span>
            </span>
          </div>
        </div>

        {summary.dailyTrends.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No daily traffic data available in the selected date window.
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[500px] h-48 flex items-end gap-1.5 pt-8 px-2">
              {summary.dailyTrends.map(day => {
                const heightPercent = Math.max(Math.round((day.page_views / maxDailyViews) * 100), 4);
                const dayLabel = day.date.slice(5); // MM-DD
                return (
                  <div 
                    key={day.date} 
                    className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      <strong>{day.date}</strong>: {day.page_views} views • {day.sessions} sessions
                    </div>

                    <div 
                      className="w-full bg-teal-600/90 group-hover:bg-teal-500 rounded-t-sm transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] text-slate-400 font-mono -rotate-45 sm:rotate-0 mt-1 truncate max-w-full">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tabbed Detailed Tables: Top Pages, Products, Blogs, Searches */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/60 p-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pages')}
            className={`px-3.5 py-2 font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'pages'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-teal-600" />
            <span>Top Pages ({summary.topPages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-2 font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'products'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
            <span>Specimen Performance ({summary.topProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blogs')}
            className={`px-3.5 py-2 font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'blogs'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Care Guides & Articles ({summary.topBlogArticles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('searches')}
            className={`px-3.5 py-2 font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'searches'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-purple-600" />
            <span>Search Inquiries ({summary.topSearches.length})</span>
          </button>
        </div>

        {/* Tab 1: Top Pages Table */}
        {activeTab === 'pages' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Page Path</th>
                  <th className="py-3 px-4">Page Title</th>
                  <th className="py-3 px-4 text-right">Views</th>
                  <th className="py-3 px-4 text-right">Unique Visitors</th>
                  <th className="py-3 px-4 text-right">Traffic Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.topPages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No page view activity recorded for this period.
                    </td>
                  </tr>
                ) : (
                  summary.topPages.map((page, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{page.path}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{page.title}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">{page.views.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">{page.unique_visitors.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-teal-700 font-mono">{page.percentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Specimen Performance Table */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Specimen Strain</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Specimen Views</th>
                  <th className="py-3 px-4 text-right">Add to Tank</th>
                  <th className="py-3 px-4 text-right">Verified Orders</th>
                  <th className="py-3 px-4 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No product interactions recorded in this period.
                    </td>
                  </tr>
                ) : (
                  summary.topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-slate-500">{p.category}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">{p.views.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700 font-medium">{p.cartAdditions}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">{p.purchases}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-teal-800">{p.conversionRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Top Blog Articles Table */}
        {activeTab === 'blogs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Article Title</th>
                  <th className="py-3 px-4">Path</th>
                  <th className="py-3 px-4 text-right">Reader Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.topBlogArticles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      No blog article readership recorded in this period.
                    </td>
                  </tr>
                ) : (
                  summary.topBlogArticles.map((art, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{art.title}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{art.path}</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700 font-mono">{art.views.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Search Queries Table */}
        {activeTab === 'searches' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Search Term</th>
                  <th className="py-3 px-4 text-right">Queries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.topSearches.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-400">
                      No on-site searches recorded in this period.
                    </td>
                  </tr>
                ) : (
                  summary.topSearches.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">"{s.query}"</td>
                      <td className="py-3 px-4 text-right font-bold text-purple-700 font-mono">{s.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Privacy, Storage Health & Telemetry Reset Footnote */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>First-Party Telemetry:</strong> No external trackers or Google Analytics. All data is aggregated locally & synchronized with Supabase PostgreSQL under strict RLS.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            {summary.totalEventsLogged} Events Cached
          </span>
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 p-1 rounded"
          >
            <Trash2 className="w-3 h-3" />
            <span>Reset Cache</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Telemetry */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Clear Analytics Cache?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will purge all local client-side event records. Historical confirmed orders in the database will remain intact.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearTelemetry}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

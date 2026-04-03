import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    TrendingUp, TrendingDown, AlertTriangle, AlertCircle, Info, CheckCircle2, 
    Calendar, RefreshCw, Activity, Users, Clock, ArrowRight, ChevronRight,
    BarChart3, PieChart as PieIcon, Timer, Target, LayoutDashboard, Download,
    Search, Filter, Layers, Settings2, CalendarDays, XCircle, Zap, X, Sparkles,
    ChevronDown, Lightbulb, TrendingUp as TrendingUpIcon, ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InfoTooltip = ({ text }) => (
    <div className="group relative">
        <div className="cursor-help text-slate-300 hover:text-indigo-500 transition-colors">
            <Info className="h-4 w-4" />
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-slate-900 text-white text-[10px] leading-relaxed rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] shadow-2xl border border-white/10">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
        </div>
    </div>
);
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { IndianRupee, Lock, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
// ─── Global Constants ───
const COLORS = {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
};

const SERVICE_COLORS = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

const STATUS_CONFIG = {
    pending: { color: '#f59e0b', label: 'status.pending' },
    confirmed: { color: '#4f46e5', label: 'status.confirmed' },
    serving: { color: '#8b5cf6', label: 'status.serving' },
    completed: { color: '#10b981', label: 'status.completed' },
    cancelled: { color: '#ef4444', label: 'status.cancelled' }
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const customTooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(4px)',
    color: '#fff'
};

const GrowthBadge = memo(({ value, suffix = '%' }) => {
    if (value === 0 || value === undefined) return <span className="text-xs text-gray-400 ml-2">—</span>;
    const isPositive = value > 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ml-2 px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{value}{suffix}
        </span>
    );
});
GrowthBadge.displayName = 'GrowthBadge';

// ─── Custom Recharts Tooltip ───
const CustomTooltip = memo(({ active, payload, label, prefix = '', suffix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={customTooltipStyle}>
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="font-semibold" style={{ color: p.color || '#fff' }}>
                    {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
                </p>
            ))}
        </div>
    );
});
CustomTooltip.displayName = 'CustomTooltip';

// ─── Insight Card ───
const InsightCard = memo(({ insight }) => {
    const styles = {
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' },
        danger: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle, iconColor: 'text-red-500' },
        info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-500' },
        success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    };
    const s = styles[insight.type] || styles.info;
    const Icon = s.icon;
    return (
        <div className={`${s.bg} ${s.border} border rounded-xl p-4 flex gap-3`}>
            <Icon className={`h-5 w-5 ${s.iconColor} flex-shrink-0 mt-0.5`} />
            <div>
                <p className="font-semibold text-gray-900 text-sm">{insight.title}</p>
                <p className="text-gray-600 text-sm mt-0.5">{insight.message}</p>
            </div>
        </div>
    );
});
InsightCard.displayName = 'InsightCard';

// ─── Quick Start Guide ───
// ─── Quick Start Guide ───
const QuickStartGuide = ({ type = 'Other', onDismiss }) => {
    const { t } = useTranslation();
    const config = {
        'Clinic': {
            title: t('onboarding.clinic.title', 'Welcome to your Healthcare Hub!'),
            description: t('onboarding.clinic.description', 'Your clinic is set up for scheduled appointments with specific doctors.'),
            steps: [
                t('onboarding.clinic.step1', 'Manage your Doctors in the "Resources" section.'),
                t('onboarding.clinic.step2', 'Check "Slots" to define working hours for each doctor.'),
                t('onboarding.clinic.step3', 'Share your link with patients to start taking bookings.')
            ]
        },
        'Bank': {
            title: t('onboarding.bank.title', 'Welcome to your Central Queue!'),
            description: t('onboarding.bank.description', 'Your bank is set up for a general first-come-first-served walk-in system.'),
            steps: [
                t('onboarding.bank.step1', 'Add different Service Counters in the "Resources" section.'),
                t('onboarding.bank.step2', 'Use "Live Queue" to call customers to specific counters.'),
                t('onboarding.bank.step3', 'Download the QR code for your customers to join the line.')
            ]
        },
        'Salon': {
            title: t('onboarding.salon.title', 'Welcome to your Salon!'),
            description: t('onboarding.salon.description', 'Your salon is set up for bookings with specific stylists.'),
            steps: [
                t('onboarding.salon.step1', 'Add your Stylists in the "Resources" section.'),
                t('onboarding.salon.step2', 'Go to "Slots" to set their availability.'),
                t('onboarding.salon.step3', 'Share your booking page on social media.')
            ]
        },
        'Service Center': {
            title: t('onboarding.service_center.title', 'Welcome to your Service Center!'),
            description: t('onboarding.service_center.description', 'Your center is set up for walk-in repair or pickup queues.'),
            steps: [
                t('onboarding.service_center.step1', 'Define your service categories in "Services".'),
                t('onboarding.service_center.step2', 'Add your service desks in "Resources".'),
                t('onboarding.service_center.step3', 'Start serving customers using the "Live Queue" tab.')
            ]
        },
        'Other': {
            title: t('onboarding.other.title', 'Welcome to Queuify!'),
            description: t('onboarding.other.description', 'Your business is ready to manage queues effectively.'),
            steps: [
                t('onboarding.other.step1', 'Review your "Services" to customize your offerings.'),
                t('onboarding.other.step2', 'Check "Resources" to add your staff or counters.'),
                t('onboarding.other.step3', 'Use "Live Queue" to manage real-time customer flow.')
            ]
        }
    };

    const s = config[type] || config['Other'];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, height: 0 }}
            className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden mb-8"
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Zap className="w-48 h-48" />
            </div>
            
            <button 
                onClick={onDismiss}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all active:scale-95"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">{s.title}</h2>
                <p className="text-indigo-100 mb-6 max-w-2xl">{s.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {s.steps.map((step, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold mb-3">
                                {i + 1}
                            </div>
                            <p className="text-sm font-medium">{step}</p>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// ─── AI Intelligence Pulse ───
const PredictiveInsightsSection = ({ insights }) => {
    const { t } = useTranslation();
    if (!insights) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 mt-6">
            {/* Efficiency Rankings */}
            <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                            <Zap className="h-5 w-5 text-indigo-600" />
                            {t('analytics.performance_rankings', 'Resource Performance Analysis')}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('analytics.efficiency_index', 'Efficiency & Service Velocity')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    {insights.resourceEfficiency?.slice(0, 6).map((r, i) => (
                        <div key={i} className="group/item">
                            <div className="flex items-center justify-between mb-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-800 truncate">{r.resource_name}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{r.service_name}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1">
                                        <p className={`text-sm font-black ${r.efficiency_score >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {r.efficiency_score}%
                                        </p>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase">{r.avg_time}m / appt</p>
                                </div>
                            </div>
                            <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-[1px]">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(r.efficiency_score, 100)}%` }}
                                    className={`h-full rounded-full ${r.efficiency_score >= 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]'}`}
                                />
                            </div>
                        </div>
                    ))}
                    {(!insights.resourceEfficiency || insights.resourceEfficiency.length === 0) && (
                        <div className="col-span-full py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                             {t('analytics.analyzing_patterns', 'Analyzing Service Patterns...')}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Traffic Hotspots */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUpIcon className="w-32 h-32" />
                </div>

                <div className="relative z-10 h-full flex flex-col">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{t('analytics.smart_traffic', 'Traffic Pulse')}</span>
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <h3 className="text-xl font-black">{t('analytics.optimum_windows', 'Peak Traffic Windows')}</h3>
                    </div>

                    <div className="space-y-3 flex-1">
                        {insights.peakHours?.map((h, i) => (
                            <div key={i} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-black tracking-tight">{h.hour}:00</span>
                                </div>
                                <div className="text-right">
                                     <p className="text-xs font-black">{h.volume} <span className="text-[9px] text-white/40 uppercase ml-0.5">{t('appointment.appointments', 'Appts')}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                        <div>
                             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t('analytics.overall_forecast', 'Overall Forecast')}</p>
                             <p className="text-sm font-black">{t('analytics.stable_demand', 'Stable Demand')}</p>
                        </div>
                        <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════
const AnalyticsPanel = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [predictiveInsights, setPredictiveInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [services, setServices] = useState([]);
    const [resources, setResources] = useState([]);
    const [wallet, setWallet] = useState(null);

    // Filters
    const [preset, setPreset] = useState('7d');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [resourceId, setResourceId] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showQuickStart, setShowQuickStart] = useState(() => {
        return localStorage.getItem('hideQuickStart') !== 'true';
    });
    const [lastUpdated, setLastUpdated] = useState(null);

    // Chart Refs
    const trendChartRef = useRef(null);
    const utilizationChartRef = useRef(null);
    const statusPieRef = useRef(null);
    const serviceBarRef = useRef(null);

    // Fetch services for filter dropdown
    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/services');
                setServices(Array.isArray(res.data) ? res.data : []);
            } catch { /* ignore */ }
        };
        load();
    }, []);

    // Fetch resources when service changes
    useEffect(() => {
        if (!serviceId) { setResources([]); setResourceId(''); return; }
        const load = async () => {
            try {
                const res = await api.get(`/resources/service/${serviceId}`);
                setResources(Array.isArray(res.data) ? res.data : []);
            } catch { setResources([]); }
        };
        load();
    }, [serviceId]);

    // Build date range from preset
    const getDateRange = useCallback(() => {
        if (preset === 'custom') return { startDate, endDate };
        const end = new Date();
        const start = new Date();
        if (preset === '7d') start.setDate(end.getDate() - 6);
        else if (preset === '30d') start.setDate(end.getDate() - 29);
        else if (preset === '90d') start.setDate(end.getDate() - 89);
        return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    }, [preset, startDate, endDate]);

    // Fetch analytics
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const range = getDateRange();
            const params = new URLSearchParams();
            if (range.startDate) params.append('startDate', range.startDate);
            if (range.endDate) params.append('endDate', range.endDate);
            if (serviceId) params.append('serviceId', serviceId);
            if (resourceId) params.append('resourceId', resourceId);
            const res = await api.get(`/admin/analytics?${params.toString()}`);
            setStats(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Analytics fetch failed', err);
            setError(err.response?.data?.message || err.message || 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    }, [getDateRange, serviceId, resourceId]);

    const fetchPredictiveInsights = useCallback(async () => {
        try {
            const res = await api.get('/admin/predictive-insights');
            setPredictiveInsights(res.data);
        } catch (err) {
            console.error('Predictive insights fetch failed', err);
        }
    }, []);

    useEffect(() => { 
        fetchAnalytics();
        fetchPredictiveInsights();
        
        // Fetch Wallet Balance
        const fetchWallet = async () => {
            try {
                const res = await api.get('/payments/status');
                setWallet(res.data);
            } catch (err) {
                console.error('Wallet fetch failed', err);
            }
        };
        fetchWallet();
    }, [fetchAnalytics, fetchPredictiveInsights]);

    // Helper to capture chart as base64
    const captureChart = async (ref) => {
        if (!ref.current) return null;
        try {
            const canvas = await html2canvas(ref.current, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false,
                useCORS: true
            });
            return canvas.toDataURL('image/png');
        } catch (err) {
            console.error('Failed to capture chart', err);
        }
    };

    // Premium Excel export using ExcelJS
    const downloadExcel = async () => {
        if (!stats) return;

        // Capture charts first
        const trendImg = await captureChart(trendChartRef);
        const utilImg = await captureChart(utilizationChartRef);
        const statusImg = await captureChart(statusPieRef);
        const serviceImg = await captureChart(serviceBarRef);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Queuify';
        workbook.lastModifiedBy = 'Queuify Admin';
        workbook.created = new Date();

        // Helper for consistent styling
        const styleHeader = (cell, color = '4F46E5') => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        };

        const styleSubHeader = (cell) => {
            cell.font = { bold: true, size: 11 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
            cell.border = { bottom: { style: 'thin' } };
        };

        // 1. OVERVIEW SHEET
        const wsOverview = workbook.addWorksheet(t('dashboard.overview', 'Overview'));
        wsOverview.columns = [{ width: 30 }, { width: 25 }, { width: 25 }];

        // Branding Header
        const titleRow = wsOverview.addRow(['Queuify ANALYTICS REPORT']);
        wsOverview.mergeCells('A1:C1');
        titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
        titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.height = 30;

        wsOverview.addRow([]);
        wsOverview.addRow([t('analytics.report_summary', 'Report Summary'), '', t('analytics.generated_on', 'Generated on: {{date}}', { date: new Date().toLocaleString() })]);
        wsOverview.addRow([t('common.organization', 'Organization:'), stats.orgName || 'Your Organization']);
        wsOverview.addRow([t('common.industry', 'Industry:'), stats.orgType || 'General']);
        wsOverview.addRow([t('common.period', 'Period:'), `${stats.dateRange?.start} to ${stats.dateRange?.end}`]);
        wsOverview.addRow([]);

        // KPI Section
        const kpiHeader = wsOverview.addRow([t('analytics.metric', 'Metric'), t('analytics.current_value', 'Current Value'), t('analytics.growth', 'Growth %')]);
        kpiHeader.eachCell(c => styleHeader(c, '1E293B'));

        const addKpiRow = (label, value, growth) => {
            const row = wsOverview.addRow([label, value, (growth !== undefined && growth !== null) ? (growth > 0 ? '+' : '') + growth + '%' : '-']);
            if (growth > 0) row.getCell(3).font = { color: { argb: '059669' }, bold: true };
            if (growth < 0) row.getCell(3).font = { color: { argb: 'DC2626' }, bold: true };
        };

        addKpiRow(t('analytics.total_bookings', 'Total Bookings'), stats.totalBookings, stats.growth?.bookings);
        addKpiRow(t('analytics.confirmed_bookings', 'Confirmed Bookings'), stats.confirmedBookings, null);
        addKpiRow(t('analytics.completed_bookings', 'Completed Bookings'), stats.completedBookings, null);
        addKpiRow(t('analytics.cancelled_bookings', 'Cancelled Bookings'), stats.cancelledBookings, null);
        addKpiRow(t('analytics.slot_utilization', 'Slot Utilization'), stats.utilization + '%', stats.growth?.utilization);
        addKpiRow(t('analytics.cancellation_rate', 'Cancellation Rate'), stats.cancellationRate + '%', stats.growth?.cancellation);

        // 2. DAILY TRENDS
        const wsTrends = workbook.addWorksheet(t('analytics.daily_trends', 'Daily Trends'));
        wsTrends.columns = [{ width: 20 }, { width: 20 }];
        const trendHeader = wsTrends.addRow([t('analytics.date', 'Date'), t('analytics.total_bookings', 'Total Bookings')]);
        trendHeader.eachCell(c => styleHeader(c));
        stats.dailyBookings.forEach(d => wsTrends.addRow([d.date, d.count]));

        // 3. SERVICE PERFORMANCE
        const wsService = workbook.addWorksheet(t('analytics.service_performance', 'Service Performance'));
        wsService.columns = [{ width: 35 }, { width: 15 }, { width: 25 }];
        const svcHeader = wsService.addRow([t('analytics.name', 'Service Name'), t('analytics.bookings', 'Bookings'), t('analytics.distribution', 'Distribution')]);
        svcHeader.eachCell(c => styleHeader(c));

        stats.bookingsByService.forEach(s => {
            const row = wsService.addRow([s.name, s.value, '']);
            const pct = stats.totalBookings > 0 ? Math.round((s.value / stats.totalBookings) * 100) : 0;
            row.getCell(3).value = `${pct}% share`;
            row.getCell(3).alignment = { horizontal: 'right' };
        });

        // 4. RESOURCE PERFORMANCE
        const wsResource = workbook.addWorksheet(t('analytics.resource_performance', 'Resource Performance'));
        wsResource.columns = [{ width: 35 }, { width: 15 }, { width: 20 }];
        resHeader.eachCell(c => styleHeader(c));
        (stats.bookingsByResource || []).forEach(r => {
            wsResource.addRow([r.name, r.value, t('common.active', 'Active')]);
        });

        // 5. PEAK HOURS HEATMAP
        const wsPeak = workbook.addWorksheet(t('analytics.peak_hours', 'Peak Hours'));
        const hCols = HOURS.map(h => ({ header: `${h}:00`, width: 8 }));
        wsPeak.columns = [{ header: t('analytics.day', 'Day'), width: 15 }, ...hCols];

        const getHeatArgb = (count) => {
            if (count === 0) return 'F8FAFC';
            const maxVal = Math.max(...(stats.peakHoursHeatmap?.map(h => h.count) || [1]), 1);
            const r = count / maxVal;
            if (r > 0.75) return '4F46E5';
            if (r > 0.5) return '818CF8';
            if (r > 0.25) return 'C7D2FE';
            return 'E0E7FF';
        };

        DAY_NAMES.forEach((day, dIdx) => {
            const rVals = [day];
            HOURS.forEach(hour => {
                const f = stats.peakHoursHeatmap?.find(h => h.day === dIdx && h.hour === hour);
                rVals.push(f ? f.count : 0);
            });
            const row = wsPeak.addRow(rVals);
            row.eachCell((cell, colNum) => {
                if (colNum > 1) {
                    const c = cell.value;
                    const bgClr = getHeatArgb(c);
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgClr } };
                    if (bgClr === '4F46E5') cell.font = { color: { argb: 'FFFFFF' }, bold: true };
                    cell.alignment = { horizontal: 'center' };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                }
            });
        });

        // 6. INSIGHTS
        const wsInsights = workbook.addWorksheet(t('analytics.smart_insights', 'Smart Insights'));
        wsInsights.columns = [{ width: 25 }, { width: 15 }, { width: 65 }];
        const insHead = wsInsights.addRow([t('analytics.metric', 'Metric'), t('analytics.impact', 'Impact'), t('analytics.action_area', 'Insight / Action Area')]);
        insHead.eachCell(c => styleHeader(c, 'F59E0B'));
        (stats.insights || []).forEach(i => {
            wsInsights.addRow([i.title, i.type.toUpperCase(), i.message]);
        });

        // Write Buffer
        const buf = await workbook.xlsx.writeBuffer();

        // After writing buffer (or during sheet creation), add images
        if (trendImg) {
            const imageId = workbook.addImage({ base64: trendImg, extension: 'png' });
            workbook.getWorksheet('Daily Trends').addImage(imageId, {
                tl: { col: 2.5, row: 1 },
                ext: { width: 500, height: 300 }
            });
        }
        if (utilImg) {
            const imageId = workbook.addImage({ base64: utilImg, extension: 'png' });
            workbook.getWorksheet('Daily Trends').addImage(imageId, {
                tl: { col: 2.5, row: 18 },
                ext: { width: 500, height: 300 }
            });
        }
        if (serviceImg) {
            const imageId = workbook.addImage({ base64: serviceImg, extension: 'png' });
            workbook.getWorksheet('Service Performance').addImage(imageId, {
                tl: { col: 4, row: 1 },
                ext: { width: 400, height: 280 }
            });
        }
        if (statusImg) {
            const imageId = workbook.addImage({ base64: statusImg, extension: 'png' });
            wsOverview.addImage(imageId, {
                tl: { col: 0.5, row: 18 },
                ext: { width: 300, height: 250 }
            });
        }

        const b = new Blob([await workbook.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const u = URL.createObjectURL(b);
        const l = document.createElement('a');
        l.href = u;
        l.download = `Queuify_Premium_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        l.click();
        URL.revokeObjectURL(u);
    };

    // ─── Memoized KPI Cards Data ───
    const kpiCards = useMemo(() => {
        if (!stats) return [];
        return [
            {
                title: t('dashboard.total_bookings', 'Total Bookings'), value: stats.totalBookings,
                growth: stats.growth?.bookings, icon: CalendarDays,
                color: 'from-indigo-500 to-purple-600', lightBg: 'bg-indigo-50', lightText: 'text-indigo-600'
            },
            {
                title: t('dashboard.utilization', 'Slot Utilization'), value: `${stats.utilization}%`,
                growth: stats.growth?.utilization, suffix: 'pt', icon: Activity,
                color: 'from-blue-500 to-cyan-600', lightBg: 'bg-blue-50', lightText: 'text-blue-600'
            },
            {
                title: t('dashboard.cancellation_rate', 'Cancellation Rate'), value: `${stats.cancellationRate}%`,
                growth: stats.growth?.cancellation, suffix: 'pt', invertGrowth: true, icon: XCircle,
                color: 'from-rose-500 to-pink-600', lightBg: 'bg-rose-50', lightText: 'text-rose-600'
            },
            ...(wallet ? [
                {
                    title: t('dashboard.available_balance', 'Available Balance'), value: `₹${wallet.available_balance || 0}`,
                    icon: IndianRupee, color: 'from-emerald-500 to-teal-600', 
                    lightBg: 'bg-emerald-50', lightText: 'text-emerald-600'
                },
                {
                    title: t('dashboard.locked_funds', 'Locked (Escrow)'), value: `₹${wallet.locked_funds || 0}`,
                    icon: Lock, color: 'from-amber-500 to-orange-600', 
                    lightBg: 'bg-amber-50', lightText: 'text-amber-600'
                }
            ] : [])
        ];
    }, [stats, wallet, t]);

    // ─── Loading state ───
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
                </div>
                <p className="text-gray-500 font-medium">{t('common.loading_analytics', 'Loading analytics…')}</p>
            </div>
        );
    }

    // ─── Error state ───
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <AlertCircle className="h-12 w-12 text-red-400" />
                <p className="text-gray-600 font-medium">{error}</p>
                <button onClick={() => fetchAnalytics()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Retry</button>
            </div>
        );
    }

    // ─── Empty state ───
    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <BarChart3 className="h-12 w-12 text-gray-300" />
                <p className="text-gray-500">{t('analytics.no_data_available', 'No analytics data available')}</p>
            </div>
        );
    }

    // ─── Heatmap ───
    // const heatmapData = stats.peakHoursHeatmap || []; // Handled inside return for simplicity or move to useMemo

    // ─── Heatmap ───
    const heatmapData = stats.peakHoursHeatmap || [];
    const maxHeatVal = Math.max(...heatmapData.map(h => h.count), 1);

    const getHeatColor = (count) => {
        if (count === 0) return 'bg-gray-50';
        const ratio = count / maxHeatVal;
        if (ratio > 0.75) return 'bg-indigo-600 text-white';
        if (ratio > 0.5) return 'bg-indigo-400 text-white';
        if (ratio > 0.25) return 'bg-indigo-200 text-indigo-800';
        return 'bg-indigo-100 text-indigo-700';
    };

    const getHeatCount = (day, hour) => {
        const found = heatmapData.find(h => h.day === day && h.hour === hour);
        return found ? found.count : 0;
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Quick Start Guide for New Orgs */}
            <AnimatePresence>
                {showQuickStart && (
                    <QuickStartGuide 
                        type={stats.orgType} 
                        onDismiss={() => {
                            setShowQuickStart(false);
                            localStorage.setItem('hideQuickStart', 'true');
                        }} 
                    />
                )}
            </AnimatePresence>

            {/* ═══ Header ═══ */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.overview', 'Analytics & Reports')}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500 text-sm">
                            {stats.dateRange?.start} → {stats.dateRange?.end}
                        </p>
                        {lastUpdated && (
                            <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                <Clock className="h-3 w-3" /> {t('common.updated_at', 'Updated {{time}}', { time: lastUpdated.toLocaleTimeString() })}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Preset buttons */}
                    <div className="bg-white border p-1 rounded-xl flex text-sm shadow-sm">
                        {[{ label: '7D', val: '7d' }, { label: '30D', val: '30d' }, { label: '90D', val: '90d' }, { label: 'Custom', val: 'custom' }].map(p => (
                            <button
                                key={p.val}
                                onClick={() => {
                                    setPreset(p.val);
                                    if (p.val === 'custom') setShowFilters(true);
                                }}
                                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${preset === p.val ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all shadow-sm ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Filter className="h-4 w-4" /> {t('common.filters', 'Filters')}
                        {(serviceId || resourceId) && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </button>

                    <button onClick={downloadExcel} className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 text-gray-600 text-sm font-medium transition shadow-sm">
                        <Download className="h-4 w-4" /> {t('common.export', 'Export')}
                    </button>
                </div>
            </div>

            {/* ═══ Expanded Filters ═══ */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap gap-4 items-end shadow-sm">
                            {preset === 'custom' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('common.start_date', 'Start Date')}</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('common.end_date', 'End Date')}</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('common.service', 'Service')}</label>
                                <div className="relative">
                                    <select value={serviceId} onChange={e => { setServiceId(e.target.value); setResourceId(''); }}
                                        className="appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none min-w-[160px]">
                                        <option value="">{t('service.all_services', 'All Services')}</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            {serviceId && resources.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('common.resource', 'Resource')}</label>
                                    <div className="relative">
                                        <select value={resourceId} onChange={e => setResourceId(e.target.value)}
                                            className="appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none min-w-[160px]">
                                            <option value="">{t('resource.all_resources', 'All Resources')}</option>
                                            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}
                            {(serviceId || resourceId) && (
                                <button onClick={() => { setServiceId(''); setResourceId(''); }}
                                    className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 pb-2 font-medium">
                                    <X className="h-3.5 w-3.5" /> {t('common.clear', 'Clear')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ KPI Cards ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {kpiCards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all group overflow-hidden relative"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${card.lightBg} ${card.lightText} p-3 rounded-xl`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                            <GrowthBadge value={card.growth} suffix={card.suffix || '%'} />
                        </div>
                        
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-1">
                                    <p className="text-3xl font-bold text-gray-900 tracking-tight">{card.value}</p>
                                    {card.suffix && <span className="text-xs font-bold text-gray-400 uppercase">{card.suffix}</span>}
                                </div>
                                
                                {card.title === t('dashboard.available_balance', 'Available Balance') && parseFloat(wallet?.available_balance) > 0 && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm(t('wallet.withdraw_confirm', 'Withdraw ₹{{amount}} to your linked bank account?', { amount: wallet.available_balance }))) {
                                                try {
                                                    await api.post('/payments/withdraw', { amount: wallet.available_balance });
                                                    toast.success(t('wallet.withdraw_success', 'Withdrawal request processed successfully!'));
                                                    window.location.reload();
                                                } catch (err) {
                                                    toast.error(err.response?.data?.message || t('wallet.withdraw_failed', 'Withdrawal failed'));
                                                }
                                            }
                                        }}
                                        className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors shadow-sm"
                                    >
                                        {t('common.withdraw', 'Withdraw')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ═══ AI Predictive Insights ═══ */}
            <PredictiveInsightsSection insights={predictiveInsights} />

            {/* ═══ Charts Row 1: Trend + Status Pie ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Booking Trend — Area Chart */}
                <motion.div
                    ref={trendChartRef}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-500" /> {t('analytics.booking_trend', 'Booking Trend')}
                        </h3>
                    </div>
                    {stats.dailyBookings?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={stats.dailyBookings} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v.slice(5)} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#bookingGrad)" dot={{ r: 3, fill: COLORS.primary }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-400">
                            <p>{t('analytics.no_booking_data', 'No booking data for this period')}</p>
                        </div>
                    )}
                </motion.div>

                {/* Status Distribution — Donut Chart */}
                <motion.div
                    ref={statusPieRef}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <PieIcon className="h-5 w-5 text-purple-500" /> {t('analytics.status_distribution', 'Status Distribution')}
                    </h3>
                    {stats.statusDistribution?.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={stats.statusDistribution}
                                        cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {stats.statusDistribution.map((s, i) => (
                                            <Cell key={i} fill={s.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div style={customTooltipStyle}>
                                                <p className="font-semibold">{t(payload[0].name)}: {payload[0].value}</p>
                                            </div>
                                        );
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                {stats.statusDistribution.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                        <span className="text-gray-600">{t(s.name)} ({s.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-gray-400">
                            <p>{t('analytics.no_status_data', 'No status data')}</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ═══ Charts Row 2: Utilization Trend ═══ */}

            {/* ═══ Charts Row 2: Bookings by Service ═══ */}
            <div className="grid grid-cols-1">
                {/* Utilization Trend — Area Chart */}
                <motion.div
                    ref={utilizationChartRef}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" /> {t('analytics.utilization_trend', 'Slot Utilization Trend (%)')}
                        </h3>
                    </div>
                    {stats.dailyBookings?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={stats.dailyBookings} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v.slice(5)} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <Tooltip content={<CustomTooltip suffix="%" />} />
                                <Area type="monotone" dataKey="utilization" stroke="#3b82f6" strokeWidth={2.5} fill="url(#utilGrad)" dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-400">
                            <p>{t('analytics.no_utilization_data', 'No utilization data')}</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ═══ Peak Hours Heatmap ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                    <Zap className="h-5 w-5 text-amber-500" /> 
                    {t('analytics.peak_hours_heatmap', 'Peak Hours Heatmap')}
                    <InfoTooltip text={t('tooltip.peak_hours_heatmap', "Visual distribution of bookings across days and hours. Darker areas indicate higher demand, helping you optimize staffing.")} />
                </h3>
                <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                        {/* Hour headers */}
                        <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)` }}>
                            <div />
                            {HOURS.map(h => (
                                <div key={h} className="text-center text-xs text-gray-400 font-medium py-1">
                                    {h}:00
                                </div>
                            ))}
                        </div>
                        {/* Day rows */}
                        {DAY_NAMES.map((day, dayIdx) => (
                            <div key={dayIdx} className="grid gap-1 mt-1" style={{ gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)` }}>
                                <div className="text-xs text-gray-500 font-medium flex items-center">{day}</div>
                                {HOURS.map(hour => {
                                    const count = getHeatCount(dayIdx, hour);
                                    return (
                                        <div
                                            key={hour}
                                            className={`${getHeatColor(count)} rounded-md h-8 flex items-center justify-center text-xs font-semibold transition-all hover:scale-110 cursor-default`}
                                            title={`${day} ${hour}:00 — ${count} bookings`}
                                        >
                                            {count > 0 ? count : ''}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        {/* Legend */}
                        <div className="flex items-center gap-2 mt-4 justify-end">
                            <span className="text-xs text-gray-400">{t('common.less', 'Less')}</span>
                            <div className="w-5 h-5 rounded bg-gray-50 border border-gray-100" />
                            <div className="w-5 h-5 rounded bg-indigo-100" />
                            <div className="w-5 h-5 rounded bg-indigo-200" />
                            <div className="w-5 h-5 rounded bg-indigo-400" />
                            <div className="w-5 h-5 rounded bg-indigo-600" />
                            <span className="text-xs text-gray-400">{t('common.more', 'More')}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══ Smart Insights ═══ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-5">
                    <Lightbulb className="h-5 w-5 text-yellow-500" /> {t('analytics.smart_insights', 'Smart Insights')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stats.insights?.map((insight, i) => (
                        <InsightCard key={i} insight={insight} />
                    ))}
                </div>
            </motion.div>
        </div >
    );
};

export default AnalyticsPanel;

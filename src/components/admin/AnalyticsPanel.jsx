import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';
import {
    Loader2, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle,
    Download, CalendarDays, BarChart3, PieChart as PieIcon, Zap,
    CheckCircle2, XCircle, Clock, Filter, X, Lightbulb, AlertTriangle, Info, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

// ─── Color Palette ───
const COLORS = {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    success: '#10b981',
    successLight: '#34d399',
    danger: '#ef4444',
    dangerLight: '#f87171',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    info: '#3b82f6',
    infoLight: '#60a5fa',
    purple: '#8b5cf6',
    pink: '#ec4899',
    teal: '#14b8a6',
    slate: '#64748b',
};

const SERVICE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.pink, COLORS.teal, COLORS.purple, COLORS.info, COLORS.dangerLight];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am to 7pm

// ─── Tooltip Styles ───
const customTooltipStyle = {
    backgroundColor: '#1e293b',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,.3)',
    color: '#fff',
    fontSize: '13px',
};

// ─── Growth Badge ───
const GrowthBadge = ({ value, suffix = '%' }) => {
    if (value === 0 || value === undefined) return <span className="text-xs text-gray-400 ml-2">—</span>;
    const isPositive = value > 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ml-2 px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{value}{suffix}
        </span>
    );
};

// ─── Custom Recharts Tooltip ───
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
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
};

// ─── Insight Card ───
const InsightCard = ({ insight }) => {
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
};

// ─── Quick Start Guide ───
const QuickStartGuide = ({ type = 'Other' }) => {
    const config = {
        'Clinic': {
            title: 'Welcome to your Healthcare Hub!',
            description: 'Your clinic is set up for scheduled appointments with specific doctors.',
            steps: [
                'Manage your Doctors in the "Resources" section.',
                'Check "Slots" to define working hours for each doctor.',
                'Share your link with patients to start taking bookings.'
            ]
        },
        'Bank': {
            title: 'Welcome to your Central Queue!',
            description: 'Your bank is set up for a general first-come-first-served walk-in system.',
            steps: [
                'Add different Service Counters in the "Resources" section.',
                'Use "Live Queue" to call customers to specific counters.',
                'Download the QR code for your customers to join the line.'
            ]
        },
        'Salon': {
            title: 'Welcome to your Salon!',
            description: 'Your salon is set up for bookings with specific stylists.',
            steps: [
                'Add your Stylists in the "Resources" section.',
                'Go to "Slots" to set their availability.',
                'Share your booking page on social media.'
            ]
        },
        'Service Center': {
            title: 'Welcome to your Service Center!',
            description: 'Your center is set up for walk-in repair or pickup queues.',
            steps: [
                'Define your service categories in "Services".',
                'Add your service desks in "Resources".',
                'Start serving customers using the "Live Queue" tab.'
            ]
        },
        'Other': {
            title: 'Welcome to Queuify!',
            description: 'Your business is ready to manage queues effectively.',
            steps: [
                'Review your "Services" to customize your offerings.',
                'Check "Resources" to add your staff or counters.',
                'Use "Live Queue" to manage real-time customer flow.'
            ]
        }
    };

    const s = config[type] || config['Other'];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden mb-8"
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Zap className="w-48 h-48" />
            </div>
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

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════
const AnalyticsPanel = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [services, setServices] = useState([]);
    const [resources, setResources] = useState([]);

    // Filters
    const [preset, setPreset] = useState('7d');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [resourceId, setResourceId] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Chart Refs
    const trendChartRef = useRef(null);
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

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

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
            return null;
        }
    };

    // Premium Excel export using ExcelJS
    const downloadExcel = async () => {
        if (!stats) return;

        // Capture charts first
        const trendImg = await captureChart(trendChartRef);
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
        const wsOverview = workbook.addWorksheet('Overview');
        wsOverview.columns = [{ width: 30 }, { width: 25 }, { width: 25 }];

        // Branding Header
        const titleRow = wsOverview.addRow(['Queuify ANALYTICS REPORT']);
        wsOverview.mergeCells('A1:C1');
        titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
        titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
        titleRow.getCell(1).alignment = { horizontal: 'center' };
        titleRow.height = 30;

        wsOverview.addRow([]);
        wsOverview.addRow(['Report Summary', '', 'Generated on: ' + new Date().toLocaleString()]);
        wsOverview.addRow(['Organization:', stats.orgName || 'Your Organization']);
        wsOverview.addRow(['Industry:', stats.orgType || 'General']);
        wsOverview.addRow(['Period:', `${stats.dateRange?.start} to ${stats.dateRange?.end}`]);
        wsOverview.addRow([]);

        // KPI Section
        const kpiHeader = wsOverview.addRow(['Metric', 'Current Value', 'Growth %']);
        kpiHeader.eachCell(c => styleHeader(c, '1E293B'));

        const addKpiRow = (label, value, growth) => {
            const row = wsOverview.addRow([label, value, (growth !== undefined && growth !== null) ? (growth > 0 ? '+' : '') + growth + '%' : '-']);
            if (growth > 0) row.getCell(3).font = { color: { argb: '059669' }, bold: true };
            if (growth < 0) row.getCell(3).font = { color: { argb: 'DC2626' }, bold: true };
        };

        addKpiRow('Total Bookings', stats.totalBookings, stats.growth?.bookings);
        addKpiRow('Confirmed Bookings', stats.confirmedBookings, null);
        addKpiRow('Completed Bookings', stats.completedBookings, null);
        addKpiRow('Cancelled Bookings', stats.cancelledBookings, null);
        addKpiRow('Slot Utilization', stats.utilization + '%', stats.growth?.utilization);
        addKpiRow('Cancellation Rate', stats.cancellationRate + '%', stats.growth?.cancellation);

        // 2. DAILY TRENDS
        const wsTrends = workbook.addWorksheet('Daily Trends');
        wsTrends.columns = [{ width: 20 }, { width: 20 }];
        const trendHeader = wsTrends.addRow(['Date', 'Total Bookings']);
        trendHeader.eachCell(c => styleHeader(c));
        stats.dailyBookings.forEach(d => wsTrends.addRow([d.date, d.count]));

        // 3. SERVICE PERFORMANCE
        const wsService = workbook.addWorksheet('Service Performance');
        wsService.columns = [{ width: 35 }, { width: 15 }, { width: 25 }];
        const svcHeader = wsService.addRow(['Service Name', 'Bookings', 'Distribution']);
        svcHeader.eachCell(c => styleHeader(c));

        stats.bookingsByService.forEach(s => {
            const row = wsService.addRow([s.name, s.value, '']);
            const pct = stats.totalBookings > 0 ? Math.round((s.value / stats.totalBookings) * 100) : 0;
            row.getCell(3).value = `${pct}% share`;
            row.getCell(3).alignment = { horizontal: 'right' };
        });

        // 4. RESOURCE PERFORMANCE
        const wsResource = workbook.addWorksheet('Resource Performance');
        wsResource.columns = [{ width: 35 }, { width: 15 }, { width: 20 }];
        const resHeader = wsResource.addRow(['Staff / Counter', 'Bookings', 'Status']);
        resHeader.eachCell(c => styleHeader(c));
        (stats.bookingsByResource || []).forEach(r => {
            wsResource.addRow([r.name, r.value, 'Active']);
        });

        // 5. PEAK HOURS HEATMAP
        const wsPeak = workbook.addWorksheet('Peak Hours');
        const hCols = HOURS.map(h => ({ header: `${h}:00`, width: 8 }));
        wsPeak.columns = [{ header: 'Day', width: 15 }, ...hCols];

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
        const wsInsights = workbook.addWorksheet('Smart Insights');
        wsInsights.columns = [{ width: 25 }, { width: 15 }, { width: 65 }];
        const insHead = wsInsights.addRow(['Metric', 'Impact', 'Insight / Action Area']);
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

    // ─── Loading state ───
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
                </div>
                <p className="text-gray-500 font-medium">Loading analytics…</p>
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
                <p className="text-gray-500">No analytics data available</p>
            </div>
        );
    }

    // ─── KPI Cards ───
    const kpiCards = [
        {
            title: 'Total Bookings', value: stats.totalBookings,
            growth: stats.growth?.bookings, icon: CalendarDays,
            color: 'from-indigo-500 to-purple-600', lightBg: 'bg-indigo-50', lightText: 'text-indigo-600'
        },
        {
            title: 'Slot Utilization', value: `${stats.utilization}%`,
            growth: stats.growth?.utilization, suffix: 'pt', icon: Activity,
            color: 'from-blue-500 to-cyan-600', lightBg: 'bg-blue-50', lightText: 'text-blue-600'
        },
        {
            title: 'Cancellation Rate', value: `${stats.cancellationRate}%`,
            growth: stats.growth?.cancellation, suffix: 'pt', invertGrowth: true, icon: XCircle,
            color: 'from-rose-500 to-pink-600', lightBg: 'bg-rose-50', lightText: 'text-rose-600'
        },
    ];

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
        <div className="space-y-6">
            {/* Quick Start Guide for New Orgs */}
            <QuickStartGuide type={stats.orgType} />

            {/* ═══ Header ═══ */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500 text-sm">
                            {stats.dateRange?.start} → {stats.dateRange?.end}
                        </p>
                        {lastUpdated && (
                            <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                <Clock className="h-3 w-3" /> Updated {lastUpdated.toLocaleTimeString()}
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
                        <Filter className="h-4 w-4" /> Filters
                        {(serviceId || resourceId) && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </button>

                    <button onClick={downloadExcel} className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 text-gray-600 text-sm font-medium transition shadow-sm">
                        <Download className="h-4 w-4" /> Export
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
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
                                <div className="relative">
                                    <select value={serviceId} onChange={e => { setServiceId(e.target.value); setResourceId(''); }}
                                        className="appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none min-w-[160px]">
                                        <option value="">All Services</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            {serviceId && resources.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Resource</label>
                                    <div className="relative">
                                        <select value={resourceId} onChange={e => setResourceId(e.target.value)}
                                            className="appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none min-w-[160px]">
                                            <option value="">All Resources</option>
                                            {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}
                            {(serviceId || resourceId) && (
                                <button onClick={() => { setServiceId(''); setResourceId(''); }}
                                    className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 pb-2 font-medium">
                                    <X className="h-3.5 w-3.5" /> Clear
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${card.lightBg} ${card.lightText} p-2.5 rounded-xl group-hover:scale-110 transition-transform`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                            <GrowthBadge value={card.growth} suffix={card.suffix || '%'} />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                        <p className="text-xs text-gray-400 mt-2">vs previous period</p>
                    </motion.div>
                ))}
            </div>

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
                            <TrendingUp className="h-5 w-5 text-indigo-500" /> Booking Trend
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
                            <p>No booking data for this period</p>
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
                        <PieIcon className="h-5 w-5 text-purple-500" /> Status Distribution
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
                                                <p className="font-semibold">{payload[0].name}: {payload[0].value}</p>
                                            </div>
                                        );
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                {stats.statusDistribution.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                        <span className="text-gray-600">{s.name} ({s.value})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-gray-400">
                            <p>No status data</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ═══ Charts Row 2: Bookings by Service ═══ */}
            <div className="grid grid-cols-1 gap-5">
                {/* Bookings by Service */}
                <motion.div
                    ref={serviceBarRef}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <BarChart3 className="h-5 w-5 text-teal-500" /> Bookings by Service
                    </h3>
                    {stats.bookingsByService?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={stats.bookingsByService} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip suffix=" bookings" />} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {stats.bookingsByService.map((_, i) => (
                                        <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[260px] flex items-center justify-center text-gray-400">
                            <p>No service data for this period</p>
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
                    <Zap className="h-5 w-5 text-amber-500" /> Peak Hours Heatmap
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
                            <span className="text-xs text-gray-400">Less</span>
                            <div className="w-5 h-5 rounded bg-gray-50 border border-gray-100" />
                            <div className="w-5 h-5 rounded bg-indigo-100" />
                            <div className="w-5 h-5 rounded bg-indigo-200" />
                            <div className="w-5 h-5 rounded bg-indigo-400" />
                            <div className="w-5 h-5 rounded bg-indigo-600" />
                            <span className="text-xs text-gray-400">More</span>
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
                    <Lightbulb className="h-5 w-5 text-yellow-500" /> Smart Insights
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

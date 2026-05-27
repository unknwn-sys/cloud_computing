'use client';

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Download,
  FileText,
  Filter,
  LayoutDashboard,
  Loader2,
  LogOut,
  Radar,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  User,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { ApiError, api, clearToken, getToken } from '@/lib/api';

type CountItem = { key: string; count: number };
type StatusCategory = { label: string; count: number };
type Alert = { severity: string; message: string };
type SuspiciousIp = {
  ip: string;
  severity: string;
  reasons: string[];
  total_requests: number;
  failed_requests: number;
  login_failures: number;
  bot_requests: number;
  sensitive_hits: number;
};
type Summary = {
  total_requests: number;
  http_404: number;
  http_500: number;
  status_categories?: Record<string, StatusCategory>;
  status_codes?: Record<string, number>;
  tracked_status_codes?: Record<string, number>;
  top_endpoints?: CountItem[];
  top_failing_endpoints?: CountItem[];
  hourly_traffic: Record<string, number>;
  minute_traffic?: Record<string, number>;
  requests_per_ip?: CountItem[];
  suspicious_ips?: SuspiciousIp[];
  brute_force_candidates?: CountItem[];
  bot_traffic?: CountItem[];
  sensitive_path_probing?: CountItem[];
  average_requests_per_minute?: number;
  peak_traffic_hour?: { hour: string; count: number };
  error_rate?: number;
  methods?: Record<string, number>;
  detected_formats?: Record<string, number>;
  unparsed_lines?: number;
  alerts?: Alert[];
};
type Upload = { id: number; filename: string; created_at: string; summary: Summary };
type AuditEvent = { id: number; action: string; actor_email: string; created_at: string };
type DashboardData = {
  uploads: Upload[];
  audit: AuditEvent[];
  upload_stats?: {
    total_uploads: number;
    recent_uploads: number;
    total_requests_recent: number;
    suspicious_events: number;
    latest_error_rate: number;
    latest_peak_hour: { hour: string; count: number };
  };
};

const navItems = [
  { id: 'overview', label: 'Analytics', icon: LayoutDashboard },
  { id: 'uploads', label: 'Upload History', icon: FileText },
  { id: 'threats', label: 'Threat Monitoring', icon: ShieldAlert },
  { id: 'audit', label: 'Audit Logs', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const statusColors = ['#22d3ee', '#34d399', '#a78bfa', '#f59e0b', '#f43f5e'];

const formatNumber = (value?: number) => new Intl.NumberFormat().format(value || 0);

const toChartData = (record?: Record<string, number>, keyName = 'key') =>
  Object.entries(record || {}).map(([key, count]) => ({ [keyName]: key, count }));

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({ uploads: [], audit: [] });
  const [isReady, setIsReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const latest = data.uploads[0]?.summary;

  const logout = (message = 'Logged out') => {
    clearToken();
    toast.success(message);
    router.replace('/login');
  };

  const handleAuthError = (error?: unknown) => {
    if (error instanceof ApiError && error.status !== 401 && error.status !== 403) {
      toast.error(error.message || 'Request failed');
      return;
    }
    clearToken();
    toast.error('Session expired. Please login again.');
    router.replace('/login');
  };

  const load = () =>
    api<DashboardData>('/analytics/dashboard')
      .then((dashboard) => {
        setData(dashboard);
        setIsReady(true);
      })
      .catch(handleAuthError);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
  }, [router]);

  const filteredUploads = useMemo(() => {
    const normalized = query.toLowerCase();
    return data.uploads.filter((upload) => {
      const matchesText = upload.filename.toLowerCase().includes(normalized);
      if (statusFilter === 'all') return matchesText;
      const count = upload.summary.status_codes?.[statusFilter] || 0;
      return matchesText && count > 0;
    });
  }, [data.uploads, query, statusFilter]);

  const paginatedUploads = filteredUploads.slice((page - 1) * 5, page * 5);
  const totalPages = Math.max(1, Math.ceil(filteredUploads.length / 5));
  const hourlyData = toChartData(latest?.hourly_traffic, 'hour');
  const statusCategoryData = Object.entries(latest?.status_categories || {}).map(([key, value]) => ({
    name: key.toUpperCase(),
    count: value.count,
  }));
  const statusCodeData = toChartData(latest?.tracked_status_codes || latest?.status_codes, 'code');
  const endpointData = (latest?.top_endpoints || []).map((item) => ({ endpoint: item.key, count: item.count }));
  const failureEndpointData = (latest?.top_failing_endpoints || []).map((item) => ({ endpoint: item.key, count: item.count }));
  const ipData = (latest?.requests_per_ip || []).map((item) => ({ ip: item.key, count: item.count }));
  const heatmapData = Array.from({ length: 24 }, (_, hour) => {
    const key = String(hour).padStart(2, '0');
    return { hour: key, count: latest?.hourly_traffic?.[key] || 0 };
  });
  const maxHeat = Math.max(...heatmapData.map((item) => item.count), 1);

  const chooseFile = (selected?: File | null) => {
    if (!selected) return;
    setFile(selected);
    toast.success(`${selected.name} ready for analysis`);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
  };

  const upload = async () => {
    if (!file) {
      toast.error('Select a log file first');
      return;
    }

    const form = new FormData();
    form.append('file', file);
    setIsUploading(true);
    setUploadProgress(18);
    const timer = window.setInterval(() => {
      setUploadProgress((value) => Math.min(value + 12, 92));
    }, 220);

    try {
      await api('/logs/upload', { method: 'POST', body: form });
      setUploadProgress(100);
      toast.success('Log processed with enterprise analytics');
      setFile(null);
      await load();
    } catch (error) {
      handleAuthError(error);
    } finally {
      window.clearInterval(timer);
      setTimeout(() => setUploadProgress(0), 700);
      setIsUploading(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['filename', 'created_at', 'total_requests', 'error_rate', 'peak_hour'],
      ...filteredUploads.map((upload) => [
        upload.filename,
        upload.created_at,
        String(upload.summary.total_requests),
        String(upload.summary.error_rate || 0),
        upload.summary.peak_traffic_hour?.hour || 'unknown',
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cloud-log-analytics.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isReady) {
    return (
      <main className='min-h-screen bg-[#050812] p-6 text-slate-100'>
        <div className='mx-auto grid max-w-7xl gap-4 md:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className='h-36 animate-pulse rounded-xl border border-white/10 bg-white/[.04]' />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-[#050812] text-slate-100'>
      <div className='fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,.1),transparent_25%)]' />
      <div className='relative z-10 flex min-h-screen'>
        <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} hidden border-r border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl transition-all duration-300 lg:block`}>
          <div className='mb-8 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950'>
                <ShieldCheck size={22} />
              </div>
              {isSidebarOpen && (
                <div>
                  <p className='text-sm font-semibold text-white'>CloudLog SIEM</p>
                  <p className='text-xs text-slate-500'>Security console</p>
                </div>
              )}
            </div>
            <button onClick={() => setIsSidebarOpen((value) => !value)} className='rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white'>
              {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <nav className='space-y-2'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon size={19} />
                  {isSidebarOpen && item.label}
                </button>
              );
            })}
          </nav>

          <div className='mt-8 rounded-xl border border-white/10 bg-white/[.04] p-4'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800'>
                <User size={17} />
              </div>
              {isSidebarOpen && (
                <div>
                  <p className='text-sm text-white'>Security Analyst</p>
                  <p className='text-xs text-slate-500'>JWT session active</p>
                </div>
              )}
            </div>
            <button onClick={() => logout()} className='mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/10'>
              <LogOut size={16} />
              {isSidebarOpen && 'Logout'}
            </button>
          </div>
        </aside>

        <section className='flex-1 p-4 md:p-6 lg:p-8'>
          <header className='mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between'>
            <div>
              <p className='text-sm text-cyan-200'>Real-time cloud HTTP analytics</p>
              <h1 className='text-2xl font-semibold text-white md:text-3xl'>Security Operations Dashboard</h1>
            </div>
            <div className='flex flex-wrap gap-2'>
              <button onClick={exportCsv} className='flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10'>
                <Download size={16} /> CSV
              </button>
              <button onClick={() => window.print()} className='flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10'>
                <FileText size={16} /> PDF
              </button>
              <button onClick={() => logout()} className='flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/25'>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </header>

          <nav className='mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70 p-2 lg:hidden'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${active ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className='mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <MetricCard icon={Activity} label='Total requests' value={formatNumber(latest?.total_requests)} detail={`${formatNumber(data.upload_stats?.total_requests_recent)} recent`} />
            <MetricCard icon={AlertTriangle} label='Error rate' value={`${latest?.error_rate || 0}%`} detail={`${formatNumber((latest?.status_categories?.['4xx']?.count || 0) + (latest?.status_categories?.['5xx']?.count || 0))} failures`} tone='red' />
            <MetricCard icon={Radar} label='Peak hour' value={latest?.peak_traffic_hour?.hour || 'unknown'} detail={`${formatNumber(latest?.peak_traffic_hour?.count)} requests`} tone='violet' />
            <MetricCard icon={Bot} label='Suspicious IPs' value={formatNumber(latest?.suspicious_ips?.length)} detail={`${formatNumber(data.upload_stats?.suspicious_events)} stored events`} tone='amber' />
          </div>

          <div className='mb-6 grid gap-4 xl:grid-cols-[.9fr_1.1fr]'>
            <section
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`rounded-2xl border border-dashed p-5 transition ${isDragging ? 'border-cyan-300 bg-cyan-400/10' : 'border-cyan-400/25 bg-slate-950/60'}`}
            >
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200'>
                    <CloudUpload size={24} />
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold text-white'>Upload logs</h2>
                    <p className='text-sm text-slate-400'>Apache, Nginx, JSON, cloud, and mixed HTTP logs.</p>
                  </div>
                </div>
                <label className='cursor-pointer rounded-xl bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15'>
                  Browse
                  <input type='file' accept='.log,.txt,.json' onChange={onFileChange} className='hidden' />
                </label>
              </div>
              <div className='mt-4 rounded-xl border border-white/10 bg-white/[.03] p-4 text-sm text-slate-300'>
                {file ? file.name : 'Drag and drop a log file here'}
              </div>
              {uploadProgress > 0 && (
                <div className='mt-4 h-2 overflow-hidden rounded-full bg-slate-800'>
                  <div className='h-full rounded-full bg-cyan-400 transition-all' style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              <button onClick={upload} disabled={isUploading} className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-70'>
                {isUploading && <Loader2 size={17} className='animate-spin' />}
                Analyze upload
              </button>
            </section>

            <Panel title='Threat Insights' icon={ShieldAlert}>
              <div className='grid gap-3 md:grid-cols-3'>
                {(latest?.alerts || []).slice(0, 3).map((alert, index) => (
                  <div key={`${alert.message}-${index}`} className='rounded-xl border border-red-400/20 bg-red-500/10 p-4'>
                    <p className='text-xs uppercase text-red-200'>{alert.severity}</p>
                    <p className='mt-2 text-sm text-slate-100'>{alert.message}</p>
                  </div>
                ))}
                {(!latest?.alerts || latest.alerts.length === 0) && <EmptyState text='No active high-risk alerts in the latest upload.' />}
              </div>
            </Panel>
          </div>

          {activeSection === 'overview' && (
            <div className='grid gap-4 xl:grid-cols-2'>
              <ChartPanel title='Hourly Traffic Trend' icon={BarChart3}>
                <ResponsiveContainer width='100%' height={280}>
                  <AreaChart data={hourlyData}>
                    <defs><linearGradient id='traffic' x1='0' y1='0' x2='0' y2='1'><stop offset='5%' stopColor='#22d3ee' stopOpacity={0.45}/><stop offset='95%' stopColor='#22d3ee' stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,.14)' />
                    <XAxis dataKey='hour' stroke='#94a3b8' />
                    <YAxis stroke='#94a3b8' />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} />
                    <Area type='monotone' dataKey='count' stroke='#22d3ee' fill='url(#traffic)' />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title='Status Category Distribution' icon={Activity}>
                <ResponsiveContainer width='100%' height={280}>
                  <PieChart>
                    <Pie data={statusCategoryData} dataKey='count' nameKey='name' innerRadius={64} outerRadius={100} paddingAngle={4}>
                      {statusCategoryData.map((_, index) => <Cell key={index} fill={statusColors[index % statusColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title='Tracked HTTP Codes' icon={Filter}>
                <ResponsiveContainer width='100%' height={280}>
                  <BarChart data={statusCodeData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,.14)' />
                    <XAxis dataKey='code' stroke='#94a3b8' />
                    <YAxis stroke='#94a3b8' />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} />
                    <Bar dataKey='count' fill='#34d399' radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title='Endpoint Analytics' icon={FileText}>
                <ResponsiveContainer width='100%' height={280}>
                  <LineChart data={endpointData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,.14)' />
                    <XAxis dataKey='endpoint' hide />
                    <YAxis stroke='#94a3b8' />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} />
                    <Line type='monotone' dataKey='count' stroke='#a78bfa' strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              <ChartPanel title='Attack Heatmap' icon={Radar}>
                <div className='grid grid-cols-6 gap-2 md:grid-cols-12'>
                  {heatmapData.map((item) => (
                    <div key={item.hour} className='rounded-lg border border-white/10 p-2 text-center text-xs text-slate-300' style={{ backgroundColor: `rgba(34,211,238,${0.08 + (item.count / maxHeat) * 0.55})` }}>
                      <div>{item.hour}</div>
                      <div className='mt-1 font-semibold text-white'>{item.count}</div>
                    </div>
                  ))}
                </div>
              </ChartPanel>

              <ChartPanel title='Top Failing Endpoints' icon={AlertTriangle}>
                <ResponsiveContainer width='100%' height={280}>
                  <BarChart data={failureEndpointData} layout='vertical' margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,.14)' />
                    <XAxis type='number' stroke='#94a3b8' />
                    <YAxis type='category' dataKey='endpoint' width={110} stroke='#94a3b8' />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} />
                    <Bar dataKey='count' stackId='a' fill='#f43f5e' radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>
          )}

          {activeSection === 'uploads' && (
            <Panel title='Recent Uploads' icon={FileText}>
              <TableToolbar query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
              <UploadsTable uploads={paginatedUploads} />
              <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </Panel>
          )}

          {activeSection === 'threats' && (
            <div className='grid gap-4 xl:grid-cols-2'>
              <Panel title='Suspicious IP Detection' icon={ShieldAlert}>
                <ThreatTable threats={latest?.suspicious_ips || []} />
              </Panel>
              <ChartPanel title='Requests Per IP' icon={Radar}>
                <ResponsiveContainer width='100%' height={320}>
                  <BarChart data={ipData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,.14)' />
                    <XAxis dataKey='ip' stroke='#94a3b8' />
                    <YAxis stroke='#94a3b8' />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12 }} />
                    <Bar dataKey='count' fill='#f59e0b' radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>
          )}

          {activeSection === 'audit' && (
            <Panel title='Audit Logs' icon={Activity}>
              <div className='space-y-3'>
                {data.audit.map((event) => (
                  <div key={event.id} className='flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[.03] p-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                      <p className='text-sm text-white'>{event.action}</p>
                      <p className='text-xs text-slate-500'>{event.actor_email}</p>
                    </div>
                    <p className='text-xs text-slate-400'>{new Date(event.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {activeSection === 'settings' && (
            <Panel title='Settings' icon={Settings}>
              <EmptyState text='Settings placeholder for team management, retention rules, alert thresholds, and integrations.' />
            </Panel>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'cyan' }: { icon: LucideIcon; label: string; value: string; detail: string; tone?: 'cyan' | 'red' | 'violet' | 'amber' }) {
  const tones = {
    cyan: 'from-cyan-400/20 to-cyan-400/5 text-cyan-200',
    red: 'from-red-400/20 to-red-400/5 text-red-200',
    violet: 'from-violet-400/20 to-violet-400/5 text-violet-200',
    amber: 'from-amber-400/20 to-amber-400/5 text-amber-200',
  };
  return (
    <motion.div whileHover={{ y: -4 }} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${tones[tone]} p-5 shadow-2xl shadow-slate-950/30`}>
      <div className='mb-4 flex items-center justify-between'>
        <p className='text-sm text-slate-300'>{label}</p>
        <Icon size={20} />
      </div>
      <p className='text-3xl font-semibold text-white'>{value}</p>
      <p className='mt-2 text-sm text-slate-400'>{detail}</p>
    </motion.div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className='rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl'>
      <div className='mb-4 flex items-center gap-2'>
        <Icon size={19} className='text-cyan-200' />
        <h2 className='text-lg font-semibold text-white'>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ChartPanel(props: { title: string; icon: LucideIcon; children: ReactNode }) {
  return <Panel {...props} />;
}

function TableToolbar({ query, setQuery, statusFilter, setStatusFilter }: { query: string; setQuery: (value: string) => void; statusFilter: string; setStatusFilter: (value: string) => void }) {
  return (
    <div className='mb-4 flex flex-col gap-3 md:flex-row'>
      <div className='flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2'>
        <Search size={17} className='text-slate-500' />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search uploads' className='w-full bg-transparent text-sm outline-none placeholder:text-slate-600' />
      </div>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className='rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm outline-none'>
        {['all', '200', '201', '301', '302', '400', '401', '403', '404', '405', '429', '500', '502', '503'].map((code) => (
          <option key={code} value={code}>{code === 'all' ? 'All statuses' : code}</option>
        ))}
      </select>
    </div>
  );
}

function UploadsTable({ uploads }: { uploads: Upload[] }) {
  if (!uploads.length) return <EmptyState text='No uploads match the current filters.' />;
  return (
    <div className='overflow-hidden rounded-xl border border-white/10'>
      <table className='w-full min-w-[760px] text-left text-sm'>
        <thead className='bg-white/[.04] text-slate-400'>
          <tr>
            <th className='px-4 py-3'>File</th>
            <th className='px-4 py-3'>Requests</th>
            <th className='px-4 py-3'>Error Rate</th>
            <th className='px-4 py-3'>Peak Hour</th>
            <th className='px-4 py-3'>Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((upload) => (
            <tr key={upload.id} className='border-t border-white/10'>
              <td className='px-4 py-3 text-white'>{upload.filename}</td>
              <td className='px-4 py-3'>{formatNumber(upload.summary.total_requests)}</td>
              <td className='px-4 py-3'>{upload.summary.error_rate || 0}%</td>
              <td className='px-4 py-3'>{upload.summary.peak_traffic_hour?.hour || 'unknown'}</td>
              <td className='px-4 py-3 text-slate-400'>{new Date(upload.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ThreatTable({ threats }: { threats: SuspiciousIp[] }) {
  if (!threats.length) return <EmptyState text='No suspicious IPs detected in the latest upload.' />;
  return (
    <div className='space-y-3'>
      {threats.map((threat) => (
        <div key={threat.ip} className='rounded-xl border border-white/10 bg-white/[.03] p-4'>
          <div className='flex items-center justify-between gap-3'>
            <p className='font-semibold text-white'>{threat.ip}</p>
            <span className='rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-100'>{threat.severity}</span>
          </div>
          <p className='mt-2 text-sm text-slate-400'>{threat.reasons.join(', ')}</p>
          <div className='mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300'>
            <span>Req {formatNumber(threat.total_requests)}</span>
            <span>Failed {formatNumber(threat.failed_requests)}</span>
            <span>Bot {formatNumber(threat.bot_requests)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (page: number) => void }) {
  return (
    <div className='mt-4 flex items-center justify-between text-sm text-slate-400'>
      <span>Page {page} of {totalPages}</span>
      <div className='flex gap-2'>
        <button disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))} className='rounded-lg border border-white/10 px-3 py-2 transition hover:bg-white/10 disabled:opacity-40'>Previous</button>
        <button disabled={page === totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))} className='rounded-lg border border-white/10 px-3 py-2 transition hover:bg-white/10 disabled:opacity-40'>Next</button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className='rounded-xl border border-white/10 bg-white/[.03] p-6 text-sm text-slate-400'>{text}</div>;
}

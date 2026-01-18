import React, { useState, useEffect, useCallback } from 'react';
import { ConnectionStatus, NavItem, Post, DashboardStats, DailyLeadCount, UnifiedLead, CookieConsentParams, CookieConsentResponse } from './types';
import { CookieConsent, BlogPost } from './types/database';
import { testNeonConnection } from './services/neonService';
import { testN8nConnection } from './services/n8nService';
import { fetchDashboardStats, fetchLeadsByDay, fetchLatestLeads } from './services/statsService';
import { fetchCookieConsents } from './services/cookieService';
import { fetchBlogPosts, fetchBlogPostById, deleteBlogPost, BlogQueryParams, BlogResponse } from './services/blogService';
import { checkSession, logout } from './services/authService';
import { StatusCard } from './components/StatusCard';
import { BlogPostForm } from './components/BlogPostForm';
import { LoginPage } from './components/LoginPage';
import { ServicesManager } from './components/ServicesManager';
import { ChatHistory } from './components/ChatHistory';
import { AuthorsManager } from './components/AuthorsManager';
import { LeadsManager } from './components/LeadsManager';
import {
  LayoutDashboard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
  FileBarChart,
  Cookie,
  RefreshCw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortDesc,
  SortAsc,
  Pencil,
  Trash2,
  LogOut,
  Brain,
  MessageSquareText
} from 'lucide-react';

const SidebarItem: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Compliance Viewer Component
const ComplianceViewer: React.FC = () => {
  const [params, setParams] = useState<CookieConsentParams>({
    page: 1,
    pageSize: 10,
    sortDir: 'desc'
  });
  const [data, setData] = useState<CookieConsentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCookieConsents(params);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cookie consents');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = data ? Math.ceil(data.total / params.pageSize) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-140px)]">
      {/* Filters Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <Filter size={16} className="text-gray-400" />
            <input
              type="date"
              className="bg-transparent border-none outline-none text-xs"
              onChange={(e) => setParams(p => ({ ...p, dateFrom: e.target.value, page: 1 }))}
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              className="bg-transparent border-none outline-none text-xs"
              onChange={(e) => setParams(p => ({ ...p, dateTo: e.target.value, page: 1 }))}
            />
          </div>

          <button
            onClick={() => setParams(p => ({ ...p, sortDir: p.sortDir === 'asc' ? 'desc' : 'asc' }))}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {params.sortDir === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            <span>{params.sortDir === 'asc' ? 'Oldest First' : 'Newest First'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-900">{data?.total || 0}</span> records found
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <RefreshCw className="animate-spin text-blue-600" size={32} />
          </div>
        )}

        {error ? (
          <div className="h-full flex flex-col items-center justify-center text-red-600 gap-4">
            <AlertCircle size={48} className="opacity-20" />
            <p className="font-medium">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 font-medium sticky top-0 z-0 shadow-sm">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-3 whitespace-nowrap">User ID</th>
                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                <th className="px-6 py-3 whitespace-nowrap">Consent JSON</th>
                <th className="px-6 py-3 whitespace-nowrap">User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.items.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                    {new Date(row.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-gray-900 font-medium">{row.user_id}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${row.consent_status === 'granted' ? 'bg-green-50 text-green-700 border-green-200' :
                      row.consent_status === 'denied' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                      {row.consent_status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <pre className="bg-gray-100 p-2 rounded text-[10px] text-gray-600 font-mono w-max">
                      {JSON.stringify(row.consent_categories, null, 2)}
                    </pre>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs truncate max-w-[200px]" title={row.user_agent}>
                    {row.user_agent}
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    No logs match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setParams(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
          disabled={params.page === 1 || loading}
          className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all text-gray-600"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-sm text-gray-600 font-medium">
          Page {params.page} of {totalPages || 1}
        </span>

        <button
          onClick={() => setParams(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
          disabled={params.page >= totalPages || loading}
          className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all text-gray-600"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; subtext?: string; icon: React.ReactNode; colorClass: string }> = ({ label, value, subtext, icon, colorClass }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
      {subtext && <p className={`text-xs mt-1 ${colorClass}`}>{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg bg-gray-50 text-gray-600`}>
      {icon}
    </div>
  </div>
);

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.DASHBOARD);
  const [neonStatus, setNeonStatus] = useState<ConnectionStatus>({ service: 'Neon Database', status: 'pending' });
  const [n8nStatus, setN8nStatus] = useState<ConnectionStatus>({ service: 'N8N Webhook', status: 'pending' });

  // Dashboard State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<DailyLeadCount[]>([]);
  const [latestLeads, setLatestLeads] = useState<UnifiedLead[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Post Management State (Stage 6)
  const [postView, setPostView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingPostData, setEditingPostData] = useState<BlogPost | undefined>(undefined);
  const [blogData, setBlogData] = useState<BlogResponse | null>(null);
  const [blogLoading, setBlogLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<{ message: string } | null>(null);

  // Check session on mount
  useEffect(() => {
    const valid = checkSession();
    setIsAuthenticated(valid);
    setAuthChecking(false);
  }, []);

  const runDiagnostics = useCallback(async () => {
    setNeonStatus(prev => ({ ...prev, status: 'pending', message: 'Initiating handshake...' }));
    setN8nStatus(prev => ({ ...prev, status: 'pending', message: 'Verifying endpoint...' }));

    const neonResult = await testNeonConnection();
    setNeonStatus({
      service: 'Neon Database',
      status: neonResult.success ? 'connected' : 'error',
      message: neonResult.message,
      latency: neonResult.latency
    });

    const n8nResult = await testN8nConnection();
    setN8nStatus({
      service: 'N8N Webhook',
      status: n8nResult.success ? 'connected' : 'error',
      message: n8nResult.message,
      latency: n8nResult.latency
    });
  }, []);

  const loadDashboardData = useCallback(async () => {
    // Only load if authenticated
    if (!checkSession()) return;

    setIsStatsLoading(true);
    try {
      const [dashboard, chart, latest] = await Promise.all([
        fetchDashboardStats(),
        fetchLeadsByDay(),
        fetchLatestLeads()
      ]);
      setStats(dashboard);
      setChartData(chart);
      setLatestLeads(latest);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const loadBlogPosts = useCallback(async () => {
    if (!checkSession()) return;

    setBlogLoading(true);
    try {
      const res = await fetchBlogPosts({ page: 1, pageSize: 100 }); // Simple fetch for demo
      setBlogData(res);
    } catch (e) {
      console.error("Failed to load blog posts", e);
    } finally {
      setBlogLoading(false);
    }
  }, []);

  // Initial Load Trigger (Only when auth changes to true)
  useEffect(() => {
    if (isAuthenticated) {
      runDiagnostics();
      loadDashboardData();
    }
  }, [isAuthenticated, runDiagnostics, loadDashboardData]);

  // Load Blog posts when tab is selected
  useEffect(() => {
    if (isAuthenticated && activeTab === NavItem.POSTS && postView === 'list') {
      loadBlogPosts();
    }
  }, [isAuthenticated, activeTab, postView, loadBlogPosts]);

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
  };

  // Blog Actions
  const handleEditClick = async (id: number) => {
    setBlogLoading(true);
    try {
      const post = await fetchBlogPostById(id);
      setEditingPostData(post);
      setEditingPostId(id);
      setPostView('edit');
    } catch (e) {
      console.error(e);
      // alert('Failed to load post');
    } finally {
      setBlogLoading(false);
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteBlogPost(id);
        setShowSuccessToast({ message: 'Post deleted successfully' });
        setTimeout(() => setShowSuccessToast(null), 3000);
        loadBlogPosts();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePostSuccess = (mode: 'create' | 'update') => {
    setPostView('list');
    setEditingPostId(null);
    setEditingPostData(undefined);
    setShowSuccessToast({ message: mode === 'create' ? 'Post published via N8N!' : 'Post updated successfully!' });
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  if (authChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="animate-spin text-blue-600" /></div>;
  }

  // Auth Guard
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans relative">

      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="absolute top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in-down">
          <CheckCircle2 size={20} />
          <span className="font-medium">{showSuccessToast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">hotelmol</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-1">Admin Control Center</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem
            active={activeTab === NavItem.DASHBOARD}
            onClick={() => { setActiveTab(NavItem.DASHBOARD); }}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <SidebarItem
            active={activeTab === NavItem.POSTS}
            onClick={() => { setActiveTab(NavItem.POSTS); setPostView('list'); }}
            icon={<FileText size={20} />}
            label="Content Manager"
          />
          <SidebarItem
            active={activeTab === NavItem.LEADS}
            onClick={() => { setActiveTab(NavItem.LEADS); }}
            icon={<Users size={20} />}
            label="Leads Manager"
          />
          <SidebarItem
            active={activeTab === NavItem.AUTHORS}
            onClick={() => { setActiveTab(NavItem.AUTHORS); }}
            icon={<Users size={20} />}
            label="Authors"
          />
          <SidebarItem
            active={activeTab === NavItem.COMPLIANCE}
            onClick={() => { setActiveTab(NavItem.COMPLIANCE); }}
            icon={<ShieldCheck size={20} />}
            label="Compliance Logs"
          />
          <div className="pt-4 mt-4 border-t border-gray-100">
            <h4 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Control</h4>
            <SidebarItem
              active={activeTab === NavItem.AI_TRAINING}
              onClick={() => { setActiveTab(NavItem.AI_TRAINING); }}
              icon={<Brain size={20} />}
              label="Knowledge Base"
            />
            <SidebarItem
              active={activeTab === NavItem.CHAT_LOGS}
              onClick={() => { setActiveTab(NavItem.CHAT_LOGS); }}
              icon={<MessageSquareText size={20} />}
              label="Chat History"
            />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
              A
            </div>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === NavItem.DASHBOARD && 'Analytics Overview'}
              {activeTab === NavItem.POSTS && (postView === 'list' ? 'Content Management' : postView === 'create' ? 'Create New Post' : 'Edit Post')}
              {activeTab === NavItem.LEADS && 'Leads Manager'}
              {activeTab === NavItem.COMPLIANCE && 'GDPR & Cookie Logs'}
              {activeTab === NavItem.AI_TRAINING && 'AI Knowledge Base'}
              {activeTab === NavItem.CHAT_LOGS && 'AI Chat Monitoring'}
              {activeTab === NavItem.AUTHORS && 'Authors Directory'}
            </h1>
            {postView === 'create' && (
              <span className="text-sm text-gray-500 mt-1">Drafting content for N8N publication</span>
            )}
            {activeTab === NavItem.DASHBOARD && (
              <span className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Monitoring Active (5s Poll)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Next.js 14+
            </span>
            <button onClick={() => { runDiagnostics(); loadDashboardData(); if (activeTab === NavItem.POSTS) loadBlogPosts(); }} className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Refresh Data">
              <RefreshCw size={20} />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full overflow-auto flex-1">

          {/* DASHBOARD VIEW */}
          {activeTab === NavItem.DASHBOARD && (
            <div className="space-y-6">

              {/* Stats Grid - Only 3 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  label="Total Leads"
                  value={stats?.totalLeads || 0}
                  subtext="Demo + Contact + ROI"
                  icon={<Users size={20} />}
                  colorClass="text-blue-600"
                />
                <StatCard
                  label="Published Posts"
                  value={stats?.blogPostsCount || 0}
                  subtext="Active on blog"
                  icon={<FileBarChart size={20} />}
                  colorClass="text-purple-600"
                />
                <StatCard
                  label="Cookie Consents"
                  value={stats?.cookieConsentsCount || 0}
                  subtext="GDPR Compliant"
                  icon={<Cookie size={20} />}
                  colorClass="text-orange-600"
                />
              </div>
            </div>
          )}

          {/* AI VIEWS */}
          {activeTab === NavItem.AI_TRAINING && <ServicesManager />}
          {activeTab === NavItem.CHAT_LOGS && <ChatHistory />}
          {activeTab === NavItem.AUTHORS && <AuthorsManager />}

          {/* LEADS VIEW */}
          {activeTab === NavItem.LEADS && <LeadsManager />}

          {/* POSTS VIEW - LIST */}
          {activeTab === NavItem.POSTS && postView === 'list' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold">Recent Posts (Read from Neon)</h3>
                <button
                  onClick={() => setPostView('create')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                >
                  <Plus size={16} />
                  <span>Create New</span>
                </button>
              </div>

              {blogLoading ? (
                <div className="p-8 flex justify-center text-gray-400">
                  <RefreshCw className="animate-spin" size={24} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-medium">
                      <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Title</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {blogData?.items.map(post => (
                        <tr key={post.id} className="hover:bg-gray-50 group">
                          <td className="px-6 py-3 font-mono">{post.id}</td>
                          <td className="px-6 py-3 font-medium text-gray-900">
                            {post.title}
                            <div className="text-xs text-gray-400 font-normal">/{post.slug}</div>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${post.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' :
                              post.status === 'draft' ? 'bg-gray-50 text-gray-700 border-gray-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-3">{post.category}</td>
                          <td className="px-6 py-3 whitespace-nowrap">{new Date(post.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditClick(post.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(post.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {blogData?.items.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">No posts found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* POSTS VIEW - CREATE/EDIT FORM */}
          {activeTab === NavItem.POSTS && (postView === 'create' || postView === 'edit') && (
            <BlogPostForm
              initialData={editingPostData}
              onCancel={() => { setPostView('list'); setEditingPostId(null); setEditingPostData(undefined); }}
              onSuccess={() => handlePostSuccess(postView === 'create' ? 'create' : 'update')}
            />
          )}

          {/* COMPLIANCE VIEW (NEW) */}
          {activeTab === NavItem.COMPLIANCE && <ComplianceViewer />}

        </div>
      </main>
    </div>
  );
};

export default App;
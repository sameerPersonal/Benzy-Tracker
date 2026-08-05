import { useState, useEffect } from 'react';
import { ProductionRegistry } from './pages/ProductionRegistry';
import { DeliveryTracker } from './pages/DeliveryTracker';
import { LeaveTracker } from './pages/LeaveTracker';
import { DailyStatus } from './pages/DailyStatus';
import { UserManagement } from './pages/UserManagement';
import { Login } from './pages/Login';
import type { User, ProductionRegistryEntry, DeliveryItem, LeaveEntry, DailyStatus as DailyStatusType } from './services/mockData';
import { authService } from './services/authService';
import { productionRegistryService } from './services/productionRegistryService';
import { deliveryTrackerService } from './services/deliveryTrackerService';
import { leaveTrackerService } from './services/leaveTrackerService';
import { teamStatusService } from './services/teamStatusService';

import { ToastContainer, type ToastMessage } from './components/Toast';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationDrawer, type AlertItem } from './components/NotificationDrawer';

type Tab = 'dashboard' | 'production' | 'delivery' | 'leave' | 'status' | 'users';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search & Drawer & Toast state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [infoModal, setInfoModal] = useState<{ title: string; content: string } | null>(null);

  // Global search data pools
  const [allBranches, setAllBranches] = useState<ProductionRegistryEntry[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<DeliveryItem[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveEntry[]>([]);
  const [allStatuses, setAllStatuses] = useState<DailyStatusType[]>([]);

  // Alerts State (Dynamically populated from database & data services)
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const [dbStats, setDbStats] = useState({
    activeDeliveries: 0,
    activeLeaveCount: 0,
    totalProjects: 0,
  });
  const [recentDeploys, setRecentDeploys] = useState<ProductionRegistryEntry[]>([]);
  const [todayTeamFocus, setTodayTeamFocus] = useState<DailyStatusType[]>([]);

  const addToast = (type: ToastMessage['type'], text: string) => {
    const id = 't_' + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, text }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (currentUser) {
      const loadStats = async () => {
        try {
          const [dels, leaves, prods, statuses] = await Promise.all([
            deliveryTrackerService.getAll(),
            leaveTrackerService.getAll(),
            productionRegistryService.getAll(),
            teamStatusService.getAll(),
          ]);

          setAllDeliveries(dels);
          setAllLeaves(leaves);
          setAllBranches(prods);
          setAllStatuses(statuses);

          const activeDels = dels.filter(d => d.status !== 'Completed').length;
          const todayStr = new Date().toISOString().split('T')[0];
          const activeLeaves = leaves.filter(l => todayStr >= l.startDate && todayStr <= l.endDate).length;

          setDbStats({
            activeDeliveries: activeDels,
            activeLeaveCount: activeLeaves,
            totalProjects: new Set(prods.map(p => p.project)).size,
          });

          const sortedProds = [...prods].sort((a, b) => b.updatedDate.localeCompare(a.updatedDate));
          setRecentDeploys(sortedProds.slice(0, 3));

          const todayStatuses = statuses.filter(s => s.date === todayStr);
          const displayStatuses = todayStatuses.length > 0 ? todayStatuses : statuses.slice(0, 4);
          setTodayTeamFocus(displayStatuses);

          // Generate Real Operational Alerts
          const generatedAlerts: AlertItem[] = [];

          // 1. Pending Access Requests (for admins)
          try {
            const users: User[] = await authService.getAllUsers();
            const pendingUsers = users.filter((u: User) => u.status === 'pending');
            if (pendingUsers.length > 0) {
              generatedAlerts.push({
                id: 'alert_pending_users',
                code: 'USER-APPROVAL',
                message: `${pendingUsers.length} user account(s) awaiting registration approval`,
                type: 'critical',
                status: 'active',
                actionTab: 'users',
              });
            }
          } catch (e) {
            console.warn('Could not check pending users:', e);
          }

          // 2. Deliverables Ready for Live Release
          const readyForLiveCount = dels.filter(d => d.status === 'Ready for Live').length;
          if (readyForLiveCount > 0) {
            generatedAlerts.push({
              id: 'alert_ready_live',
              code: 'RELEASE-READY',
              message: `${readyForLiveCount} deliverable(s) marked Ready for Live release`,
              type: 'info',
              status: 'active',
              actionTab: 'delivery',
            });
          }

          // 3. Emergency Leaves Today
          const todayEmergencyLeaves = leaves.filter(l => todayStr >= l.startDate && todayStr <= l.endDate && l.leaveType === 'Emergency');
          if (todayEmergencyLeaves.length > 0) {
            const names = todayEmergencyLeaves.map(l => l.resource).join(', ');
            generatedAlerts.push({
              id: 'alert_emergency_leave',
              code: 'CAPACITY-WARN',
              message: `Emergency Leave today: ${names}`,
              type: 'warning',
              status: 'active',
              actionTab: 'leave',
            });
          }

          // 4. Active In-Flight Deliveries
          const inFlightCount = dels.filter(d => d.status === 'In Progress' || d.status === 'UAT').length;
          if (inFlightCount > 0) {
            generatedAlerts.push({
              id: 'alert_in_flight',
              code: 'DELIVERY-FLIGHT',
              message: `${inFlightCount} deliverable(s) currently in flight (In Progress / UAT)`,
              type: 'info',
              status: 'active',
              actionTab: 'delivery',
            });
          }

          setAlerts(prev => {
            const resolvedIds = new Set(prev.filter(a => a.status === 'resolved').map(a => a.id));
            const ackIds = new Set(prev.filter(a => a.status === 'acknowledged').map(a => a.id));
            return generatedAlerts.map(ga => {
              if (resolvedIds.has(ga.id)) return { ...ga, status: 'resolved' };
              if (ackIds.has(ga.id)) return { ...ga, status: 'acknowledged' };
              return ga;
            });
          });

        } catch (err) {
          console.error('Error loading stats:', err);
        }
      };
      loadStats();
    }
  }, [currentUser, activeTab]);

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
    addToast('info', 'Alert acknowledged');
  };

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
    addToast('success', 'Alert marked as resolved');
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const isAdmin = currentUser.role === 'admin' || currentUser.email.toLowerCase().includes('sameer') || currentUser.id.toLowerCase() === 'sameer';

  const userPerms = currentUser.permissions || {
    production: isAdmin ? 'write' : 'read',
    delivery: isAdmin ? 'write' : 'read',
    leave: isAdmin ? 'write' : 'read',
    status: isAdmin ? 'write' : 'read',
  };

  const menuItems: { id: Tab; name: string; icon: string }[] = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
    { id: 'production', name: 'Live Branch Details', icon: 'alt_route' },
    { id: 'delivery', name: 'Delivery Tracker', icon: 'local_shipping' },
    { id: 'leave', name: 'Leave Tracker', icon: 'event_busy' },
    { id: 'status', name: 'Daily Team Status', icon: 'assignment' },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'users', name: 'User Management', icon: 'admin_panel_settings' });
  }

  return (
    <div className="min-h-screen text-on-surface font-body-md mesh-bg flex overflow-x-hidden relative">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed h-screen w-[260px] left-0 top-0 bg-surface-container-low/95 dark:bg-surface-container-lowest/95 backdrop-blur-xl border-r border-white/5 shadow-2xl flex flex-col p-6 z-50 transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="mb-8 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tight text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>deployed_code</span>
            OpsPortal
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-on-surface-variant hover:text-on-surface p-1"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-primary bg-primary-container/20 font-bold border-l-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-label-caps text-label-caps">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-white/5 flex flex-col gap-1.5">
          <div className="flex items-center gap-3 px-4 py-2 text-xs">
            <div className="bg-white/15 p-1.5 rounded-full">
              <span className="material-symbols-outlined text-sm text-primary">person</span>
            </div>
            <div className="truncate">
              <p className="font-semibold text-on-surface text-[12px]">{currentUser.name}</p>
              <p className="text-[10px] text-on-surface-variant/70 truncate">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-0 lg:ml-[260px] flex flex-col min-w-0 min-h-screen">
        {/* Top App Bar */}
        <header className="sticky top-0 w-full h-16 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md border-b border-white/5 z-30 flex justify-between items-center px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:gap-8">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-white/5 transition-all"
              aria-label="Toggle Menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
            <div
              onClick={() => setIsSearchOpen(true)}
              className="relative w-40 sm:w-64 group hidden sm:block cursor-pointer"
            >
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                readOnly
                className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-10 pr-12 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-on-surface cursor-pointer select-none"
                placeholder="Global node search..."
                type="text"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-on-surface-variant/70 bg-white/5 border border-white/10 rounded">
                Ctrl+K
              </kbd>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => setInfoModal({
                  title: 'Documentation & API Guides',
                  content: 'OpsPortal Live Branch Tracker API endpoints:\n• GET /api/v1/registry - Fetch all live production branches\n• POST /api/v1/registry - Register branch deployment\n• GET /api/v1/deliveries - Query Jira task pipeline & incident metrics'
                })}
                className="text-on-surface-variant font-medium hover:text-primary transition-all text-xs font-body-sm"
              >
                Documentation
              </button>
              <button
                onClick={() => setInfoModal({
                  title: 'REST API Specs',
                  content: 'Swagger OpenAPI 3.0 specs available at /api/docs.\nAuthentication header: Authorization: Bearer <token>\nSupabase Realtime channels enabled for daily_status and production_registry.'
                })}
                className="text-on-surface-variant font-medium hover:text-primary transition-all text-xs font-body-sm"
              >
                API
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`text-xs font-body-sm transition-all ${
                  activeTab === 'dashboard'
                    ? 'text-primary border-b-2 border-primary pb-0.5 font-bold'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Status
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="text-on-surface-variant p-2 hover:bg-surface-container-highest/30 rounded-md transition-all relative"
              title="Notification Center"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {alerts.filter(a => a.status !== 'resolved').length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-tertiary rounded-full animate-ping" />
              )}
            </button>
            <button 
              onClick={() => {
                setActiveTab('delivery');
                setIsMobileMenuOpen(false);
              }}
              className="bg-tertiary-container/20 text-tertiary font-bold px-3 sm:px-4 py-1.5 rounded-lg text-xs border border-tertiary/20 flex items-center gap-1.5 hover:bg-tertiary-container/30 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">warning</span>
              <span className="hidden sm:inline">New Incident</span>
            </button>
            <div className="h-8 w-[1px] bg-white/10 mx-0.5 sm:mx-1"></div>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-white/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>

        {/* Main Section */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Hero Metrics */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Card 1 */}
                <div className="glass-panel inner-glow p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Regions</span>
                    <span className="material-symbols-outlined text-primary text-[20px]">public</span>
                  </div>
                  <div className="font-display-lg text-4xl font-bold text-on-surface mb-1">12</div>
                  <div className="flex items-center gap-2">
                    <span className="text-secondary font-data-mono text-xs flex items-center">
                      <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span>
                      +2
                    </span>
                    <span className="text-on-surface-variant/60 text-xs">from last month</span>
                  </div>
                </div>

                {/* Metric Card 2 */}
                <div className="glass-panel inner-glow p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Pending Deliveries</span>
                    <span className="material-symbols-outlined text-secondary text-[20px]">rocket_launch</span>
                  </div>
                  <div className="font-display-lg text-4xl font-bold text-on-surface mb-1">{dbStats.activeDeliveries}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-secondary font-data-mono text-xs flex items-center">
                      <span className="material-symbols-outlined text-sm mr-0.5">bolt</span>
                      99.9%
                    </span>
                    <span className="text-on-surface-variant/60 text-xs">success rate</span>
                  </div>
                </div>

                {/* Metric Card 3 */}
                <div className="glass-panel inner-glow p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 blur-3xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Projects Active</span>
                    <span className="material-symbols-outlined text-tertiary text-[20px]">memory</span>
                  </div>
                  <div className="font-display-lg text-4xl font-bold text-on-surface mb-1">{dbStats.totalProjects}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-data-mono text-xs flex items-center">
                      <span className="material-symbols-outlined text-sm mr-0.5">check_circle</span>
                      Stable
                    </span>
                    <span className="text-on-surface-variant/60 text-xs">nominal status</span>
                  </div>
                </div>
              </section>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Activity Pipeline */}
                <section className="col-span-12 lg:col-span-8 glass-panel inner-glow rounded-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="font-headline-sm text-lg font-bold text-on-surface">Recent Activity Pipeline</h2>
                      <p className="text-on-surface-variant/70 text-xs">Real-time deployment and incident stream</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('production')}
                      className="text-primary font-label-caps text-label-caps hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all text-xs"
                    >
                      View Branch Details
                    </button>
                  </div>
                  <div className="space-y-6 relative before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                    {recentDeploys.map((deploy) => (
                      <div key={deploy.id} className="flex gap-6 items-start relative">
                        <div className="w-10 h-10 rounded-full bg-secondary-container/20 border border-secondary/30 flex items-center justify-center shrink-0 z-10 bg-[#0b1326]">
                          <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                        </div>
                        <div className="flex-1 pb-6 border-b border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-headline-sm font-semibold text-sm">Deployment Sync Success</span>
                            <span className="font-data-mono text-xs text-on-surface-variant/60">{deploy.updatedDate}</span>
                          </div>
                          <p className="text-on-surface-variant/80 text-xs mb-2">
                            Project: <span className="text-on-surface">{deploy.project}</span> branch <span className="font-mono text-on-surface">{deploy.version}</span> live in {deploy.region}.
                          </p>
                          {deploy.remarks && (
                            <p className="text-[10px] text-on-surface-variant/50 italic">"{deploy.remarks}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {recentDeploys.length === 0 && (
                      <div className="text-center py-8 text-xs font-mono text-on-surface-variant/60">
                        No recent activity or branch details logged.
                      </div>
                    )}
                  </div>
                </section>

                {/* Side Widgets */}
                <aside className="col-span-12 lg:col-span-4 space-y-6">
                  {/* Priority Alerts */}
                  <div className="glass-panel inner-glow rounded-2xl p-6 shadow-2xl border-l-4 border-l-tertiary">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                      <h3 className="font-headline-sm font-bold text-sm text-on-surface">Priority Alerts</h3>
                      <span className="ml-auto bg-tertiary-container/20 text-tertiary font-mono text-[10px] px-2.5 py-0.5 rounded-full">
                        {alerts.filter(a => a.status !== 'resolved').length} Active
                      </span>
                    </div>
                    <div className="space-y-4">
                      {alerts.map(alert => (
                        <div key={alert.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-label-caps text-[9px] text-tertiary font-mono uppercase">{alert.code}</div>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                              alert.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {alert.status}
                            </span>
                          </div>
                          <div className="text-xs font-semibold">{alert.message}</div>
                          {alert.status !== 'resolved' && (
                            <div className="mt-2.5 flex justify-end gap-2.5 items-center">
                              {alert.actionTab && (
                                <button
                                  onClick={() => setActiveTab(alert.actionTab as Tab)}
                                  className="text-primary text-[11px] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>View Details</span>
                                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleResolveAlert(alert.id)}
                                className="text-emerald-400 text-[11px] font-bold hover:underline cursor-pointer"
                              >
                                Resolve
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {alerts.length === 0 && (
                        <div className="text-center py-6 text-xs text-on-surface-variant/60">
                          No active operational alerts. System healthy.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Focus widget */}
                  <div className="glass-panel inner-glow rounded-2xl p-6 shadow-xl">
                    <h3 className="font-headline-sm text-sm font-bold text-on-surface mb-4">Today's Team Focus</h3>
                    <div className="space-y-4">
                      {todayTeamFocus.map((item, idx) => {
                        const initials = item.resource ? item.resource.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                        const colors = ['bg-primary/20 text-primary border-primary/30', 'bg-secondary/20 text-secondary border-secondary/30', 'bg-tertiary/20 text-tertiary border-tertiary/30'];
                        const colorClass = colors[idx % colors.length];
                        return (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${colorClass}`}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-on-surface truncate">{item.resource}</div>
                              <div className="text-[10px] text-on-surface-variant truncate">{item.focus}</div>
                            </div>
                            <span className="w-2 h-2 rounded-full bg-secondary"></span>
                          </div>
                        );
                      })}
                      {todayTeamFocus.length === 0 && (
                        <div className="text-xs text-on-surface-variant/60 italic py-2 text-center">
                          No status entries logged for today yet.
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setActiveTab('status')}
                      className="mt-6 w-full border border-white/10 text-on-surface-variant py-2 rounded-xl text-xs hover:bg-white/5 transition-all text-center block font-semibold"
                    >
                      View Team Status
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {activeTab === 'production' && <ProductionRegistry canWrite={userPerms.production === 'write'} />}
          {activeTab === 'delivery' && <DeliveryTracker canWrite={userPerms.delivery === 'write'} />}
          {activeTab === 'leave' && <LeaveTracker canWrite={userPerms.leave === 'write'} />}
          {activeTab === 'status' && <DailyStatus canWrite={userPerms.status === 'write'} />}
          {activeTab === 'users' && isAdmin && <UserManagement />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        branches={allBranches}
        deliveries={allDeliveries}
        leaves={allLeaves}
        statuses={allStatuses}
      />

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        recentDeploys={recentDeploys}
        leaves={allLeaves}
        alerts={alerts}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onResolveAlert={handleResolveAlert}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0b1326] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              {infoModal.title}
            </h3>
            <pre className="text-xs font-mono text-on-surface-variant bg-white/5 p-4 rounded-xl whitespace-pre-wrap leading-relaxed mb-6 border border-white/5">
              {infoModal.content}
            </pre>
            <button
              onClick={() => setInfoModal(null)}
              className="w-full py-2 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

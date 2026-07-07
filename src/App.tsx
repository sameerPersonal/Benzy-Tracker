import { useState, useEffect } from 'react';
import { ProductionRegistry } from './pages/ProductionRegistry';
import { DeliveryTracker } from './pages/DeliveryTracker';
import { LeaveTracker } from './pages/LeaveTracker';
import { DailyStatus } from './pages/DailyStatus';
import { Login } from './pages/Login';
import type { User, ProductionRegistryEntry } from './services/mockData';
import { authService } from './services/authService';
import { productionRegistryService } from './services/productionRegistryService';
import { deliveryTrackerService } from './services/deliveryTrackerService';
import { leaveTrackerService } from './services/leaveTrackerService';

type Tab = 'dashboard' | 'production' | 'delivery' | 'leave' | 'status';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dbStats, setDbStats] = useState({
    activeDeliveries: 0,
    activeLeaveCount: 0,
    totalProjects: 0,
  });
  const [recentDeploys, setRecentDeploys] = useState<ProductionRegistryEntry[]>([]);

  useEffect(() => {
    if (currentUser) {
      const loadStats = async () => {
        try {
          const [dels, leaves, prods] = await Promise.all([
            deliveryTrackerService.getAll(),
            leaveTrackerService.getAll(),
            productionRegistryService.getAll(),
          ]);

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
        } catch (err) {
          console.error('Error loading stats:', err);
        }
      };
      loadStats();
    }
  }, [currentUser, activeTab]);

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
    { id: 'production', name: 'Production Registry', icon: 'inventory_2' },
    { id: 'delivery', name: 'Delivery Tracker', icon: 'local_shipping' },
    { id: 'leave', name: 'Leave Tracker', icon: 'event_busy' },
    { id: 'status', name: 'Daily Team Status', icon: 'assignment' },
  ] as const;

  return (
    <div className="min-h-screen text-on-surface font-body-md mesh-bg flex overflow-x-hidden">
      {/* Sidebar Navigation */}
      <aside className="fixed h-screen w-[260px] left-0 top-0 bg-surface-container-low/70 dark:bg-surface-container-lowest/70 backdrop-blur-xl border-r border-white/5 shadow-2xl flex flex-col p-6 z-50">
        <div className="mb-8">
          <div className="text-2xl font-bold tracking-tight text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>deployed_code</span>
            OpsPortal
          </div>
          <div className="font-label-caps text-label-caps text-on-surface-variant mt-1 ml-11">Engineering HQ</div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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

        <button 
          onClick={() => setActiveTab('production')}
          className="mb-6 w-full bg-primary text-on-primary font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-sm tracking-wide">Register New Service</span>
        </button>

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
      <div className="flex-1 ml-[260px] flex flex-col min-w-0 min-h-screen">
        {/* Top App Bar */}
        <header className="sticky top-0 w-full h-16 bg-surface/40 dark:bg-surface-dim/40 backdrop-blur-md border-b border-white/5 z-40 flex justify-between items-center px-8">
          <div className="flex items-center gap-8">
            <div className="relative w-64 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                className="w-full bg-surface-container-low border border-white/10 rounded-lg pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-on-surface"
                placeholder="Global node search..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-6">
              <a className="text-on-surface-variant font-medium hover:text-primary transition-all text-xs font-body-sm" href="#">Documentation</a>
              <a className="text-on-surface-variant font-medium hover:text-primary transition-all text-xs font-body-sm" href="#">API</a>
              <a className="text-primary border-b-2 border-primary pb-0.5 text-xs font-body-sm" href="#">Status</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant p-2 hover:bg-surface-container-highest/30 rounded-md transition-all">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button 
              onClick={() => setActiveTab('delivery')}
              className="bg-tertiary-container/20 text-tertiary font-bold px-4 py-1.5 rounded-lg text-xs border border-tertiary/20 flex items-center gap-2 hover:bg-tertiary-container/30 transition-all"
            >
              <span className="material-symbols-outlined text-sm">warning</span>
              New Incident
            </button>
            <div className="h-8 w-[1px] bg-white/10 mx-1"></div>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-white/10 flex items-center justify-center font-bold text-primary text-xs">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>

        {/* Main Section */}
        <main className="flex-1 p-8 max-w-[1440px] w-full mx-auto">
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
                      View Registry
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
                            Service: <span className="text-on-surface">{deploy.project}</span> version <span className="font-mono text-on-surface">{deploy.version}</span> deployed to {deploy.region}.
                          </p>
                          {deploy.remarks && (
                            <p className="text-[10px] text-on-surface-variant/50 italic">"{deploy.remarks}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {recentDeploys.length === 0 && (
                      <div className="text-center py-8 text-xs font-mono text-on-surface-variant/60">
                        No recent activity or deployments logged in the fleet registry.
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
                      <span className="ml-auto bg-tertiary-container/20 text-tertiary font-mono text-[10px] px-2.5 py-0.5 rounded-full">2 Active</span>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="font-label-caps text-[9px] text-tertiary mb-1 font-mono uppercase">DB-01-CLUSTER</div>
                        <div className="text-xs font-semibold">Memory saturation at 94%</div>
                        <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-tertiary w-[94%]"></div>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="font-label-caps text-[9px] text-tertiary mb-1 font-mono uppercase">NETWORK-CORE</div>
                        <div className="text-xs font-semibold">SSL Certificate expiration (3 days)</div>
                        <div className="mt-2 text-right">
                          <button className="text-primary text-xs font-bold hover:underline">Renew Now</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Focus widget */}
                  <div className="glass-panel inner-glow rounded-2xl p-6 shadow-xl">
                    <h3 className="font-headline-sm text-sm font-bold text-on-surface mb-4">Today's Team Focus</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                          AS
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-on-surface truncate">Alice Smith</div>
                          <div className="text-[10px] text-on-surface-variant truncate">Working on OPS-101 updates</div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center font-bold text-xs text-secondary shrink-0">
                          BJ
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-on-surface truncate">Bob Jones</div>
                          <div className="text-[10px] text-on-surface-variant truncate">Planned Leave tomorrow</div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                      </div>
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

          {activeTab === 'production' && <ProductionRegistry />}
          {activeTab === 'delivery' && <DeliveryTracker />}
          {activeTab === 'leave' && <LeaveTracker />}
          {activeTab === 'status' && <DailyStatus />}
        </main>
      </div>
    </div>
  );
}

export default App;

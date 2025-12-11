import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    CreditCard,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Percent,
    Settings,
    ShieldCheck,
    Ticket,
    X
} from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
    { name: 'Events', path: '/admin-events', icon: Ticket },
    { name: 'Payments (UPI)', path: '/admin-upi', icon: CreditCard },
    { name: 'UTR Verification', path: '/admin-utr', icon: Package },
    { name: 'Discounts', path: '/admin-discounts', icon: Percent },
    { name: 'Settings', path: '/admin-settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-white/5">
             <div className="flex items-center gap-3">
                 <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/20">
                     <ShieldCheck className="h-6 w-6 text-blue-500" />
                 </div>
                 <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Admin Panel</span>
             </div>
          </div>

          {/* Nav Items */}
          <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                   <div className={cn(
                     "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                     isActive
                     ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                     : "text-slate-400 hover:text-white hover:bg-white/5"
                   )}>
                      {/* Active Glow */}
                      {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-50 blur-sm"></div>}

                      <item.icon className={cn("h-5 w-5 relative z-10", isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400")} />
                      <span className="font-medium relative z-10">{item.name}</span>
                   </div>
                </Link>
              );
            })}
          </div>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-white/5 bg-slate-900/50">
             <div className="flex items-center gap-3 mb-4 px-2">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                     AD
                 </div>
                 <div>
                     <div className="font-bold text-sm">Administrator</div>
                     <div className="text-xs text-slate-500">Super User</div>
                 </div>
             </div>
             <Button variant="outline" className="w-full border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors">
                 <LogOut className="h-4 w-4 mr-2" /> Logout
             </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
           <Button variant="ghost" size="icon" className="md:hidden text-slate-400" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
               {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
           </Button>

           <h2 className="text-lg font-medium text-slate-400 hidden md:block">
              {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
           </h2>

           <div className="flex items-center gap-4">
              <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-white/5">
                 v2.4.0 (District)
              </div>
           </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 relative">
           {/* Background Glows */}
           <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2"></div>

           <div className="relative z-10 max-w-7xl mx-auto animate-fade-in">
              <Outlet />
           </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;

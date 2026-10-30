import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';
import Avatar from './Avatar';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/workspaces', label: 'Workspaces', icon: 'workspaces' },
  { to: '/projects', label: 'Projects', icon: 'projects' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-slate-100">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-200 to-emerald-400 font-serif text-slate-900 shadow-sm">t</span>
      taskflow
    </div>
  );
}

// The sidebar content is shared by the desktop sidebar and the mobile drawer.
function SidebarContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5"><Brand /></div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-400/15 text-emerald-200 shadow-sm ring-1 ring-emerald-300/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar name={user?.name} size="h-9 w-9 text-xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-100">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.accountType === 'company' ? user.companyName : user?.email}</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-slate-100">
          <Icon name="logout" className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell min-h-screen">
      {/* Desktop / laptop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-[#131a17] md:block">
        <SidebarContent />
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#131a17]/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <Brand />
        <button type="button" onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Open menu">
          <Icon name="menu" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-white/10 bg-[#131a17] shadow-xl">
            <button type="button" onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 rounded-lg p-2 text-slate-300 hover:bg-white/10" aria-label="Close menu">
              <Icon name="close" className="h-4 w-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

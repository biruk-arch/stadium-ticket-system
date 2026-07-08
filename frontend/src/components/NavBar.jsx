import { NavLink, useNavigate } from 'react-router-dom';
import { Trophy, LogOut, Ticket, LayoutDashboard, ScanLine, ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';

const NAV_BY_ROLE = {
  fan: [
    { to: '/events', label: 'Matches', icon: Trophy },
    { to: '/my-tickets', label: 'My Tickets', icon: Ticket }
  ],
  box_office_staff: [
    { to: '/box-office', label: 'Box Office', icon: ShoppingBag }
  ],
  gate_scanner_officer: [
    { to: '/gate', label: 'Gate Scanner', icon: ScanLine }
  ],
  stadium_admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/events', label: 'Events', icon: Trophy },
    { to: '/admin/reports', label: 'Reports', icon: Ticket },
    { to: '/admin/users', label: 'Staff', icon: ShoppingBag },
    { to: '/gate', label: 'Gate Scanner', icon: ScanLine }
  ],
  sport_commission_officer: [
    { to: '/admin/reports', label: 'Reports', icon: Ticket }
  ]
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = user ? NAV_BY_ROLE[user.role] || [] : [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-pitch-line bg-pitch-night/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to={user ? (items[0]?.to || '/') : '/login'} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-flood text-pitch-night">
            <Trophy size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg leading-none tracking-wide text-chalk">
            DIRE&nbsp;DAWA<span className="text-flood"> STADIUM</span>
          </span>
        </NavLink>

        {user && (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-pitch-ink text-flood' : 'text-chalk-dim hover:text-chalk'
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-chalk">{user.fullName}</p>
                <p className="label-eyebrow">{ROLE_LABELS[user.role]}</p>
              </div>
              <button onClick={handleLogout} className="btn-secondary !px-3 !py-2" title="Log out">
                <LogOut size={16} />
              </button>
            </div>

            <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </>
        )}
      </div>

      {user && open && (
        <div className="border-t border-pitch-line bg-pitch-night px-4 py-3 md:hidden">
          <div className="mb-3">
            <p className="text-sm font-semibold text-chalk">{user.fullName}</p>
            <p className="label-eyebrow">{ROLE_LABELS[user.role]}</p>
          </div>
          <div className="flex flex-col gap-1">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-pitch-ink text-flood' : 'text-chalk-dim'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-alert">
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

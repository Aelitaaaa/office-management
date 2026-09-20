import { useState } from 'react';
import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import {
  Archive,
  Boxes,
  Building2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileInput,
  FileOutput,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
  UserRound,
  Users,
  Workflow,
  X,
} from 'lucide-react';

type UserRole =
  | 'ADMIN'
  | 'STAFF'
  | 'FINANCE'
  | 'MANAGER';

interface LoggedInUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
}

interface MenuItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'UTAMA',
    items: [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'MASTER DATA',
    items: [
      {
        name: 'Customer',
        path: '/customers',
        icon: Users,
      },
      {
        name: 'Supplier',
        path: '/suppliers',
        icon: Building2,
      },
      {
        name: 'Produk',
        path: '/products',
        icon: Package,
      },
      {
        name: 'Driver',
        path: '/drivers',
        icon: UserRound,
      },
      {
        name: 'Kendaraan',
        path: '/vehicles',
        icon: Truck,
      },
    ],
  },
  {
    title: 'TRANSAKSI',
    items: [
      {
        name: 'Pesanan',
        path: '/orders',
        icon: ClipboardList,
      },
      {
        name: 'Pembelian',
        path: '/purchases',
        icon: ShoppingCart,
      },
      {
        name: 'Surat Jalan',
        path: '/surat-jalan',
        icon: FileText,
      },
      {
        name: 'Invoice',
        path: '/invoices',
        icon: ReceiptText,
      },
      {
        name: 'Pembayaran',
        path: '/payments',
        icon: CircleDollarSign,
      },
    ],
  },
  {
    title: 'SURAT & DOKUMEN',
    items: [
      {
        name: 'Surat Masuk',
        path: '/incoming-letters',
        icon: FileInput,
      },
      {
        name: 'Surat Keluar',
        path: '/outgoing-letters',
        icon: FileOutput,
      },
      {
        name: 'Dokumen',
        path: '/documents',
        icon: Boxes,
      },
    ],
  },
  {
    title: 'LAINNYA',
    items: [
      {
        name: 'Pengumuman',
        path: '/announcements',
        icon: Megaphone,
        adminOnly: true,
      },
      {
        name: 'Manajemen User',
        path: '/users',
        icon: Settings,
        adminOnly: true,
      },
      {
        name: 'Riwayat',
        path: '/history',
        icon: Archive,
        adminOnly: true,
      },
    ],
  },
];

function getStoredUser(): LoggedInUser | null {
  const storedUser =
    sessionStorage.getItem('user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser,
    ) as LoggedInUser;
  } catch {
    return null;
  }
}

function getRoleLabel(
  role?: UserRole,
) {
  switch (role) {
    case 'ADMIN':
      return 'Administrator';

    case 'STAFF':
      return 'Staff';

    case 'FINANCE':
      return 'Finance';

    case 'MANAGER':
      return 'Manager';

    default:
      return 'User';
  }
}

function DashboardLayout() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [user] =
    useState<LoggedInUser | null>(
      getStoredUser,
    );

  const userName =
    user?.name ||
    user?.username ||
    'User';

  const roleLabel =
    getRoleLabel(user?.role);

  const initial =
    userName
      .trim()
      .charAt(0)
      .toUpperCase() || 'U';

  const visibleMenuGroups =
    menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            !item.adminOnly ||
            user?.role === 'ADMIN',
        ),
      }))
      .filter(
        (group) =>
          group.items.length > 0,
      );

  const handleLogout = () => {
    sessionStorage.removeItem(
      'access_token',
    );

    sessionStorage.removeItem(
      'user',
    );

    navigate('/login', {
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-800 bg-[#111b2b] transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.06] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/30">
              <Workflow
                size={21}
                className="text-white"
              />
            </div>

            <div>
              <p className="font-semibold tracking-tight text-white">
                OfficeFlow
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                Management System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <div className="space-y-7">
            {visibleMenuGroups.map(
              (group) => (
                <div
                  key={group.title}
                >
                  <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-slate-600">
                    {group.title}
                  </p>

                  <div className="space-y-1">
                    {group.items.map(
                      (item) => {
                        const Icon =
                          item.icon;

                        return (
                          <NavLink
                            key={
                              item.path
                            }
                            to={
                              item.path
                            }
                            onClick={() =>
                              setSidebarOpen(
                                false,
                              )
                            }
                            className={({
                              isActive,
                            }) =>
                              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                              }`
                            }
                          >
                            <Icon
                              size={18}
                              strokeWidth={
                                1.9
                              }
                            />

                            <span>
                              {
                                item.name
                              }
                            </span>
                          </NavLink>
                        );
                      },
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="rounded-xl bg-white/[0.035] px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-xs font-semibold text-blue-400">
                {initial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">
                  {userName}
                </p>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  {roleLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Keluar"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Office Management
              </p>

              <p className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">
                Sistem operasional internal perusahaan
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (value) => !value,
                )
              }
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                {initial}
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-[160px] truncate text-xs font-semibold text-slate-700">
                  {userName}
                </p>

                <p className="text-[10px] text-slate-400">
                  {roleLabel}
                </p>
              </div>

              <ChevronDown
                size={15}
                className={`hidden text-slate-400 transition-transform sm:block ${
                  profileOpen
                    ? 'rotate-180'
                    : ''
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/60">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="truncate text-xs font-semibold text-slate-700">
                    {userName}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {roleLabel}
                  </p>

                  {user?.email && (
                    <p className="mt-1 truncate text-[10px] text-slate-400">
                      {user.email}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} />

                  Keluar dari sistem
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-5 sm:p-7 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
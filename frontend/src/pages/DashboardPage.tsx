import {
  ArrowRight,
  ClipboardList,
  FileText,
  Megaphone,
  Package,
  ReceiptText,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import api from '../api/axios';

interface User {
  id?: number;
  sub?: number;
  name?: string;
  username?: string;
  role?: string;
}

interface ActivityUser {
  id: number;
  name: string;
  username: string;
  role: string;
}

interface ActivityLog {
  id: number;
  userId?: number | null;
  action: string;
  module: string;
  description: string;
  entityId?: number | null;
  createdAt: string;
  user?: ActivityUser | null;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
}

interface Statistics {
  customers: number;
  products: number;
  orders: number;
  invoices: number;
}

const quickActions = [
  {
    title: 'Pesanan Baru',
    description:
      'Buat dan kelola pesanan customer.',
    path: '/orders',
    icon: ClipboardList,
    iconClass:
      'bg-blue-50 text-blue-600',
    hoverClass:
      'hover:border-blue-200',
  },
  {
    title: 'Pembelian Bahan',
    description:
      'Catat pembelian bahan dari supplier.',
    path: '/purchases',
    icon: ShoppingCart,
    iconClass:
      'bg-emerald-50 text-emerald-600',
    hoverClass:
      'hover:border-emerald-200',
  },
  {
    title: 'Surat Jalan',
    description:
      'Kelola dokumen pengiriman pesanan.',
    path: '/surat-jalan',
    icon: Truck,
    iconClass:
      'bg-orange-50 text-orange-500',
    hoverClass:
      'hover:border-orange-200',
  },
  {
    title: 'Invoice',
    description:
      'Kelola tagihan dan status pembayaran.',
    path: '/invoices',
    icon: FileText,
    iconClass:
      'bg-violet-50 text-violet-600',
    hoverClass:
      'hover:border-violet-200',
  },
];

const getStoredUser = (): User | null => {
  try {
    const storedUser =
      sessionStorage.getItem('user');

    if (!storedUser) {
      return null;
    }

    return JSON.parse(
      storedUser,
    ) as User;
  } catch {
    return null;
  }
};

const getArrayLength = (
  data: unknown,
): number => {
  if (Array.isArray(data)) {
    return data.length;
  }

  if (
    typeof data === 'object' &&
    data !== null
  ) {
    const object =
      data as Record<string, unknown>;

    if (Array.isArray(object.data)) {
      return object.data.length;
    }

    if (
      typeof object.total === 'number'
    ) {
      return object.total;
    }

    if (
      typeof object.count === 'number'
    ) {
      return object.count;
    }
  }

  return 0;
};

function DashboardPage() {
  const [user] =
    useState<User | null>(
      getStoredUser,
    );

  const [statistics, setStatistics] =
    useState<Statistics>({
      customers: 0,
      products: 0,
      orders: 0,
      invoices: 0,
    });

  const [activities, setActivities] =
    useState<ActivityLog[]>([]);

  const [
    announcements,
    setAnnouncements,
  ] = useState<Announcement[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const fetchDashboard =
      async () => {
        try {
          setLoading(true);

          const [
            customersResult,
            productsResult,
            ordersResult,
            invoicesResult,
            activitiesResult,
            announcementsResult,
          ] = await Promise.allSettled([
            api.get('/customers'),
            api.get('/products'),
            api.get('/orders'),
            api.get('/invoices'),
            api.get<ActivityLog[]>(
              '/activity-logs/latest?limit=5',
            ),
            api.get<Announcement[]>(
              '/announcements/active',
            ),
          ]);

          setStatistics({
            customers:
              customersResult.status ===
              'fulfilled'
                ? getArrayLength(
                    customersResult.value
                      .data,
                  )
                : 0,

            products:
              productsResult.status ===
              'fulfilled'
                ? getArrayLength(
                    productsResult.value
                      .data,
                  )
                : 0,

            orders:
              ordersResult.status ===
              'fulfilled'
                ? getArrayLength(
                    ordersResult.value
                      .data,
                  )
                : 0,

            invoices:
              invoicesResult.status ===
              'fulfilled'
                ? getArrayLength(
                    invoicesResult.value
                      .data,
                  )
                : 0,
          });

          if (
            activitiesResult.status ===
            'fulfilled'
          ) {
            setActivities(
              Array.isArray(
                activitiesResult.value
                  .data,
              )
                ? activitiesResult.value
                    .data
                : [],
            );
          }

          if (
            announcementsResult.status ===
            'fulfilled'
          ) {
            setAnnouncements(
              Array.isArray(
                announcementsResult.value
                  .data,
              )
                ? announcementsResult.value
                    .data
                : [],
            );
          }
        } catch (error) {
          console.error(
            'Gagal memuat dashboard:',
            error,
          );
        } finally {
          setLoading(false);
        }
      };

    void fetchDashboard();
  }, []);

  const statisticCards = [
    {
      title: 'Total Customer',
      value: statistics.customers,
      description:
        'Customer terdaftar',
      icon: Users,
      iconClass:
        'bg-blue-50 text-blue-600',
    },
    {
      title: 'Total Produk',
      value: statistics.products,
      description:
        'Produk terdaftar',
      icon: Package,
      iconClass:
        'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Total Pesanan',
      value: statistics.orders,
      description:
        'Pesanan tercatat',
      icon: ShoppingCart,
      iconClass:
        'bg-orange-50 text-orange-500',
    },
    {
      title: 'Total Invoice',
      value: statistics.invoices,
      description:
        'Invoice diterbitkan',
      icon: ReceiptText,
      iconClass:
        'bg-violet-50 text-violet-600',
    },
  ];

  const currentDate =
    new Intl.DateTimeFormat(
      'id-ID',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    ).format(new Date());

  const formatDate = (
    value: string,
  ) =>
    new Intl.DateTimeFormat(
      'id-ID',
      {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(new Date(value));

  const displayName =
    user?.name ||
    user?.username ||
    'Pengguna';

  return (
    <div className="mx-auto max-w-[1500px]">
      {/* WELCOME */}
      <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[32px]">
            Selamat datang, {displayName}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kelola aktivitas operasional
            kantor dari satu tempat.
          </p>
        </div>

        <div className="hidden text-right md:block">
          <p className="text-sm font-semibold capitalize text-slate-700">
            {currentDate}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Semoga hari Anda produktif.
          </p>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statisticCards.map(
          (item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                  >
                    <Icon
                      size={22}
                      strokeWidth={2}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {item.title}
                    </p>

                    <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                      {loading
                        ? '...'
                        : item.value}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[11px] text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          },
        )}
      </section>

      {/* QUICK ACTION */}
      <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_5px_20px_rgba(15,23,42,0.025)] sm:p-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Akses Cepat
          </p>

          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Mulai pekerjaan hari ini
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Pilih aktivitas yang ingin
            dikerjakan.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(
            (item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative min-h-[190px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50 ${item.hoverClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClass}`}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>

                  <h3 className="mt-6 text-sm font-semibold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 max-w-[220px] text-xs leading-5 text-slate-500">
                    {item.description}
                  </p>

                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
                </Link>
              );
            },
          )}
        </div>
      </section>

      {/* BOTTOM */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* ACTIVITY */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_5px_20px_rgba(15,23,42,0.025)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Aktivitas Terbaru
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Aktivitas operasional
                terbaru dalam sistem.
              </p>
            </div>

            {user?.role ===
              'ADMIN' && (
              <Link
                to="/activity-logs"
                className="hidden items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 sm:flex"
              >
                Lihat semua
                <ArrowRight
                  size={14}
                />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-[210px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : activities.length ===
            0 ? (
            <div className="flex min-h-[210px] items-center justify-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                  <ClipboardList
                    size={21}
                  />
                </div>

                <p className="mt-4 text-sm font-medium text-slate-700">
                  Belum ada aktivitas
                </p>

                <p className="mt-1.5 text-xs leading-5 text-slate-400">
                  Aktivitas terbaru akan
                  muncul setelah sistem
                  mulai digunakan.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {activities.map(
                (activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                      <ClipboardList
                        size={16}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-5 text-slate-700">
                        {
                          activity.description
                        }
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-500">
                          {activity.user
                            ?.name ||
                            activity.user
                              ?.username ||
                            'Sistem'}
                        </span>

                        <span>•</span>

                        <span>
                          {
                            activity.module
                          }
                        </span>

                        <span>•</span>

                        <span>
                          {formatDate(
                            activity.createdAt,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* ANNOUNCEMENT */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_5px_20px_rgba(15,23,42,0.025)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Pengumuman
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Informasi penting untuk
                pengguna sistem.
              </p>
            </div>

            {user?.role ===
              'ADMIN' && (
              <Link
                to="/announcements"
                className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Kelola
                <ArrowRight
                  size={13}
                />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-[210px] items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : announcements.length ===
            0 ? (
            <div className="flex min-h-[210px] items-center justify-center">
              <div className="max-w-xs text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Megaphone
                    size={21}
                  />
                </div>

                <p className="mt-4 text-sm font-medium text-slate-700">
                  Belum ada pengumuman
                </p>

                <p className="mt-1.5 text-xs leading-5 text-slate-400">
                  Pengumuman akan
                  ditampilkan di sini
                  jika tersedia.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {announcements
                .slice(0, 3)
                .map(
                  (
                    announcement,
                  ) => (
                    <div
                      key={
                        announcement.id
                      }
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Megaphone
                            size={16}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800">
                            {
                              announcement.title
                            }
                          </p>

                          <p className="mt-1.5 line-clamp-3 text-[11px] leading-5 text-slate-500">
                            {
                              announcement.content
                            }
                          </p>

                          {announcement.endDate && (
                            <p className="mt-2 text-[10px] text-slate-400">
                              Berlaku
                              sampai{' '}
                              {formatDate(
                                announcement.endDate,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
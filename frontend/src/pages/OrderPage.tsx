import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import axios from 'axios';
import {
  Archive,
  ChevronDown,
  ClipboardList,
  Eye,
  FileText,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import api from '../api/axios';

type OrderStatus =
  | 'DRAFT'
  | 'DIPROSES'
  | 'SELESAI'
  | 'DIKIRIM'
  | 'SELESAI_DIKIRIM'
  | 'DIBATALKAN';

interface Customer {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

interface Product {
  id: number;
  code: string;
  name: string;
  type: string;
  unit: string;
  isActive: boolean;
}

interface OrderDetail {
  id: number;
  orderId?: number;
  productId: number;
  quantity: string | number;
  price: string | number;
  subtotal: string | number;
  product: Product;
}

interface OrderUser {
  id: number;
  name: string;
  username: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  userId?: number | null;
  orderDate: string;
  status: OrderStatus;
  notes?: string | null;
  total: string | number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  customer: Customer;
  user?: OrderUser | null;
  details: OrderDetail[];
  suratJalan?: unknown | null;
  invoice?: unknown | null;
}

interface FormDetail {
  productId: string;
  quantity: string;
  price: string;
}

const statusOptions: {
  value: OrderStatus;
  label: string;
}[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'DIPROSES', label: 'Diproses' },
  { value: 'DIKIRIM', label: 'Dikirim' },
  {
    value: 'SELESAI_DIKIRIM',
    label: 'Selesai Dikirim',
  },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'DIBATALKAN', label: 'Dibatalkan' },
];

const formatCurrency = (
  value: string | number,
) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getStatusLabel = (status: OrderStatus) => {
  return (
    statusOptions.find(
      (item) => item.value === status,
    )?.label ?? status
  );
};

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-slate-100 text-slate-600';
    case 'DIPROSES':
      return 'bg-blue-50 text-blue-700';
    case 'DIKIRIM':
      return 'bg-violet-50 text-violet-700';
    case 'SELESAI_DIKIRIM':
      return 'bg-cyan-50 text-cyan-700';
    case 'SELESAI':
      return 'bg-emerald-50 text-emerald-700';
    case 'DIBATALKAN':
      return 'bg-red-50 text-red-700';
  }
};

function OrderPage() {
  const storedUser = sessionStorage.getItem('user');
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  const role = currentUser?.role ?? '';
  const canManage =
    role === 'ADMIN' || role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<
    Customer[]
  >([]);
  const [products, setProducts] = useState<
    Product[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'ALL' | OrderStatus>('ALL');

  const [createOpen, setCreateOpen] =
    useState(false);
  const [detailOrder, setDetailOrder] =
    useState<Order | null>(null);
  const [editOrder, setEditOrder] =
    useState<Order | null>(null);
  const [archiveOrder, setArchiveOrder] =
    useState<Order | null>(null);

  const [customerId, setCustomerId] =
    useState('');
  const [notes, setNotes] = useState('');
  const [details, setDetails] = useState<
    FormDetail[]
  >([
    {
      productId: '',
      quantity: '1',
      price: '',
    },
  ]);

  const [editStatus, setEditStatus] =
    useState<OrderStatus>('DRAFT');
  const [editNotes, setEditNotes] =
    useState('');

  const [historyOpen, setHistoryOpen] =
    useState(false);
  const [historyOrders, setHistoryOrders] =
    useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);
  const [historySearch, setHistorySearch] =
    useState('');
  const [historyError, setHistoryError] =
    useState('');
  const [restoringId, setRestoringId] =
    useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await api.get<Order[]>('/orders');

      setOrders(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          typeof message === 'string'
            ? message
            : 'Data pesanan gagal dimuat.',
        );
      } else {
        setError('Data pesanan gagal dimuat.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReferences = async () => {
    if (!canManage) {
      setCustomers([]);
      setProducts([]);
      return;
    }

    try {
      const [customerResponse, productResponse] =
        await Promise.all([
          api.get<Customer[]>('/customers'),
          api.get<Product[]>('/products'),
        ]);

      setCustomers(
        customerResponse.data.filter(
          (customer) => customer.isActive,
        ),
      );

      setProducts(
        productResponse.data.filter(
          (product) => product.isActive,
        ),
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          typeof message === 'string'
            ? message
            : 'Data customer atau produk gagal dimuat.',
        );
      } else {
        setError(
          'Data customer atau produk gagal dimuat.',
        );
      }
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError('');

      const response =
        await api.get<Order[]>('/orders/history');

      setHistoryOrders(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Riwayat pesanan gagal dimuat.',
        );
      } else {
        setHistoryError(
          'Riwayat pesanan gagal dimuat.',
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();

    if (canManage) {
      void fetchReferences();
    }
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus =
        statusFilter === 'ALL' ||
        order.status === statusFilter;

      const matchSearch =
        !keyword ||
        order.orderNumber
          .toLowerCase()
          .includes(keyword) ||
        order.customer.name
          .toLowerCase()
          .includes(keyword) ||
        order.customer.code
          .toLowerCase()
          .includes(keyword);

      return matchStatus && matchSearch;
    });
  }, [orders, search, statusFilter]);

  const filteredHistory = useMemo(() => {
    const keyword =
      historySearch.trim().toLowerCase();

    if (!keyword) {
      return historyOrders;
    }

    return historyOrders.filter(
      (order) =>
        order.orderNumber
          .toLowerCase()
          .includes(keyword) ||
        order.customer.name
          .toLowerCase()
          .includes(keyword),
    );
  }, [historyOrders, historySearch]);

  const draftCount = useMemo(
    () =>
      orders.filter(
        (order) => order.status === 'DRAFT',
      ).length,
    [orders],
  );

  const processCount = useMemo(
    () =>
      orders.filter(
        (order) => order.status === 'DIPROSES',
      ).length,
    [orders],
  );

  const shippingCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === 'DIKIRIM' ||
          order.status === 'SELESAI_DIKIRIM',
      ).length,
    [orders],
  );

  const orderTotal = useMemo(
    () =>
      details.reduce((total, detail) => {
        const quantity =
          Number(detail.quantity) || 0;
        const price = Number(detail.price) || 0;

        return total + quantity * price;
      }, 0),
    [details],
  );

  const resetCreateForm = () => {
    setCustomerId('');
    setNotes('');
    setDetails([
      {
        productId: '',
        quantity: '1',
        price: '',
      },
    ]);
  };

  const openCreate = () => {
    if (!canManage) return;
    resetCreateForm();
    setError('');
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (submitting) {
      return;
    }

    setCreateOpen(false);
    resetCreateForm();
    setError('');
  };

  const addDetail = () => {
    setDetails((current) => [
      ...current,
      {
        productId: '',
        quantity: '1',
        price: '',
      },
    ]);
  };

  const removeDetail = (index: number) => {
    if (details.length === 1) {
      return;
    }

    setDetails((current) =>
      current.filter(
        (_, detailIndex) =>
          detailIndex !== index,
      ),
    );
  };

  const updateDetail = (
    index: number,
    field: keyof FormDetail,
    value: string,
  ) => {
    setDetails((current) =>
      current.map((detail, detailIndex) =>
        detailIndex === index
          ? {
              ...detail,
              [field]: value,
            }
          : detail,
      ),
    );
  };

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!customerId) {
      setError('Customer harus dipilih.');
      return;
    }

    const invalidDetail = details.some(
      (detail) =>
        !detail.productId ||
        Number(detail.quantity) <= 0 ||
        Number(detail.price) <= 0,
    );

    if (invalidDetail) {
      setError(
        'Produk, quantity, dan harga harus diisi dengan benar.',
      );
      return;
    }

    const productIds = details.map(
      (detail) => detail.productId,
    );

    if (
      new Set(productIds).size !==
      productIds.length
    ) {
      setError(
        'Produk yang sama tidak perlu ditambahkan dua kali. Ubah quantity pada baris produk tersebut.',
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await api.post('/orders', {
        customerId: Number(customerId),
        notes: notes.trim() || undefined,
        details: details.map((detail) => ({
          productId: Number(detail.productId),
          quantity: Number(detail.quantity),
          price: Number(detail.price),
        })),
      });

      setCreateOpen(false);
      resetCreateForm();

      setSuccess(
        'Pesanan baru berhasil dibuat.',
      );

      await fetchOrders();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        if (Array.isArray(message)) {
          setError(
            message[0] ??
              'Data pesanan tidak valid.',
          );
        } else if (
          typeof message === 'string'
        ) {
          setError(message);
        } else {
          setError(
            'Pesanan gagal disimpan.',
          );
        }
      } else {
        setError(
          'Terjadi kesalahan saat menyimpan pesanan.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (order: Order) => {
    if (!canManage) return;
    setEditOrder(order);
    setEditStatus(order.status);
    setEditNotes(order.notes ?? '');
    setError('');
  };

  const handleEdit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editOrder) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await api.patch(
        `/orders/${editOrder.id}`,
        {
          status: editStatus,
          notes: editNotes.trim() || '',
        },
      );

      setEditOrder(null);

      setSuccess(
        'Pesanan berhasil diperbarui.',
      );

      await fetchOrders();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        if (Array.isArray(message)) {
          setError(
            message[0] ??
              'Pesanan gagal diperbarui.',
          );
        } else {
          setError(
            typeof message === 'string'
              ? message
              : 'Pesanan gagal diperbarui.',
          );
        }
      } else {
        setError(
          'Pesanan gagal diperbarui.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!isAdmin) return;
    if (!archiveOrder) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await api.delete(
        `/orders/${archiveOrder.id}`,
      );

      setArchiveOrder(null);

      setSuccess(
        'Pesanan berhasil dipindahkan ke riwayat.',
      );

      await fetchOrders();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          typeof message === 'string'
            ? message
            : 'Pesanan gagal diarsipkan.',
        );
      } else {
        setError(
          'Pesanan gagal diarsipkan.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async () => {
    if (!isAdmin) return;
    setHistoryOpen(true);
    setHistorySearch('');
    setHistoryError('');
    await fetchHistory();
  };

  const handleRestore = async (
    order: Order,
  ) => {
    try {
      setRestoringId(order.id);
      setHistoryError('');
      setSuccess('');

      await api.patch(
        `/orders/${order.id}/restore`,
      );

      setSuccess(
        `${order.orderNumber} berhasil dipulihkan.`,
      );

      await Promise.all([
        fetchHistory(),
        fetchOrders(),
      ]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Pesanan gagal dipulihkan.',
        );
      } else {
        setHistoryError(
          'Pesanan gagal dipulihkan.',
        );
      }
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-600">
            Transaksi
          </p>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
            Pesanan
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kelola pesanan customer dan proses
            transaksi perusahaan.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {isAdmin && (
            <button
              type="button"
              onClick={() => void openHistory()}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Archive size={17} />
              Lihat Riwayat
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Buat Pesanan
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess('')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error &&
        !createOpen &&
        !editOrder &&
        !historyOpen && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
            >
              <X size={16} />
            </button>
          </div>
        )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Pesanan"
          value={orders.length}
          icon={<ClipboardList size={20} />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          label="Draft"
          value={draftCount}
          icon={<FileText size={20} />}
          iconClass="bg-slate-100 text-slate-600"
        />

        <SummaryCard
          label="Diproses"
          value={processCount}
          icon={<Package size={20} />}
          iconClass="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          label="Pengiriman"
          value={shippingCount}
          icon={<ShoppingBag size={20} />}
          iconClass="bg-violet-50 text-violet-600"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Daftar Pesanan
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {orders.length} pesanan terdaftar
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-[300px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Cari pesanan atau customer..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | 'ALL'
                      | OrderStatus,
                  )
                }
                className="h-10 min-w-[170px] appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-xs text-slate-600 outline-none focus:border-blue-400"
              >
                <option value="ALL">
                  Semua Status
                </option>

                {statusOptions.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState text="Memuat data pesanan..." />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="Pesanan tidak ditemukan"
            text={
              orders.length === 0
                ? 'Belum ada pesanan yang dibuat.'
                : 'Coba ubah pencarian atau filter status.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/80">
                  <TableHead>
                    No. Pesanan
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead align="right">
                    Aksi
                  </TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-slate-50/60"
                  >
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-semibold text-blue-600">
                        {order.orderNumber}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-slate-700">
                        {order.customer.name}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {order.customer.code}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(order.orderDate)}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {order.details.length} item
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                      {formatCurrency(order.total)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusStyle(
                          order.status,
                        )}`}
                      >
                        {getStatusLabel(
                          order.status,
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserRound
                          size={14}
                          className="text-slate-400"
                        />
                        <span className="text-xs text-slate-500">
                          {order.user?.name ||
                            order.user?.username ||
                            '-'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <ActionButton
                          title="Lihat detail"
                          onClick={() =>
                            setDetailOrder(order)
                          }
                        >
                          <Eye size={15} />
                        </ActionButton>

                        {canManage && (
                          <ActionButton
                            title="Edit pesanan"
                            onClick={() =>
                              openEdit(order)
                            }
                            hoverClass="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={15} />
                          </ActionButton>
                        )}

                        {isAdmin &&
                          order.status ===
                            'DRAFT' && (
                          <ActionButton
                            title="Arsipkan pesanan"
                            onClick={() =>
                              setArchiveOrder(
                                order,
                              )
                            }
                            hoverClass="hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Archive
                              size={15}
                            />
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {createOpen && canManage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[2px]">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Buat Pesanan"
              subtitle="Masukkan customer dan detail produk yang dipesan."
              onClose={closeCreate}
            />

            <form
              onSubmit={handleCreate}
              className="min-h-0 flex flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {error && (
                  <ErrorBox text={error} />
                )}

                <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                  <div>
                    <FieldLabel
                      htmlFor="customer"
                      required
                    >
                      Customer
                    </FieldLabel>

                    <select
                      id="customer"
                      required
                      value={customerId}
                      onChange={(event) =>
                        setCustomerId(
                          event.target.value,
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    >
                      <option value="">
                        Pilih customer
                      </option>

                      {customers.map(
                        (customer) => (
                          <option
                            key={customer.id}
                            value={customer.id}
                          >
                            {customer.code} —{' '}
                            {customer.name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="notes">
                      Catatan
                    </FieldLabel>

                    <input
                      id="notes"
                      type="text"
                      maxLength={1000}
                      value={notes}
                      onChange={(event) =>
                        setNotes(
                          event.target.value,
                        )
                      }
                      placeholder="Catatan pesanan jika ada"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>
                </div>

                <div className="mt-7">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Detail Produk
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Tambahkan produk yang
                        dipesan customer.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addDetail}
                      className="flex h-9 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Plus size={14} />
                      Tambah Produk
                    </button>
                  </div>

                  <div className="space-y-3">
                    {details.map(
                      (detail, index) => {
                        const subtotal =
                          (Number(
                            detail.quantity,
                          ) || 0) *
                          (Number(
                            detail.price,
                          ) || 0);

                        return (
                          <div
                            key={index}
                            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 lg:grid-cols-[2fr_0.7fr_1fr_1fr_auto]"
                          >
                            <div>
                              <FieldLabel>
                                Produk
                              </FieldLabel>

                              <select
                                required
                                value={
                                  detail.productId
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateDetail(
                                    index,
                                    'productId',
                                    event.target
                                      .value,
                                  )
                                }
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-500"
                              >
                                <option value="">
                                  Pilih produk
                                </option>

                                {products.map(
                                  (product) => (
                                    <option
                                      key={
                                        product.id
                                      }
                                      value={
                                        product.id
                                      }
                                    >
                                      {
                                        product.code
                                      }{' '}
                                      —{' '}
                                      {
                                        product.name
                                      }{' '}
                                      (
                                      {
                                        product.unit
                                      }
                                      )
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>

                            <div>
                              <FieldLabel>
                                Qty
                              </FieldLabel>

                              <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                  detail.quantity
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateDetail(
                                    index,
                                    'quantity',
                                    event.target
                                      .value,
                                  )
                                }
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <FieldLabel>
                                Harga
                              </FieldLabel>

                              <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                  detail.price
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateDetail(
                                    index,
                                    'price',
                                    event.target
                                      .value,
                                  )
                                }
                                placeholder="0"
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <FieldLabel>
                                Subtotal
                              </FieldLabel>

                              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-700">
                                {formatCurrency(
                                  subtotal,
                                )}
                              </div>
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                disabled={
                                  details.length ===
                                  1
                                }
                                onClick={() =>
                                  removeDetail(
                                    index,
                                  )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <div className="w-full max-w-sm rounded-xl bg-slate-900 px-5 py-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Total Pesanan
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {details.length}{' '}
                          produk
                        </p>
                      </div>

                      <p className="text-xl font-semibold tracking-tight">
                        {formatCurrency(
                          orderTotal,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeCreate}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-medium text-slate-600"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 min-w-[140px] rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : 'Simpan Pesanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[2px]">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title={`Pesanan ${detailOrder.orderNumber}`}
              subtitle="Informasi lengkap pesanan customer."
              onClose={() =>
                setDetailOrder(null)
              }
            />

            <div className="overflow-y-auto p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBox
                  label="Customer"
                  value={
                    detailOrder.customer.name
                  }
                />
                <InfoBox
                  label="Tanggal"
                  value={formatDate(
                    detailOrder.orderDate,
                  )}
                />
                <InfoBox
                  label="Status"
                  value={getStatusLabel(
                    detailOrder.status,
                  )}
                />
                <InfoBox
                  label="Dibuat Oleh"
                  value={
                    detailOrder.user?.name ||
                    detailOrder.user
                      ?.username ||
                    '-'
                  }
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHead>
                        Produk
                      </TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead align="right">
                        Subtotal
                      </TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {detailOrder.details.map(
                      (detail) => (
                        <tr key={detail.id}>
                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-slate-700">
                              {
                                detail.product
                                  .name
                              }
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {
                                detail.product
                                  .code
                              }
                            </p>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {Number(
                              detail.quantity,
                            )}{' '}
                            {
                              detail.product
                                .unit
                            }
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {formatCurrency(
                              detail.price,
                            )}
                          </td>

                          <td className="px-5 py-4 text-right text-xs font-semibold text-slate-800">
                            {formatCurrency(
                              detail.subtotal,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex justify-end">
                <div className="rounded-xl bg-slate-900 px-6 py-4 text-white">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">
                    Total
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatCurrency(
                      detailOrder.total,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Catatan
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {detailOrder.notes ||
                    'Tidak ada catatan.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {editOrder && canManage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title={`Edit ${editOrder.orderNumber}`}
              subtitle="Ubah status dan catatan pesanan."
              onClose={() => {
                if (!submitting) {
                  setEditOrder(null);
                  setError('');
                }
              }}
            />

            <form onSubmit={handleEdit}>
              <div className="space-y-5 p-6">
                {error && (
                  <ErrorBox text={error} />
                )}

                <div>
                  <FieldLabel
                    htmlFor="edit-status"
                    required
                  >
                    Status
                  </FieldLabel>

                  <select
                    id="edit-status"
                    value={editStatus}
                    onChange={(event) =>
                      setEditStatus(
                        event.target
                          .value as OrderStatus,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500"
                  >
                    {statusOptions.map(
                      (status) => (
                        <option
                          key={status.value}
                          value={status.value}
                        >
                          {status.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="edit-notes">
                    Catatan
                  </FieldLabel>

                  <textarea
                    id="edit-notes"
                    rows={4}
                    value={editNotes}
                    onChange={(event) =>
                      setEditNotes(
                        event.target.value,
                      )
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                  />
                </div>

                {editOrder.status ===
                  'DIBATALKAN' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                    Pesanan ini sudah dibatalkan
                    dan tidak dapat diaktifkan
                    kembali melalui perubahan
                    status.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    setEditOrder(null)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-medium text-slate-600"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveOrder && isAdmin && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Archive size={20} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              Arsipkan pesanan?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pesanan{' '}
              <span className="font-semibold text-slate-700">
                {archiveOrder.orderNumber}
              </span>{' '}
              akan dipindahkan ke riwayat.
              Data tidak dihapus permanen.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  setArchiveOrder(null)
                }
                className="h-10 rounded-xl border border-slate-200 px-5 text-xs font-medium text-slate-600"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  void handleArchive()
                }
                className="h-10 rounded-xl bg-amber-500 px-5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {submitting
                  ? 'Memproses...'
                  : 'Ya, Arsipkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyOpen && isAdmin && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[2px]">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <ModalHeader
              title="Riwayat Pesanan"
              subtitle="Pesanan yang telah dipindahkan ke arsip."
              onClose={() => {
                if (restoringId === null) {
                  setHistoryOpen(false);
                }
              }}
            />

            <div className="border-b border-slate-100 px-6 py-4">
              <div className="relative max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={historySearch}
                  onChange={(event) =>
                    setHistorySearch(
                      event.target.value,
                    )
                  }
                  placeholder="Cari riwayat pesanan..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>

            {historyError && (
              <div className="mx-6 mt-4">
                <ErrorBox
                  text={historyError}
                />
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto">
              {historyLoading ? (
                <LoadingState text="Memuat riwayat pesanan..." />
              ) : filteredHistory.length ===
                0 ? (
                <EmptyState
                  title="Belum ada riwayat"
                  text="Pesanan yang diarsipkan akan muncul di sini."
                />
              ) : (
                <table className="w-full min-w-[800px]">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <TableHead>
                        No. Pesanan
                      </TableHead>
                      <TableHead>
                        Customer
                      </TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>
                        Diarsipkan
                      </TableHead>
                      <TableHead align="right">
                        Aksi
                      </TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map(
                      (order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                            {
                              order.orderNumber
                            }
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-600">
                            {
                              order.customer
                                .name
                            }
                          </td>

                          <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                            {formatCurrency(
                              order.total,
                            )}
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-500">
                            {order.deletedAt
                              ? formatDateTime(
                                  order.deletedAt,
                                )
                              : '-'}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                disabled={
                                  restoringId ===
                                  order.id
                                }
                                onClick={() =>
                                  void handleRestore(
                                    order,
                                  )
                                }
                                className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                              >
                                <RotateCcw
                                  size={14}
                                />
                                {restoringId ===
                                order.id
                                  ? 'Memulihkan...'
                                  : 'Pulihkan'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function TableHead({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${
        align === 'right'
          ? 'text-right'
          : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function ActionButton({
  children,
  title,
  onClick,
  hoverClass = 'hover:bg-slate-100 hover:text-slate-700',
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  hoverClass?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition ${hoverClass}`}
    >
      {children}
    </button>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function FieldLabel({
  children,
  htmlFor,
  required = false,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-xs font-medium text-slate-700"
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
    </label>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function ErrorBox({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
      {text}
    </div>
  );
}

function LoadingState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex min-h-[330px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="mt-3 text-xs text-slate-400">
          {text}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-[330px] items-center justify-center">
      <div className="text-center">
        <ClipboardList
          size={27}
          className="mx-auto text-slate-300"
        />
        <p className="mt-4 text-sm font-medium text-slate-700">
          {title}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {text}
        </p>
      </div>
    </div>
  );
}

export default OrderPage;
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Archive,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit3,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  Truck,
  UserRound,
  X,
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

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
  address?: string | null;
}

interface Product {
  id: number;
  code: string;
  name: string;
  unit: string;
}

interface OrderDetail {
  id: number;
  productId: number;
  quantity: number | string;
  price: number | string;
  subtotal: number | string;
  product: Product;
}

interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  status: OrderStatus;
  total: number | string;
  customer: Customer;
  details: OrderDetail[];
  suratJalan?: {
    id: number;
    nomorSurat: string;
  } | null;
}

interface Driver {
  id: number;
  name: string;
  phone?: string | null;
  licenseNo?: string | null;
  isActive: boolean;
}

interface Vehicle {
  id: number;
  nomorPolisi: string;
  jenis: string;
  merek?: string | null;
  model?: string | null;
  warna?: string | null;
  tahun?: number | null;
  aktif: boolean;
}

interface SuratJalanDetail {
  id: number;
  productId: number;
  quantity: number | string;
  keterangan?: string | null;
  product: Product;
}

interface SuratJalan {
  id: number;
  nomorSurat: string;
  orderId: number;
  userId: number;
  driverId?: number | null;
  vehicleId?: number | null;
  tanggalKirim: string;
  referensiPO?: string | null;
  tujuan?: string | null;
  alamat?: string | null;
  penerima?: string | null;
  catatan?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  order: Order;
  user: {
    id: number;
    name: string;
    username: string;
  };
  driver?: Driver | null;
  vehicle?: Vehicle | null;
  details: SuratJalanDetail[];
}

interface ApiError {
  message?: string | string[];
}

interface FormState {
  orderId: string;
  driverId: string;
  vehicleId: string;
  referensiPO: string;
  tujuan: string;
  alamat: string;
  penerima: string;
  catatan: string;
}

interface ConfirmState {
  open: boolean;
  type: 'archive' | 'restore' | null;
  data: SuratJalan | null;
}

const initialForm: FormState = {
  orderId: '',
  driverId: '',
  vehicleId: '',
  referensiPO: '',
  tujuan: '',
  alamat: '',
  penerima: '',
  catatan: '',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getErrorMessage = async (
  response: Response,
  fallback: string,
) => {
  try {
    const data = (await response.json()) as ApiError;

    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }

    return data.message || fallback;
  } catch {
    return fallback;
  }
};

const getRoleFromToken = (token: string) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return '';

    const normalized = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));

    return String(decoded.role || '').toUpperCase();
  } catch {
    return '';
  }
};

function SuratJalanPage() {
  const token =
    sessionStorage.getItem('access_token') || '';

  const role = getRoleFromToken(token);
  const canManage = role === 'ADMIN' || role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const [suratJalan, setSuratJalan] = useState<
    SuratJalan[]
  >([]);
  const [history, setHistory] = useState<SuratJalan[]>(
    [],
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    number | null
  >(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] =
    useState(false);
  const [selected, setSelected] =
    useState<SuratJalan | null>(null);
  const [editing, setEditing] =
    useState<SuratJalan | null>(null);

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [confirm, setConfirm] =
    useState<ConfirmState>({
      open: false,
      type: null,
      data: null,
    });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const perPage = 8;

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const jsonHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token],
  );

  const showMessage = (
    type: 'success' | 'error',
    message: string,
  ) => {
    if (type === 'success') {
      setSuccess(message);
      setError('');

      window.setTimeout(() => {
        setSuccess('');
      }, 3500);
    } else {
      setError(message);
      setSuccess('');

      window.setTimeout(() => {
        setError('');
      }, 4500);
    }
  };

  const fetchSuratJalan = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/surat-jalan`,
        {
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil data surat jalan',
          ),
        );
      }

      const data =
        (await response.json()) as SuratJalan[];

      setSuratJalan(data);
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data surat jalan',
      );
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchMasterData = useCallback(async () => {
    try {
      const [
        orderResponse,
        driverResponse,
        vehicleResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/orders`, {
          headers: authHeaders,
        }),
        fetch(`${API_URL}/drivers`, {
          headers: authHeaders,
        }),
        fetch(`${API_URL}/vehicles`, {
          headers: authHeaders,
        }),
      ]);

      if (!orderResponse.ok) {
        throw new Error(
          await getErrorMessage(
            orderResponse,
            'Gagal mengambil data pesanan',
          ),
        );
      }

      if (!driverResponse.ok) {
        throw new Error(
          await getErrorMessage(
            driverResponse,
            'Gagal mengambil data driver',
          ),
        );
      }

      if (!vehicleResponse.ok) {
        throw new Error(
          await getErrorMessage(
            vehicleResponse,
            'Gagal mengambil data kendaraan',
          ),
        );
      }

      const orderData =
        (await orderResponse.json()) as Order[];
      const driverData =
        (await driverResponse.json()) as Driver[];
      const vehicleData =
        (await vehicleResponse.json()) as Vehicle[];

      setOrders(orderData);
      setDrivers(
        driverData.filter(
          (driver) => driver.isActive,
        ),
      );
      setVehicles(
        vehicleData.filter(
          (vehicle) => vehicle.aktif,
        ),
      );
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal mengambil master data',
      );
    }
  }, [authHeaders]);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);

      const response = await fetch(
        `${API_URL}/surat-jalan/history`,
        {
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil riwayat surat jalan',
          ),
        );
      }

      const data =
        (await response.json()) as SuratJalan[];

      setHistory(data);
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal mengambil riwayat surat jalan',
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void fetchSuratJalan();
    void fetchMasterData();
  }, [fetchSuratJalan, fetchMasterData]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const availableOrders = useMemo(() => {
    return orders.filter((order) => {
      if (editing?.orderId === order.id) {
        return true;
      }

      return (
        !order.suratJalan &&
        order.status !== 'DIBATALKAN' &&
        order.details.length > 0
      );
    });
  }, [orders, editing]);

  const selectedOrder = useMemo(() => {
    return orders.find(
      (order) => order.id === Number(form.orderId),
    );
  }, [orders, form.orderId]);

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return suratJalan;
    }

    return suratJalan.filter((item) => {
      return (
        item.nomorSurat
          .toLowerCase()
          .includes(keyword) ||
        item.order?.orderNumber
          ?.toLowerCase()
          .includes(keyword) ||
        item.order?.customer?.name
          ?.toLowerCase()
          .includes(keyword) ||
        item.referensiPO
          ?.toLowerCase()
          .includes(keyword) ||
        item.driver?.name
          ?.toLowerCase()
          .includes(keyword) ||
        item.vehicle?.nomorPolisi
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [suratJalan, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / perPage),
  );

  const currentData = filteredData.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  const historyTotalPages = Math.max(
    1,
    Math.ceil(history.length / perPage),
  );

  const currentHistory = history.slice(
    (historyPage - 1) * perPage,
    historyPage * perPage,
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditing(null);
  };

  const openCreate = () => {
    if (!canManage) return;

    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: SuratJalan) => {
    if (!canManage) return;

    setEditing(item);

    setForm({
      orderId: String(item.orderId),
      driverId: item.driverId
        ? String(item.driverId)
        : '',
      vehicleId: item.vehicleId
        ? String(item.vehicleId)
        : '',
      referensiPO: item.referensiPO || '',
      tujuan: item.tujuan || '',
      alamat: item.alamat || '',
      penerima: item.penerima || '',
      catatan: item.catatan || '',
    });

    setSelected(null);
    setShowForm(true);
  };

  const handleOrderChange = (value: string) => {
    const order = orders.find(
      (item) => item.id === Number(value),
    );

    setForm((current) => ({
      ...current,
      orderId: value,
      tujuan:
        order?.customer?.name || current.tujuan,
      alamat:
        order?.customer?.address ||
        current.alamat,
    }));
  };

  const handleChange = (
    field: keyof FormState,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitForm = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!canManage) {
      showMessage('error', 'Anda tidak memiliki akses untuk mengubah surat jalan');
      return;
    }

    if (!editing && !form.orderId) {
      showMessage(
        'error',
        'Pesanan harus dipilih',
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...(editing
          ? {}
          : {
              orderId: Number(form.orderId),
            }),
        driverId: form.driverId
          ? Number(form.driverId)
          : undefined,
        vehicleId: form.vehicleId
          ? Number(form.vehicleId)
          : undefined,
        referensiPO:
          form.referensiPO.trim() || undefined,
        tujuan: form.tujuan.trim() || undefined,
        alamat: form.alamat.trim() || undefined,
        penerima:
          form.penerima.trim() || undefined,
        catatan: form.catatan.trim() || undefined,
      };

      const response = await fetch(
        editing
          ? `${API_URL}/surat-jalan/${editing.id}`
          : `${API_URL}/surat-jalan`,
        {
          method: editing ? 'PATCH' : 'POST',
          headers: jsonHeaders,
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            editing
              ? 'Gagal mengubah surat jalan'
              : 'Gagal membuat surat jalan',
          ),
        );
      }

      setShowForm(false);

      showMessage(
        'success',
        editing
          ? 'Surat jalan berhasil diperbarui'
          : 'Surat jalan berhasil dibuat',
      );

      resetForm();

      await Promise.all([
        fetchSuratJalan(),
        fetchMasterData(),
      ]);
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan surat jalan',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const archiveData = async (
    item: SuratJalan,
  ) => {
    try {
      setActionLoading(item.id);

      const response = await fetch(
        `${API_URL}/surat-jalan/${item.id}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal memindahkan surat jalan ke riwayat',
          ),
        );
      }

      setConfirm({
        open: false,
        type: null,
        data: null,
      });

      setSelected(null);

      showMessage(
        'success',
        'Surat jalan berhasil dipindahkan ke riwayat',
      );

      await Promise.all([
        fetchSuratJalan(),
        fetchMasterData(),
      ]);
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal memindahkan surat jalan',
      );
    } finally {
      setActionLoading(null);
    }
  };

  const restoreData = async (
    item: SuratJalan,
  ) => {
    try {
      setActionLoading(item.id);

      const response = await fetch(
        `${API_URL}/surat-jalan/${item.id}/restore`,
        {
          method: 'PATCH',
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal memulihkan surat jalan',
          ),
        );
      }

      setConfirm({
        open: false,
        type: null,
        data: null,
      });

      showMessage(
        'success',
        'Surat jalan berhasil dipulihkan',
      );

      await Promise.all([
        fetchHistory(),
        fetchSuratJalan(),
        fetchMasterData(),
      ]);
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal memulihkan surat jalan',
      );
    } finally {
      setActionLoading(null);
    }
  };

  const executeConfirm = async () => {
    if (!confirm.data || !confirm.type) {
      return;
    }

    if (confirm.type === 'archive') {
      await archiveData(confirm.data);
    } else {
      await restoreData(confirm.data);
    }
  };

  const openHistory = async () => {
    if (!isAdmin) return;

    setShowHistory(true);
    setHistoryPage(1);
    await fetchHistory();
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="fixed right-6 top-6 z-[150] flex max-w-sm items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-xl">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check size={17} />
          </div>

          <p className="text-sm font-medium text-slate-700">
            {success}
          </p>
        </div>
      )}

      {error && (
        <div className="fixed right-6 top-6 z-[150] flex max-w-sm items-center gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 shadow-xl">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <X size={17} />
          </div>

          <p className="text-sm font-medium text-slate-700">
            {error}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-600">
            Transaksi
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Surat Jalan
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola dokumen pengiriman barang berdasarkan
            pesanan customer.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => void openHistory()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Archive size={17} />
              Lihat Riwayat
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Buat Surat Jalan
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total Surat Jalan
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {suratJalan.length}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <FileText size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Pesanan Tersedia
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {availableOrders.length}
              </p>
            </div>

            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
              <ClipboardList size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Driver Aktif
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {drivers.length}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <UserRound size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Kendaraan Aktif
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {vehicles.length}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Truck size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari surat, pesanan, customer, driver..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  No. Surat
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Pesanan
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Customer
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Pengiriman
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tujuan
                </th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tanggal
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Memuat surat jalan...
                    </div>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <FileText
                      size={34}
                      className="mx-auto mb-3 text-slate-300"
                    />
                    <p className="text-sm font-medium text-slate-600">
                      Belum ada surat jalan
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Buat surat jalan dari pesanan yang
                      akan dikirim.
                    </p>
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-blue-600">
                        {item.nomorSurat}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        PO: {item.referensiPO || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {item.order?.orderNumber || '-'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.details.length} barang
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {item.order?.customer?.name || '-'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.order?.customer?.code || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {item.driver?.name || '-'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.vehicle?.nomorPolisi || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[180px] truncate text-sm text-slate-700">
                        {item.tujuan || '-'}
                      </p>
                      <p className="mt-0.5 max-w-[180px] truncate text-xs text-slate-400">
                        {item.alamat || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(item.tanggalKirim)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="Lihat detail"
                          onClick={() =>
                            setSelected(item)
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Eye size={16} />
                        </button>

                        {canManage && (
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEdit(item)}
                            className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50"
                          >
                            <Edit3 size={16} />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            title="Pindahkan ke riwayat"
                            onClick={() =>
                              setConfirm({
                                open: true,
                                type: 'archive',
                                data: item,
                              })
                            }
                            className="rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredData.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Menampilkan {(page - 1) * perPage + 1}–
              {Math.min(
                page * perPage,
                filteredData.length,
              )}{' '}
              dari {filteredData.length} surat jalan
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 text-xs font-medium text-slate-600">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1,
                    ),
                  )
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && canManage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editing
                    ? 'Edit Surat Jalan'
                    : 'Buat Surat Jalan'}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {editing
                    ? editing.nomorSurat
                    : 'Pilih pesanan yang akan dikirim'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitForm}>
              <div className="space-y-6 p-6">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Pesanan
                  </label>

                  <select
                    value={form.orderId}
                    disabled={Boolean(editing)}
                    onChange={(event) =>
                      handleOrderChange(
                        event.target.value,
                      )
                    }
                    required={!editing}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">
                      Pilih pesanan
                    </option>

                    {availableOrders.map((order) => (
                      <option
                        key={order.id}
                        value={order.id}
                      >
                        {order.orderNumber} -{' '}
                        {order.customer?.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedOrder && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-500">
                          PESANAN
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {selectedOrder.orderNumber}
                        </p>
                      </div>

                      <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-semibold text-blue-600">
                        {selectedOrder.status}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] text-slate-400">
                          Customer
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {
                            selectedOrder.customer
                              ?.name
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-slate-400">
                          Jumlah Barang
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {
                            selectedOrder.details
                              .length
                          }{' '}
                          item
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Driver
                    </label>

                    <select
                      value={form.driverId}
                      onChange={(event) =>
                        handleChange(
                          'driverId',
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="">
                        Pilih driver
                      </option>

                      {drivers.map((driver) => (
                        <option
                          key={driver.id}
                          value={driver.id}
                        >
                          {driver.name}
                          {driver.licenseNo
                            ? ` - ${driver.licenseNo}`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Kendaraan
                    </label>

                    <select
                      value={form.vehicleId}
                      onChange={(event) =>
                        handleChange(
                          'vehicleId',
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="">
                        Pilih kendaraan
                      </option>

                      {vehicles.map((vehicle) => (
                        <option
                          key={vehicle.id}
                          value={vehicle.id}
                        >
                          {vehicle.nomorPolisi} -{' '}
                          {vehicle.jenis}
                          {vehicle.merek
                            ? ` ${vehicle.merek}`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Referensi PO
                    </label>

                    <input
                      value={form.referensiPO}
                      maxLength={100}
                      onChange={(event) =>
                        handleChange(
                          'referensiPO',
                          event.target.value,
                        )
                      }
                      placeholder="Contoh: PO-001/2026"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Penerima
                    </label>

                    <input
                      value={form.penerima}
                      maxLength={100}
                      onChange={(event) =>
                        handleChange(
                          'penerima',
                          event.target.value,
                        )
                      }
                      placeholder="Nama penerima barang"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Tujuan
                  </label>

                  <input
                    value={form.tujuan}
                    maxLength={200}
                    onChange={(event) =>
                      handleChange(
                        'tujuan',
                        event.target.value,
                      )
                    }
                    placeholder="Tujuan pengiriman"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Alamat Pengiriman
                  </label>

                  <textarea
                    value={form.alamat}
                    maxLength={500}
                    rows={3}
                    onChange={(event) =>
                      handleChange(
                        'alamat',
                        event.target.value,
                      )
                    }
                    placeholder="Alamat tujuan pengiriman"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {selectedOrder &&
                  selectedOrder.details.length > 0 && (
                    <div>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-800">
                          Barang yang Dikirim
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Barang otomatis mengikuti
                          detail pesanan.
                        </p>
                      </div>

                      <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Produk
                              </th>
                              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Jumlah
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {selectedOrder.details.map(
                              (detail) => (
                                <tr key={detail.id}>
                                  <td className="px-4 py-3">
                                    <p className="text-sm font-medium text-slate-700">
                                      {
                                        detail.product
                                          ?.name
                                      }
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {
                                        detail.product
                                          ?.code
                                      }
                                    </p>
                                  </td>

                                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                                    {Number(
                                      detail.quantity,
                                    )}{' '}
                                    {
                                      detail.product
                                        ?.unit
                                    }
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Catatan
                  </label>

                  <textarea
                    value={form.catatan}
                    maxLength={1000}
                    rows={3}
                    onChange={(event) =>
                      handleChange(
                        'catatan',
                        event.target.value,
                      )
                    }
                    placeholder="Catatan tambahan..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editing
                    ? 'Simpan Perubahan'
                    : 'Buat Surat Jalan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
                  Surat Jalan
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  {selected.nomorSurat}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] text-slate-400">
                    Pesanan
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {selected.order?.orderNumber ||
                      '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] text-slate-400">
                    Customer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {selected.order?.customer?.name ||
                      '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] text-slate-400">
                    Tanggal Kirim
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(
                      selected.tanggalKirim,
                    )}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-slate-700">
                    <UserRound size={17} />
                    <p className="text-sm font-semibold">
                      Driver
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">
                    {selected.driver?.name || '-'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    SIM:{' '}
                    {selected.driver?.licenseNo ||
                      '-'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-slate-700">
                    <Truck size={17} />
                    <p className="text-sm font-semibold">
                      Kendaraan
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">
                    {selected.vehicle
                      ?.nomorPolisi || '-'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {selected.vehicle?.jenis || '-'}{' '}
                    {selected.vehicle?.merek || ''}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center gap-2 text-slate-700">
                  <MapPin size={17} />
                  <p className="text-sm font-semibold">
                    Pengiriman
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-slate-400">
                      Tujuan
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selected.tujuan || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400">
                      Penerima
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selected.penerima || '-'}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-[11px] text-slate-400">
                      Alamat
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {selected.alamat || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Package
                    size={17}
                    className="text-slate-500"
                  />
                  <p className="text-sm font-semibold text-slate-800">
                    Detail Barang
                  </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Produk
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Jumlah
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {selected.details.map(
                        (detail) => (
                          <tr key={detail.id}>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-700">
                                {
                                  detail.product
                                    ?.name
                                }
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {
                                  detail.product
                                    ?.code
                                }
                              </p>
                            </td>

                            <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                              {Number(
                                detail.quantity,
                              )}{' '}
                              {
                                detail.product
                                  ?.unit
                              }
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-600">
                    Referensi PO
                  </p>
                  <div className="rounded-xl bg-slate-50 p-3.5 text-sm text-slate-600">
                    {selected.referensiPO || '-'}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-600">
                    Dibuat Oleh
                  </p>
                  <div className="rounded-xl bg-slate-50 p-3.5 text-sm text-slate-600">
                    {selected.user?.name ||
                      selected.user?.username ||
                      '-'}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  Catatan
                </p>
                <div className="min-h-16 rounded-xl bg-slate-50 p-3.5 text-sm leading-6 text-slate-600">
                  {selected.catatan ||
                    'Tidak ada catatan.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              {canManage && (
                <button
                  type="button"
                  onClick={() => openEdit(selected)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showHistory && isAdmin && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#f6f8fb]">
          <div className="mx-auto min-h-screen max-w-7xl p-5 sm:p-7 lg:p-9">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setShowHistory(false)
                  }
                  className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft size={17} />
                  Kembali ke Surat Jalan
                </button>

                <h2 className="text-2xl font-semibold text-slate-900">
                  Riwayat Surat Jalan
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Surat jalan yang telah dipindahkan
                  ke riwayat.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchHistory()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600"
              >
                <RefreshCcw size={16} />
                Muat Ulang
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase text-slate-400">
                        No. Surat
                      </th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase text-slate-400">
                        Pesanan
                      </th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase text-slate-400">
                        Customer
                      </th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase text-slate-400">
                        Dihapus
                      </th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase text-slate-400">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {historyLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-16"
                        >
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                            <Loader2
                              size={18}
                              className="animate-spin"
                            />
                            Memuat riwayat...
                          </div>
                        </td>
                      </tr>
                    ) : currentHistory.length ===
                      0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-16 text-center"
                        >
                          <Archive
                            size={32}
                            className="mx-auto mb-3 text-slate-300"
                          />
                          <p className="text-sm font-medium text-slate-600">
                            Riwayat masih kosong
                          </p>
                        </td>
                      </tr>
                    ) : (
                      currentHistory.map((item) => (
                        <tr key={item.id}>
                          <td className="px-5 py-4 text-sm font-semibold text-blue-600">
                            {item.nomorSurat}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.order
                              ?.orderNumber || '-'}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.order?.customer
                              ?.name || '-'}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(
                              item.deletedAt,
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  open: true,
                                  type: 'restore',
                                  data: item,
                                })
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"
                            >
                              <RotateCcw
                                size={14}
                              />
                              Pulihkan
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!historyLoading &&
                history.length > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                    <p className="text-xs text-slate-400">
                      {history.length} data riwayat
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={
                          historyPage === 1
                        }
                        onClick={() =>
                          setHistoryPage(
                            (current) =>
                              Math.max(
                                1,
                                current - 1,
                              ),
                          )
                        }
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <span className="px-3 text-xs text-slate-600">
                        {historyPage} /{' '}
                        {historyTotalPages}
                      </span>

                      <button
                        type="button"
                        disabled={
                          historyPage ===
                          historyTotalPages
                        }
                        onClick={() =>
                          setHistoryPage(
                            (current) =>
                              Math.min(
                                historyTotalPages,
                                current + 1,
                              ),
                          )
                        }
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-40"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {confirm.open &&
        confirm.data &&
        confirm.type && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[430px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="p-6">
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${
                    confirm.type === 'archive'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {confirm.type === 'archive' ? (
                    <Archive size={23} />
                  ) : (
                    <RotateCcw size={23} />
                  )}
                </div>

                <h3 className="text-lg font-semibold text-slate-900">
                  {confirm.type === 'archive'
                    ? 'Pindahkan ke Riwayat'
                    : 'Pulihkan Surat Jalan'}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {confirm.type === 'archive'
                    ? `Surat jalan ${confirm.data.nomorSurat} akan dipindahkan ke riwayat.`
                    : `Surat jalan ${confirm.data.nomorSurat} akan dikembalikan ke daftar aktif.`}
                </p>

                {confirm.type === 'archive' && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                    Surat jalan tidak dapat dipindahkan
                    ke riwayat jika pesanan sudah memiliki
                    Invoice.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() =>
                    setConfirm({
                      open: false,
                      type: null,
                      data: null,
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() =>
                    void executeConfirm()
                  }
                  className={`inline-flex min-w-[110px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
                    confirm.type === 'archive'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionLoading !== null && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {confirm.type === 'archive'
                    ? 'Pindahkan'
                    : 'Pulihkan'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default SuratJalanPage;
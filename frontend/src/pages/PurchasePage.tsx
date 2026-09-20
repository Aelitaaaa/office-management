import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Eye,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  X,
  XCircle,
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

type PurchaseStatus =
  | 'DRAFT'
  | 'DIPESAN'
  | 'DITERIMA'
  | 'SELESAI'
  | 'DIBATALKAN';

type ConfirmAction =
  | 'order'
  | 'receive'
  | 'complete'
  | 'cancel'
  | 'archive'
  | 'restore';

interface Supplier {
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
  stock: number | string;
  isActive: boolean;
}

interface PurchaseDetail {
  id: number;
  productId: number;
  quantity: number | string;
  price: number | string;
  subtotal: number | string;
  product: Product;
}

interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  userId?: number | null;
  purchaseDate?: string;
  status: PurchaseStatus;
  notes?: string | null;
  total: number | string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  supplier: Supplier;
  user?: {
    id: number;
    name: string;
    username: string;
  } | null;
  details: PurchaseDetail[];
}

interface FormDetail {
  productId: string;
  quantity: string;
  price: string;
}

interface ApiError {
  message?: string | string[];
}

interface ConfirmModalState {
  open: boolean;
  purchase: Purchase | null;
  action: ConfirmAction | null;
}

const rupiah = (value: number | string) => {
  const number = Number(value) || 0;

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
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

const statusLabel: Record<PurchaseStatus, string> = {
  DRAFT: 'Draft',
  DIPESAN: 'Dipesan',
  DITERIMA: 'Diterima',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

const statusClass: Record<PurchaseStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-600',
  DIPESAN: 'border-blue-200 bg-blue-50 text-blue-700',
  DITERIMA: 'border-amber-200 bg-amber-50 text-amber-700',
  SELESAI:
    'border-emerald-200 bg-emerald-50 text-emerald-700',
  DIBATALKAN: 'border-red-200 bg-red-50 text-red-600',
};

const confirmConfig: Record<
  ConfirmAction,
  {
    title: string;
    description: (purchase: Purchase) => string;
    button: string;
    buttonClass: string;
    iconClass: string;
  }
> = {
  order: {
    title: 'Pesan ke Supplier',
    description: (purchase) =>
      `Pembelian ${purchase.purchaseNumber} akan dikirim sebagai pesanan ke supplier. Pastikan detail barang dan harga sudah benar.`,
    button: 'Pesan Sekarang',
    buttonClass:
      'bg-blue-600 text-white hover:bg-blue-700',
    iconClass: 'bg-blue-50 text-blue-600',
  },
  receive: {
    title: 'Konfirmasi Barang Diterima',
    description: (purchase) =>
      `Pastikan barang untuk ${purchase.purchaseNumber} sudah diterima dari supplier. Setelah dikonfirmasi, stok bahan mentah akan otomatis bertambah.`,
    button: 'Terima Barang',
    buttonClass:
      'bg-amber-500 text-white hover:bg-amber-600',
    iconClass: 'bg-amber-50 text-amber-600',
  },
  complete: {
    title: 'Selesaikan Pembelian',
    description: (purchase) =>
      `Pembelian ${purchase.purchaseNumber} akan ditandai sebagai selesai. Pastikan proses penerimaan barang sudah selesai.`,
    button: 'Selesaikan',
    buttonClass:
      'bg-emerald-600 text-white hover:bg-emerald-700',
    iconClass: 'bg-emerald-50 text-emerald-600',
  },
  cancel: {
    title: 'Batalkan Pembelian',
    description: (purchase) =>
      `Pembelian ${purchase.purchaseNumber} akan dibatalkan. Status ini menandakan transaksi tidak dilanjutkan.`,
    button: 'Batalkan Pembelian',
    buttonClass: 'bg-red-600 text-white hover:bg-red-700',
    iconClass: 'bg-red-50 text-red-600',
  },
  archive: {
    title: 'Pindahkan ke Riwayat',
    description: (purchase) =>
      `Pembelian ${purchase.purchaseNumber} akan dipindahkan dari daftar aktif ke riwayat. Data masih dapat dipulihkan kembali.`,
    button: 'Pindahkan',
    buttonClass: 'bg-red-600 text-white hover:bg-red-700',
    iconClass: 'bg-red-50 text-red-600',
  },
  restore: {
    title: 'Pulihkan Pembelian',
    description: (purchase) =>
      `Pembelian ${purchase.purchaseNumber} akan dikembalikan dari riwayat ke daftar pembelian.`,
    button: 'Pulihkan',
    buttonClass:
      'bg-emerald-600 text-white hover:bg-emerald-700',
    iconClass: 'bg-emerald-50 text-emerald-600',
  },
};

function PurchasePage() {
  const token = sessionStorage.getItem('access_token') || '';
  const storedUser = sessionStorage.getItem('user');
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  const role = currentUser?.role ?? '';
  const canManage =
    role === 'ADMIN' || role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [history, setHistory] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(
    null,
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('SEMUA');
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [selectedPurchase, setSelectedPurchase] =
    useState<Purchase | null>(null);

  const [confirmModal, setConfirmModal] =
    useState<ConfirmModalState>({
      open: false,
      purchase: null,
      action: null,
    });

  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');

  const [details, setDetails] = useState<FormDetail[]>([
    {
      productId: '',
      quantity: '1',
      price: '',
    },
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      window.setTimeout(() => setSuccess(''), 3500);
    } else {
      setError(message);
      setSuccess('');
      window.setTimeout(() => setError(''), 4500);
    }
  };

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/purchases`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil data pembelian',
          ),
        );
      }

      const data = (await response.json()) as Purchase[];
      setPurchases(data);
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data pembelian',
      );
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchMasterData = useCallback(async () => {
    try {
      const [supplierResponse, productResponse] =
        await Promise.all([
          fetch(`${API_URL}/suppliers`, {
            headers: authHeaders,
          }),
          fetch(`${API_URL}/products`, {
            headers: authHeaders,
          }),
        ]);

      if (!supplierResponse.ok) {
        throw new Error(
          await getErrorMessage(
            supplierResponse,
            'Gagal mengambil data supplier',
          ),
        );
      }

      if (!productResponse.ok) {
        throw new Error(
          await getErrorMessage(
            productResponse,
            'Gagal mengambil data produk',
          ),
        );
      }

      const supplierData =
        (await supplierResponse.json()) as Supplier[];

      const productData =
        (await productResponse.json()) as Product[];

      setSuppliers(
        supplierData.filter((supplier) => supplier.isActive),
      );

      setProducts(
        productData.filter(
          (product) =>
            product.isActive &&
            product.type === 'BAHAN_MENTAH',
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
        `${API_URL}/purchases/history`,
        {
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil riwayat pembelian',
          ),
        );
      }

      const data = (await response.json()) as Purchase[];
      setHistory(data);
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal mengambil riwayat pembelian',
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void fetchPurchases();

    if (canManage) {
      void fetchMasterData();
    }
  }, [fetchPurchases, fetchMasterData, canManage]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredPurchases = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return purchases.filter((purchase) => {
      const matchSearch =
        !keyword ||
        purchase.purchaseNumber
          .toLowerCase()
          .includes(keyword) ||
        purchase.supplier?.name
          ?.toLowerCase()
          .includes(keyword) ||
        purchase.supplier?.code
          ?.toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === 'SEMUA' ||
        purchase.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [purchases, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPurchases.length / perPage),
  );

  const currentPurchases = filteredPurchases.slice(
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

  const formTotal = useMemo(() => {
    return details.reduce((total, detail) => {
      return (
        total +
        (Number(detail.quantity) || 0) *
          (Number(detail.price) || 0)
      );
    }, 0);
  }, [details]);

  const draftCount = purchases.filter(
    (purchase) => purchase.status === 'DRAFT',
  ).length;

  const orderedCount = purchases.filter(
    (purchase) => purchase.status === 'DIPESAN',
  ).length;

  const totalPurchaseValue = purchases
    .filter((purchase) => purchase.status !== 'DIBATALKAN')
    .reduce(
      (total, purchase) => total + Number(purchase.total),
      0,
    );

  const resetForm = () => {
    setSupplierId('');
    setNotes('');
    setDetails([
      {
        productId: '',
        quantity: '1',
        price: '',
      },
    ]);
  };

  const openForm = () => {
    if (!canManage) return;

    resetForm();
    setShowForm(true);
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
    if (details.length === 1) return;

    setDetails((current) =>
      current.filter(
        (_, detailIndex) => detailIndex !== index,
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

  const submitPurchase = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!canManage) return;

    if (!supplierId) {
      showMessage('error', 'Supplier harus dipilih');
      return;
    }

    const hasInvalidDetail = details.some(
      (detail) =>
        !detail.productId ||
        Number(detail.quantity) <= 0 ||
        Number(detail.price) <= 0,
    );

    if (hasInvalidDetail) {
      showMessage(
        'error',
        'Produk, quantity, dan harga harus diisi dengan benar',
      );
      return;
    }

    const productIds = details.map(
      (detail) => detail.productId,
    );

    if (new Set(productIds).size !== productIds.length) {
      showMessage(
        'error',
        'Produk yang sama tidak boleh dimasukkan dua kali',
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/purchases`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          supplierId: Number(supplierId),
          notes: notes.trim() || undefined,
          details: details.map((detail) => ({
            productId: Number(detail.productId),
            quantity: Number(detail.quantity),
            price: Number(detail.price),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal membuat pembelian',
          ),
        );
      }

      setShowForm(false);
      resetForm();

      showMessage(
        'success',
        'Pembelian berhasil dibuat',
      );

      await fetchPurchases();
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal membuat pembelian',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirm = (
    purchase: Purchase,
    action: ConfirmAction,
  ) => {
    setConfirmModal({
      open: true,
      purchase,
      action,
    });
  };

  const closeConfirm = () => {
    if (actionLoading !== null) return;

    setConfirmModal({
      open: false,
      purchase: null,
      action: null,
    });
  };

  const runAction = async (
    purchase: Purchase,
    action:
      | 'order'
      | 'receive'
      | 'complete'
      | 'cancel'
      | 'archive',
  ) => {
    if (!canManage) return;
    if (action === 'archive' && !isAdmin) return;

    const messages = {
      order: 'Pembelian berhasil diubah menjadi dipesan',
      receive:
        'Barang berhasil diterima dan stok telah diperbarui',
      complete: 'Pembelian berhasil diselesaikan',
      cancel: 'Pembelian berhasil dibatalkan',
      archive:
        'Pembelian berhasil dipindahkan ke riwayat',
    };

    try {
      setActionLoading(purchase.id);

      const isArchive = action === 'archive';

      const endpoint = isArchive
        ? `${API_URL}/purchases/${purchase.id}`
        : `${API_URL}/purchases/${purchase.id}/${action}`;

      const response = await fetch(endpoint, {
        method: isArchive ? 'DELETE' : 'PATCH',
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Aksi pembelian gagal dilakukan',
          ),
        );
      }

      setConfirmModal({
        open: false,
        purchase: null,
        action: null,
      });

      setSelectedPurchase(null);

      showMessage('success', messages[action]);

      await fetchPurchases();
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Aksi pembelian gagal dilakukan',
      );
    } finally {
      setActionLoading(null);
    }
  };

  const restorePurchase = async (
    purchase: Purchase,
  ) => {
    if (!isAdmin) return;

    try {
      setActionLoading(purchase.id);

      const response = await fetch(
        `${API_URL}/purchases/${purchase.id}/restore`,
        {
          method: 'PATCH',
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal memulihkan pembelian',
          ),
        );
      }

      setConfirmModal({
        open: false,
        purchase: null,
        action: null,
      });

      showMessage(
        'success',
        'Pembelian berhasil dipulihkan',
      );

      await Promise.all([
        fetchHistory(),
        fetchPurchases(),
      ]);
    } catch (err) {
      showMessage(
        'error',
        err instanceof Error
          ? err.message
          : 'Gagal memulihkan pembelian',
      );
    } finally {
      setActionLoading(null);
    }
  };

  const executeConfirmAction = async () => {
    const purchase = confirmModal.purchase;
    const action = confirmModal.action;

    if (!purchase || !action) return;

    if (action === 'restore') {
      await restorePurchase(purchase);
      return;
    }

    await runAction(purchase, action);
  };

  const openHistory = async () => {
    if (!isAdmin) return;

    setShowHistory(true);
    setHistoryPage(1);
    await fetchHistory();
  };

  const currentConfirmConfig =
    confirmModal.action
      ? confirmConfig[confirmModal.action]
      : null;

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
            Pembelian
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola pembelian bahan mentah dari supplier.
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
              onClick={openForm}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Tambah Pembelian
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Total Pembelian
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {purchases.length}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <ShoppingCart size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Draft
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {draftCount}
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <ClipboardCheck size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Menunggu Barang
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {orderedCount}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Truck size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                Nilai Pembelian
              </p>

              <p className="mt-2 truncate text-xl font-semibold text-slate-900">
                {rupiah(totalPurchaseValue)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CircleDollarSign size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari nomor atau supplier..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-400"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="DIPESAN">Dipesan</option>
            <option value="DITERIMA">Diterima</option>
            <option value="SELESAI">Selesai</option>
            <option value="DIBATALKAN">Dibatalkan</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  No. Pembelian
                </th>

                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Supplier
                </th>

                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Barang
                </th>

                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Total
                </th>

                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>

                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Dibuat
                </th>

                <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Memuat pembelian...
                    </div>
                  </td>
                </tr>
              ) : currentPurchases.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <ShoppingCart
                      size={32}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="text-sm font-medium text-slate-600">
                      Belum ada data pembelian
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Tambahkan pembelian bahan mentah dari
                      supplier.
                    </p>
                  </td>
                </tr>
              ) : (
                currentPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {purchase.purchaseNumber}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {purchase.user?.name ||
                          purchase.user?.username ||
                          '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {purchase.supplier?.name || '-'}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {purchase.supplier?.code || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {purchase.details.length} item
                      </p>

                      <p className="mt-0.5 max-w-[190px] truncate text-xs text-slate-400">
                        {purchase.details
                          .map(
                            (detail) =>
                              detail.product?.name,
                          )
                          .join(', ')}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                      {rupiah(purchase.total)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass[purchase.status]}`}
                      >
                        {statusLabel[purchase.status]}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(purchase.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          title="Lihat detail"
                          onClick={() =>
                            setSelectedPurchase(purchase)
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Eye size={16} />
                        </button>

                        {canManage && (
                          <>
                        {purchase.status === 'DRAFT' && (
                          <button
                            type="button"
                            title="Pesan ke supplier"
                            onClick={() =>
                              openConfirm(
                                purchase,
                                'order',
                              )
                            }
                            className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50"
                          >
                            <ShoppingCart size={16} />
                          </button>
                        )}

                        {purchase.status === 'DIPESAN' && (
                          <button
                            type="button"
                            title="Terima barang"
                            onClick={() =>
                              openConfirm(
                                purchase,
                                'receive',
                              )
                            }
                            className="rounded-lg border border-amber-200 p-2 text-amber-600 transition hover:bg-amber-50"
                          >
                            <PackageCheck size={16} />
                          </button>
                        )}

                        {purchase.status === 'DITERIMA' && (
                          <button
                            type="button"
                            title="Selesaikan"
                            onClick={() =>
                              openConfirm(
                                purchase,
                                'complete',
                              )
                            }
                            className="rounded-lg border border-emerald-200 p-2 text-emerald-600 transition hover:bg-emerald-50"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}

                        {(purchase.status === 'DRAFT' ||
                          purchase.status ===
                            'DIPESAN') && (
                          <button
                            type="button"
                            title="Batalkan"
                            onClick={() =>
                              openConfirm(
                                purchase,
                                'cancel',
                              )
                            }
                            className="rounded-lg border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
                          >
                            <XCircle size={16} />
                          </button>
                        )}

                        {isAdmin &&
                          purchase.status === 'DRAFT' && (
                          <button
                            type="button"
                            title="Pindahkan ke riwayat"
                            onClick={() =>
                              openConfirm(
                                purchase,
                                'archive',
                              )
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading &&
          filteredPurchases.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Menampilkan{' '}
                {(page - 1) * perPage + 1}–
                {Math.min(
                  page * perPage,
                  filteredPurchases.length,
                )}{' '}
                dari {filteredPurchases.length} pembelian
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
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <RefreshCcw size={19} />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Alur Pembelian
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Draft dibuat terlebih dahulu, kemudian pembelian
              dipesan ke supplier. Saat barang diterima, stok
              bahan mentah otomatis bertambah. Setelah proses
              selesai, pembelian dapat ditandai sebagai selesai.
            </p>
          </div>
        </div>
      </div>

      {showForm && canManage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Tambah Pembelian
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Buat pembelian bahan mentah dari supplier.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitPurchase}>
              <div className="space-y-6 p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Supplier
                    </label>

                    <select
                      value={supplierId}
                      onChange={(event) =>
                        setSupplierId(
                          event.target.value,
                        )
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    >
                      <option value="">
                        Pilih supplier
                      </option>

                      {suppliers.map((supplier) => (
                        <option
                          key={supplier.id}
                          value={supplier.id}
                        >
                          {supplier.code} -{' '}
                          {supplier.name}
                        </option>
                      ))}
                    </select>

                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {suppliers.length} supplier aktif
                      tersedia
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-600">
                      Catatan
                    </label>

                    <textarea
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
                      rows={3}
                      placeholder="Catatan pembelian jika diperlukan..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Detail Barang
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Hanya produk bahan mentah yang dapat
                        dibeli.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addDetail}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                    >
                      <Plus size={15} />
                      Tambah Barang
                    </button>
                  </div>

                  <div className="space-y-3">
                    {details.map((detail, index) => {
                      const selectedProduct =
                        products.find(
                          (product) =>
                            product.id ===
                            Number(
                              detail.productId,
                            ),
                        );

                      const subtotal =
                        (Number(detail.quantity) ||
                          0) *
                        (Number(detail.price) || 0);

                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                        >
                          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1.3fr_1.3fr_auto] md:items-end">
                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                                Bahan Mentah
                              </label>

                              <select
                                value={
                                  detail.productId
                                }
                                onChange={(event) =>
                                  updateDetail(
                                    index,
                                    'productId',
                                    event.target
                                      .value,
                                  )
                                }
                                required
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400"
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
                                      disabled={details.some(
                                        (
                                          other,
                                          otherIndex,
                                        ) =>
                                          otherIndex !==
                                            index &&
                                          other.productId ===
                                            String(
                                              product.id,
                                            ),
                                      )}
                                    >
                                      {product.code} -{' '}
                                      {product.name}
                                    </option>
                                  ),
                                )}
                              </select>

                              {selectedProduct && (
                                <p className="mt-1 text-[10px] text-slate-400">
                                  Stok:{' '}
                                  {Number(
                                    selectedProduct.stock,
                                  )}{' '}
                                  {
                                    selectedProduct.unit
                                  }
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                                Quantity
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                  detail.quantity
                                }
                                onChange={(event) =>
                                  updateDetail(
                                    index,
                                    'quantity',
                                    event.target
                                      .value,
                                  )
                                }
                                required
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                                Harga Satuan
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={detail.price}
                                onChange={(event) =>
                                  updateDetail(
                                    index,
                                    'price',
                                    event.target
                                      .value,
                                  )
                                }
                                required
                                placeholder="0"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-400"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                                Subtotal
                              </label>

                              <div className="flex h-[38px] items-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-700">
                                {rupiah(subtotal)}
                              </div>
                            </div>

                            <button
                              type="button"
                              title="Hapus barang"
                              disabled={
                                details.length === 1
                              }
                              onClick={() =>
                                removeDetail(index)
                              }
                              className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 sm:w-80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Jumlah Item
                      </span>

                      <span className="text-sm font-semibold text-slate-700">
                        {details.length}
                      </span>
                    </div>

                    <div className="my-3 border-t border-slate-200" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        Total
                      </span>

                      <span className="text-lg font-semibold text-blue-600">
                        {rupiah(formTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Simpan Pembelian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPurchase && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {
                      selectedPurchase.purchaseNumber
                    }
                  </h2>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass[selectedPurchase.status]}`}
                  >
                    {
                      statusLabel[
                        selectedPurchase.status
                      ]
                    }
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Detail transaksi pembelian
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPurchase(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-400">
                    Supplier
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-700">
                    {selectedPurchase.supplier
                      ?.name || '-'}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {selectedPurchase.supplier
                      ?.code || '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-400">
                    Dibuat Oleh
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-700">
                    {selectedPurchase.user?.name ||
                      selectedPurchase.user
                        ?.username ||
                      '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-400">
                    Tanggal
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-700">
                    {formatDate(
                      selectedPurchase.createdAt,
                    )}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Produk
                      </th>

                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Qty
                      </th>

                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Harga
                      </th>

                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Subtotal
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {selectedPurchase.details.map(
                      (detail) => (
                        <tr key={detail.id}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-700">
                              {detail.product
                                ?.name || '-'}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {detail.product
                                ?.code || '-'}
                            </p>
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {Number(
                              detail.quantity,
                            )}{' '}
                            {detail.product?.unit}
                          </td>

                          <td className="px-4 py-3 text-right text-sm text-slate-600">
                            {rupiah(detail.price)}
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                            {rupiah(
                              detail.subtotal,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>

                  <tfoot className="border-t border-slate-200 bg-slate-50">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-right text-sm font-semibold text-slate-600"
                      >
                        Total
                      </td>

                      <td className="px-4 py-3 text-right text-base font-semibold text-blue-600">
                        {rupiah(
                          selectedPurchase.total,
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  Catatan
                </p>

                <div className="min-h-16 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-600">
                  {selectedPurchase.notes ||
                    'Tidak ada catatan.'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              {canManage && (
                <>
              {selectedPurchase.status ===
                'DRAFT' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm(
                        selectedPurchase,
                        'cancel',
                      )
                    }
                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Batalkan
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openConfirm(
                        selectedPurchase,
                        'order',
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    <ShoppingCart size={16} />
                    Pesan ke Supplier
                  </button>
                </>
              )}

              {selectedPurchase.status ===
                'DIPESAN' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm(
                        selectedPurchase,
                        'cancel',
                      )
                    }
                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Batalkan
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openConfirm(
                        selectedPurchase,
                        'receive',
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"
                  >
                    <PackageCheck size={16} />
                    Terima Barang
                  </button>
                </>
              )}

              {selectedPurchase.status ===
                'DITERIMA' && (
                <button
                  type="button"
                  onClick={() =>
                    openConfirm(
                      selectedPurchase,
                      'complete',
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  <CheckCircle2 size={16} />
                  Selesaikan
                </button>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showHistory && isAdmin && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#f6f8fb]">
          <div className="mx-auto min-h-screen max-w-7xl p-5 sm:p-7 lg:p-9">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setShowHistory(false)
                  }
                  className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
                >
                  <ArrowLeft size={17} />
                  Kembali ke Pembelian
                </button>

                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Riwayat Pembelian
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Data pembelian yang telah dipindahkan ke
                  riwayat.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void fetchHistory()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <RefreshCcw size={16} />
                Muat Ulang
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        No. Pembelian
                      </th>

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Supplier
                      </th>

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Total
                      </th>

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Dihapus
                      </th>

                      <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {historyLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-16"
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
                          colSpan={6}
                          className="px-5 py-16 text-center"
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
                      currentHistory.map(
                        (purchase) => (
                          <tr
                            key={purchase.id}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                              {
                                purchase.purchaseNumber
                              }
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {purchase.supplier
                                ?.name || '-'}
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                              {rupiah(
                                purchase.total,
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass[purchase.status]}`}
                              >
                                {
                                  statusLabel[
                                    purchase.status
                                  ]
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4 text-xs text-slate-500">
                              {formatDate(
                                purchase.deletedAt,
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  openConfirm(
                                    purchase,
                                    'restore',
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                              >
                                <RotateCcw
                                  size={14}
                                />
                                Pulihkan
                              </button>
                            </td>
                          </tr>
                        ),
                      )
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

                      <span className="px-3 text-xs font-medium text-slate-600">
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

      {confirmModal.open &&
        confirmModal.purchase &&
        confirmModal.action &&
        currentConfirmConfig &&
        (((confirmModal.action === 'restore' ||
          confirmModal.action === 'archive') && isAdmin) ||
          (confirmModal.action !== 'restore' &&
            confirmModal.action !== 'archive' &&
            canManage)) && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
              <div className="p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${currentConfirmConfig.iconClass}`}
                  >
                    {confirmModal.action ===
                      'order' && (
                      <ShoppingCart size={23} />
                    )}

                    {confirmModal.action ===
                      'receive' && (
                      <PackageCheck size={23} />
                    )}

                    {confirmModal.action ===
                      'complete' && (
                      <CheckCircle2 size={23} />
                    )}

                    {confirmModal.action ===
                      'cancel' && (
                      <XCircle size={23} />
                    )}

                    {confirmModal.action ===
                      'archive' && (
                      <Archive size={23} />
                    )}

                    {confirmModal.action ===
                      'restore' && (
                      <RotateCcw size={23} />
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      actionLoading !== null
                    }
                    onClick={closeConfirm}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X size={19} />
                  </button>
                </div>

                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  {currentConfirmConfig.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {currentConfirmConfig.description(
                    confirmModal.purchase,
                  )}
                </p>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Nomor Pembelian
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {
                          confirmModal.purchase
                            .purchaseNumber
                        }
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass[confirmModal.purchase.status]}`}
                    >
                      {
                        statusLabel[
                          confirmModal.purchase
                            .status
                        ]
                      }
                    </span>
                  </div>
                </div>

                {confirmModal.action ===
                  'receive' && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs leading-5 text-amber-700">
                      Stok bahan mentah akan bertambah
                      otomatis setelah barang dikonfirmasi
                      diterima.
                    </p>
                  </div>
                )}

                {(confirmModal.action ===
                  'cancel' ||
                  confirmModal.action ===
                    'archive') && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-xs leading-5 text-red-600">
                      Pastikan tindakan ini memang ingin
                      dilakukan sebelum melanjutkan.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={closeConfirm}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() =>
                    void executeConfirmAction()
                  }
                  className={`inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${currentConfirmConfig.buttonClass}`}
                >
                  {actionLoading !== null && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {currentConfirmConfig.button}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default PurchasePage;
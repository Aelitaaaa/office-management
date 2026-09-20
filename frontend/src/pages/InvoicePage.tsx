import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  ChevronLeft,
  Eye,
  FileText,
  History,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

type Customer = {
  id: number;
  code?: string;
  name: string;
  address?: string | null;
  phone?: string | null;
};

type Product = {
  id: number;
  code?: string;
  name: string;
  unit?: string;
};

type OrderDetail = {
  id: number;
  productId: number;
  quantity: string | number;
  price: string | number;
  subtotal: string | number;
  product: Product;
};

type SuratJalan = {
  id: number;
  nomorSuratJalan?: string;
};

type Order = {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: string;
  total: string | number;
  customerId: number;
  customer: Customer;
  details: OrderDetail[];
  suratJalan?: SuratJalan | null;
  invoice?: {
    id: number;
  } | null;
};

type InvoiceDetail = {
  id: number;
  productId: number;
  quantity: string | number;
  price: string | number;
  subtotal: string | number;
  product: Product;
};

type Payment = {
  id: number;
  jumlah: string | number;
  status: string;
};

type Invoice = {
  id: number;
  nomorInvoice: string;
  orderId: number;
  userId?: number | null;
  jatuhTempo?: string | null;
  subtotal: string | number;

  // diskon = nominal Rupiah
  diskon: string | number;

  // pajak = persentase, contoh 11 berarti 11%
  pajak: string | number;

  total: string | number;
  statusBayar: string;
  keterangan?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  order: Order;
  details: InvoiceDetail[];
  payments: Payment[];
  user?: {
    id: number;
    name: string;
    username: string;
  } | null;
};

type FormData = {
  orderId: string;
  jatuhTempo: string;
  diskon: string;
  pajak: string;
  keterangan: string;
};

type AlertState = {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

type ConfirmState = {
  show: boolean;
  type: 'archive' | 'restore' | null;
  invoice: Invoice | null;
};

const initialForm: FormData = {
  orderId: '',
  jatuhTempo: '',
  diskon: '0',
  pajak: '0',
  keterangan: '',
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

function InvoicePage() {
  const token = sessionStorage.getItem('access_token') || '';
  const role = getRoleFromToken(token);
  const canManage = role === 'ADMIN' || role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [history, setHistory] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [editingInvoice, setEditingInvoice] =
    useState<Invoice | null>(null);

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(null);

  const [form, setForm] =
    useState<FormData>(initialForm);

  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    type: null,
    invoice: null,
  });


  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const showAlert = (
    type: 'success' | 'error',
    title: string,
    message: string,
  ) => {
    setAlert({
      show: true,
      type,
      title,
      message,
    });

    window.setTimeout(() => {
      setAlert((prev) => ({
        ...prev,
        show: false,
      }));
    }, 3500);
  };

  const getErrorMessage = async (
    response: Response,
    fallback: string,
  ) => {
    try {
      const data = await response.json();

      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }

      return data.message || fallback;
    } catch {
      return fallback;
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(
        `${API_URL}/invoices`,
        {
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil data invoice',
          ),
        );
      }

      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      showAlert(
        'error',
        'Gagal Memuat Data',
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data invoice',
      );
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `${API_URL}/invoices/history`,
        {
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil riwayat invoice',
          ),
        );
      }

      const data = await response.json();
      setHistory(data);
    } catch (error) {
      showAlert(
        'error',
        'Gagal Memuat Riwayat',
        error instanceof Error
          ? error.message
          : 'Gagal mengambil riwayat invoice',
      );
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${API_URL}/orders`,
        {
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil data pesanan',
          ),
        );
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      showAlert(
        'error',
        'Gagal Memuat Pesanan',
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data pesanan',
      );
    }
  };

  const loadData = async () => {
    setLoading(true);

    await Promise.all([
      fetchInvoices(),
      fetchOrders(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const availableOrders = useMemo(() => {
    const invoiceOrderIds = new Set(
      invoices.map(
        (invoice) => invoice.orderId,
      ),
    );

    return orders.filter((order) => {
      if (order.status === 'DIBATALKAN') {
        return false;
      }

      if (
        !order.details ||
        order.details.length === 0
      ) {
        return false;
      }

      if (
        editingInvoice &&
        order.id === editingInvoice.orderId
      ) {
        return true;
      }

      return !invoiceOrderIds.has(order.id);
    });
  }, [
    orders,
    invoices,
    editingInvoice,
  ]);

  const selectedOrder = useMemo(() => {
    if (!form.orderId) {
      return null;
    }

    return (
      orders.find(
        (order) =>
          order.id === Number(form.orderId),
      ) || null
    );
  }, [
    form.orderId,
    orders,
  ]);

  const calculatedSubtotal = useMemo(() => {
    if (!selectedOrder) {
      return 0;
    }

    return selectedOrder.details.reduce(
      (total, detail) =>
        total +
        Number(detail.quantity) *
          Number(detail.price),
      0,
    );
  }, [selectedOrder]);

  /*
   * PAJAK
   *
   * Contoh:
   * subtotal = 1.000.000
   * diskon   = 100.000
   * pajak    = 11
   *
   * dasar pajak:
   * 1.000.000 - 100.000 = 900.000
   *
   * pajak:
   * 900.000 × 11% = 99.000
   */

  const calculatedTax = useMemo(() => {
    const discount =
      Number(form.diskon || 0);

    const taxPercent =
      Number(form.pajak || 0);

    const taxableAmount = Math.max(
      calculatedSubtotal - discount,
      0,
    );

    return (
      taxableAmount *
      (taxPercent / 100)
    );
  }, [
    calculatedSubtotal,
    form.diskon,
    form.pajak,
  ]);

  const calculatedTotal = useMemo(() => {
    const discount =
      Number(form.diskon || 0);

    return Math.max(
      calculatedSubtotal -
        discount +
        calculatedTax,
      0,
    );
  }, [
    calculatedSubtotal,
    form.diskon,
    calculatedTax,
  ]);

  const displayedInvoices = useMemo(() => {
    const source = showHistory
      ? history
      : invoices;

    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return source;
    }

    return source.filter((invoice) => {
      const customerName =
        invoice.order?.customer?.name || '';

      const orderNumber =
        invoice.order?.orderNumber || '';

      return (
        invoice.nomorInvoice
          .toLowerCase()
          .includes(keyword) ||
        customerName
          .toLowerCase()
          .includes(keyword) ||
        orderNumber
          .toLowerCase()
          .includes(keyword) ||
        invoice.statusBayar
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [
    invoices,
    history,
    search,
    showHistory,
  ]);

  const formatCurrency = (
    value: string | number,
  ) => {
    return new Intl.NumberFormat(
      'id-ID',
      {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      },
    ).format(Number(value || 0));
  };

  const formatDate = (
    value?: string | null,
  ) => {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(new Date(value));
  };

  const formatDateTime = (
    value?: string | null,
  ) => {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(new Date(value));
  };

  const getInvoiceTaxAmount = (
    invoice: Invoice,
  ) => {
    const subtotal =
      Number(invoice.subtotal || 0);

    const discount =
      Number(invoice.diskon || 0);

    const taxPercent =
      Number(invoice.pajak || 0);

    const taxableAmount = Math.max(
      subtotal - discount,
      0,
    );

    return (
      taxableAmount *
      (taxPercent / 100)
    );
  };

  const openCreate = () => {
    if (!canManage) return;

    setEditingInvoice(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEdit = (
    invoice: Invoice,
  ) => {
    if (!canManage) return;

    setEditingInvoice(invoice);

    setForm({
      orderId: String(
        invoice.orderId,
      ),

      jatuhTempo:
        invoice.jatuhTempo
          ? invoice.jatuhTempo.slice(
              0,
              10,
            )
          : '',

      diskon: String(
        Number(invoice.diskon),
      ),

      pajak: String(
        Number(invoice.pajak),
      ),

      keterangan:
        invoice.keterangan || '',
    });

    setShowForm(true);
  };

  const openDetail = (
    invoice: Invoice,
  ) => {
    setSelectedInvoice(invoice);
    setShowDetail(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingInvoice(null);
    setForm(initialForm);
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!canManage) {
      showAlert('error', 'Akses Ditolak', 'Role Anda tidak memiliki akses untuk menyimpan invoice.');
      return;
    }

    if (
      !editingInvoice &&
      !form.orderId
    ) {
      showAlert(
        'error',
        'Data Belum Lengkap',
        'Silakan pilih pesanan terlebih dahulu',
      );

      return;
    }

    const discount =
      Number(form.diskon || 0);

    const tax =
      Number(form.pajak || 0);

    if (
      Number.isNaN(discount) ||
      discount < 0
    ) {
      showAlert(
        'error',
        'Diskon Tidak Valid',
        'Diskon tidak boleh bernilai negatif',
      );

      return;
    }

    if (
      Number.isNaN(tax) ||
      tax < 0 ||
      tax > 100
    ) {
      showAlert(
        'error',
        'Pajak Tidak Valid',
        'Pajak harus berada antara 0% sampai 100%',
      );

      return;
    }

    if (
      !editingInvoice &&
      discount > calculatedSubtotal
    ) {
      showAlert(
        'error',
        'Diskon Tidak Valid',
        'Diskon tidak boleh lebih besar dari subtotal',
      );

      return;
    }

    setSaving(true);

    try {
      const url = editingInvoice
        ? `${API_URL}/invoices/${editingInvoice.id}`
        : `${API_URL}/invoices`;

      const body = editingInvoice
        ? {
            jatuhTempo:
              form.jatuhTempo ||
              undefined,

            diskon: discount,

            // dikirim sebagai persen
            pajak: tax,

            keterangan:
              form.keterangan.trim() ||
              undefined,
          }
        : {
            orderId:
              Number(form.orderId),

            jatuhTempo:
              form.jatuhTempo ||
              undefined,

            diskon: discount,

            // dikirim sebagai persen
            pajak: tax,

            keterangan:
              form.keterangan.trim() ||
              undefined,
          };

      const response =
        await fetch(url, {
          method: editingInvoice
            ? 'PATCH'
            : 'POST',

          headers,

          body:
            JSON.stringify(body),
        });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            editingInvoice
              ? 'Gagal mengubah invoice'
              : 'Gagal membuat invoice',
          ),
        );
      }

      closeForm();

      await Promise.all([
        fetchInvoices(),
        fetchOrders(),
      ]);

      showAlert(
        'success',
        editingInvoice
          ? 'Invoice Diperbarui'
          : 'Invoice Berhasil Dibuat',

        editingInvoice
          ? 'Data invoice berhasil diperbarui.'
          : 'Invoice baru berhasil dibuat dari pesanan.',
      );
    } catch (error) {
      showAlert(
        'error',
        'Proses Gagal',
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (
    invoice: Invoice,
  ) => {
    if (!isAdmin) return;

    try {
      const response =
        await fetch(
          `${API_URL}/invoices/${invoice.id}`,
          {
            method: 'DELETE',
            headers,
          },
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengarsipkan invoice',
          ),
        );
      }

      await Promise.all([
        fetchInvoices(),
        fetchHistory(),
        fetchOrders(),
      ]);

      setConfirm({ show: false, type: null, invoice: null });

      showAlert(
        'success',
        'Invoice Diarsipkan',
        `${invoice.nomorInvoice} berhasil dipindahkan ke riwayat.`,
      );
    } catch (error) {
      showAlert(
        'error',
        'Gagal Mengarsipkan',
        error instanceof Error
          ? error.message
          : 'Gagal mengarsipkan invoice',
      );
    }
  };

  const handleRestore = async (
    invoice: Invoice,
  ) => {
    if (!isAdmin) return;

    try {
      const response =
        await fetch(
          `${API_URL}/invoices/${invoice.id}/restore`,
          {
            method: 'PATCH',
            headers,
          },
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal memulihkan invoice',
          ),
        );
      }

      await Promise.all([
        fetchInvoices(),
        fetchHistory(),
        fetchOrders(),
      ]);

      setConfirm({ show: false, type: null, invoice: null });

      showAlert(
        'success',
        'Invoice Dipulihkan',
        `${invoice.nomorInvoice} berhasil dipulihkan.`,
      );
    } catch (error) {
      showAlert(
        'error',
        'Gagal Memulihkan',
        error instanceof Error
          ? error.message
          : 'Gagal memulihkan invoice',
      );
    }
  };

  const toggleHistory = async () => {
    if (!isAdmin) return;

    if (!showHistory) {
      await fetchHistory();
    }

    setSearch('');
    setShowHistory(
      (prev) => !prev,
    );
  };

  const getStatusStyle = (
    status: string,
  ) => {
    if (status === 'LUNAS') {
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    }

    if (status === 'SEBAGIAN') {
      return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    }

    return 'bg-red-50 text-red-700 ring-red-600/20';
  };

  return (
    <div className="space-y-6">
      {alert.show && (
        <div className="fixed right-5 top-5 z-[100] w-[calc(100%-2.5rem)] max-w-sm">
          <div
            className={`rounded-2xl border bg-white p-4 shadow-2xl ${
              alert.type === 'success'
                ? 'border-emerald-200'
                : 'border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  alert.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {alert.type ===
                'success' ? (
                  <ReceiptText
                    size={20}
                  />
                ) : (
                  <X size={20} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {alert.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {alert.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAlert(
                    (prev) => ({
                      ...prev,
                      show: false,
                    }),
                  )
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Transaksi</span>
            <span>/</span>

            <span className="text-slate-600">
              Invoice
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {showHistory
              ? 'Riwayat Invoice'
              : 'Invoice'}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {showHistory
              ? 'Invoice yang telah dipindahkan ke riwayat.'
              : 'Kelola tagihan pelanggan berdasarkan pesanan.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAdmin && (
          <button
            type="button"
            onClick={
              toggleHistory
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {showHistory ? (
              <>
                <ChevronLeft
                  size={17}
                />
                Kembali
              </>
            ) : (
              <>
                <History
                  size={17}
                />
                Lihat Riwayat
              </>
            )}
          </button>
          )}

          {!showHistory && canManage && (
            <button
              type="button"
              onClick={
                openCreate
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Buat Invoice
            </button>
          )}
        </div>
      </div>

      {/* STATISTIK */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">
            Total Invoice
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {invoices.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">
            Belum Dibayar
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {
              invoices.filter(
                (item) =>
                  item.statusBayar ===
                  'BELUM_DIBAYAR',
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">
            Sebagian
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-600">
            {
              invoices.filter(
                (item) =>
                  item.statusBayar ===
                  'SEBAGIAN',
              ).length
            }
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-400">
            Lunas
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {
              invoices.filter(
                (item) =>
                  item.statusBayar ===
                  'LUNAS',
              ).length
            }
          </p>
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Cari invoice, customer, pesanan..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                showHistory
              ) {
                void fetchHistory();
              } else {
                void loadData();
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw
              size={16}
            />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Invoice
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Pesanan
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Jatuh Tempo
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Total
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading &&
              !showHistory ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-sm text-slate-400"
                  >
                    Memuat data
                    invoice...
                  </td>
                </tr>
              ) : displayedInvoices.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center"
                  >
                    <FileText
                      size={38}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-500">
                      {showHistory
                        ? 'Belum ada riwayat invoice'
                        : 'Belum ada invoice'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedInvoices.map(
                  (invoice) => (
                    <tr
                      key={
                        invoice.id
                      }
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {
                            invoice.nomorInvoice
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            invoice.createdAt,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {invoice
                            .order
                            ?.customer
                            ?.name ||
                            '-'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {invoice
                            .order
                            ?.orderNumber ||
                            '-'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          invoice.jatuhTempo,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {formatCurrency(
                          invoice.total,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getStatusStyle(
                            invoice.statusBayar,
                          )}`}
                        >
                          {invoice.statusBayar.replace(
                            /_/g,
                            ' ',
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openDetail(
                                invoice,
                              )
                            }
                            title="Detail"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye
                              size={
                                17
                              }
                            />
                          </button>

                          {showHistory ? (
                            isAdmin ? (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  show: true,
                                  type: 'restore',
                                  invoice,
                                })
                              }
                              title="Pulihkan"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <RotateCcw
                                size={
                                  17
                                }
                              />
                            </button>
                            ) : null
                          ) : (
                            <>
                              {canManage && (
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    invoice,
                                  )
                                }
                                disabled={
                                  invoice.statusBayar ===
                                  'LUNAS'
                                }
                                title={
                                  invoice.statusBayar ===
                                  'LUNAS'
                                    ? 'Invoice lunas tidak dapat diedit'
                                    : 'Edit'
                                }
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Pencil
                                  size={
                                    17
                                  }
                                />
                              </button>
                              )}

                              {isAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirm({
                                    show: true,
                                    type: 'archive',
                                    invoice,
                                  })
                                }
                                disabled={
                                  invoice
                                    .payments
                                    ?.length >
                                    0 ||
                                  invoice.statusBayar !==
                                    'BELUM_DIBAYAR'
                                }
                                title="Arsipkan"
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Archive
                                  size={
                                    17
                                  }
                                />
                              </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM */}

      {showForm && canManage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingInvoice
                    ? 'Edit Invoice'
                    : 'Buat Invoice'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {editingInvoice
                    ? editingInvoice.nomorInvoice
                    : 'Buat invoice berdasarkan pesanan pelanggan'}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-6"
            >
              {!editingInvoice && (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Pesanan
                  </label>

                  <select
                    value={
                      form.orderId
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          orderId:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">
                      Pilih
                      pesanan
                    </option>

                    {availableOrders.map(
                      (order) => (
                        <option
                          key={
                            order.id
                          }
                          value={
                            order.id
                          }
                        >
                          {
                            order.orderNumber
                          }{' '}
                          -{' '}
                          {
                            order
                              .customer
                              ?.name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>
              )}

              {selectedOrder && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Customer
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {
                          selectedOrder
                            .customer
                            ?.name
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Nomor
                        Pesanan
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {
                          selectedOrder.orderNumber
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-white">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500">
                            Produk
                          </th>

                          <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-slate-500">
                            Qty
                          </th>

                          <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-slate-500">
                            Harga
                          </th>

                          <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-slate-500">
                            Subtotal
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.details.map(
                          (
                            detail,
                          ) => (
                            <tr
                              key={
                                detail.id
                              }
                            >
                              <td className="px-3 py-2.5 text-xs font-medium text-slate-700">
                                {detail
                                  .product
                                  ?.name ||
                                  '-'}
                              </td>

                              <td className="px-3 py-2.5 text-right text-xs text-slate-600">
                                {Number(
                                  detail.quantity,
                                )}
                              </td>

                              <td className="px-3 py-2.5 text-right text-xs text-slate-600">
                                {formatCurrency(
                                  detail.price,
                                )}
                              </td>

                              <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-700">
                                {formatCurrency(
                                  Number(
                                    detail.quantity,
                                  ) *
                                    Number(
                                      detail.price,
                                    ),
                                )}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                {/* JATUH TEMPO */}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Jatuh Tempo
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      value={
                        form.jatuhTempo
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            prev,
                          ) => ({
                            ...prev,
                            jatuhTempo:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>

                {/* DISKON */}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Diskon
                    (Rp)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.diskon
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          diskon:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {/* PAJAK */}

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Pajak (%)
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        form.pajak
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (
                            prev,
                          ) => ({
                            ...prev,
                            pajak:
                              event
                                .target
                                .value,
                          }),
                        )
                      }
                      placeholder="Contoh: 11"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-3 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* PREVIEW TOTAL */}

              {selectedOrder && (
                <div className="rounded-2xl bg-slate-900 p-5 text-white">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        Subtotal
                      </span>

                      <span>
                        {formatCurrency(
                          calculatedSubtotal,
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        Diskon
                      </span>

                      <span>
                        -{' '}
                        {formatCurrency(
                          Number(
                            form.diskon ||
                              0,
                          ),
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        Pajak (
                        {Number(
                          form.pajak ||
                            0,
                        )}
                        %)
                      </span>

                      <span>
                        +{' '}
                        {formatCurrency(
                          calculatedTax,
                        )}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
                      <span className="font-semibold">
                        Total
                      </span>

                      <span className="text-lg font-bold">
                        {formatCurrency(
                          calculatedTotal,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Keterangan
                </label>

                <textarea
                  rows={4}
                  value={
                    form.keterangan
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (prev) => ({
                        ...prev,
                        keterangan:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  placeholder="Tambahkan keterangan invoice..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Menyimpan...'
                    : editingInvoice
                      ? 'Simpan Perubahan'
                      : 'Buat Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirm.show && confirm.invoice && confirm.type && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              confirm.type === 'archive'
                ? 'bg-red-50 text-red-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              {confirm.type === 'archive' ? <Archive size={22} /> : <RotateCcw size={22} />}
            </div>

            <h3 className="mt-4 text-center text-lg font-bold text-slate-900">
              {confirm.type === 'archive' ? 'Arsipkan Invoice?' : 'Pulihkan Invoice?'}
            </h3>

            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              {confirm.type === 'archive'
                ? `Invoice ${confirm.invoice.nomorInvoice} akan dipindahkan ke riwayat.`
                : `Invoice ${confirm.invoice.nomorInvoice} akan dikembalikan ke daftar aktif.`}
            </p>

            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirm({ show: false, type: null, invoice: null })}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm.type === 'archive') {
                    void handleArchive(confirm.invoice!);
                  } else {
                    void handleRestore(confirm.invoice!);
                  }
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
                  confirm.type === 'archive'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirm.type === 'archive' ? 'Ya, Arsipkan' : 'Ya, Pulihkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL INVOICE */}

      {showDetail &&
        selectedInvoice && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                <div>
                  <p className="text-xs font-medium text-blue-600">
                    DETAIL
                    INVOICE
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {
                      selectedInvoice.nomorInvoice
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetail(
                      false,
                    )
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X
                    size={19}
                  />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-medium uppercase text-slate-400">
                      Customer
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-700">
                      {selectedInvoice
                        .order
                        ?.customer
                        ?.name ||
                        '-'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-medium uppercase text-slate-400">
                      Pesanan
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-700">
                      {selectedInvoice
                        .order
                        ?.orderNumber ||
                        '-'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-medium uppercase text-slate-400">
                      Dibuat
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-700">
                      {formatDate(
                        selectedInvoice.createdAt,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-medium uppercase text-slate-400">
                      Jatuh
                      Tempo
                    </p>

                    <p className="mt-1.5 text-sm font-semibold text-slate-700">
                      {formatDate(
                        selectedInvoice.jatuhTempo,
                      )}
                    </p>
                  </div>
                </div>

                {/* DETAIL PRODUK */}

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                          Produk
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                          Qty
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                          Harga
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                          Subtotal
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.details.map(
                        (
                          detail,
                        ) => (
                          <tr
                            key={
                              detail.id
                            }
                          >
                            <td className="px-4 py-3 text-sm font-medium text-slate-700">
                              {detail
                                .product
                                ?.name ||
                                '-'}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-slate-600">
                              {Number(
                                detail.quantity,
                              )}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-slate-600">
                              {formatCurrency(
                                detail.price,
                              )}
                            </td>

                            <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
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

                {/* TOTAL DETAIL */}

                <div className="flex justify-end">
                  <div className="w-full max-w-sm rounded-2xl bg-slate-50 p-5">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          Subtotal
                        </span>

                        <span className="font-medium text-slate-700">
                          {formatCurrency(
                            selectedInvoice.subtotal,
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          Diskon
                        </span>

                        <span className="font-medium text-red-600">
                          -{' '}
                          {formatCurrency(
                            selectedInvoice.diskon,
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">
                          Pajak (
                          {Number(
                            selectedInvoice.pajak ||
                              0,
                          )}
                          %)
                        </span>

                        <span className="font-medium text-slate-700">
                          +{' '}
                          {formatCurrency(
                            getInvoiceTaxAmount(
                              selectedInvoice,
                            ),
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between border-t border-slate-200 pt-3">
                        <span className="font-semibold text-slate-800">
                          Total
                        </span>

                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(
                            selectedInvoice.total,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATUS */}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Status
                      Pembayaran
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
                        selectedInvoice.statusBayar,
                      )}`}
                    >
                      {selectedInvoice.statusBayar.replace(
                        /_/g,
                        ' ',
                      )}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Dibuat Oleh
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {selectedInvoice
                        .user
                        ?.name ||
                        selectedInvoice
                          .user
                          ?.username ||
                        '-'}
                    </p>
                  </div>
                </div>

                {selectedInvoice.keterangan && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500">
                      Keterangan
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {
                        selectedInvoice.keterangan
                      }
                    </p>
                  </div>
                )}

                {showHistory &&
                  selectedInvoice.deletedAt && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                      <p className="text-xs font-semibold text-red-700">
                        Diarsipkan
                      </p>

                      <p className="mt-1 text-sm text-red-600">
                        {formatDateTime(
                          selectedInvoice.deletedAt,
                        )}
                      </p>
                    </div>
                  )}

                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      setShowDetail(
                        false,
                      )
                    }
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default InvoicePage;
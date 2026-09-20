import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  X,
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

type Customer = {
  id: number;
  code?: string;
  name: string;
};

type Order = {
  id: number;
  orderNumber: string;
  customer: Customer;
};

type PaymentItem = {
  id: number;
  jumlah: string | number;
  metode: string;
  status: string;
  tanggalBayar?: string | null;
  keterangan?: string | null;
};

type Invoice = {
  id: number;
  nomorInvoice: string;
  total: string | number;
  statusBayar: string;
  jatuhTempo?: string | null;
  order: Order;
  payments?: PaymentItem[];
};

type Payment = {
  id: number;
  invoiceId: number;
  userId?: number | null;
  jumlah: string | number;
  metode: string;
  status: string;
  tanggalBayar?: string | null;
  keterangan?: string | null;
  invoice: Invoice;
  user?: {
    id: number;
    name: string;
    username: string;
  } | null;
};

type FormData = {
  invoiceId: string;
  jumlah: string;
  metode: string;
  keterangan: string;
};

type AlertState = {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

const initialForm: FormData = {
  invoiceId: '',
  jumlah: '',
  metode: 'BANK_TRANSFER',
  keterangan: '',
};

function PaymentPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null);

  const [form, setForm] =
    useState<FormData>(initialForm);

  const [alert, setAlert] =
    useState<AlertState>({
      show: false,
      type: 'success',
      title: '',
      message: '',
    });

  const token =
    sessionStorage.getItem('access_token');

  // Hak akses frontend:
  // ADMIN dan STAFF dapat mencatat pembayaran.
  // MANAGER dan FINANCE hanya dapat melihat data pembayaran.
  const currentRole = (() => {
    const directRole = sessionStorage.getItem('role');
    if (directRole) return directRole.toUpperCase();

    const userRaw = sessionStorage.getItem('user');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw) as { role?: string };
        if (user.role) return user.role.toUpperCase();
      } catch {
        // Abaikan data session user yang tidak valid.
      }
    }

    return '';
  })();

  const canCreatePayment =
    currentRole === 'ADMIN' || currentRole === 'STAFF';

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

  const fetchPayments = async () => {
    try {
      const response = await fetch(
        `${API_URL}/payments`,
        {
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil data pembayaran',
          ),
        );
      }

      const data = await response.json();
      setPayments(data);
    } catch (error) {
      showAlert(
        'error',
        'Gagal Memuat Data',
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data pembayaran',
      );
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
        'Gagal Memuat Invoice',
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data invoice',
      );
    }
  };

  const loadData = async () => {
    setLoading(true);

    await Promise.all([
      fetchPayments(),
      fetchInvoices(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const formatCurrency = (
    value: string | number,
  ) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatDateTime = (
    value?: string | null,
  ) => {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const formatMethod = (method: string) => {
    if (method === 'BANK_TRANSFER') {
      return 'Transfer Bank';
    }

    if (method === 'CASH') {
      return 'Tunai';
    }

    if (method === 'OTHER') {
      return 'Lainnya';
    }

    if (method === 'VIRTUAL_ACCOUNT') {
      return 'Virtual Account';
    }

    if (method === 'QRIS') {
      return 'QRIS';
    }

    if (method === 'EWALLET') {
      return 'E-Wallet';
    }

    return method.replace(/_/g, ' ');
  };

  const getPaidTotal = (invoiceId: number) => {
    return payments
      .filter(
        (payment) =>
          payment.invoiceId === invoiceId &&
          payment.status === 'PAID',
      )
      .reduce(
        (total, payment) =>
          total + Number(payment.jumlah),
        0,
      );
  };

  const selectedInvoice = useMemo(() => {
    if (!form.invoiceId) {
      return null;
    }

    return (
      invoices.find(
        (invoice) =>
          invoice.id === Number(form.invoiceId),
      ) || null
    );
  }, [form.invoiceId, invoices]);

  const totalPaid = useMemo(() => {
    if (!selectedInvoice) {
      return 0;
    }

    return getPaidTotal(selectedInvoice.id);
  }, [selectedInvoice, payments]);

  const remainingAmount = useMemo(() => {
    if (!selectedInvoice) {
      return 0;
    }

    return Math.max(
      Number(selectedInvoice.total) - totalPaid,
      0,
    );
  }, [selectedInvoice, totalPaid]);

  const availableInvoices = useMemo(() => {
    return invoices.filter(
      (invoice) =>
        invoice.statusBayar !== 'LUNAS',
    );
  }, [invoices]);

  const filteredPayments = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return payments;
    }

    return payments.filter((payment) => {
      const invoiceNumber =
        payment.invoice?.nomorInvoice || '';

      const customerName =
        payment.invoice?.order?.customer?.name ||
        '';

      const method =
        formatMethod(payment.metode);

      return (
        invoiceNumber
          .toLowerCase()
          .includes(keyword) ||
        customerName
          .toLowerCase()
          .includes(keyword) ||
        method
          .toLowerCase()
          .includes(keyword) ||
        payment.status
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [payments, search]);

  const totalPayment = useMemo(() => {
    return payments
      .filter(
        (payment) =>
          payment.status === 'PAID',
      )
      .reduce(
        (total, payment) =>
          total + Number(payment.jumlah),
        0,
      );
  }, [payments]);

  const openCreate = () => {
    if (!canCreatePayment) {
      showAlert(
        'error',
        'Akses Ditolak',
        'Role Anda hanya memiliki akses untuk melihat pembayaran.',
      );
      return;
    }

    setForm(initialForm);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setForm(initialForm);
  };

  const openDetail = (
    payment: Payment,
  ) => {
    setSelectedPayment(payment);
    setShowDetail(true);
  };

  const handlePayFull = () => {
    if (!selectedInvoice) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      jumlah: String(remainingAmount),
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!canCreatePayment) {
      showAlert(
        'error',
        'Akses Ditolak',
        'Anda tidak memiliki izin untuk mencatat pembayaran.',
      );
      return;
    }

    if (!form.invoiceId) {
      showAlert(
        'error',
        'Invoice Belum Dipilih',
        'Silakan pilih invoice terlebih dahulu.',
      );
      return;
    }

    const amount = Number(form.jumlah);

    if (!amount || amount <= 0) {
      showAlert(
        'error',
        'Nominal Tidak Valid',
        'Jumlah pembayaran harus lebih dari 0.',
      );
      return;
    }

    if (amount > remainingAmount) {
      showAlert(
        'error',
        'Pembayaran Melebihi Tagihan',
        `Sisa tagihan hanya ${formatCurrency(
          remainingAmount,
        )}.`,
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/payments/manual`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            invoiceId: Number(
              form.invoiceId,
            ),
            jumlah: amount,
            metode: form.metode,
            keterangan:
              form.keterangan.trim() ||
              undefined,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mencatat pembayaran',
          ),
        );
      }

      setShowForm(false);
      setForm(initialForm);

      await loadData();

      showAlert(
        'success',
        'Pembayaran Berhasil',
        'Pembayaran berhasil dicatat dan status invoice telah diperbarui.',
      );
    } catch (error) {
      showAlert(
        'error',
        'Pembayaran Gagal',
        error instanceof Error
          ? error.message
          : 'Gagal mencatat pembayaran',
      );
    } finally {
      setSaving(false);
    }
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
                {alert.type === 'success' ? (
                  <CheckCircle2 size={20} />
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
                  setAlert((prev) => ({
                    ...prev,
                    show: false,
                  }))
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Transaksi</span>
            <span>/</span>
            <span className="text-slate-600">
              Pembayaran
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Pembayaran
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Catat dan pantau pembayaran invoice
            pelanggan.
          </p>
        </div>

        {canCreatePayment && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Catat Pembayaran
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Total Transaksi
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {payments.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Total Pembayaran
              </p>

              <p className="mt-2 text-xl font-bold text-emerald-600">
                {formatCurrency(totalPayment)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Banknote size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Invoice Belum Lunas
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-600">
                {availableInvoices.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText size={21} />
            </div>
          </div>
        </div>
      </div>

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
                setSearch(event.target.value)
              }
              placeholder="Cari invoice, customer, metode..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Invoice
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Tanggal
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Metode
                </th>

                <th className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  Jumlah
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
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-sm text-slate-400"
                  >
                    Memuat data pembayaran...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center"
                  >
                    <Wallet
                      size={38}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-500">
                      Belum ada pembayaran
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(
                  (payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {payment.invoice
                            ?.nomorInvoice || '-'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {payment.invoice?.order
                          ?.customer?.name || '-'}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDateTime(
                          payment.tanggalBayar,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {formatMethod(
                            payment.metode,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-emerald-700">
                        {formatCurrency(
                          payment.jumlah,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          {payment.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              openDetail(payment)
                            }
                            title="Detail"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={17} />
                          </button>
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

      {showForm && canCreatePayment && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Catat Pembayaran
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Pembayaran manual untuk invoice
                  pelanggan
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Invoice
                </label>

                <select
                  value={form.invoiceId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      invoiceId:
                        event.target.value,
                      jumlah: '',
                    }))
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="">
                    Pilih invoice
                  </option>

                  {availableInvoices.map(
                    (invoice) => (
                      <option
                        key={invoice.id}
                        value={invoice.id}
                      >
                        {invoice.nomorInvoice} -{' '}
                        {invoice.order?.customer
                          ?.name || '-'}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {selectedInvoice && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Customer
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {selectedInvoice.order
                          ?.customer?.name || '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Invoice
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {
                          selectedInvoice.nomorInvoice
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] font-medium uppercase text-slate-400">
                        Total Invoice
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatCurrency(
                          selectedInvoice.total,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] font-medium uppercase text-slate-400">
                        Sudah Dibayar
                      </p>

                      <p className="mt-1 text-sm font-bold text-emerald-600">
                        {formatCurrency(
                          totalPaid,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-[10px] font-medium uppercase text-slate-400">
                        Sisa Tagihan
                      </p>

                      <p className="mt-1 text-sm font-bold text-red-600">
                        {formatCurrency(
                          remainingAmount,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">
                    Jumlah Pembayaran
                  </label>

                  {selectedInvoice && (
                    <button
                      type="button"
                      onClick={handlePayFull}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Bayar penuh
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    Rp
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.jumlah}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        jumlah:
                          event.target.value,
                      }))
                    }
                    required
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Metode Pembayaran
                </label>

                <select
                  value={form.metode}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      metode:
                        event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="BANK_TRANSFER">
                    Transfer Bank
                  </option>

                  <option value="CASH">
                    Tunai
                  </option>

                  <option value="OTHER">
                    Lainnya
                  </option>
                </select>

                <p className="mt-2 text-[11px] leading-5 text-slate-400">
                  QRIS, Virtual Account, dan
                  E-Wallet diproses melalui payment
                  gateway.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Keterangan
                </label>

                <textarea
                  rows={4}
                  value={form.keterangan}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      keterangan:
                        event.target.value,
                    }))
                  }
                  placeholder="Keterangan pembayaran..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !selectedInvoice
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Memproses...'
                    : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && selectedPayment && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-medium text-blue-600">
                  DETAIL PEMBAYARAN
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {selectedPayment.invoice
                    ?.nomorInvoice || '-'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDetail(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl bg-emerald-50 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Jumlah Pembayaran
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {formatCurrency(
                    selectedPayment.jumlah,
                  )}
                </p>

                <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                  {selectedPayment.status}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-medium uppercase text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-700">
                    {selectedPayment.invoice
                      ?.order?.customer?.name ||
                      '-'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-medium uppercase text-slate-400">
                    Metode
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-700">
                    {formatMethod(
                      selectedPayment.metode,
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-medium uppercase text-slate-400">
                    Tanggal Bayar
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-700">
                    {formatDateTime(
                      selectedPayment.tanggalBayar,
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-medium uppercase text-slate-400">
                    Dicatat Oleh
                  </p>

                  <p className="mt-1.5 text-sm font-semibold text-slate-700">
                    {selectedPayment.user?.name ||
                      selectedPayment.user
                        ?.username ||
                      '-'}
                  </p>
                </div>
              </div>

              {selectedPayment.keterangan && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Keterangan
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {
                      selectedPayment.keterangan
                    }
                  </p>
                </div>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowDetail(false)
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

export default PaymentPage;
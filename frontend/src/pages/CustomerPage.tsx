import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  Archive,
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import axios from 'axios';
import api from '../api/axios';

interface Customer {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

interface CustomerForm {
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const initialForm: CustomerForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  isActive: true,
};

function CustomerPage() {
  const storedUser = sessionStorage.getItem('user');
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;
  const role = currentUser?.role;
  const canManage =
    role === 'ADMIN' || role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);

  const [archiveCustomer, setArchiveCustomer] =
    useState<Customer | null>(null);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [form, setForm] =
    useState<CustomerForm>(initialForm);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyCustomers, setHistoryCustomers] =
    useState<Customer[]>([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);
  const [restoringId, setRestoringId] =
    useState<number | null>(null);
  const [historyError, setHistoryError] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await api.get<Customer[]>('/customers');

      setCustomers(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError(
            'Tidak dapat terhubung ke server.',
          );
        } else {
          setError(
            'Data customer gagal dimuat.',
          );
        }
      } else {
        setError(
          'Terjadi kesalahan saat memuat data.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError('');

      const response =
        await api.get<Customer[]>(
          '/customers/history',
        );

      setHistoryCustomers(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Riwayat customer gagal dimuat.',
        );
      } else {
        setHistoryError(
          'Riwayat customer gagal dimuat.',
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return customers;
    }

    return customers.filter((customer) => {
      return [
        customer.code,
        customer.name,
        customer.address,
        customer.phone,
        customer.email,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(keyword),
        );
    });
  }, [customers, search]);

  const filteredHistory = useMemo(() => {
    const keyword =
      historySearch.trim().toLowerCase();

    if (!keyword) {
      return historyCustomers;
    }

    return historyCustomers.filter(
      (customer) => {
        return [
          customer.code,
          customer.name,
          customer.address,
          customer.phone,
          customer.email,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(keyword),
          );
      },
    );
  }, [historyCustomers, historySearch]);

  const activeCustomers = useMemo(() => {
    return customers.filter(
      (customer) => customer.isActive,
    ).length;
  }, [customers]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(initialForm);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (
    customer: Customer,
  ) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name,
      address: customer.address ?? '',
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      isActive: customer.isActive,
    });

    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingCustomer(null);
    setForm(initialForm);
    setError('');
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistorySearch('');
    setHistoryError('');

    await fetchHistory();
  };

  const closeHistory = () => {
    if (restoringId !== null) {
      return;
    }

    setHistoryOpen(false);
    setHistorySearch('');
    setHistoryError('');
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      name: form.name.trim(),
      address:
        form.address.trim() || undefined,
      phone:
        form.phone.trim() || undefined,
      email:
        form.email.trim() || undefined,
      isActive: form.isActive,
    };

    try {
      if (editingCustomer) {
        await api.patch(
          `/customers/${editingCustomer.id}`,
          payload,
        );

        setSuccess(
          'Data customer berhasil diperbarui.',
        );
      } else {
        await api.post(
          '/customers',
          payload,
        );

        setSuccess(
          'Customer baru berhasil ditambahkan.',
        );
      }

      setModalOpen(false);
      setEditingCustomer(null);
      setForm(initialForm);

      await fetchCustomers();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        if (Array.isArray(message)) {
          setError(
            message[0] ??
              'Data customer tidak valid.',
          );
        } else if (
          typeof message === 'string'
        ) {
          setError(message);
        } else {
          setError(
            'Data customer gagal disimpan.',
          );
        }
      } else {
        setError(
          'Terjadi kesalahan saat menyimpan data.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveCustomer) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await api.delete(
        `/customers/${archiveCustomer.id}`,
      );

      setArchiveCustomer(null);

      setSuccess(
        'Customer berhasil dipindahkan ke riwayat.',
      );

      await fetchCustomers();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        if (typeof message === 'string') {
          setError(message);
        } else {
          setError(
            'Customer gagal diarsipkan.',
          );
        }
      } else {
        setError(
          'Customer gagal diarsipkan.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (
    customer: Customer,
  ) => {
    try {
      setRestoringId(customer.id);
      setHistoryError('');
      setSuccess('');

      await api.patch(
        `/customers/${customer.id}/restore`,
      );

      setSuccess(
        `${customer.name} berhasil dipulihkan.`,
      );

      await Promise.all([
        fetchHistory(),
        fetchCustomers(),
      ]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Customer gagal dipulihkan.',
        );
      } else {
        setHistoryError(
          'Customer gagal dipulihkan.',
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
            Master Data
          </p>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
            Customer
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kelola data customer perusahaan.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {isAdmin && (
            <button
              type="button"
              onClick={() => void openHistory()}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Archive size={17} />
              Lihat Riwayat
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Tambah Customer
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

      {error && !modalOpen && !historyOpen && (
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

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Total Customer
              </p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {customers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Customer Aktif
              </p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {activeCustomers}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Daftar Customer
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {customers.length} customer terdaftar
            </p>
          </div>

          <div className="relative w-full sm:w-[320px]">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari nama, kode, telepon..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.06]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-3 text-xs text-slate-400">
                Memuat data customer...
              </p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex min-h-[350px] items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <Users size={21} />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-700">
                {search
                  ? 'Customer tidak ditemukan'
                  : 'Belum ada customer'}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {search
                  ? 'Coba gunakan kata pencarian lain.'
                  : 'Tambahkan customer pertama untuk memulai.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 text-left">
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Kode
                  </th>

                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Customer
                  </th>

                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Kontak
                  </th>

                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                  <th className="px-6 py-3.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(
                  (customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50/60"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-medium text-slate-500">
                          {customer.code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-semibold text-blue-600">
                            {customer.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800">
                              {customer.name}
                            </p>

                            <div className="mt-1 flex max-w-[350px] items-center gap-1.5 text-[11px] text-slate-400">
                              <MapPin
                                size={12}
                                className="shrink-0"
                              />

                              <span className="truncate">
                                {customer.address ||
                                  'Alamat belum diisi'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone
                              size={13}
                              className="text-slate-400"
                            />

                            {customer.phone ||
                              'Belum ada telepon'}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <Mail size={12} />

                            {customer.email ||
                              'Belum ada email'}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            customer.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              customer.isActive
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          />

                          {customer.isActive
                            ? 'Aktif'
                            : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(customer)
                              }
                              title="Edit customer"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil size={15} />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                setArchiveCustomer(
                                  customer,
                                )
                              }
                              title="Arsipkan customer"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Archive size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && canManage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingCustomer
                    ? 'Edit Customer'
                    : 'Tambah Customer'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {editingCustomer
                    ? 'Perbarui informasi customer.'
                    : 'Masukkan informasi customer baru.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-6">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="customer-name"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Nama Customer
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="customer-name"
                    type="text"
                    maxLength={150}
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Contoh: PT Maju Jaya"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Nomor Telepon
                    </label>

                    <input
                      id="customer-phone"
                      type="text"
                      maxLength={30}
                      value={form.phone}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          phone:
                            event.target.value,
                        })
                      }
                      placeholder="08xxxxxxxxxx"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customer-email"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Email
                    </label>

                    <input
                      id="customer-email"
                      type="email"
                      maxLength={150}
                      value={form.email}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          email:
                            event.target.value,
                        })
                      }
                      placeholder="email@perusahaan.com"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="customer-address"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Alamat
                  </label>

                  <textarea
                    id="customer-address"
                    rows={4}
                    maxLength={500}
                    value={form.address}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        address:
                          event.target.value,
                      })
                    }
                    placeholder="Alamat lengkap customer"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 transition hover:border-slate-300">
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      Customer aktif
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Customer dapat digunakan dalam
                      transaksi.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        isActive:
                          event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-10 min-w-[120px] items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingCustomer
                      ? 'Simpan Perubahan'
                      : 'Simpan Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveCustomer && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Archive size={20} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              Arsipkan customer?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              <span className="font-medium text-slate-700">
                {archiveCustomer.name}
              </span>{' '}
              akan dipindahkan dari daftar customer
              aktif ke riwayat. Data tidak akan
              dihapus permanen.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  setArchiveCustomer(null)
                }
                className="h-10 rounded-xl border border-slate-200 px-5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  void handleArchive()
                }
                className="h-10 rounded-xl bg-amber-500 px-5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-[2px]">
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Archive size={18} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Riwayat Customer
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Customer yang telah diarsipkan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeHistory}
                disabled={restoringId !== null}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

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
                  placeholder="Cari riwayat customer..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.06]"
                />
              </div>
            </div>

            {historyError && (
              <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                <span>{historyError}</span>

                <button
                  type="button"
                  onClick={() =>
                    setHistoryError('')
                  }
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto">
              {historyLoading ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                    <p className="mt-3 text-xs text-slate-400">
                      Memuat riwayat customer...
                    </p>
                  </div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center px-6">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                      <Archive size={21} />
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-700">
                      {historySearch
                        ? 'Customer tidak ditemukan'
                        : 'Belum ada riwayat customer'}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {historySearch
                        ? 'Coba gunakan kata pencarian lain.'
                        : 'Customer yang diarsipkan akan muncul di sini.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr className="text-left">
                        <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Kode
                        </th>

                        <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Customer
                        </th>

                        <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Diarsipkan
                        </th>

                        <th className="px-6 py-3.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map(
                        (customer) => (
                          <tr
                            key={customer.id}
                            className="transition hover:bg-slate-50/60"
                          >
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs font-medium text-slate-500">
                                {customer.code}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                                  {customer.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800">
                                    {
                                      customer.name
                                    }
                                  </p>

                                  <p className="mt-1 truncate text-[11px] text-slate-400">
                                    {customer.email ||
                                      customer.phone ||
                                      'Tidak ada kontak'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-xs text-slate-500">
                                {customer.deletedAt
                                  ? new Date(
                                      customer.deletedAt,
                                    ).toLocaleString(
                                      'id-ID',
                                      {
                                        dateStyle:
                                          'medium',
                                        timeStyle:
                                          'short',
                                      },
                                    )
                                  : '-'}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  disabled={
                                    restoringId ===
                                    customer.id
                                  }
                                  onClick={() =>
                                    void handleRestore(
                                      customer,
                                    )
                                  }
                                  className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <RotateCcw
                                    size={14}
                                  />

                                  {restoringId ===
                                  customer.id
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
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <p className="text-[11px] text-slate-400">
                {historyCustomers.length}{' '}
                customer di riwayat
              </p>

              <button
                type="button"
                onClick={closeHistory}
                disabled={restoringId !== null}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerPage;
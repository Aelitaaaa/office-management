import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  Archive,
  Car,
  CheckCircle2,
  IdCard,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import axios from 'axios';
import api from '../api/axios';

interface Driver {
  id: number;
  name: string;
  phone?: string | null;
  licenseNo?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

interface DriverForm {
  name: string;
  phone: string;
  licenseNo: string;
  address: string;
  isActive: boolean;
}

const initialForm: DriverForm = {
  name: '',
  phone: '',
  licenseNo: '',
  address: '',
  isActive: true,
};

function DriverPage() {
  const storedUser = sessionStorage.getItem('user');
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  const role = currentUser?.role;
  const canManage =
    role === 'ADMIN' ||
    role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] =
    useState<Driver | null>(null);

  const [archiveDriver, setArchiveDriver] =
    useState<Driver | null>(null);

  const [form, setForm] =
    useState<DriverForm>(initialForm);

  const [historyOpen, setHistoryOpen] =
    useState(false);

  const [historyDrivers, setHistoryDrivers] =
    useState<Driver[]>([]);

  const [historySearch, setHistorySearch] =
    useState('');

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState('');

  const [restoringId, setRestoringId] =
    useState<number | null>(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await api.get<Driver[]>('/drivers');

      setDrivers(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setError(
          typeof message === 'string'
            ? message
            : 'Data driver gagal dimuat.',
        );
      } else {
        setError('Data driver gagal dimuat.');
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
        await api.get<Driver[]>('/drivers/history');

      setHistoryDrivers(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Riwayat driver gagal dimuat.',
        );
      } else {
        setHistoryError(
          'Riwayat driver gagal dimuat.',
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchDrivers();
  }, []);

  const filteredDrivers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return drivers;
    }

    return drivers.filter((driver) =>
      [
        driver.name,
        driver.phone,
        driver.licenseNo,
        driver.address,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(keyword),
        ),
    );
  }, [drivers, search]);

  const filteredHistory = useMemo(() => {
    const keyword =
      historySearch.trim().toLowerCase();

    if (!keyword) {
      return historyDrivers;
    }

    return historyDrivers.filter((driver) =>
      [
        driver.name,
        driver.phone,
        driver.licenseNo,
        driver.address,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(keyword),
        ),
    );
  }, [historyDrivers, historySearch]);

  const activeCount = useMemo(
    () =>
      drivers.filter((driver) => driver.isActive)
        .length,
    [drivers],
  );

  const inactiveCount =
    drivers.length - activeCount;

  const openCreateModal = () => {
    setEditingDriver(null);
    setForm(initialForm);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);

    setForm({
      name: driver.name,
      phone: driver.phone ?? '',
      licenseNo: driver.licenseNo ?? '',
      address: driver.address ?? '',
      isActive: driver.isActive,
    });

    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingDriver(null);
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
      phone: form.phone.trim() || undefined,
      licenseNo:
        form.licenseNo.trim() || undefined,
      address: form.address.trim() || undefined,
      isActive: form.isActive,
    };

    try {
      if (editingDriver) {
        await api.patch(
          `/drivers/${editingDriver.id}`,
          payload,
        );

        setSuccess(
          'Data driver berhasil diperbarui.',
        );
      } else {
        await api.post('/drivers', payload);

        setSuccess(
          'Driver baru berhasil ditambahkan.',
        );
      }

      setModalOpen(false);
      setEditingDriver(null);
      setForm(initialForm);

      await fetchDrivers();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        if (Array.isArray(message)) {
          setError(
            message[0] ??
              'Data driver tidak valid.',
          );
        } else if (
          typeof message === 'string'
        ) {
          setError(message);
        } else {
          setError(
            'Data driver gagal disimpan.',
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
    if (!archiveDriver) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await api.delete(
        `/drivers/${archiveDriver.id}`,
      );

      setArchiveDriver(null);

      setSuccess(
        'Driver berhasil dipindahkan ke riwayat.',
      );

      await fetchDrivers();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setError(
          typeof message === 'string'
            ? message
            : 'Driver gagal diarsipkan.',
        );
      } else {
        setError('Driver gagal diarsipkan.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (
    driver: Driver,
  ) => {
    try {
      setRestoringId(driver.id);
      setHistoryError('');
      setSuccess('');

      await api.patch(
        `/drivers/${driver.id}/restore`,
      );

      setSuccess(
        `${driver.name} berhasil dipulihkan.`,
      );

      await Promise.all([
        fetchHistory(),
        fetchDrivers(),
      ]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Driver gagal dipulihkan.',
        );
      } else {
        setHistoryError(
          'Driver gagal dipulihkan.',
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
            Driver
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kelola data pengemudi untuk kebutuhan
            pengiriman.
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
              onClick={openCreateModal}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Tambah Driver
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

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Total Driver
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {drivers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Driver Aktif
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {activeCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Car size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Nonaktif
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {inactiveCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Daftar Driver
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {drivers.length} driver terdaftar
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
              placeholder="Cari nama, telepon, atau SIM..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              <p className="mt-3 text-xs text-slate-400">
                Memuat data driver...
              </p>
            </div>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <UserRound
                size={25}
                className="mx-auto text-slate-300"
              />
              <p className="mt-4 text-sm font-medium text-slate-700">
                Driver tidak ditemukan
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {drivers.length === 0
                  ? 'Tambahkan driver pertama untuk memulai.'
                  : 'Coba gunakan kata pencarian lain.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="bg-slate-50/80 text-left">
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Driver
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Telepon
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Nomor SIM
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Alamat
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
                {filteredDrivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="transition hover:bg-slate-50/60"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <UserRound size={16} />
                        </div>

                        <p className="text-sm font-medium text-slate-800">
                          {driver.name}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone
                          size={14}
                          className="text-slate-400"
                        />
                        {driver.phone || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <IdCard
                          size={15}
                          className="text-slate-400"
                        />
                        <span className="font-mono text-xs text-slate-600">
                          {driver.licenseNo || '-'}
                        </span>
                      </div>
                    </td>

                    <td className="max-w-[250px] px-6 py-4">
                      <p className="truncate text-xs text-slate-500">
                        {driver.address || '-'}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                          driver.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            driver.isActive
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                        />

                        {driver.isActive
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
                              openEditModal(driver)
                            }
                            title="Edit driver"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={15} />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              setArchiveDriver(driver)
                            }
                            title="Arsipkan driver"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Archive size={15} />
                          </button>
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

      {modalOpen && canManage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingDriver
                    ? 'Edit Driver'
                    : 'Tambah Driver'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {editingDriver
                    ? 'Perbarui informasi driver.'
                    : 'Masukkan informasi driver baru.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
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
                    htmlFor="driver-name"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Nama Driver
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="driver-name"
                    type="text"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Masukkan nama driver"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="driver-phone"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Nomor Telepon
                    </label>

                    <input
                      id="driver-phone"
                      type="text"
                      maxLength={30}
                      value={form.phone}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          phone: event.target.value,
                        })
                      }
                      placeholder="08xxxxxxxxxx"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="driver-license"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Nomor SIM
                    </label>

                    <input
                      id="driver-license"
                      type="text"
                      maxLength={50}
                      value={form.licenseNo}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          licenseNo:
                            event.target.value,
                        })
                      }
                      placeholder="Nomor SIM driver"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="driver-address"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Alamat
                  </label>

                  <textarea
                    id="driver-address"
                    rows={4}
                    maxLength={500}
                    value={form.address}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        address: event.target.value,
                      })
                    }
                    placeholder="Masukkan alamat driver"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5">
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      Driver aktif
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Driver dapat dipilih untuk
                      pengiriman.
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
                  className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-medium text-slate-600"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-10 min-w-[120px] items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingDriver
                      ? 'Simpan Perubahan'
                      : 'Simpan Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveDriver && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Archive size={20} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              Arsipkan driver?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              <span className="font-medium text-slate-700">
                {archiveDriver.name}
              </span>{' '}
              akan dipindahkan ke riwayat. Data
              tidak akan dihapus permanen.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  setArchiveDriver(null)
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
                    Riwayat Driver
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Driver yang telah diarsipkan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeHistory}
                disabled={restoringId !== null}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
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
                  placeholder="Cari riwayat driver..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>

            {historyError && (
              <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {historyError}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto">
              {historyLoading ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                    <p className="mt-3 text-xs text-slate-400">
                      Memuat riwayat driver...
                    </p>
                  </div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <div className="text-center">
                    <Archive
                      size={24}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-4 text-sm font-medium text-slate-700">
                      Belum ada riwayat driver
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase text-slate-400">
                          Driver
                        </th>
                        <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase text-slate-400">
                          Telepon
                        </th>
                        <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase text-slate-400">
                          Nomor SIM
                        </th>
                        <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase text-slate-400">
                          Diarsipkan
                        </th>
                        <th className="px-6 py-3.5 text-right text-[10px] font-semibold uppercase text-slate-400">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map(
                        (driver) => (
                          <tr key={driver.id}>
                            <td className="px-6 py-4 text-sm font-medium text-slate-800">
                              {driver.name}
                            </td>

                            <td className="px-6 py-4 text-xs text-slate-500">
                              {driver.phone || '-'}
                            </td>

                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                              {driver.licenseNo || '-'}
                            </td>

                            <td className="px-6 py-4 text-xs text-slate-500">
                              {driver.deletedAt
                                ? new Date(
                                    driver.deletedAt,
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
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  disabled={
                                    restoringId ===
                                    driver.id
                                  }
                                  onClick={() =>
                                    void handleRestore(
                                      driver,
                                    )
                                  }
                                  className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                >
                                  <RotateCcw
                                    size={14}
                                  />
                                  {restoringId ===
                                  driver.id
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

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <p className="text-[11px] text-slate-400">
                {historyDrivers.length} driver di
                riwayat
              </p>

              <button
                type="button"
                onClick={closeHistory}
                disabled={restoringId !== null}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600"
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

export default DriverPage;
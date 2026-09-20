import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import axios from 'axios';
import {
  Archive,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleOff,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import api from '../api/axios';

interface Vehicle {
  id: number;
  nomorPolisi: string;
  jenis: string;
  merek?: string | null;
  model?: string | null;
  warna?: string | null;
  tahun?: number | null;
  aktif: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

interface VehicleForm {
  nomorPolisi: string;
  jenis: string;
  merek: string;
  model: string;
  warna: string;
  tahun: string;
  aktif: boolean;
}

const initialForm: VehicleForm = {
  nomorPolisi: '',
  jenis: '',
  merek: '',
  model: '',
  warna: '',
  tahun: '',
  aktif: true,
};

function VehiclePage() {
  const storedUser = sessionStorage.getItem('user');
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  const role = currentUser?.role;
  const canManage =
    role === 'ADMIN' ||
    role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] =
    useState<Vehicle | null>(null);

  const [archiveVehicle, setArchiveVehicle] =
    useState<Vehicle | null>(null);

  const [form, setForm] =
    useState<VehicleForm>(initialForm);

  const [historyOpen, setHistoryOpen] =
    useState(false);

  const [historyVehicles, setHistoryVehicles] =
    useState<Vehicle[]>([]);

  const [historySearch, setHistorySearch] =
    useState('');

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState('');

  const [restoringId, setRestoringId] =
    useState<number | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await api.get<Vehicle[]>('/vehicles');

      setVehicles(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          typeof message === 'string'
            ? message
            : 'Data kendaraan gagal dimuat.',
        );
      } else {
        setError('Data kendaraan gagal dimuat.');
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
        await api.get<Vehicle[]>('/vehicles/history');

      setHistoryVehicles(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Riwayat kendaraan gagal dimuat.',
        );
      } else {
        setHistoryError(
          'Riwayat kendaraan gagal dimuat.',
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return vehicles;
    }

    return vehicles.filter((vehicle) =>
      [
        vehicle.nomorPolisi,
        vehicle.jenis,
        vehicle.merek,
        vehicle.model,
        vehicle.warna,
        vehicle.tahun,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined,
        )
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(keyword),
        ),
    );
  }, [vehicles, search]);

  const filteredHistory = useMemo(() => {
    const keyword =
      historySearch.trim().toLowerCase();

    if (!keyword) {
      return historyVehicles;
    }

    return historyVehicles.filter((vehicle) =>
      [
        vehicle.nomorPolisi,
        vehicle.jenis,
        vehicle.merek,
        vehicle.model,
        vehicle.warna,
        vehicle.tahun,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined,
        )
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(keyword),
        ),
    );
  }, [historyVehicles, historySearch]);

  const activeCount = useMemo(
    () =>
      vehicles.filter((vehicle) => vehicle.aktif)
        .length,
    [vehicles],
  );

  const inactiveCount =
    vehicles.length - activeCount;

  const openCreateModal = () => {
    setEditingVehicle(null);
    setForm(initialForm);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);

    setForm({
      nomorPolisi: vehicle.nomorPolisi,
      jenis: vehicle.jenis,
      merek: vehicle.merek ?? '',
      model: vehicle.model ?? '',
      warna: vehicle.warna ?? '',
      tahun: vehicle.tahun
        ? String(vehicle.tahun)
        : '',
      aktif: vehicle.aktif,
    });

    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingVehicle(null);
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
      nomorPolisi: form.nomorPolisi
        .trim()
        .toUpperCase(),
      jenis: form.jenis.trim(),
      merek: form.merek.trim() || undefined,
      model: form.model.trim() || undefined,
      warna: form.warna.trim() || undefined,
      tahun: form.tahun
        ? Number(form.tahun)
        : undefined,
      aktif: form.aktif,
    };

    try {
      if (editingVehicle) {
        await api.patch(
          `/vehicles/${editingVehicle.id}`,
          payload,
        );

        setSuccess(
          'Data kendaraan berhasil diperbarui.',
        );
      } else {
        await api.post('/vehicles', payload);

        setSuccess(
          'Kendaraan baru berhasil ditambahkan.',
        );
      }

      setModalOpen(false);
      setEditingVehicle(null);
      setForm(initialForm);

      await fetchVehicles();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        if (Array.isArray(message)) {
          setError(
            message[0] ??
              'Data kendaraan tidak valid.',
          );
        } else if (
          typeof message === 'string'
        ) {
          setError(message);
        } else {
          setError(
            'Data kendaraan gagal disimpan.',
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
    if (!archiveVehicle) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await api.delete(
        `/vehicles/${archiveVehicle.id}`,
      );

      setArchiveVehicle(null);

      setSuccess(
        'Kendaraan berhasil dipindahkan ke riwayat.',
      );

      await fetchVehicles();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setError(
          typeof message === 'string'
            ? message
            : 'Kendaraan gagal diarsipkan.',
        );
      } else {
        setError(
          'Kendaraan gagal diarsipkan.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (
    vehicle: Vehicle,
  ) => {
    try {
      setRestoringId(vehicle.id);
      setHistoryError('');
      setSuccess('');

      await api.patch(
        `/vehicles/${vehicle.id}/restore`,
      );

      setSuccess(
        `${vehicle.nomorPolisi} berhasil dipulihkan.`,
      );

      await Promise.all([
        fetchHistory(),
        fetchVehicles(),
      ]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Kendaraan gagal dipulihkan.',
        );
      } else {
        setHistoryError(
          'Kendaraan gagal dipulihkan.',
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
            Kendaraan
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kelola kendaraan yang digunakan untuk
            kebutuhan pengiriman perusahaan.
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
              Tambah Kendaraan
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
              <Car size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Total Kendaraan
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {vehicles.length}
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
                Kendaraan Aktif
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
              <CircleOff size={20} />
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
              Daftar Kendaraan
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {vehicles.length} kendaraan terdaftar
            </p>
          </div>

          <div className="relative w-full sm:w-[340px]">
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
              placeholder="Cari nomor polisi, merek, jenis..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              <p className="mt-3 text-xs text-slate-400">
                Memuat data kendaraan...
              </p>
            </div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <Car
                size={27}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-sm font-medium text-slate-700">
                Kendaraan tidak ditemukan
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {vehicles.length === 0
                  ? 'Tambahkan kendaraan pertama untuk memulai.'
                  : 'Coba gunakan kata pencarian lain.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50/80 text-left">
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Nomor Polisi
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Kendaraan
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Jenis
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Warna
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Tahun
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
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="transition hover:bg-slate-50/60"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-xs font-semibold tracking-wide text-white">
                        {vehicle.nomorPolisi}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Car size={17} />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {vehicle.merek || '-'}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {vehicle.model ||
                              'Model tidak dicantumkan'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600">
                      {vehicle.jenis}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Palette
                          size={14}
                          className="text-slate-400"
                        />
                        {vehicle.warna || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <CalendarDays
                          size={14}
                          className="text-slate-400"
                        />
                        {vehicle.tahun || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                          vehicle.aktif
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            vehicle.aktif
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                        />

                        {vehicle.aktif
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
                              openEditModal(vehicle)
                            }
                            title="Edit kendaraan"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={15} />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              setArchiveVehicle(vehicle)
                            }
                            title="Arsipkan kendaraan"
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
                  {editingVehicle
                    ? 'Edit Kendaraan'
                    : 'Tambah Kendaraan'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {editingVehicle
                    ? 'Perbarui informasi kendaraan.'
                    : 'Masukkan informasi kendaraan baru.'}
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

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vehicle-plate"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Nomor Polisi
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="vehicle-plate"
                      type="text"
                      required
                      maxLength={20}
                      value={form.nomorPolisi}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          nomorPolisi:
                            event.target.value.toUpperCase(),
                        })
                      }
                      placeholder="B 1234 ABC"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 font-mono text-sm uppercase text-slate-800 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vehicle-type"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Jenis Kendaraan
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="vehicle-type"
                      type="text"
                      required
                      maxLength={50}
                      value={form.jenis}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          jenis: event.target.value,
                        })
                      }
                      placeholder="Contoh: Pickup"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vehicle-brand"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Merek
                    </label>

                    <input
                      id="vehicle-brand"
                      type="text"
                      maxLength={50}
                      value={form.merek}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          merek: event.target.value,
                        })
                      }
                      placeholder="Contoh: Suzuki"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vehicle-model"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Model
                    </label>

                    <input
                      id="vehicle-model"
                      type="text"
                      maxLength={50}
                      value={form.model}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          model: event.target.value,
                        })
                      }
                      placeholder="Contoh: Carry"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vehicle-color"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Warna
                    </label>

                    <input
                      id="vehicle-color"
                      type="text"
                      maxLength={30}
                      value={form.warna}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          warna: event.target.value,
                        })
                      }
                      placeholder="Contoh: Putih"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vehicle-year"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Tahun
                    </label>

                    <input
                      id="vehicle-year"
                      type="number"
                      min={1900}
                      max={2100}
                      value={form.tahun}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          tahun: event.target.value,
                        })
                      }
                      placeholder="2025"
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5">
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      Kendaraan aktif
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Kendaraan dapat digunakan untuk
                      operasional pengiriman.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.aktif}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        aktif: event.target.checked,
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
                  className="flex h-10 min-w-[130px] items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingVehicle
                      ? 'Simpan Perubahan'
                      : 'Simpan Kendaraan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveVehicle && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Archive size={20} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              Arsipkan kendaraan?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kendaraan{' '}
              <span className="font-semibold text-slate-700">
                {archiveVehicle.nomorPolisi}
              </span>{' '}
              akan dipindahkan ke riwayat. Data tidak
              akan dihapus permanen.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  setArchiveVehicle(null)
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
                    Riwayat Kendaraan
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Kendaraan yang telah diarsipkan.
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
                  placeholder="Cari riwayat kendaraan..."
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
                      Memuat riwayat kendaraan...
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
                      Belum ada riwayat kendaraan
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px]">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase text-slate-400">
                          Nomor Polisi
                        </th>
                        <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase text-slate-400">
                          Kendaraan
                        </th>
                        <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase text-slate-400">
                          Jenis
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
                        (vehicle) => (
                          <tr key={vehicle.id}>
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs font-semibold text-slate-700">
                                {vehicle.nomorPolisi}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-xs font-medium text-slate-700">
                                {vehicle.merek || '-'}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                {vehicle.model || '-'}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-xs text-slate-500">
                              {vehicle.jenis}
                            </td>

                            <td className="px-6 py-4 text-xs text-slate-500">
                              {vehicle.deletedAt
                                ? new Date(
                                    vehicle.deletedAt,
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
                                    vehicle.id
                                  }
                                  onClick={() =>
                                    void handleRestore(
                                      vehicle,
                                    )
                                  }
                                  className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                >
                                  <RotateCcw
                                    size={14}
                                  />

                                  {restoringId ===
                                  vehicle.id
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
                {historyVehicles.length} kendaraan di
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

export default VehiclePage;
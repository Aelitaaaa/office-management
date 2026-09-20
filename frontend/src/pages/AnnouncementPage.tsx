import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  CalendarDays,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import axios from 'axios';
import api from '../api/axios';

interface AnnouncementUser {
  id: number;
  name: string;
  username: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: AnnouncementUser | null;
}

interface AnnouncementForm {
  title: string;
  content: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const getLocalDateTimeValue = (
  value?: string | null,
) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  const offset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
};

const getInitialForm =
  (): AnnouncementForm => ({
    title: '',
    content: '',
    isActive: true,
    startDate: getLocalDateTimeValue(
      new Date().toISOString(),
    ),
    endDate: '',
  });

function AnnouncementPage() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    editingAnnouncement,
    setEditingAnnouncement,
  ] = useState<Announcement | null>(
    null,
  );

  const [
    deleteAnnouncement,
    setDeleteAnnouncement,
  ] = useState<Announcement | null>(
    null,
  );

  const [form, setForm] =
    useState<AnnouncementForm>(
      getInitialForm,
    );

  const fetchAnnouncements =
    async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await api.get<Announcement[]>(
            '/announcements',
          );

        setAnnouncements(
          response.data,
        );
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const message =
            err.response?.data
              ?.message;

          setError(
            typeof message ===
              'string'
              ? message
              : 'Data pengumuman gagal dimuat.',
          );
        } else {
          setError(
            'Terjadi kesalahan saat memuat pengumuman.',
          );
        }
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void fetchAnnouncements();
  }, []);

  const filteredAnnouncements =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return announcements;
      }

      return announcements.filter(
        (announcement) =>
          [
            announcement.title,
            announcement.content,
            announcement.user
              ?.name,
            announcement.user
              ?.username,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(
                  keyword,
                ),
            ),
      );
    }, [
      announcements,
      search,
    ]);

  const activeCount =
    useMemo(() => {
      const now = new Date();

      return announcements.filter(
        (announcement) => {
          if (
            !announcement.isActive
          ) {
            return false;
          }

          const start =
            new Date(
              announcement.startDate,
            );

          const end =
            announcement.endDate
              ? new Date(
                  announcement.endDate,
                )
              : null;

          return (
            start <= now &&
            (!end || end >= now)
          );
        },
      ).length;
    }, [announcements]);

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setForm(getInitialForm());
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (
    announcement: Announcement,
  ) => {
    setEditingAnnouncement(
      announcement,
    );

    setForm({
      title:
        announcement.title,
      content:
        announcement.content,
      isActive:
        announcement.isActive,
      startDate:
        getLocalDateTimeValue(
          announcement.startDate,
        ),
      endDate:
        getLocalDateTimeValue(
          announcement.endDate,
        ),
    });

    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);

    setEditingAnnouncement(
      null,
    );

    setForm(getInitialForm());
    setError('');
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setSubmitting(true);
    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError(
        'Judul pengumuman wajib diisi.',
      );

      setSubmitting(false);
      return;
    }

    if (!form.content.trim()) {
      setError(
        'Isi pengumuman wajib diisi.',
      );

      setSubmitting(false);
      return;
    }

    if (!form.startDate) {
      setError(
        'Tanggal mulai wajib diisi.',
      );

      setSubmitting(false);
      return;
    }

    if (
      form.endDate &&
      new Date(form.endDate) <
        new Date(form.startDate)
    ) {
      setError(
        'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
      );

      setSubmitting(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      content:
        form.content.trim(),
      isActive:
        form.isActive,
      startDate:
        new Date(
          form.startDate,
        ).toISOString(),
      endDate:
        form.endDate
          ? new Date(
              form.endDate,
            ).toISOString()
          : null,
    };

    try {
      if (
        editingAnnouncement
      ) {
        await api.patch(
          `/announcements/${editingAnnouncement.id}`,
          payload,
        );

        setSuccess(
          'Pengumuman berhasil diperbarui.',
        );
      } else {
        await api.post(
          '/announcements',
          payload,
        );

        setSuccess(
          'Pengumuman berhasil dibuat.',
        );
      }

      setModalOpen(false);

      setEditingAnnouncement(
        null,
      );

      setForm(
        getInitialForm(),
      );

      await fetchAnnouncements();
    } catch (err) {
      if (
        axios.isAxiosError(err)
      ) {
        const message =
          err.response?.data
            ?.message;

        if (
          Array.isArray(message)
        ) {
          setError(
            message[0] ??
              'Data pengumuman tidak valid.',
          );
        } else if (
          typeof message ===
          'string'
        ) {
          setError(message);
        } else {
          setError(
            'Pengumuman gagal disimpan.',
          );
        }
      } else {
        setError(
          'Terjadi kesalahan saat menyimpan pengumuman.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete =
    async () => {
      if (
        !deleteAnnouncement
      ) {
        return;
      }

      try {
        setSubmitting(true);
        setError('');
        setSuccess('');

        await api.delete(
          `/announcements/${deleteAnnouncement.id}`,
        );

        setSuccess(
          'Pengumuman berhasil dihapus.',
        );

        setDeleteAnnouncement(
          null,
        );

        await fetchAnnouncements();
      } catch (err) {
        if (
          axios.isAxiosError(err)
        ) {
          const message =
            err.response?.data
              ?.message;

          setError(
            typeof message ===
              'string'
              ? message
              : 'Pengumuman gagal dihapus.',
          );
        } else {
          setError(
            'Pengumuman gagal dihapus.',
          );
        }
      } finally {
        setSubmitting(false);
      }
    };

  const formatDate = (
    value?: string | null,
  ) => {
    if (!value) {
      return '-';
    }

    return new Date(
      value,
    ).toLocaleString(
      'id-ID',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    );
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-600">
            Informasi
          </p>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
            Pengumuman
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kelola informasi dan
            pengumuman untuk pengguna
            sistem.
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreateModal
          }
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Tambah Pengumuman
        </button>
      </div>

      {success && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{success}</span>

          <button
            type="button"
            onClick={() =>
              setSuccess('')
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error &&
        !modalOpen && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Megaphone
                size={20}
              />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Total Pengumuman
              </p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {
                  announcements.length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarDays
                size={20}
              />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Sedang Aktif
              </p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {activeCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Daftar Pengumuman
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {
                announcements.length
              }{' '}
              pengumuman tercatat
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
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Cari pengumuman..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.06]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-3 text-xs text-slate-400">
                Memuat pengumuman...
              </p>
            </div>
          </div>
        ) : filteredAnnouncements
            .length === 0 ? (
          <div className="flex min-h-[350px] items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <Megaphone
                  size={21}
                />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-700">
                {search
                  ? 'Pengumuman tidak ditemukan'
                  : 'Belum ada pengumuman'}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {search
                  ? 'Coba gunakan kata pencarian lain.'
                  : 'Tambahkan pengumuman pertama untuk memulai.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 text-left">
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Pengumuman
                  </th>

                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Periode
                  </th>

                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Dibuat Oleh
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
                {filteredAnnouncements.map(
                  (
                    announcement,
                  ) => (
                    <tr
                      key={
                        announcement.id
                      }
                      className="transition hover:bg-slate-50/60"
                    >
                      <td className="px-6 py-4">
                        <div className="flex max-w-md items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Megaphone
                              size={
                                16
                              }
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800">
                              {
                                announcement.title
                              }
                            </p>

                            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-400">
                              {
                                announcement.content
                              }
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600">
                          {formatDate(
                            announcement.startDate,
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          sampai{' '}
                          {announcement.endDate
                            ? formatDate(
                                announcement.endDate,
                              )
                            : 'tanpa batas'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-700">
                          {announcement
                            .user
                            ?.name ||
                            announcement
                              .user
                              ?.username ||
                            '-'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            announcement.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              announcement.isActive
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          />

                          {announcement.isActive
                            ? 'Aktif'
                            : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Edit pengumuman"
                            onClick={() =>
                              openEditModal(
                                announcement,
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil
                              size={
                                15
                              }
                            />
                          </button>

                          <button
                            type="button"
                            title="Hapus pengumuman"
                            onClick={() =>
                              setDeleteAnnouncement(
                                announcement,
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2
                              size={
                                15
                              }
                            />
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
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingAnnouncement
                    ? 'Edit Pengumuman'
                    : 'Tambah Pengumuman'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {editingAnnouncement
                    ? 'Perbarui informasi pengumuman.'
                    : 'Buat pengumuman baru untuk pengguna sistem.'}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="space-y-5 p-6">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="announcement-title"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Judul
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="announcement-title"
                    type="text"
                    maxLength={
                      150
                    }
                    required
                    value={
                      form.title
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        title:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Contoh: Libur Nasional"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="announcement-content"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Isi Pengumuman
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <textarea
                    id="announcement-content"
                    rows={6}
                    required
                    value={
                      form.content
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        content:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="Tulis isi pengumuman..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="announcement-start"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Mulai
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="announcement-start"
                      type="datetime-local"
                      required
                      value={
                        form.startDate
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,
                          startDate:
                            event
                              .target
                              .value,
                        })
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="announcement-end"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Selesai
                    </label>

                    <input
                      id="announcement-end"
                      type="datetime-local"
                      value={
                        form.endDate
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,
                          endDate:
                            event
                              .target
                              .value,
                        })
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />

                    <p className="mt-1.5 text-[10px] text-slate-400">
                      Kosongkan jika
                      tidak memiliki
                      batas waktu.
                    </p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 transition hover:border-slate-300">
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      Pengumuman aktif
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Pengumuman dapat
                      ditampilkan pada
                      dashboard selama
                      periode aktif.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        isActive:
                          event
                            .target
                            .checked,
                      })
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    submitting
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="flex h-10 min-w-[130px] items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingAnnouncement
                      ? 'Simpan Perubahan'
                      : 'Simpan Pengumuman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteAnnouncement && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2
                size={20}
              />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              Hapus pengumuman?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pengumuman{' '}
              <span className="font-medium text-slate-700">
                "
                {
                  deleteAnnouncement.title
                }
                "
              </span>{' '}
              akan dihapus
              permanen.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={() =>
                  setDeleteAnnouncement(
                    null,
                  )
                }
                className="h-10 rounded-xl border border-slate-200 px-5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={() =>
                  void handleDelete()
                }
                className="h-10 rounded-xl bg-red-600 px-5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {submitting
                  ? 'Menghapus...'
                  : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementPage;
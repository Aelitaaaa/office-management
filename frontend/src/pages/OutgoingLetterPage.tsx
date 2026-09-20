import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  ChangeEvent,
  FormEvent,
} from 'react';
import {
  Archive,
  Download,
  Edit,
  FileText,
  History,
  Loader2,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

type LetterType = 'BIASA' | 'PENTING' | 'RAHASIA';

interface User {
  id: number;
  name: string;
  username: string;
}

interface OutgoingLetter {
  id: number;
  nomorSurat: string;
  tanggalSurat: string;
  penerima: string;
  perihal: string;
  jenis: LetterType;
  filePath?: string | null;
  keterangan?: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedById?: number | null;
  user?: User;
}

interface FormData {
  nomorSurat: string;
  tanggalSurat: string;
  penerima: string;
  perihal: string;
  jenis: LetterType;
  keterangan: string;
}

interface AlertState {
  type: 'success' | 'error';
  message: string;
}

const initialForm: FormData = {
  nomorSurat: '',
  tanggalSurat: new Date().toISOString().split('T')[0],
  penerima: '',
  perihal: '',
  jenis: 'BIASA',
  keterangan: '',
};

function OutgoingLetterPage() {
  const [letters, setLetters] = useState<OutgoingLetter[]>([]);
  const [history, setHistory] = useState<OutgoingLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState<OutgoingLetter | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [confirmDelete, setConfirmDelete] =
    useState<OutgoingLetter | null>(null);
  const [confirmRestore, setConfirmRestore] =
    useState<OutgoingLetter | null>(null);

  const token = sessionStorage.getItem('access_token');

  const getRole = () => {
    const user = sessionStorage.getItem('user');

    if (user) {
      try {
        const parsed = JSON.parse(user);
        return parsed.role || '';
      } catch {
        return '';
      }
    }

    if (!token) {
      return '';
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || '';
    } catch {
      return '';
    }
  };

  const role = String(getRole()).toUpperCase();
  const canManage = role === 'ADMIN' || role === 'STAFF';

  const showMessage = (
    type: 'success' | 'error',
    message: string,
  ) => {
    setAlert({
      type,
      message,
    });

    window.setTimeout(() => {
      setAlert(null);
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

  const fetchLetters = async () => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/outgoing-letters`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil data surat keluar',
          ),
        );
      }

      const data = await response.json();
      setLetters(data);
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data surat keluar',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!token || !canManage) {
      return;
    }

    setHistoryLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/outgoing-letters/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil history surat keluar',
          ),
        );
      }

      const data = await response.json();
      setHistory(data);
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal mengambil history surat keluar',
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const filteredLetters = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return letters;
    }

    return letters.filter((letter) => {
      return (
        letter.nomorSurat.toLowerCase().includes(keyword) ||
        letter.penerima.toLowerCase().includes(keyword) ||
        letter.perihal.toLowerCase().includes(keyword) ||
        letter.jenis.toLowerCase().includes(keyword)
      );
    });
  }, [letters, search]);

  const openCreate = () => {
    if (!canManage) {
      showMessage('error', 'Anda tidak memiliki akses untuk menambah surat keluar.');
      return;
    }

    setEditing(null);
    setForm({
      ...initialForm,
      tanggalSurat: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const openEdit = (letter: OutgoingLetter) => {
    if (!canManage) {
      showMessage('error', 'Anda tidak memiliki akses untuk mengubah surat keluar.');
      return;
    }

    setEditing(letter);

    setForm({
      nomorSurat: letter.nomorSurat,
      tanggalSurat: letter.tanggalSurat.split('T')[0],
      penerima: letter.penerima,
      perihal: letter.perihal,
      jenis: letter.jenis,
      keterangan: letter.keterangan || '',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setShowModal(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManage) {
      showMessage('error', 'Anda tidak memiliki akses untuk mengubah data surat keluar.');
      return;
    }

    if (!token) {
      return;
    }

    if (
      !form.nomorSurat.trim() ||
      !form.penerima.trim() ||
      !form.perihal.trim()
    ) {
      showMessage(
        'error',
        'Nomor surat, penerima, dan perihal wajib diisi',
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        editing
          ? `${API_URL}/outgoing-letters/${editing.id}`
          : `${API_URL}/outgoing-letters`,
        {
          method: editing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nomorSurat: form.nomorSurat.trim(),
            tanggalSurat: form.tanggalSurat,
            penerima: form.penerima.trim(),
            perihal: form.perihal.trim(),
            jenis: form.jenis,
            keterangan: form.keterangan.trim() || undefined,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            editing
              ? 'Gagal mengubah surat keluar'
              : 'Gagal menambahkan surat keluar',
          ),
        );
      }

      showMessage(
        'success',
        editing
          ? 'Surat keluar berhasil diperbarui'
          : 'Surat keluar berhasil ditambahkan',
      );

      setShowModal(false);
      setEditing(null);
      setForm(initialForm);

      await fetchLetters();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canManage) {
      setConfirmDelete(null);
      showMessage('error', 'Anda tidak memiliki akses untuk menghapus surat keluar.');
      return;
    }

    if (!token || !confirmDelete) {
      return;
    }

    const letter = confirmDelete;

    try {
      const response = await fetch(
        `${API_URL}/outgoing-letters/${letter.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal menghapus surat keluar',
          ),
        );
      }

      setConfirmDelete(null);
      showMessage(
        'success',
        'Surat keluar berhasil dipindahkan ke history',
      );

      await fetchLetters();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal menghapus surat keluar',
      );
    }
  };

  const handleRestore = async () => {
    if (!canManage) {
      setConfirmRestore(null);
      showMessage('error', 'Anda tidak memiliki akses untuk memulihkan surat keluar.');
      return;
    }

    if (!token || !confirmRestore) {
      return;
    }

    const letter = confirmRestore;

    try {
      const response = await fetch(
        `${API_URL}/outgoing-letters/${letter.id}/restore`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal memulihkan surat keluar',
          ),
        );
      }

      setConfirmRestore(null);
      showMessage(
        'success',
        'Surat keluar berhasil dipulihkan',
      );

      await Promise.all([
        fetchLetters(),
        fetchHistory(),
      ]);
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal memulihkan surat keluar',
      );
    }
  };

  const handleUpload = async (
    letter: OutgoingLetter,
    file: File,
  ) => {
    if (!canManage) {
      showMessage('error', 'Anda tidak memiliki akses untuk mengunggah file surat.');
      return;
    }

    if (!token) {
      return;
    }

    setUploadingId(letter.id);

    try {
      const data = new FormData();
      data.append('file', file);

      const response = await fetch(
        `${API_URL}/outgoing-letters/${letter.id}/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengunggah file',
          ),
        );
      }

      showMessage(
        'success',
        'File surat berhasil diunggah',
      );

      await fetchLetters();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal mengunggah file',
      );
    } finally {
      setUploadingId(null);
    }
  };

  const handleDownload = async (letter: OutgoingLetter) => {
    if (!token) {
      return;
    }

    setDownloadingId(letter.id);

    try {
      const response = await fetch(
        `${API_URL}/outgoing-letters/${letter.id}/file`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal membuka file',
          ),
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download =
        letter.filePath?.split('/').pop() ||
        `surat-${letter.nomorSurat}`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal membuka file',
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const openHistory = async () => {
    setShowHistory(true);
    await fetchHistory();
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getTypeStyle = (type: LetterType) => {
    if (type === 'PENTING') {
      return 'bg-amber-100 text-amber-700';
    }

    if (type === 'RAHASIA') {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-6">
      {alert && (
        <div
          className={`fixed right-6 top-6 z-[100] flex max-w-md items-start gap-3 rounded-xl border px-5 py-4 shadow-xl ${
            alert.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex-1 text-sm font-medium">
            {alert.message}
          </div>

          <button
            type="button"
            onClick={() => setAlert(null)}
            className="opacity-60 transition hover:opacity-100"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Surat Keluar
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola seluruh surat keluar perusahaan
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canManage && (
            <button
              type="button"
              onClick={openHistory}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <History size={18} />
              Riwayat
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={18} />
              Tambah Surat
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Surat
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-800">
                {letters.length}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Surat Penting
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-800">
                {
                  letters.filter(
                    (item) => item.jenis === 'PENTING',
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Archive size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Surat Rahasia
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-800">
                {
                  letters.filter(
                    (item) => item.jenis === 'RAHASIA',
                  ).length
                }
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <FileText size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari nomor, penerima, perihal..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <button
            type="button"
            onClick={fetchLetters}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">No</th>
                <th className="px-5 py-4">
                  Nomor Surat
                </th>
                <th className="px-5 py-4">
                  Tanggal
                </th>
                <th className="px-5 py-4">
                  Penerima
                </th>
                <th className="px-5 py-4">
                  Perihal
                </th>
                <th className="px-5 py-4">
                  Jenis
                </th>
                <th className="px-5 py-4">
                  File
                </th>
                <th className="px-5 py-4">
                  Dibuat Oleh
                </th>
                <th className="px-5 py-4 text-center">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-14 text-center"
                  >
                    <Loader2
                      size={28}
                      className="mx-auto animate-spin text-slate-400"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Memuat data...
                    </p>
                  </td>
                </tr>
              ) : filteredLetters.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    Data surat keluar belum tersedia
                  </td>
                </tr>
              ) : (
                filteredLetters.map(
                  (letter, index) => (
                    <tr
                      key={letter.id}
                      className="text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {letter.nomorSurat}
                      </td>

                      <td className="px-5 py-4">
                        {formatDate(
                          letter.tanggalSurat,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {letter.penerima}
                      </td>

                      <td className="max-w-xs px-5 py-4">
                        <p className="truncate">
                          {letter.perihal}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeStyle(
                            letter.jenis,
                          )}`}
                        >
                          {letter.jenis}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {letter.filePath ? (
                          <button
                            type="button"
                            disabled={
                              downloadingId ===
                              letter.id
                            }
                            onClick={() =>
                              handleDownload(
                                letter,
                              )
                            }
                            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-800 disabled:opacity-50"
                          >
                            {downloadingId ===
                            letter.id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Download
                                size={16}
                              />
                            )}
                            Unduh
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Belum ada
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {letter.user?.name ||
                          letter.user
                            ?.username ||
                          '-'}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {!canManage && (
                            <span className="text-xs font-medium text-slate-400">
                              Lihat saja
                            </span>
                          )}

                          {canManage && (
                            <>
                              <label
                                className={`cursor-pointer rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 ${
                                  uploadingId ===
                                  letter.id
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                                }`}
                                title="Upload file"
                              >
                                {uploadingId ===
                                letter.id ? (
                                  <Loader2
                                    size={18}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Upload
                                    size={18}
                                  />
                                )}

                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(
                                    event,
                                  ) => {
                                    const file =
                                      event
                                        .target
                                        .files?.[0];

                                    if (file) {
                                      handleUpload(
                                        letter,
                                        file,
                                      );
                                    }

                                    event.target.value =
                                      '';
                                  }}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    letter,
                                  )
                                }
                                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                title="Edit"
                              >
                                <Edit
                                  size={18}
                                />
                              </button>
                            </>
                          )}

                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDelete(letter)
                              }
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                              title="Pindahkan ke history"
                            >
                              <Trash2
                                size={18}
                              />
                            </button>
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

      {showModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editing
                    ? 'Edit Surat Keluar'
                    : 'Tambah Surat Keluar'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Lengkapi informasi surat keluar
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nomor Surat
                  </label>

                  <input
                    name="nomorSurat"
                    value={form.nomorSurat}
                    onChange={handleChange}
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    placeholder="Contoh: 001/SK/IX/2026"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tanggal Surat
                  </label>

                  <input
                    type="date"
                    name="tanggalSurat"
                    value={form.tanggalSurat}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Penerima
                </label>

                <input
                  name="penerima"
                  value={form.penerima}
                  onChange={handleChange}
                  maxLength={150}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="Nama perusahaan atau penerima"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Perihal
                </label>

                <input
                  name="perihal"
                  value={form.perihal}
                  onChange={handleChange}
                  maxLength={250}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="Perihal surat"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Jenis Surat
                </label>

                <select
                  name="jenis"
                  value={form.jenis}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="BIASA">
                    Biasa
                  </option>
                  <option value="PENTING">
                    Penting
                  </option>
                  <option value="RAHASIA">
                    Rahasia
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Keterangan
                </label>

                <textarea
                  name="keterangan"
                  value={form.keterangan}
                  onChange={handleChange}
                  maxLength={1000}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="Keterangan tambahan"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-w-28 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editing
                    ? 'Simpan'
                    : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Riwayat Surat Keluar
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Surat keluar yang telah dipindahkan ke history
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowHistory(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[800px]">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">
                      No
                    </th>
                    <th className="px-5 py-4">
                      Nomor Surat
                    </th>
                    <th className="px-5 py-4">
                      Penerima
                    </th>
                    <th className="px-5 py-4">
                      Perihal
                    </th>
                    <th className="px-5 py-4">
                      Dihapus
                    </th>
                    <th className="px-5 py-4 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {historyLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-14 text-center"
                      >
                        <Loader2
                          size={28}
                          className="mx-auto animate-spin text-slate-400"
                        />
                      </td>
                    </tr>
                  ) : history.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-14 text-center text-sm text-slate-500"
                      >
                        Belum ada riwayat surat keluar
                      </td>
                    </tr>
                  ) : (
                    history.map(
                      (letter, index) => (
                        <tr
                          key={letter.id}
                          className="text-sm text-slate-700"
                        >
                          <td className="px-5 py-4">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4 font-semibold">
                            {
                              letter.nomorSurat
                            }
                          </td>

                          <td className="px-5 py-4">
                            {letter.penerima}
                          </td>

                          <td className="px-5 py-4">
                            {letter.perihal}
                          </td>

                          <td className="px-5 py-4">
                            {letter.deletedAt
                              ? formatDate(
                                  letter.deletedAt,
                                )
                              : '-'}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmRestore(letter)
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <RotateCcw
                                size={16}
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
          </div>
        </div>
      )}

      {confirmDelete && canManage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">
              Pindahkan ke Riwayat?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Surat <span className="font-semibold text-slate-700">
                {confirmDelete.nomorSurat}
              </span> akan dipindahkan ke riwayat surat keluar.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Ya, Pindahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRestore && canManage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">
              Pulihkan Surat?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Surat <span className="font-semibold text-slate-700">
                {confirmRestore.nomorSurat}
              </span> akan dikembalikan ke daftar surat keluar.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRestore(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleRestore()}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                Ya, Pulihkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default OutgoingLetterPage;
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Download,
  FileText,
  History,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

type LetterType =
  | 'BIASA'
  | 'PENTING'
  | 'RAHASIA'
  | 'SEGERA';

interface User {
  id: number;
  name: string;
  username: string;
}

interface IncomingLetter {
  id: number;
  nomorSurat: string;
  tanggalSurat: string;
  tanggalTerima: string;
  pengirim: string;
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
  tanggalTerima: string;
  pengirim: string;
  perihal: string;
  jenis: LetterType;
  keterangan: string;
}

type MessageType = 'success' | 'error';

interface Message {
  type: MessageType;
  text: string;
}

const API_URL = 'http://localhost:3000';

const initialForm: FormData = {
  nomorSurat: '',
  tanggalSurat: '',
  tanggalTerima: '',
  pengirim: '',
  perihal: '',
  jenis: 'BIASA',
  keterangan: '',
};

function IncomingLetterPage() {
  const [letters, setLetters] = useState<IncomingLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyMode, setHistoryMode] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IncomingLetter | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [confirmDelete, setConfirmDelete] =
    useState<IncomingLetter | null>(null);
  const [confirmRestore, setConfirmRestore] =
    useState<IncomingLetter | null>(null);

  const token = sessionStorage.getItem('access_token');

  // Hak akses frontend:
  // ADMIN & STAFF = dapat tambah, edit, upload, hapus, dan restore.
  // MANAGER & FINANCE = hanya melihat data/file.
  const storedUser = (() => {
    try {
      const rawUser =
        sessionStorage.getItem('user') ||
        localStorage.getItem('user');

      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  })();

  const role = String(
    storedUser?.role ||
      sessionStorage.getItem('role') ||
      localStorage.getItem('role') ||
      '',
  ).toUpperCase();

  const canManage = ['ADMIN', 'STAFF'].includes(role);

  const ensureCanManage = () => {
    if (canManage) {
      return true;
    }

    showMessage(
      'error',
      'Anda tidak memiliki akses untuk melakukan perubahan data surat masuk.',
    );
    return false;
  };

  const showMessage = useCallback(
    (type: MessageType, text: string) => {
      setMessage({ type, text });

      window.setTimeout(() => {
        setMessage(null);
      }, 3500);
    },
    [],
  );

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

  const loadLetters = useCallback(async () => {
    setLoading(true);

    try {
      const endpoint = historyMode
        ? `${API_URL}/incoming-letters/history`
        : `${API_URL}/incoming-letters`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengambil data surat masuk',
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
          : 'Gagal mengambil data surat masuk',
      );
    } finally {
      setLoading(false);
    }
  }, [historyMode, showMessage, token]);

  useEffect(() => {
    void loadLetters();
  }, [loadLetters]);

  const filteredLetters = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) {
      return letters;
    }

    return letters.filter((letter) => {
      return (
        letter.nomorSurat.toLowerCase().includes(keyword) ||
        letter.pengirim.toLowerCase().includes(keyword) ||
        letter.perihal.toLowerCase().includes(keyword) ||
        letter.jenis.toLowerCase().includes(keyword)
      );
    });
  }, [letters, search]);

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  };

  const dateInputValue = (value?: string | null) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  };

  const openCreate = () => {
    if (!ensureCanManage()) {
      return;
    }

    setEditing(null);
    setSelectedFile(null);
    setForm({
      ...initialForm,
      tanggalSurat: new Date().toISOString().slice(0, 10),
      tanggalTerima: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  };

  const openEdit = (letter: IncomingLetter) => {
    if (!ensureCanManage()) {
      return;
    }

    setEditing(letter);
    setSelectedFile(null);
    setForm({
      nomorSurat: letter.nomorSurat,
      tanggalSurat: dateInputValue(letter.tanggalSurat),
      tanggalTerima: dateInputValue(letter.tanggalTerima),
      pengirim: letter.pengirim,
      perihal: letter.perihal,
      jenis: letter.jenis,
      keterangan: letter.keterangan ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditing(null);
    setSelectedFile(null);
    setForm(initialForm);
  };

  const uploadFile = async (
    letterId: number,
    file: File,
  ) => {
    if (!canManage) {
      throw new Error(
        'Anda tidak memiliki akses untuk mengunggah file surat.',
      );
    }

    const fileData = new FormData();
    fileData.append('file', file);

    const response = await fetch(
      `${API_URL}/incoming-letters/${letterId}/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fileData,
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          'Gagal mengunggah file surat',
        ),
      );
    }

    return response.json();
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!ensureCanManage()) {
      return;
    }

    if (
      !form.nomorSurat.trim() ||
      !form.tanggalSurat ||
      !form.pengirim.trim() ||
      !form.perihal.trim()
    ) {
      showMessage(
        'error',
        'Nomor surat, tanggal surat, pengirim, dan perihal wajib diisi',
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nomorSurat: form.nomorSurat.trim(),
        tanggalSurat: form.tanggalSurat,
        tanggalTerima: form.tanggalTerima || undefined,
        pengirim: form.pengirim.trim(),
        perihal: form.perihal.trim(),
        jenis: form.jenis,
        keterangan: form.keterangan.trim() || undefined,
      };

      const endpoint = editing
        ? `${API_URL}/incoming-letters/${editing.id}`
        : `${API_URL}/incoming-letters`;

      const response = await fetch(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            editing
              ? 'Gagal mengubah surat masuk'
              : 'Gagal menambahkan surat masuk',
          ),
        );
      }

      const savedLetter: IncomingLetter =
        await response.json();

      if (selectedFile) {
        await uploadFile(savedLetter.id, selectedFile);
      }

      showMessage(
        'success',
        editing
          ? 'Surat masuk berhasil diperbarui'
          : 'Surat masuk berhasil ditambahkan',
      );

      closeModal();
      await loadLetters();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!ensureCanManage()) {
      setConfirmDelete(null);
      return;
    }

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/incoming-letters/${confirmDelete.id}`,
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
            'Gagal menghapus surat masuk',
          ),
        );
      }

      setConfirmDelete(null);
      showMessage(
        'success',
        'Surat masuk berhasil dipindahkan ke riwayat',
      );
      await loadLetters();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal menghapus surat masuk',
      );
    }
  };

  const handleRestore = async () => {
    if (!ensureCanManage()) {
      setConfirmRestore(null);
      return;
    }

    if (!confirmRestore) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/incoming-letters/${confirmRestore.id}/restore`,
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
            'Gagal memulihkan surat masuk',
          ),
        );
      }

      setConfirmRestore(null);
      showMessage(
        'success',
        'Surat masuk berhasil dipulihkan',
      );
      await loadLetters();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal memulihkan surat masuk',
      );
    }
  };

  const handleRowUpload = async (
    letter: IncomingLetter,
    file: File | undefined,
  ) => {
    if (!file) {
      return;
    }

    if (!ensureCanManage()) {
      return;
    }

    setUploadingId(letter.id);

    try {
      await uploadFile(letter.id, file);
      showMessage(
        'success',
        'File surat berhasil diunggah',
      );
      await loadLetters();
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

  const handleOpenFile = async (
    letter: IncomingLetter,
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/incoming-letters/${letter.id}/file`,
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
            'File tidak dapat dibuka',
          ),
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'File tidak dapat dibuka',
      );
    }
  };

  const typeBadge = (type: LetterType) => {
    const styles: Record<LetterType, string> = {
      BIASA:
        'bg-slate-100 text-slate-600 ring-slate-200',
      PENTING:
        'bg-amber-50 text-amber-700 ring-amber-200',
      RAHASIA:
        'bg-purple-50 text-purple-700 ring-purple-200',
      SEGERA:
        'bg-red-50 text-red-700 ring-red-200',
    };

    return styles[type] ?? styles.BIASA;
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`fixed right-6 top-6 z-[100] flex max-w-md items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-xl ${
            message.type === 'success'
              ? 'border-emerald-200'
              : 'border-red-200'
          }`}
        >
          <div
            className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              message.type === 'success'
                ? 'bg-emerald-500'
                : 'bg-red-500'
            }`}
          />
          <p className="text-sm font-medium text-slate-700">
            {message.text}
          </p>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <FileText size={15} />
            Surat & Dokumen
            <span>/</span>
            <span className="text-slate-600">
              Surat Masuk
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {historyMode
              ? 'Riwayat Surat Masuk'
              : 'Surat Masuk'}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {historyMode
              ? 'Data surat masuk yang telah dipindahkan ke riwayat.'
              : 'Kelola pencatatan dan arsip surat masuk perusahaan.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setHistoryMode((value) => !value);
              setSearch('');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            {historyMode ? (
              <ArrowLeft size={17} />
            ) : (
              <History size={17} />
            )}
            {historyMode
              ? 'Kembali'
              : 'Lihat Riwayat'}
          </button>

          {!historyMode && canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Tambah Surat
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
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
              placeholder="Cari nomor, pengirim, perihal..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() => void loadLetters()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading ? 'animate-spin' : ''
              }
            />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">
                  No
                </th>
                <th className="px-5 py-3.5">
                  Nomor Surat
                </th>
                <th className="px-5 py-3.5">
                  Tanggal Surat
                </th>
                <th className="px-5 py-3.5">
                  Diterima
                </th>
                <th className="px-5 py-3.5">
                  Pengirim
                </th>
                <th className="px-5 py-3.5">
                  Perihal
                </th>
                <th className="px-5 py-3.5">
                  Jenis
                </th>
                <th className="px-5 py-3.5">
                  File
                </th>
                <th className="px-5 py-3.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-16 text-center"
                  >
                    <Loader2
                      size={28}
                      className="mx-auto animate-spin text-blue-600"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Memuat data surat masuk...
                    </p>
                  </td>
                </tr>
              ) : filteredLetters.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-16 text-center"
                  >
                    <Archive
                      size={34}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      {historyMode
                        ? 'Belum ada riwayat surat masuk'
                        : 'Belum ada surat masuk'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLetters.map(
                  (letter, index) => (
                    <tr
                      key={letter.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {letter.nomorSurat}
                        </p>
                        {letter.user && (
                          <p className="mt-1 text-[11px] text-slate-400">
                            Dicatat oleh{' '}
                            {letter.user.name ||
                              letter.user.username}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          letter.tanggalSurat,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          letter.tanggalTerima,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {letter.pengirim}
                      </td>

                      <td className="max-w-[250px] px-5 py-4">
                        <p
                          className="truncate text-sm text-slate-600"
                          title={letter.perihal}
                        >
                          {letter.perihal}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${typeBadge(
                            letter.jenis,
                          )}`}
                        >
                          {letter.jenis.replace(
                            /_/g,
                            ' ',
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {letter.filePath ? (
                          <button
                            type="button"
                            onClick={() =>
                              void handleOpenFile(
                                letter,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                          >
                            <Download size={14} />
                            Buka
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Belum ada
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          {canManage ? (
                            historyMode ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmRestore(letter)
                                }
                                title="Pulihkan"
                                className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                              >
                                <RotateCcw size={17} />
                              </button>
                            ) : (
                              <>
                                <label
                                  title="Upload file"
                                  className="cursor-pointer rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
                                >
                                  {uploadingId === letter.id ? (
                                    <Loader2
                                      size={17}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Upload size={17} />
                                  )}

                                  <input
                                    type="file"
                                    className="hidden"
                                    disabled={
                                      uploadingId === letter.id
                                    }
                                    onChange={(event) => {
                                      void handleRowUpload(
                                        letter,
                                        event.target.files?.[0],
                                      );
                                      event.currentTarget.value = '';
                                    }}
                                  />
                                </label>

                                <button
                                  type="button"
                                  onClick={() => openEdit(letter)}
                                  title="Edit"
                                  className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                                >
                                  <Pencil size={17} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmDelete(letter)
                                  }
                                  title="Pindahkan ke riwayat"
                                  className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </>
                            )
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              Lihat saja
                            </span>
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

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Menampilkan {filteredLetters.length} dari{' '}
          {letters.length} data
        </div>
      </div>

      {modalOpen && canManage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editing
                    ? 'Edit Surat Masuk'
                    : 'Tambah Surat Masuk'}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Lengkapi informasi surat masuk
                  perusahaan.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Nomor Surat
                </label>
                <input
                  type="text"
                  value={form.nomorSurat}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      nomorSurat:
                        event.target.value,
                    })
                  }
                  maxLength={100}
                  required
                  placeholder="Contoh: 001/ABC/IX/2026"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    value={form.tanggalSurat}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        tanggalSurat:
                          event.target.value,
                      })
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Tanggal Terima
                  </label>
                  <input
                    type="date"
                    value={form.tanggalTerima}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        tanggalTerima:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Pengirim
                </label>
                <input
                  type="text"
                  value={form.pengirim}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      pengirim:
                        event.target.value,
                    })
                  }
                  maxLength={150}
                  required
                  placeholder="Nama perusahaan atau pengirim"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Perihal
                </label>
                <input
                  type="text"
                  value={form.perihal}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      perihal:
                        event.target.value,
                    })
                  }
                  maxLength={250}
                  required
                  placeholder="Perihal surat"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Jenis Surat
                </label>
                <select
                  value={form.jenis}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      jenis: event.target
                        .value as LetterType,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
                  <option value="SEGERA">
                    Segera
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  File Surat
                </label>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 transition hover:border-blue-300 hover:bg-blue-50/40">
                  <Upload size={19} />

                  <span>
                    {selectedFile
                      ? selectedFile.name
                      : editing?.filePath
                        ? 'Pilih file baru untuk mengganti file'
                        : 'Pilih file surat'}
                  </span>

                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) =>
                      setSelectedFile(
                        event.target.files?.[0] ??
                          null,
                      )
                    }
                  />
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Keterangan
                </label>
                <textarea
                  value={form.keterangan}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      keterangan:
                        event.target.value,
                    })
                  }
                  maxLength={1000}
                  rows={4}
                  placeholder="Keterangan tambahan..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editing
                    ? 'Simpan Perubahan'
                    : 'Simpan Surat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && canManage && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Pindahkan ke riwayat?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Surat{' '}
              <span className="font-semibold text-slate-700">
                {confirmDelete.nomorSurat}
              </span>{' '}
              akan dipindahkan ke riwayat dan tidak
              tampil pada daftar surat aktif.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmDelete(null)
                }
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Pindahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRestore && canManage && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <RotateCcw size={22} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Pulihkan surat?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Surat{' '}
              <span className="font-semibold text-slate-700">
                {confirmRestore.nomorSurat}
              </span>{' '}
              akan dikembalikan ke daftar surat masuk
              aktif.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmRestore(null)
                }
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleRestore()
                }
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <RotateCcw size={16} />
                Pulihkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncomingLetterPage;
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
  CheckCircle2,
  Download,
  Edit,
  History,
  Loader2,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

type DocumentStatus =
  | 'DRAFT'
  | 'AKTIF'
  | 'SELESAI'
  | 'DIBATALKAN';

interface User {
  id: number;
  name: string;
  username: string;
}

interface DocumentData {
  id: number;
  nomorDokumen?: string | null;
  nama: string;
  kategori: string;
  tanggal: string;
  filePath?: string | null;
  status: DocumentStatus;
  keterangan?: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedById?: number | null;
  user?: User;
}

interface DocumentForm {
  nomorDokumen: string;
  nama: string;
  kategori: string;
  tanggal: string;
  status: DocumentStatus;
  keterangan: string;
}

interface AlertState {
  type: 'success' | 'error';
  message: string;
}

const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

const initialForm: DocumentForm = {
  nomorDokumen: '',
  nama: '',
  kategori: '',
  tanggal: getToday(),
  status: 'DRAFT',
  keterangan: '',
};

function DocumentPage() {
  const [documents, setDocuments] =
    useState<DocumentData[]>([]);

  const [history, setHistory] =
    useState<DocumentData[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [uploadingId, setUploadingId] =
    useState<number | null>(null);

  const [downloadingId, setDownloadingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('SEMUA');

  const [showModal, setShowModal] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [editing, setEditing] =
    useState<DocumentData | null>(null);

  const [form, setForm] =
    useState<DocumentForm>({
      ...initialForm,
    });

  const [alert, setAlert] =
    useState<AlertState | null>(null);

  const [confirmDelete, setConfirmDelete] =
    useState<DocumentData | null>(null);

  const [confirmRestore, setConfirmRestore] =
    useState<DocumentData | null>(null);

  const token =
    sessionStorage.getItem('access_token');

  const getRole = () => {
    const storedUser =
      sessionStorage.getItem('user');

    if (storedUser) {
      try {
        const parsed = JSON.parse(
          storedUser,
        );

        return parsed.role || '';
      } catch {
        // lanjut baca JWT
      }
    }

    if (!token) {
      return '';
    }

    try {
      const payloadPart =
        token.split('.')[1];

      if (!payloadPart) {
        return '';
      }

      const normalized =
        payloadPart
          .replace(/-/g, '+')
          .replace(/_/g, '/');

      const payload = JSON.parse(
        atob(normalized),
      );

      return payload.role || '';
    } catch {
      return '';
    }
  };

  const role =
    String(getRole()).toUpperCase();

  const canManage =
    role === 'ADMIN' ||
    role === 'STAFF';

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
      const data =
        await response.json();

      if (
        Array.isArray(data.message)
      ) {
        return data.message.join(', ');
      }

      return (
        data.message ||
        fallback
      );
    } catch {
      return fallback;
    }
  };

  const fetchDocuments =
    async () => {
      if (!token) {
        return;
      }

      setLoading(true);

      try {
        const response =
          await fetch(
            `${API_URL}/documents`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              'Gagal mengambil data dokumen',
            ),
          );
        }

        const data =
          await response.json();

        setDocuments(data);
      } catch (error) {
        showMessage(
          'error',
          error instanceof Error
            ? error.message
            : 'Gagal mengambil data dokumen',
        );
      } finally {
        setLoading(false);
      }
    };

  const fetchHistory =
    async () => {
      if (!token || !canManage) {
        return;
      }

      setHistoryLoading(true);

      try {
        const response =
          await fetch(
            `${API_URL}/documents/history`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              'Gagal mengambil history dokumen',
            ),
          );
        }

        const data =
          await response.json();

        setHistory(data);
      } catch (error) {
        showMessage(
          'error',
          error instanceof Error
            ? error.message
            : 'Gagal mengambil history dokumen',
        );
      } finally {
        setHistoryLoading(false);
      }
    };

  useEffect(() => {
    void fetchDocuments();
  }, []);

  const filteredDocuments =
    useMemo(() => {
      const keyword =
        search
          .toLowerCase()
          .trim();

      return documents.filter(
        (document) => {
          const nomor =
            document.nomorDokumen ||
            '';

          const matchesSearch =
            !keyword ||
            document.nama
              .toLowerCase()
              .includes(keyword) ||
            document.kategori
              .toLowerCase()
              .includes(keyword) ||
            nomor
              .toLowerCase()
              .includes(keyword);

          const matchesStatus =
            statusFilter ===
              'SEMUA' ||
            document.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      documents,
      search,
      statusFilter,
    ]);

  const openCreate = () => {
    if (!canManage) {
      showMessage(
        'error',
        'Anda tidak memiliki akses untuk menambah dokumen',
      );
      return;
    }

    setEditing(null);

    setForm({
      nomorDokumen: '',
      nama: '',
      kategori: '',
      tanggal: getToday(),
      status: 'DRAFT',
      keterangan: '',
    });

    setShowModal(true);
  };

  const openEdit = (
    document: DocumentData,
  ) => {
    if (!canManage) {
      showMessage(
        'error',
        'Anda tidak memiliki akses untuk mengubah dokumen',
      );
      return;
    }

    setEditing(document);

    setForm({
      nomorDokumen:
        document.nomorDokumen ||
        '',
      nama:
        document.nama,
      kategori:
        document.kategori,
      tanggal:
        document.tanggal.split(
          'T',
        )[0],
      status:
        document.status,
      keterangan:
        document.keterangan ||
        '',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setShowModal(false);
    setEditing(null);

    setForm({
      ...initialForm,
      tanggal: getToday(),
    });
  };

  const handleChange = (
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!canManage) {
      showMessage(
        'error',
        'Anda tidak memiliki akses untuk mengubah data dokumen',
      );
      return;
    }

    if (!token) {
      showMessage(
        'error',
        'Sesi login tidak ditemukan',
      );

      return;
    }

    if (!form.nama.trim()) {
      showMessage(
        'error',
        'Nama dokumen wajib diisi',
      );

      return;
    }

    if (!form.kategori.trim()) {
      showMessage(
        'error',
        'Kategori dokumen wajib diisi',
      );

      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        nomorDokumen:
          form.nomorDokumen.trim() ||
          undefined,
        nama:
          form.nama.trim(),
        kategori:
          form.kategori.trim(),
        tanggal:
          form.tanggal ||
          undefined,
        status:
          form.status,
        keterangan:
          form.keterangan.trim() ||
          undefined,
      };

      const url =
        editing
          ? `${API_URL}/documents/${editing.id}`
          : `${API_URL}/documents`;

      const response =
        await fetch(url, {
          method: editing
            ? 'PATCH'
            : 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify(
            payload,
          ),
        });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            editing
              ? 'Gagal memperbarui dokumen'
              : 'Gagal menambahkan dokumen',
          ),
        );
      }

      showMessage(
        'success',
        editing
          ? 'Dokumen berhasil diperbarui'
          : 'Dokumen berhasil ditambahkan',
      );

      setShowModal(false);
      setEditing(null);

      setForm({
        ...initialForm,
        tanggal: getToday(),
      });

      await fetchDocuments();
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
      showMessage(
        'error',
        'Anda tidak memiliki akses untuk menghapus dokumen',
      );
      return;
    }

    if (!token || !confirmDelete) {
      return;
    }

    const document = confirmDelete;

    try {
      const response =
        await fetch(
          `${API_URL}/documents/${document.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal memindahkan dokumen ke riwayat',
          ),
        );
      }

      setConfirmDelete(null);

      showMessage(
        'success',
        'Dokumen berhasil dipindahkan ke riwayat',
      );

      await fetchDocuments();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal memindahkan dokumen ke riwayat',
      );
    }
  };

  const handleRestore = async () => {
    if (!canManage) {
      setConfirmRestore(null);
      showMessage(
        'error',
        'Anda tidak memiliki akses untuk memulihkan dokumen',
      );
      return;
    }

    if (!token || !confirmRestore) {
      return;
    }

    const document = confirmRestore;

    try {
      const response =
        await fetch(
          `${API_URL}/documents/${document.id}/restore`,
          {
            method: 'PATCH',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal memulihkan dokumen',
          ),
        );
      }

      setConfirmRestore(null);

      showMessage(
        'success',
        'Dokumen berhasil dipulihkan',
      );

      await Promise.all([
        fetchDocuments(),
        fetchHistory(),
      ]);
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal memulihkan dokumen',
      );
    }
  };

  const handleUpload = async (
    document: DocumentData,
    file: File,
  ) => {
    if (!canManage) {
      showMessage(
        'error',
        'Anda tidak memiliki akses untuk mengunggah file dokumen',
      );
      return;
    }

    if (!token) {
      return;
    }

    setUploadingId(document.id);

    try {
      const formData =
        new FormData();

      formData.append(
        'file',
        file,
      );

      const response =
        await fetch(
          `${API_URL}/documents/${document.id}/upload`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            body: formData,
          },
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengunggah file dokumen',
          ),
        );
      }

      showMessage(
        'success',
        'File dokumen berhasil diunggah',
      );

      await fetchDocuments();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal mengunggah file dokumen',
      );
    } finally {
      setUploadingId(null);
    }
  };

  const handleDownload = async (
    document: DocumentData,
  ) => {
    if (!token) {
      return;
    }

    setDownloadingId(
      document.id,
    );

    try {
      const response =
        await fetch(
          `${API_URL}/documents/${document.id}/file`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengunduh file dokumen',
          ),
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(blob);

      const anchor =
        window.document.createElement(
          'a',
        );

      const fileName =
        document.filePath
          ?.replace(/\\/g, '/')
          .split('/')
          .pop() ||
        document.nama;

      anchor.href = url;
      anchor.download =
        fileName;

      window.document.body.appendChild(
        anchor,
      );

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal mengunduh file dokumen',
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const openHistory = async () => {
    if (!canManage) {
      showMessage(
        'error',
        'Anda tidak memiliki akses ke riwayat dokumen',
      );
      return;
    }

    setShowHistory(true);

    await fetchHistory();
  };

  const formatDate = (
    date?: string | null,
  ) => {
    if (!date) {
      return '-';
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return '-';
    }

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(parsed);
  };

  const getStatusStyle = (
    status: DocumentStatus,
  ) => {
    switch (status) {
      case 'AKTIF':
        return 'bg-blue-100 text-blue-700';

      case 'SELESAI':
        return 'bg-emerald-100 text-emerald-700';

      case 'DIBATALKAN':
        return 'bg-red-100 text-red-700';

      case 'DRAFT':
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (
    status: DocumentStatus,
  ) => {
    switch (status) {
      case 'AKTIF':
        return 'Aktif';

      case 'SELESAI':
        return 'Selesai';

      case 'DIBATALKAN':
        return 'Dibatalkan';

      case 'DRAFT':
      default:
        return 'Draft';
    }
  };

  return (
    <div className="space-y-6">
      {alert && (
        <div
          className={`fixed right-6 top-6 z-[100] flex max-w-md items-start gap-3 rounded-xl border px-5 py-4 shadow-xl ${
            alert.type ===
            'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {alert.type ===
          'success' ? (
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />
          ) : (
            <XCircle
              size={20}
              className="mt-0.5 shrink-0"
            />
          )}

          <div className="flex-1 text-sm font-medium">
            {alert.message}
          </div>

          <button
            type="button"
            onClick={() =>
              setAlert(null)
            }
            className="rounded p-1 hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dokumen
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola arsip dan dokumen
            perusahaan
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => {
                void openHistory();
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <History size={18} />
              Riwayat
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={18} />
              Tambah Dokumen
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Dokumen
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {documents.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Draft
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-700">
            {
              documents.filter(
                (item) =>
                  item.status ===
                  'DRAFT',
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Aktif
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {
              documents.filter(
                (item) =>
                  item.status ===
                  'AKTIF',
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Selesai
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {
              documents.filter(
                (item) =>
                  item.status ===
                  'SELESAI',
              ).length
            }
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Cari nomor, nama, atau kategori dokumen..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
          >
            <option value="SEMUA">
              Semua Status
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="AKTIF">
              Aktif
            </option>

            <option value="SELESAI">
              Selesai
            </option>

            <option value="DIBATALKAN">
              Dibatalkan
            </option>
          </select>

          <button
            type="button"
            onClick={() => {
              void fetchDocuments();
            }}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">
                  No
                </th>

                <th className="px-5 py-4">
                  Nomor
                </th>

                <th className="px-5 py-4">
                  Nama Dokumen
                </th>

                <th className="px-5 py-4">
                  Kategori
                </th>

                <th className="px-5 py-4">
                  Tanggal
                </th>

                <th className="px-5 py-4">
                  Status
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
                      Memuat data
                      dokumen...
                    </p>
                  </td>
                </tr>
              ) : filteredDocuments.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    Data dokumen tidak
                    ditemukan.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map(
                  (
                    document,
                    index,
                  ) => (
                    <tr
                      key={
                        document.id
                      }
                      className="text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {document.nomorDokumen ||
                          '-'}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {
                            document.nama
                          }
                        </div>

                        {document.keterangan && (
                          <div className="mt-1 max-w-[250px] truncate text-xs text-slate-400">
                            {
                              document.keterangan
                            }
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {
                          document.kategori
                        }
                      </td>

                      <td className="px-5 py-4">
                        {formatDate(
                          document.tanggal,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            document.status,
                          )}`}
                        >
                          {getStatusLabel(
                            document.status,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {document.filePath ? (
                          <button
                            type="button"
                            onClick={() => {
                              void handleDownload(
                                document,
                              );
                            }}
                            disabled={
                              downloadingId ===
                              document.id
                            }
                            className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {downloadingId ===
                            document.id ? (
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
                        {document.user
                          ?.name ||
                          document.user
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
                                className={`rounded-lg p-2 transition ${
                                  uploadingId ===
                                  document.id
                                    ? 'cursor-not-allowed text-slate-400'
                                    : 'cursor-pointer text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title="Upload file"
                              >
                                {uploadingId ===
                                document.id ? (
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
                                  disabled={
                                    uploadingId ===
                                    document.id
                                  }
                                  onChange={(
                                    event,
                                  ) => {
                                    const file =
                                      event
                                        .target
                                        .files?.[0];

                                    if (
                                      file
                                    ) {
                                      void handleUpload(
                                        document,
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
                                    document,
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
                              onClick={() => {
                                setConfirmDelete(
                                  document,
                                );
                              }}
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                              title="Pindahkan ke riwayat"
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

        {!loading &&
          filteredDocuments.length >
            0 && (
            <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
              Menampilkan{' '}
              {
                filteredDocuments.length
              }{' '}
              dari {documents.length}{' '}
              dokumen
            </div>
          )}
      </div>

      {showModal && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editing
                    ? 'Edit Dokumen'
                    : 'Tambah Dokumen'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Lengkapi data
                  dokumen di bawah
                  ini.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nomor Dokumen
                </label>

                <input
                  type="text"
                  name="nomorDokumen"
                  value={
                    form.nomorDokumen
                  }
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Contoh: DOC/001/IX/2026"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Nomor dokumen boleh
                  dikosongkan.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nama Dokumen
                  <span className="text-red-500">
                    {' '}
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  maxLength={200}
                  required
                  placeholder="Masukkan nama dokumen"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Kategori
                    <span className="text-red-500">
                      {' '}
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="kategori"
                    value={
                      form.kategori
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={100}
                    required
                    placeholder="Contoh: Kontrak"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tanggal
                  </label>

                  <input
                    type="date"
                    name="tanggal"
                    value={
                      form.tanggal
                    }
                    onChange={
                      handleChange
                    }
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="DRAFT">
                    Draft
                  </option>

                  <option value="AKTIF">
                    Aktif
                  </option>

                  <option value="SELESAI">
                    Selesai
                  </option>

                  <option value="DIBATALKAN">
                    Dibatalkan
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Keterangan
                </label>

                <textarea
                  name="keterangan"
                  value={
                    form.keterangan
                  }
                  onChange={handleChange}
                  maxLength={1000}
                  rows={4}
                  placeholder="Tambahkan keterangan jika diperlukan"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editing
                    ? 'Simpan Perubahan'
                    : 'Tambah Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistory && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Riwayat Dokumen
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Dokumen yang telah
                  dipindahkan dari
                  daftar aktif.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowHistory(
                    false,
                  )
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
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
                      Nomor
                    </th>

                    <th className="px-5 py-4">
                      Nama
                    </th>

                    <th className="px-5 py-4">
                      Kategori
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
                        className="py-14 text-center"
                      >
                        <Loader2
                          size={28}
                          className="mx-auto animate-spin text-slate-400"
                        />

                        <p className="mt-3 text-sm text-slate-500">
                          Memuat riwayat...
                        </p>
                      </td>
                    </tr>
                  ) : history.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-14 text-center text-sm text-slate-500"
                      >
                        Belum ada riwayat
                        dokumen.
                      </td>
                    </tr>
                  ) : (
                    history.map(
                      (
                        document,
                        index,
                      ) => (
                        <tr
                          key={
                            document.id
                          }
                          className="text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {document.nomorDokumen ||
                              '-'}
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {
                              document.nama
                            }
                          </td>

                          <td className="px-5 py-4">
                            {
                              document.kategori
                            }
                          </td>

                          <td className="px-5 py-4">
                            {formatDate(
                              document.deletedAt,
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmRestore(
                                  document,
                                );
                              }}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700 transition hover:bg-emerald-100"
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

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setShowHistory(
                    false,
                  )
                }
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && canManage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">
              Pindahkan Dokumen ke Riwayat?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Dokumen{' '}
              <span className="font-semibold text-slate-700">
                {confirmDelete.nama}
              </span>{' '}
              akan dipindahkan dari daftar aktif ke riwayat.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfirmDelete(null)
                }
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleDelete();
                }}
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
              Pulihkan Dokumen?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Dokumen{' '}
              <span className="font-semibold text-slate-700">
                {confirmRestore.nama}
              </span>{' '}
              akan dikembalikan ke daftar dokumen aktif.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfirmRestore(null)
                }
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleRestore();
                }}
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

export default DocumentPage;
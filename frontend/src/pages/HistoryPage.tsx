import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  AlertTriangle,
  Archive,
  Car,
  CheckCircle2,
  FileText,
  Inbox,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

type HistoryType =
  | 'driver'
  | 'vehicle'
  | 'incoming-letter'
  | 'document'
  | 'surat-jalan';

type ActionType =
  | 'restore'
  | 'delete';

interface HistoryItem {
  id: number;
  type: HistoryType;
  title: string;
  subtitle: string;
  deletedAt: string | null;
  orderStatus?: string | null;
}

interface Driver {
  id: number;
  name: string;
  phone?: string | null;
  licenseNo?: string | null;
  deletedAt?: string | null;
}

interface Vehicle {
  id: number;
  nomorPolisi: string;
  jenis: string;
  merek?: string | null;
  model?: string | null;
  deletedAt?: string | null;
}

interface IncomingLetter {
  id: number;
  nomorSurat: string;
  pengirim: string;
  perihal: string;
  deletedAt?: string | null;
}

interface DocumentData {
  id: number;
  nomorDokumen?: string | null;
  nama: string;
  kategori: string;
  deletedAt?: string | null;
}

interface SuratJalan {
  id: number;
  nomorSurat: string;
  tujuan?: string | null;
  penerima?: string | null;
  deletedAt?: string | null;
  order: {
    id: number;
    orderNumber: string;
    status: string;
    customer?: {
      id: number;
      name: string;
    } | null;
  };
}

type FilterType =
  | 'all'
  | HistoryType;

interface ConfirmModal {
  action: ActionType;
  item: HistoryItem;
}

function HistoryPage() {
  const [items, setItems] = useState<
    HistoryItem[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState('');

  const [filter, setFilter] =
    useState<FilterType>('all');

  const [confirmModal, setConfirmModal] =
    useState<ConfirmModal | null>(null);

  const [message, setMessage] =
    useState<{
      type: 'success' | 'error';
      text: string;
    } | null>(null);

  const token =
    sessionStorage.getItem(
      'access_token',
    );

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const showMessage = (
    type: 'success' | 'error',
    text: string,
  ) => {
    setMessage({
      type,
      text,
    });

    window.setTimeout(() => {
      setMessage(null);
    }, 4000);
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
        data.message || fallback
      );
    } catch {
      return fallback;
    }
  };

  const fetchJson = async <T,>(
    url: string,
  ): Promise<T> => {
    const response = await fetch(
      `${API_URL}${url}`,
      {
        headers,
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          `Gagal mengambil ${url}`,
        ),
      );
    }

    return response.json();
  };

  const fetchHistory =
    useCallback(async () => {
      if (!token) {
        return;
      }

      setLoading(true);

      try {
        const [
          drivers,
          vehicles,
          incomingLetters,
          documents,
          suratJalans,
        ] = await Promise.all([
          fetchJson<Driver[]>(
            '/drivers/history',
          ),
          fetchJson<Vehicle[]>(
            '/vehicles/history',
          ),
          fetchJson<
            IncomingLetter[]
          >(
            '/incoming-letters/history',
          ),
          fetchJson<DocumentData[]>(
            '/documents/history',
          ),
          fetchJson<SuratJalan[]>(
            '/surat-jalan/history',
          ),
        ]);

        const combined: HistoryItem[] =
          [
            ...drivers.map(
              (
                driver,
              ): HistoryItem => ({
                id: driver.id,
                type: 'driver',
                title: driver.name,
                subtitle:
                  driver.licenseNo
                    ? `SIM: ${driver.licenseNo}`
                    : driver.phone ||
                      'Driver',
                deletedAt:
                  driver.deletedAt ||
                  null,
              }),
            ),

            ...vehicles.map(
              (
                vehicle,
              ): HistoryItem => ({
                id: vehicle.id,
                type: 'vehicle',
                title:
                  vehicle.nomorPolisi,
                subtitle: [
                  vehicle.jenis,
                  vehicle.merek,
                  vehicle.model,
                ]
                  .filter(Boolean)
                  .join(' • '),
                deletedAt:
                  vehicle.deletedAt ||
                  null,
              }),
            ),

            ...incomingLetters.map(
              (
                letter,
              ): HistoryItem => ({
                id: letter.id,
                type:
                  'incoming-letter',
                title:
                  letter.nomorSurat,
                subtitle:
                  `${letter.pengirim} • ${letter.perihal}`,
                deletedAt:
                  letter.deletedAt ||
                  null,
              }),
            ),

            ...documents.map(
              (
                document,
              ): HistoryItem => ({
                id: document.id,
                type: 'document',
                title:
                  document.nama,
                subtitle:
                  document.nomorDokumen
                    ? `${document.nomorDokumen} • ${document.kategori}`
                    : document.kategori,
                deletedAt:
                  document.deletedAt ||
                  null,
              }),
            ),

            ...suratJalans.map(
              (
                suratJalan,
              ): HistoryItem => ({
                id: suratJalan.id,
                type: 'surat-jalan',
                title:
                  suratJalan.nomorSurat,
                subtitle: [
                  suratJalan.order
                    ?.orderNumber,
                  suratJalan.order
                    ?.customer?.name,
                  suratJalan.tujuan,
                ]
                  .filter(Boolean)
                  .join(' • '),
                deletedAt:
                  suratJalan.deletedAt ||
                  null,
                orderStatus:
                  suratJalan.order
                    ?.status || null,
              }),
            ),
          ];

        combined.sort((a, b) => {
          const dateA = a.deletedAt
            ? new Date(
                a.deletedAt,
              ).getTime()
            : 0;

          const dateB = b.deletedAt
            ? new Date(
                b.deletedAt,
              ).getTime()
            : 0;

          return dateB - dateA;
        });

        setItems(combined);
      } catch (error) {
        showMessage(
          'error',
          error instanceof Error
            ? error.message
            : 'Gagal mengambil data riwayat',
        );
      } finally {
        setLoading(false);
      }
    }, [token]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const getRestoreEndpoint = (
    item: HistoryItem,
  ) => {
    switch (item.type) {
      case 'driver':
        return `/drivers/${item.id}/restore`;

      case 'vehicle':
        return `/vehicles/${item.id}/restore`;

      case 'incoming-letter':
        return `/incoming-letters/${item.id}/restore`;

      case 'document':
        return `/documents/${item.id}/restore`;

      case 'surat-jalan':
        return `/surat-jalan/${item.id}/restore`;
    }
  };

  const getDeleteEndpoint = (
    item: HistoryItem,
  ) => {
    switch (item.type) {
      case 'driver':
        return `/drivers/${item.id}/permanent`;

      case 'vehicle':
        return `/vehicles/${item.id}/permanent`;

      case 'incoming-letter':
        return `/incoming-letters/${item.id}/permanent`;

      case 'document':
        return `/documents/${item.id}/permanent`;

      case 'surat-jalan':
        return `/surat-jalan/${item.id}/permanent`;
    }
  };

  const handleRestore = async (
    item: HistoryItem,
  ) => {
    if (!token) {
      return;
    }

    if (
      item.type === 'surat-jalan' &&
      item.orderStatus === 'SELESAI'
    ) {
      showMessage(
        'error',
        'Surat jalan dari pesanan yang sudah selesai tidak dapat dipulihkan',
      );

      return;
    }

    const key =
      `restore-${item.type}-${item.id}`;

    setProcessing(key);

    try {
      const response = await fetch(
        `${API_URL}${getRestoreEndpoint(
          item,
        )}`,
        {
          method: 'PATCH',
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal memulihkan data',
          ),
        );
      }

      const data = await response
        .json()
        .catch(() => null);

      setConfirmModal(null);

      showMessage(
        'success',
        data?.message ||
          `"${item.title}" berhasil dipulihkan`,
      );

      await fetchHistory();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal memulihkan data',
      );
    } finally {
      setProcessing(null);
    }
  };

  const handlePermanentDelete = async (
    item: HistoryItem,
  ) => {
    if (!token) {
      return;
    }

    if (
      item.type === 'surat-jalan' &&
      item.orderStatus === 'SELESAI'
    ) {
      showMessage(
        'error',
        'Surat jalan dari pesanan yang sudah selesai merupakan riwayat transaksi dan tidak dapat dihapus permanen',
      );

      return;
    }

    const key =
      `delete-${item.type}-${item.id}`;

    setProcessing(key);

    try {
      const response = await fetch(
        `${API_URL}${getDeleteEndpoint(
          item,
        )}`,
        {
          method: 'DELETE',
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal menghapus data permanen',
          ),
        );
      }

      const data = await response
        .json()
        .catch(() => null);

      setConfirmModal(null);

      showMessage(
        'success',
        data?.message ||
          `"${item.title}" berhasil dihapus permanen`,
      );

      await fetchHistory();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal menghapus data permanen',
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirm = () => {
    if (!confirmModal) {
      return;
    }

    if (
      confirmModal.action ===
      'restore'
    ) {
      void handleRestore(
        confirmModal.item,
      );

      return;
    }

    void handlePermanentDelete(
      confirmModal.item,
    );
  };

  const filteredItems =
    items.filter((item) => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      const matchesSearch =
        !keyword ||
        item.title
          .toLowerCase()
          .includes(keyword) ||
        item.subtitle
          .toLowerCase()
          .includes(keyword);

      const matchesFilter =
        filter === 'all' ||
        item.type === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });

  const formatDate = (
    value: string | null,
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

  const getTypeLabel = (
    type: HistoryType,
  ) => {
    switch (type) {
      case 'driver':
        return 'Driver';

      case 'vehicle':
        return 'Kendaraan';

      case 'incoming-letter':
        return 'Surat Masuk';

      case 'document':
        return 'Dokumen';

      case 'surat-jalan':
        return 'Surat Jalan';
    }
  };

  const getIcon = (
    type: HistoryType,
  ) => {
    switch (type) {
      case 'driver':
        return (
          <UserRound size={18} />
        );

      case 'vehicle':
        return <Car size={18} />;

      case 'incoming-letter':
        return <Inbox size={18} />;

      case 'document':
        return (
          <FileText size={18} />
        );

      case 'surat-jalan':
        return <Send size={18} />;
    }
  };

  const countType = (
    type: HistoryType,
  ) => {
    return items.filter(
      (item) => item.type === type,
    ).length;
  };

  const modalProcessing =
    confirmModal
      ? processing ===
        `${confirmModal.action}-${confirmModal.item.type}-${confirmModal.item.id}`
      : false;

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`fixed right-6 top-6 z-[100] flex max-w-md items-start gap-3 rounded-xl border px-5 py-4 shadow-xl ${
            message.type ===
            'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.type ===
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

          <p className="flex-1 text-sm font-medium">
            {message.text}
          </p>

          <button
            type="button"
            onClick={() =>
              setMessage(null)
            }
            className="shrink-0 opacity-70 transition hover:opacity-100"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2.5 text-white">
            <Archive size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Riwayat
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola data yang telah
              dihapus atau diarsipkan
              dari aplikasi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void fetchHistory();
          }}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCcw
            size={17}
            className={
              loading
                ? 'animate-spin'
                : ''
            }
          />

          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <button
          type="button"
          onClick={() =>
            setFilter('all')
          }
          className={`rounded-xl border p-5 text-left shadow-sm transition ${
            filter === 'all'
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
          }`}
        >
          <p
            className={`text-sm ${
              filter === 'all'
                ? 'text-slate-300'
                : 'text-slate-500'
            }`}
          >
            Semua
          </p>

          <p className="mt-2 text-3xl font-bold">
            {items.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilter('driver')
          }
          className={`rounded-xl border p-5 text-left shadow-sm transition ${
            filter === 'driver'
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-500">
            Driver
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {countType('driver')}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilter('vehicle')
          }
          className={`rounded-xl border p-5 text-left shadow-sm transition ${
            filter === 'vehicle'
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-500">
            Kendaraan
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {countType('vehicle')}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilter(
              'incoming-letter',
            )
          }
          className={`rounded-xl border p-5 text-left shadow-sm transition ${
            filter ===
            'incoming-letter'
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-500">
            Surat Masuk
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {countType(
              'incoming-letter',
            )}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilter('document')
          }
          className={`rounded-xl border p-5 text-left shadow-sm transition ${
            filter === 'document'
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-500">
            Dokumen
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {countType('document')}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilter('surat-jalan')
          }
          className={`rounded-xl border p-5 text-left shadow-sm transition ${
            filter === 'surat-jalan'
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-500">
            Surat Jalan
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {countType(
              'surat-jalan',
            )}
          </p>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-xl">
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
              placeholder="Cari data riwayat..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">
                  No
                </th>

                <th className="px-5 py-4">
                  Jenis
                </th>

                <th className="px-5 py-4">
                  Data
                </th>

                <th className="px-5 py-4">
                  Keterangan
                </th>

                <th className="px-5 py-4">
                  Dihapus / Diarsipkan
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
                    colSpan={6}
                    className="px-5 py-16 text-center"
                  >
                    <Loader2
                      size={30}
                      className="mx-auto animate-spin text-slate-400"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Memuat data
                      riwayat...
                    </p>
                  </td>
                </tr>
              ) : filteredItems.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center"
                  >
                    <Trash2
                      size={36}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-medium text-slate-600">
                      Riwayat kosong
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Belum ada data pada
                      kategori ini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(
                  (item, index) => {
                    const restoreKey =
                      `restore-${item.type}-${item.id}`;

                    const deleteKey =
                      `delete-${item.type}-${item.id}`;

                    const locked =
                      item.type ===
                        'surat-jalan' &&
                      item.orderStatus ===
                        'SELESAI';

                    return (
                      <tr
                        key={`${item.type}-${item.id}`}
                        className="text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          {index + 1}
                        </td>

                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                            {getIcon(
                              item.type,
                            )}

                            {getTypeLabel(
                              item.type,
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {item.title}
                          </p>

                          {locked && (
                            <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Transaksi Selesai
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {item.subtitle ||
                            '-'}
                        </td>

                        <td className="px-5 py-4">
                          {formatDate(
                            item.deletedAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {locked ? (
                            <div className="text-center">
                              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                                <Archive
                                  size={15}
                                />
                                Arsip Transaksi
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModal(
                                    {
                                      action:
                                        'restore',
                                      item,
                                    },
                                  )
                                }
                                disabled={
                                  processing !==
                                  null
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processing ===
                                restoreKey ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <RotateCcw
                                    size={16}
                                  />
                                )}

                                Pulihkan
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModal(
                                    {
                                      action:
                                        'delete',
                                      item,
                                    },
                                  )
                                }
                                disabled={
                                  processing !==
                                  null
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processing ===
                                deleteKey ? (
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={16}
                                  />
                                )}

                                Hapus Permanen
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
            Menampilkan{' '}
            {filteredItems.length}{' '}
            data dari {items.length}{' '}
            riwayat
          </div>
        )}
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                  confirmModal.action ===
                  'delete'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {confirmModal.action ===
                'delete' ? (
                  <AlertTriangle
                    size={27}
                  />
                ) : (
                  <RotateCcw
                    size={27}
                  />
                )}
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-xl font-bold text-slate-800">
                  {confirmModal.action ===
                  'delete'
                    ? 'Hapus Permanen?'
                    : 'Pulihkan Data?'}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {confirmModal.action ===
                  'delete'
                    ? 'Data berikut akan dihapus secara permanen dan tidak dapat dipulihkan kembali.'
                    : 'Data berikut akan dikembalikan ke data aktif.'}
                </p>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-slate-500">
                    {getIcon(
                      confirmModal.item
                        .type,
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">
                      {
                        confirmModal.item
                          .title
                      }
                    </p>

                    <p className="mt-1 break-words text-sm text-slate-500">
                      {
                        confirmModal.item
                          .subtitle
                      }
                    </p>

                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {getTypeLabel(
                        confirmModal.item
                          .type,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {confirmModal.action ===
                'delete' && (
                <div className="mt-4 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
                  <AlertTriangle
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <p className="text-sm leading-5">
                    Tindakan ini tidak
                    dapat dibatalkan.
                    File terkait juga
                    dapat ikut terhapus
                    secara permanen.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-4">
              <button
                type="button"
                disabled={
                  modalProcessing
                }
                onClick={() =>
                  setConfirmModal(
                    null,
                  )
                }
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  modalProcessing
                }
                onClick={
                  handleConfirm
                }
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmModal.action ===
                  'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {modalProcessing ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Memproses...
                  </>
                ) : confirmModal.action ===
                  'delete' ? (
                  <>
                    <Trash2
                      size={17}
                    />
                    Hapus Permanen
                  </>
                ) : (
                  <>
                    <RotateCcw
                      size={17}
                    />
                    Pulihkan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import {
  AlertTriangle,
  Archive,
  Boxes,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import axios from 'axios';
import api from '../api/axios';

type ProductType =
  | 'BAHAN_MENTAH'
  | 'BARANG_JADI';

interface Product {
  id: number;
  code: string;
  name: string;
  type: ProductType;
  unit: string;
  stock: number;
  minimumStock: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

interface ProductForm {
  name: string;
  type: ProductType;
  unit: string;
  stock: string;
  minimumStock: string;
  description: string;
  isActive: boolean;
}

const initialForm: ProductForm = {
  name: '',
  type: 'BAHAN_MENTAH',
  unit: '',
  stock: '0',
  minimumStock: '0',
  description: '',
  isActive: true,
};

function ProductPage() {
  const storedUser = sessionStorage.getItem('user');
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;
  const role = currentUser?.role;
  const canManage = role === 'ADMIN' || role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  const [products, setProducts] =
    useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] =
    useState<'SEMUA' | ProductType>('SEMUA');

  const [loading, setLoading] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] =
    useState('');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [archiveProduct, setArchiveProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductForm>(initialForm);

  const [historyOpen, setHistoryOpen] =
    useState(false);

  const [historySearch, setHistorySearch] =
    useState('');

  const [historyProducts, setHistoryProducts] =
    useState<Product[]>([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState('');

  const [restoringId, setRestoringId] =
    useState<number | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await api.get<Product[]>('/products');

      setProducts(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError(
            'Tidak dapat terhubung ke server.',
          );
        } else {
          setError(
            'Data produk gagal dimuat.',
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
        await api.get<Product[]>(
          '/products/history',
        );

      setHistoryProducts(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Riwayat produk gagal dimuat.',
        );
      } else {
        setHistoryError(
          'Riwayat produk gagal dimuat.',
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        [
          product.code,
          product.name,
          product.unit,
          product.description,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(keyword),
          );

      const matchesType =
        typeFilter === 'SEMUA' ||
        product.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [products, search, typeFilter]);

  const filteredHistory = useMemo(() => {
    const keyword =
      historySearch.trim().toLowerCase();

    if (!keyword) {
      return historyProducts;
    }

    return historyProducts.filter(
      (product) =>
        [
          product.code,
          product.name,
          product.unit,
          product.description,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(keyword),
          ),
    );
  }, [historyProducts, historySearch]);

  const rawMaterialCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.type === 'BAHAN_MENTAH',
      ).length,
    [products],
  );

  const finishedProductCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.type === 'BARANG_JADI',
      ).length,
    [products],
  );

  const lowStockCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.type === 'BAHAN_MENTAH' &&
          product.isActive &&
          product.stock <=
            product.minimumStock,
      ).length,
    [products],
  );

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(initialForm);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (
    product: Product,
  ) => {
    setEditingProduct(product);

    setForm({
      name: product.name,
      type: product.type,
      unit: product.unit,
      stock: String(product.stock),
      minimumStock: String(
        product.minimumStock,
      ),
      description:
        product.description ?? '',
      isActive: product.isActive,
    });

    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingProduct(null);
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

    const stock = Number(form.stock);
    const minimumStock = Number(
      form.minimumStock,
    );

    if (
      Number.isNaN(stock) ||
      stock < 0 ||
      Number.isNaN(minimumStock) ||
      minimumStock < 0
    ) {
      setError(
        'Stok dan minimum stok harus berupa angka 0 atau lebih.',
      );
      setSubmitting(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      unit: form.unit.trim(),
      stock,
      minimumStock,
      description:
        form.description.trim() || undefined,
      isActive: form.isActive,
    };

    try {
      if (editingProduct) {
        await api.patch(
          `/products/${editingProduct.id}`,
          payload,
        );

        setSuccess(
          'Data produk berhasil diperbarui.',
        );
      } else {
        await api.post(
          '/products',
          payload,
        );

        setSuccess(
          'Produk baru berhasil ditambahkan.',
        );
      }

      setModalOpen(false);
      setEditingProduct(null);
      setForm(initialForm);

      await fetchProducts();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        if (Array.isArray(message)) {
          setError(
            message[0] ??
              'Data produk tidak valid.',
          );
        } else if (
          typeof message === 'string'
        ) {
          setError(message);
        } else {
          setError(
            'Data produk gagal disimpan.',
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
    if (!archiveProduct) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await api.delete(
        `/products/${archiveProduct.id}`,
      );

      setArchiveProduct(null);

      setSuccess(
        'Produk berhasil dipindahkan ke riwayat.',
      );

      await fetchProducts();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setError(
          typeof message === 'string'
            ? message
            : 'Produk gagal diarsipkan.',
        );
      } else {
        setError(
          'Produk gagal diarsipkan.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (
    product: Product,
  ) => {
    try {
      setRestoringId(product.id);
      setHistoryError('');
      setSuccess('');

      await api.patch(
        `/products/${product.id}/restore`,
      );

      setSuccess(
        `${product.name} berhasil dipulihkan.`,
      );

      await Promise.all([
        fetchHistory(),
        fetchProducts(),
      ]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message;

        setHistoryError(
          typeof message === 'string'
            ? message
            : 'Produk gagal dipulihkan.',
        );
      } else {
        setHistoryError(
          'Produk gagal dipulihkan.',
        );
      }
    } finally {
      setRestoringId(null);
    }
  };

  const productTypeLabel = (
    type: ProductType,
  ) =>
    type === 'BAHAN_MENTAH'
      ? 'Bahan Mentah'
      : 'Barang Jadi';

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-600">
            Master Data
          </p>

          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
            Produk
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kelola bahan mentah dan produk
            perusahaan.
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
              Tambah Produk
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

      {error &&
        !modalOpen &&
        !historyOpen && (
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

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Total Produk
              </p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {products.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Boxes size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Bahan Mentah
              </p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {rawMaterialCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Package size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Barang Jadi
              </p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {finishedProductCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Stok Minimum
              </p>

              <p className="mt-1 text-xl font-semibold text-slate-900">
                {lowStockCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 xl:flex-row xl:items-center xl:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Daftar Produk
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {products.length} produk terdaftar
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as
                    | 'SEMUA'
                    | ProductType,
                )
              }
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-600 outline-none transition focus:border-blue-400 focus:bg-white"
            >
              <option value="SEMUA">
                Semua Jenis
              </option>
              <option value="BAHAN_MENTAH">
                Bahan Mentah
              </option>
              <option value="BARANG_JADI">
                Barang Jadi
              </option>
            </select>

            <div className="relative w-full sm:w-[300px]">
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
                placeholder="Cari produk..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.06]"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              <p className="mt-3 text-xs text-slate-400">
                Memuat data produk...
              </p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[350px] items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <Package size={21} />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-700">
                Produk tidak ditemukan
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {products.length === 0
                  ? 'Tambahkan produk pertama untuk memulai.'
                  : 'Coba ubah pencarian atau filter.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50/80 text-left">
                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Kode
                  </th>

                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Produk
                  </th>

                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Jenis
                  </th>

                  <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Stok
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
                {filteredProducts.map(
                  (product) => {
                    const lowStock =
                      product.type ===
                        'BAHAN_MENTAH' &&
                      product.stock <=
                        product.minimumStock;

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-medium text-slate-500">
                            {product.code}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <Package
                                size={16}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800">
                                {product.name}
                              </p>

                              <p className="mt-1 max-w-[300px] truncate text-[11px] text-slate-400">
                                {product.description ||
                                  'Tidak ada deskripsi'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${
                              product.type ===
                              'BAHAN_MENTAH'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-violet-50 text-violet-700'
                            }`}
                          >
                            {productTypeLabel(
                              product.type,
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-semibold ${
                                  lowStock
                                    ? 'text-red-600'
                                    : 'text-slate-700'
                                }`}
                              >
                                {product.stock}{' '}
                                {product.unit}
                              </p>

                              {lowStock && (
                                <AlertTriangle
                                  size={14}
                                  className="text-red-500"
                                />
                              )}
                            </div>

                            <p className="mt-1 text-[10px] text-slate-400">
                              Minimum:{' '}
                              {
                                product.minimumStock
                              }{' '}
                              {product.unit}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                              product.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                product.isActive
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-400'
                              }`}
                            />

                            {product.isActive
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
                                  openEditModal(
                                    product,
                                  )
                                }
                                title="Edit produk"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Pencil size={15} />
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  setArchiveProduct(
                                    product,
                                  )
                                }
                                title="Arsipkan produk"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                              >
                                <Archive size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
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
                  {editingProduct
                    ? 'Edit Produk'
                    : 'Tambah Produk'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {editingProduct
                    ? 'Perbarui informasi produk.'
                    : 'Masukkan informasi produk baru.'}
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
                    htmlFor="product-name"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Nama Produk
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="product-name"
                    type="text"
                    required
                    maxLength={150}
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Masukkan nama produk"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="product-type"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Jenis Produk
                    </label>

                    <select
                      id="product-type"
                      value={form.type}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          type: event.target
                            .value as ProductType,
                        })
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    >
                      <option value="BAHAN_MENTAH">
                        Bahan Mentah
                      </option>
                      <option value="BARANG_JADI">
                        Barang Jadi
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="product-unit"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Satuan
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="product-unit"
                      type="text"
                      required
                      maxLength={30}
                      value={form.unit}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          unit: event.target.value,
                        })
                      }
                      placeholder="Kg, Pcs, Roll..."
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="product-stock"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Stok
                    </label>

                    <input
                      id="product-stock"
                      type="number"
                      min="0"
                      step="any"
                      value={form.stock}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          stock: event.target.value,
                        })
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="minimum-stock"
                      className="mb-2 block text-xs font-medium text-slate-700"
                    >
                      Minimum Stok
                    </label>

                    <input
                      id="minimum-stock"
                      type="number"
                      min="0"
                      step="any"
                      value={form.minimumStock}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          minimumStock:
                            event.target.value,
                        })
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="product-description"
                    className="mb-2 block text-xs font-medium text-slate-700"
                  >
                    Deskripsi
                  </label>

                  <textarea
                    id="product-description"
                    rows={4}
                    maxLength={1000}
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description:
                          event.target.value,
                      })
                    }
                    placeholder="Keterangan produk"
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.07]"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5">
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      Produk aktif
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Produk dapat digunakan dalam
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
                    : editingProduct
                      ? 'Simpan Perubahan'
                      : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveProduct && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Archive size={20} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-slate-900">
              Arsipkan produk?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              <span className="font-medium text-slate-700">
                {archiveProduct.name}
              </span>{' '}
              akan dipindahkan ke riwayat.
              Data tidak akan dihapus permanen.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  setArchiveProduct(null)
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
                    Riwayat Produk
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Produk yang telah diarsipkan.
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
                  placeholder="Cari riwayat produk..."
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
                      Memuat riwayat produk...
                    </p>
                  </div>
                </div>
              ) : filteredHistory.length ===
                0 ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <div className="text-center">
                    <Archive
                      size={24}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-4 text-sm font-medium text-slate-700">
                      Belum ada riwayat produk
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase text-slate-400">
                          Kode
                        </th>

                        <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase text-slate-400">
                          Produk
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
                        (product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                              {product.code}
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-800">
                                {product.name}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                {product.unit}
                              </p>
                            </td>

                            <td className="px-6 py-4 text-xs text-slate-600">
                              {productTypeLabel(
                                product.type,
                              )}
                            </td>

                            <td className="px-6 py-4 text-xs text-slate-500">
                              {product.deletedAt
                                ? new Date(
                                    product.deletedAt,
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
                                    product.id
                                  }
                                  onClick={() =>
                                    void handleRestore(
                                      product,
                                    )
                                  }
                                  className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                                >
                                  <RotateCcw
                                    size={14}
                                  />

                                  {restoringId ===
                                  product.id
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
                {historyProducts.length} produk
                di riwayat
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

export default ProductPage;
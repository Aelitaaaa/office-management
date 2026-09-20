import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  Power,
  PowerOff,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
  X,
  XCircle,
} from 'lucide-react';

const API_URL = 'http://localhost:3000';

type UserRole =
  | 'ADMIN'
  | 'STAFF'
  | 'FINANCE'
  | 'MANAGER';

interface UserData {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserForm {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

const initialForm: UserForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'STAFF',
};

function UserManagementPage() {
  const [users, setUsers] = useState<
    UserData[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState('');

  const [form, setForm] =
    useState<UserForm>(initialForm);

  const [editingUser, setEditingUser] =
    useState<UserData | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [deleteUser, setDeleteUser] =
    useState<UserData | null>(null);

  const [message, setMessage] =
    useState<Message | null>(null);

  const token =
    sessionStorage.getItem(
      'access_token',
    );

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const showMessage = (
    type: Message['type'],
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

      return data.message || fallback;
    } catch {
      return fallback;
    }
  };

  const fetchUsers =
    useCallback(async () => {
      if (!token) {
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/users`,
          {
            headers,
          },
        );

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              'Gagal mengambil data user',
            ),
          );
        }

        const data: UserData[] =
          await response.json();

        setUsers(data);
      } catch (error) {
        showMessage(
          'error',
          error instanceof Error
            ? error.message
            : 'Gagal mengambil data user',
        );
      } finally {
        setLoading(false);
      }
    }, [token]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingUser(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEdit = (
    user: UserData,
  ) => {
    setEditingUser(user);

    setForm({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    });

    setShowForm(true);
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (
      !form.name.trim() ||
      !form.username.trim() ||
      !form.email.trim()
    ) {
      showMessage(
        'error',
        'Nama, username, dan email wajib diisi',
      );

      return;
    }

    if (
      !editingUser &&
      !form.password
    ) {
      showMessage(
        'error',
        'Password wajib diisi untuk user baru',
      );

      return;
    }

    if (
      form.password &&
      form.password.length < 6
    ) {
      showMessage(
        'error',
        'Password minimal 6 karakter',
      );

      return;
    }

    setSaving(true);

    try {
      const payload: {
        name: string;
        username: string;
        email: string;
        role: UserRole;
        password?: string;
      } = {
        name: form.name.trim(),
        username:
          form.username.trim(),
        email: form.email
          .trim()
          .toLowerCase(),
        role: form.role,
      };

      if (form.password) {
        payload.password =
          form.password;
      }

      const url = editingUser
        ? `${API_URL}/users/${editingUser.id}`
        : `${API_URL}/users`;

      const response = await fetch(
        url,
        {
          method: editingUser
            ? 'PATCH'
            : 'POST',
          headers: {
            ...headers,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            payload,
          ),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            editingUser
              ? 'Gagal mengubah user'
              : 'Gagal menambahkan user',
          ),
        );
      }

      resetForm();

      showMessage(
        'success',
        editingUser
          ? 'User berhasil diperbarui'
          : 'User berhasil ditambahkan',
      );

      await fetchUsers();
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

  const handleToggleActive = async (
    user: UserData,
  ) => {
    if (!token) {
      return;
    }

    setProcessingId(user.id);

    try {
      const response = await fetch(
        `${API_URL}/users/${user.id}/toggle-active`,
        {
          method: 'PATCH',
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal mengubah status user',
          ),
        );
      }

      const data = await response
        .json()
        .catch(() => null);

      showMessage(
        'success',
        data?.message ||
          'Status user berhasil diubah',
      );

      await fetchUsers();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal mengubah status user',
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser || !token) {
      return;
    }

    setProcessingId(
      deleteUser.id,
    );

    try {
      const response = await fetch(
        `${API_URL}/users/${deleteUser.id}`,
        {
          method: 'DELETE',
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            'Gagal menghapus user',
          ),
        );
      }

      const data = await response
        .json()
        .catch(() => null);

      setDeleteUser(null);

      showMessage(
        'success',
        data?.message ||
          'User berhasil dipindahkan ke riwayat',
      );

      await fetchUsers();
    } catch (error) {
      showMessage(
        'error',
        error instanceof Error
          ? error.message
          : 'Gagal menghapus user',
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers =
    users.filter((user) => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return true;
      }

      return (
        user.name
          .toLowerCase()
          .includes(keyword) ||
        user.username
          .toLowerCase()
          .includes(keyword) ||
        user.email
          .toLowerCase()
          .includes(keyword) ||
        user.role
          .toLowerCase()
          .includes(keyword)
      );
    });

  const getRoleLabel = (
    role: UserRole,
  ) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';

      case 'STAFF':
        return 'Staff';

      case 'FINANCE':
        return 'Finance';

      case 'MANAGER':
        return 'Manager';
    }
  };

  const getRoleClass = (
    role: UserRole,
  ) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700';

      case 'STAFF':
        return 'bg-blue-50 text-blue-700';

      case 'FINANCE':
        return 'bg-emerald-50 text-emerald-700';

      case 'MANAGER':
        return 'bg-amber-50 text-amber-700';
    }
  };

  const formatDate = (
    value: string,
  ) => {
    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(new Date(value));
  };

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
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2.5 text-white">
            <UserCog size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Manajemen User
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola akun dan hak akses
              pengguna aplikasi
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              void fetchUsers()
            }
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
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

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={18} />
            Tambah User
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total User
            </p>

            <Users
              size={20}
              className="text-slate-400"
            />
          </div>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {users.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            User Aktif
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {
              users.filter(
                (user) =>
                  user.isActive,
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            User Nonaktif
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {
              users.filter(
                (user) =>
                  !user.isActive,
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Administrator
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-600">
            {
              users.filter(
                (user) =>
                  user.role ===
                  'ADMIN',
              ).length
            }
          </p>
        </div>
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
              placeholder="Cari nama, username, email, atau role..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">
                  No
                </th>
                <th className="px-5 py-4">
                  User
                </th>
                <th className="px-5 py-4">
                  Username
                </th>
                <th className="px-5 py-4">
                  Role
                </th>
                <th className="px-5 py-4">
                  Status
                </th>
                <th className="px-5 py-4">
                  Dibuat
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
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <Loader2
                      size={30}
                      className="mx-auto animate-spin text-slate-400"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                      Memuat data user...
                    </p>
                  </td>
                </tr>
              ) : filteredUsers.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-sm text-slate-500"
                  >
                    Data user tidak
                    ditemukan
                  </td>
                </tr>
              ) : (
                filteredUsers.map(
                  (user, index) => (
                    <tr
                      key={user.id}
                      className="text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                            {user.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {user.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {user.username}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleClass(
                            user.role,
                          )}`}
                        >
                          <ShieldCheck
                            size={14}
                          />

                          {getRoleLabel(
                            user.role,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {user.isActive
                            ? 'Aktif'
                            : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(
                          user.createdAt,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                user,
                              )
                            }
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                            title="Edit"
                          >
                            <Edit3
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleToggleActive(
                                user,
                              )
                            }
                            disabled={
                              processingId ===
                              user.id
                            }
                            className={`rounded-lg p-2 transition disabled:opacity-50 ${
                              user.isActive
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title={
                              user.isActive
                                ? 'Nonaktifkan'
                                : 'Aktifkan'
                            }
                          >
                            {processingId ===
                            user.id ? (
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                            ) : user.isActive ? (
                              <PowerOff
                                size={17}
                              />
                            ) : (
                              <Power
                                size={17}
                              />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteUser(
                                user,
                              )
                            }
                            className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                            title="Hapus"
                          >
                            <Trash2
                              size={17}
                            />
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

        {!loading && (
          <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
            Menampilkan{' '}
            {filteredUsers.length} dari{' '}
            {users.length} user
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingUser
                    ? 'Edit User'
                    : 'Tambah User'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingUser
                    ? 'Perbarui data dan hak akses user'
                    : 'Buat akun pengguna baru'}
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nama Lengkap
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        name: event
                          .target
                          .value,
                      })
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Username
                    </label>

                    <input
                      type="text"
                      value={
                        form.username
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,
                          username:
                            event
                              .target
                              .value,
                        })
                      }
                      required
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Role
                    </label>

                    <select
                      value={form.role}
                      onChange={(
                        event,
                      ) =>
                        setForm({
                          ...form,
                          role: event
                            .target
                            .value as UserRole,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    >
                      <option value="ADMIN">
                        Administrator
                      </option>
                      <option value="STAFF">
                        Staff
                      </option>
                      <option value="FINANCE">
                        Finance
                      </option>
                      <option value="MANAGER">
                        Manager
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        email:
                          event.target
                            .value,
                      })
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    value={
                      form.password
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,
                        password:
                          event.target
                            .value,
                      })
                    }
                    required={
                      !editingUser
                    }
                    minLength={6}
                    placeholder={
                      editingUser
                        ? 'Kosongkan jika password tidak diubah'
                        : 'Minimal 6 karakter'
                    }
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />

                  {editingUser && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Password lama
                      tetap digunakan
                      jika kolom ini
                      dikosongkan.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  disabled={saving}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editingUser
                    ? 'Simpan Perubahan'
                    : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 size={26} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-800">
                Hapus User?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                User akan
                dinonaktifkan dan
                dipindahkan ke riwayat.
              </p>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                <p className="font-semibold text-slate-800">
                  {deleteUser.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  @{deleteUser.username}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {deleteUser.email}
                </p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() =>
                  setDeleteUser(null)
                }
                disabled={
                  processingId ===
                  deleteUser.id
                }
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleDelete()
                }
                disabled={
                  processingId ===
                  deleteUser.id
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {processingId ===
                deleteUser.id ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={17}
                  />
                )}

                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
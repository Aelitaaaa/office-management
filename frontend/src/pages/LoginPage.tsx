import {
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Headphones,
  LockKeyhole,
  ShieldCheck,
  User,
  Workflow,
} from 'lucide-react';
import axios from 'axios';
import api from '../api/axios';

function Logo({
  dark = false,
}: {
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
        <Workflow
          size={23}
          strokeWidth={2.3}
          className="text-white"
        />
      </div>

      <div>
        <p
          className={`text-lg font-bold leading-none tracking-tight ${
            dark
              ? 'text-slate-900'
              : 'text-white'
          }`}
        >
          OfficeFlow
        </p>

        <p
          className={`mt-1 text-xs ${
            dark
              ? 'text-slate-500'
              : 'text-slate-400'
          }`}
        >
          Management System
        </p>
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [remember, setRemember] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response =
        await api.post(
          '/auth/login',
          {
            username,
            password,
          },
        );

      const accessToken =
        response.data.access_token;

      const user =
        response.data.user;

      if (!accessToken) {
        throw new Error(
          'Token login tidak diterima dari server.',
        );
      }

      if (!user) {
        throw new Error(
          'Data user tidak diterima dari server.',
        );
      }

      sessionStorage.setItem(
        'access_token',
        accessToken,
      );

      sessionStorage.setItem(
        'user',
        JSON.stringify(user),
      );

      navigate('/dashboard', {
        replace: true,
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (
          err.response?.status ===
          401
        ) {
          const message =
            err.response?.data
              ?.message;

          setError(
            typeof message ===
              'string'
              ? message
              : 'Username atau password salah.',
          );
        } else if (
          err.response?.status ===
          429
        ) {
          setError(
            'Terlalu banyak percobaan login. Silakan tunggu sebentar.',
          );
        } else if (
          !err.response
        ) {
          setError(
            'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.',
          );
        } else {
          const message =
            err.response?.data
              ?.message;

          setError(
            typeof message ===
              'string'
              ? message
              : 'Login gagal. Silakan coba kembali.',
          );
        }
      } else if (
        err instanceof Error
      ) {
        setError(err.message);
      } else {
        setError(
          'Terjadi kesalahan pada sistem.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <section className="relative hidden w-[50%] overflow-hidden bg-[#101a2a] lg:block">
          <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />

          <div className="absolute -bottom-48 right-[-100px] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[130px]" />

          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
              backgroundSize:
                '48px 48px',
            }}
          />

          <div className="relative z-10 flex min-h-screen flex-col px-14 py-12 xl:px-20 xl:py-14">
            <Logo />

            <div className="my-auto max-w-[540px] py-16">
              <p className="mb-7 text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-400">
                Simple · Organized ·
                Reliable
              </p>

              <h1 className="max-w-[500px] text-[46px] font-semibold leading-[1.12] tracking-[-0.035em] text-white xl:text-[54px]">
                Pekerjaan kantor
                <br />
                lebih teratur,
                <br />
                lebih mudah.
              </h1>

              <p className="mt-8 max-w-[500px] text-[15px] leading-7 text-slate-400">
                Kelola pesanan,
                pembelian bahan, surat
                jalan, invoice,
                pembayaran, dan dokumen
                perusahaan dalam satu
                sistem.
              </p>

              <div className="mt-12 space-y-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                    <FileText
                      size={18}
                      className="text-blue-400"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      Dokumen terpusat
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Data dan dokumen
                      tersimpan dalam
                      satu sistem.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                    <ShieldCheck
                      size={18}
                      className="text-blue-400"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      Akses terkontrol
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Setiap pengguna
                      memiliki akses
                      sesuai tugasnya.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.06] pt-6 text-[11px] text-slate-600">
              <span>
                OfficeFlow
              </span>

              <span>
                Internal Office System
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex w-full items-center justify-center bg-[#f8fafc] px-6 py-16 lg:w-[50%] lg:px-16">
          <div className="absolute right-10 top-10 hidden items-center gap-2 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Internal Use Only
            </span>
          </div>

          <div className="w-full max-w-[460px]">
            <div className="mb-14 lg:hidden">
              <Logo dark />
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white px-7 py-9 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)] sm:px-10 sm:py-11">
              <div className="mb-10">
                <div className="mb-7 hidden lg:block">
                  <Logo dark />
                </div>

                <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-slate-900">
                  Selamat datang kembali
                </h2>

                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  Masuk menggunakan akun
                  Anda untuk melanjutkan
                  ke sistem.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              <form
                onSubmit={
                  handleSubmit
                }
              >
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-2.5 block text-sm font-medium text-slate-700"
                    >
                      Username
                    </label>

                    <div className="group relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                      />

                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(
                          event,
                        ) =>
                          setUsername(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Masukkan username"
                        autoComplete="username"
                        disabled={
                          loading
                        }
                        required
                        className="h-[54px] w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.08] disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2.5 block text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>

                    <div className="group relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600"
                      />

                      <input
                        id="password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={password}
                        onChange={(
                          event,
                        ) =>
                          setPassword(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Masukkan password"
                        autoComplete="current-password"
                        disabled={
                          loading
                        }
                        required
                        className="h-[54px] w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/[0.08] disabled:bg-slate-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (value) =>
                              !value,
                          )
                        }
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={
                          showPassword
                            ? 'Sembunyikan password'
                            : 'Tampilkan password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff
                            size={18}
                          />
                        ) : (
                          <Eye
                            size={18}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="my-6 flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(
                        event,
                      ) =>
                        setRemember(
                          event
                            .target
                            .checked,
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />

                    Ingat saya di
                    perangkat ini
                  </label>

                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-blue-600 transition hover:text-blue-700"
                  >
                    Lupa password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Masuk

                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-9 border-t border-slate-100 pt-7">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                    <Headphones
                      size={17}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      Kesulitan masuk?
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Hubungi
                      administrator
                      sistem.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between px-2 text-[10px] text-slate-400">
              <span>
                © 2026 OfficeFlow
              </span>

              <span>
                v1.0.0
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
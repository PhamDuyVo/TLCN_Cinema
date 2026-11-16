import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';
import useAuth from '../../hooks/useAuth';
import { dataOf, errorMessage } from '../../utils/booking';

export default function AdminLoginPage({ portal = 'admin' }) {
  const { user, loading, handleLoginSuccess } = useAuth();
  const navigate = useNavigate();
  const isStaff = portal === 'staff';
  const home = isStaff ? '/staff/pos' : '/admin';
  const permitted = role => role?.toLowerCase() === (isStaff ? 'staff' : 'admin');
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const pending = useRef(false);
  if (loading) return <main className="min-h-screen bg-slate-950 text-white p-10" role="status">Đang kiểm tra phiên quản trị…</main>;
  if (user && permitted(user.role)) return <Navigate to={home} replace />;
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const data = dataOf(await authApi.login({ email: email.trim(), password }));
      if (!permitted(data.user?.role)) throw new Error('Tài khoản này không có quyền truy cập cổng này.');
      handleLoginSuccess(data.user, data.accessToken ?? data.token, data.refreshToken);
      navigate(home, { replace: true });
    } catch (e) { setError(errorMessage(e)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
    <form onSubmit={submit} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
      <div><p className="text-red-500 font-bold text-sm">UTE CINEMA · {isStaff ? 'STAFF PORTAL' : 'ADMIN PORTAL'}</p><h1 className="text-2xl font-bold mt-2">{isStaff ? 'Đăng nhập nhân viên' : 'Đăng nhập quản trị'}</h1><p className="text-slate-400 text-sm mt-2">{isStaff ? 'Cổng nhân viên bán vé và soát vé.' : 'Dành cho tài khoản quản trị hệ thống rạp phim.'}</p></div>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <label className="block">Email<input required type="email" autoComplete="username" disabled={busy} value={email} onChange={e => setEmail(e.target.value)} className="block w-full mt-2 p-3 rounded bg-slate-950 border border-slate-700" /></label>
      <label className="block">Mật khẩu<input required type="password" autoComplete="current-password" disabled={busy} value={password} onChange={e => setPassword(e.target.value)} className="block w-full mt-2 p-3 rounded bg-slate-950 border border-slate-700" /></label>
      <button disabled={busy} className="w-full py-3 rounded bg-red-600 font-bold disabled:opacity-50">{busy ? 'Đang xác thực…' : isStaff ? 'Đăng nhập nhân viên' : 'Đăng nhập quản trị'}</button>
    </form>
  </main>;
}

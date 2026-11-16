import showtimeApi from '../../api/showtimeApi';
import { dataOf, errorMessage } from '../../utils/booking';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useEffect, useRef, useState } from 'react';
import adminApi from '../../api/adminApi';
import { mediaApi } from '../../api/mediaApi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { Film, DollarSign, Users, Ticket, TrendingUp, Calendar, Plus } from 'lucide-react';

const REVENUE_DATA = [
  { day: 'Thứ 2', revenue: 12500000 },
  { day: 'Thứ 3', revenue: 15200000 },
  { day: 'Thứ 4', revenue: 22800000 },
  { day: 'Thứ 5', revenue: 18400000 },
  { day: 'Thứ 6', revenue: 35600000 },
  { day: 'Thứ 7', revenue: 48900000 },
  { day: 'Chủ Nhật', revenue: 52100000 },
];

export const DashboardPage = () => (
  <div className="space-y-8 text-zinc-100">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-black text-white">DASHBOARD QUẢN TRỊ DOANH THU</h1>
      <span className="text-xs bg-zinc-800 border border-zinc-700 px-3 py-1 rounded text-zinc-300">
        Hệ thống Rạp UTE Cinema
      </span>
    </div>

    {/* Stat Cards Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-[#141414] border border-zinc-800 p-5 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-400 font-medium">TỔNG DOANH THU TUẦN</span>
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-black text-white">205,500,000 ₫</h3>
        <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
          <TrendingUp className="w-3.5 h-3.5" /> +18.4% so với tuần trước
        </span>
      </div>

      <div className="bg-[#141414] border border-zinc-800 p-5 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-400 font-medium">TỔNG VÉ ĐÃ BÁN</span>
          <Ticket className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-2xl font-black text-white">1,842 Vé</h3>
        <span className="text-[11px] text-zinc-400 mt-2 block">Tỷ lệ lấp đầy trung bình 74.2%</span>
      </div>

      <div className="bg-[#141414] border border-zinc-800 p-5 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-400 font-medium">PHIM CHIẾU HOT</span>
          <Film className="w-5 h-5 text-amber-400" />
        </div>
        <h3 className="text-xl font-bold text-white line-clamp-1">Avatar 3</h3>
        <span className="text-[11px] text-amber-400 mt-2 block">Chiếm 52% tổng doanh thu</span>
      </div>

      <div className="bg-[#141414] border border-zinc-800 p-5 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-400 font-medium">TÀI KHOẢN KHÁCH HÀNG</span>
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-2xl font-black text-white">12,450</h3>
        <span className="text-[11px] text-blue-400 mt-2 block">+142 thành viên mới tuần này</span>
      </div>
    </div>

    {/* Recharts Revenue Line Chart */}
    <div className="bg-[#141414] border border-zinc-800 p-6 rounded-xl">
      <h2 className="text-base font-bold text-white mb-6">BIỂU ĐỒ TĂNG TRƯỞNG DOANH THU THEO NGÀY (VND)</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={REVENUE_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} />
            <YAxis stroke="#a1a1aa" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="revenue" stroke="#e71a0f" strokeWidth={3} dot={{ fill: '#e71a0f' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const emptyMovie = () => ({ title: '', originalTitle: '', durationMinutes: 90, releaseDate: '', endDate: '', ageRating: 'P', description: '', director: '', cast: '', status: 'coming_soon' });
const mediaError = (error) => error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Không thể thực hiện thao tác';
const mediaLabels = { POSTER: 'Poster', BANNER: 'Banner', TRAILER: 'Trailer' };
const mediaUrlFields = { POSTER: 'posterUrl', BANNER: 'bannerUrl', TRAILER: 'trailerUrl' };

function MovieMediaUpload({ movie, type, metadata, onChanged, onBusy }) {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const run = async (action) => {
    setBusy(true); onBusy(true); setError('');
    try { await action(); } catch (e) { setError(mediaError(e)); }
    finally { setBusy(false); onBusy(false); }
  };
  const finish = async (intent) => {
    await mediaApi.complete(movie.id, intent.intentId);
    setPending(null); setFile(null); setPreview('');
    await onChanged();
  };
  const upload = (chosen) => run(async () => {
    if (!chosen) return;
    const allowed = type === 'TRAILER' ? ['video/mp4'] : ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(chosen.type)) throw new Error('Chỉ hỗ trợ JPG, PNG, WebP hoặc trailer MP4');
    setFile(chosen); setProgress(0); setPending(null);
    const { data: intent } = await mediaApi.intent(movie.id, type);
    await mediaApi.upload(intent, chosen, setProgress);
    setPending(intent);
    await finish(intent);
  });
  const url = preview || movie[mediaUrlFields[type]];
  return <section className="rounded-xl border border-zinc-700 p-4 space-y-3 min-w-0">
    <h3 className="font-bold">{mediaLabels[type]}</h3>
    {url && (type === 'TRAILER' ? <video src={url} controls preload="metadata" className="w-full max-h-52 rounded bg-black" /> : <img src={url} alt={mediaLabels[type]} className="w-full h-52 object-contain rounded bg-black" />)}
    <label className="block text-sm">Chọn tệp {type === 'TRAILER' ? 'MP4' : 'JPG / PNG / WebP'}
      <input aria-label={`Tải ${mediaLabels[type]}`} type="file" disabled={busy} accept={type === 'TRAILER' ? 'video/mp4' : 'image/jpeg,image/png,image/webp'} className="block w-full mt-2 text-xs" onChange={(e) => { const chosen = e.target.files?.[0]; e.target.value = ''; if (chosen) upload(chosen); }} />
    </label>
    {busy && <div role="status"><progress className="w-full" max="100" value={progress} /><p className="text-xs">{progress < 100 ? `Đang tải: ${progress}%` : 'Đang xác minh và lưu…'}</p></div>}
    {metadata && <p className="text-xs text-zinc-400 break-all">{metadata.format?.toUpperCase()} · {(metadata.bytes / 1024 / 1024).toFixed(2)} MB · {metadata.width} × {metadata.height}{metadata.duration ? ` · ${metadata.duration.toFixed(1)} giây` : ''}<br />{metadata.publicId}</p>}
    {pending && !busy && <button type="button" onClick={() => run(() => finish(pending))} className="text-amber-300 underline">Thử xác minh lại</button>}
    {movie[mediaUrlFields[type]] && <button type="button" disabled={busy} onClick={() => run(async () => { await mediaApi.remove(movie.id, type); setFile(null); setPreview(''); setPending(null); await onChanged(); })} className="text-red-400 text-sm disabled:opacity-50">Gỡ {mediaLabels[type]}</button>}
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
  </section>;
}

export const ManageMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busy = saving || uploads > 0;
  useEffect(() => {
    let active = true;
    adminApi.getMovies().then(({ data }) => { if (active) setMovies(data); })
      .catch((e) => { if (active) setError(mediaError(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const edit = async (movie) => {
    setSaving(true); setError(''); setNotice('');
    try {
      const { data } = await mediaApi.list(movie.id);
      setMedia(data); setForm({ ...movie });
    } catch (e) { setError(mediaError(e)); } finally { setSaving(false); }
  };
  const refreshMedia = async () => {
    const [{ data: list }, { data: items }] = await Promise.all([adminApi.getMovies(), mediaApi.list(form.id)]);
    setMovies(list); setMedia(items);
    const updated = list.find((m) => m.id === form.id);
    // Retain unsaved metadata while refreshing the verified media URLs.
    if (updated) setForm((old) => ({ ...old, posterUrl: updated.posterUrl, bannerUrl: updated.bannerUrl, trailerUrl: updated.trailerUrl }));
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const payload = Object.fromEntries(Object.keys(emptyMovie()).map((key) => [key, form[key] ?? '']));
      payload.durationMinutes = Number(payload.durationMinutes); payload.endDate = payload.endDate || null;
      const { data } = form.id ? await adminApi.updateMovie(form.id, payload) : await adminApi.createMovie(payload);
      setForm(data); setNotice('Đã lưu thông tin phim. Bạn có thể tải poster, banner và trailer bên dưới.');
      const result = await adminApi.getMovies(); setMovies(result.data);
    } catch (e) { setError(mediaError(e)); } finally { setSaving(false); }
  };
  return <div className="space-y-6 text-zinc-100">
    <div className="flex justify-between items-center gap-3"><h1 className="text-xl font-bold">QUẢN LÝ DANH MỤC PHIM</h1>
      <button disabled={busy} onClick={() => { setForm(emptyMovie()); setMedia([]); setError(''); setNotice(''); }} className="bg-red-600 rounded-lg px-4 py-2 disabled:opacity-50 flex items-center gap-2"><Plus size={16} />Thêm phim</button>
    </div>
    {error && <p role="alert" className="text-red-400">{error}</p>}{notice && <p role="status" className="text-emerald-400">{notice}</p>}
    {loading ? <p>Đang tải danh sách phim…</p> : <div className="overflow-x-auto rounded-xl border border-zinc-800"><table className="w-full text-left text-sm"><thead className="bg-zinc-900"><tr><th className="p-3">Phim</th><th>Khởi chiếu</th><th>Trạng thái</th><th className="p-3">Thao tác</th></tr></thead><tbody>
      {movies.map((movie) => <tr key={movie.id} className="border-t border-zinc-800"><td className="p-3 flex gap-3 items-center">{movie.posterUrl && <img src={movie.posterUrl} alt="" className="w-10 h-14 object-cover" />}<span>{movie.title}<small className="block text-zinc-400">{movie.durationMinutes} phút</small></span></td><td>{movie.releaseDate}</td><td>{movie.status}</td><td className="p-3"><button disabled={busy} onClick={() => edit(movie)} className="text-red-400 disabled:opacity-50">Chỉnh sửa</button></td></tr>)}
      {!movies.length && <tr><td colSpan="4" className="p-6 text-zinc-400">Chưa có phim.</td></tr>}
    </tbody></table></div>}
    {form && <div className="p-5 rounded-xl border border-zinc-800 space-y-6">
      <h2 className="font-bold text-lg">{form.id ? `Chỉnh sửa: ${form.title}` : 'Thêm phim mới'}</h2>
      <form onSubmit={save} className="space-y-4"><fieldset disabled={busy} className="grid md:grid-cols-2 gap-4 disabled:opacity-60">
        {[['title', 'Tên phim', 'text', 200], ['originalTitle', 'Tên gốc', 'text', 200], ['durationMinutes', 'Thời lượng (phút)', 'number'], ['releaseDate', 'Ngày khởi chiếu', 'date'], ['endDate', 'Ngày kết thúc', 'date'], ['director', 'Đạo diễn', 'text', 150], ['cast', 'Diễn viên', 'text', 500]].map(([key, label, type, maxLength]) => <label key={key} className="text-sm space-y-1">{label}<input className="block w-full p-2 rounded bg-zinc-900 border border-zinc-700" type={type} maxLength={maxLength} min={type === 'number' ? 1 : key === 'endDate' ? form.releaseDate : undefined} required={['title', 'durationMinutes', 'releaseDate'].includes(key)} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
        <label className="text-sm">Phân loại độ tuổi<select className="block w-full p-2 rounded bg-zinc-900" value={form.ageRating || 'P'} onChange={(e) => setForm({ ...form, ageRating: e.target.value })}>{['P', 'K', 'T13', 'T16', 'T18'].map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="text-sm">Trạng thái<select className="block w-full p-2 rounded bg-zinc-900" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="coming_soon">Sắp chiếu</option><option value="now_showing">Đang chiếu</option><option value="ended">Ngừng chiếu</option></select></label>
        <label className="text-sm md:col-span-2">Nội dung<textarea rows="4" className="block w-full p-2 rounded bg-zinc-900 border border-zinc-700" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      </fieldset><button disabled={busy} className="bg-red-600 rounded px-5 py-2 disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu thông tin phim'}</button></form>
      {form.id ? <div className="grid lg:grid-cols-3 gap-4">{Object.keys(mediaLabels).map((type) => <MovieMediaUpload key={`${form.id}-${type}`} movie={form} type={type} metadata={media.find((m) => m.type === type)} onChanged={refreshMedia} onBusy={(value) => setUploads((n) => n + (value ? 1 : -1))} />)}</div> : <p className="text-sm text-zinc-400">Lưu phim trước khi tải poster, banner hoặc trailer.</p>}
    </div>}
  </div>;
};

export function ManageShowtimesPage() {
  const [movies, setMovies] = useState([]), [cinemas, setCinemas] = useState([]);
  const [rooms, setRooms] = useState([]), [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true), [roomLoading, setRoomLoading] = useState(false);
  const [saving, setSaving] = useState(false), [open, setOpen] = useState(false);
  const [error, setError] = useState(''), [roomError, setRoomError] = useState(''), [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0), [roomRetry, setRoomRetry] = useState(0);
  const [form, setForm] = useState({ movieId: '', cinemaId: '', hallId: '', startTime: '', endTime: '', basePrice: '' });
  const savingRef = useRef(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    (async () => {
      const [films, theaters] = await Promise.all([adminApi.getMovies().then(dataOf), adminApi.getCinemas().then(dataOf)]);
      if (!active) return;
      setMovies(films); setCinemas(theaters);
      const schedules = await Promise.all(films.map(movie => showtimeApi.getShowtimesByMovie(movie.id).then(dataOf)));
      if (active) setRows(schedules.flat());
    })().catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setRooms([]); setRoomError('');
    if (!form.cinemaId) { setRoomLoading(false); return; }
    setRoomLoading(true);
    adminApi.getRoomsByCinema(Number(form.cinemaId)).then(dataOf).then(data => { if (active) setRooms(data.filter(r => !r.status || r.status.toLowerCase() === 'active')); })
      .catch(e => { if (active) setRoomError(errorMessage(e)); }).finally(() => { if (active) setRoomLoading(false); });
    return () => { active = false; };
  }, [form.cinemaId, roomRetry]);
  const change = (key, value) => setForm(old => ({ ...old, [key]: value, ...(key === 'cinemaId' ? { hallId: '' } : {}) }));
  async function save(event) {
    event.preventDefault();
    if (savingRef.current) return;
    setError(''); setNotice('');
    const start = Date.parse(form.startTime + '+07:00'), end = Date.parse(form.endTime + '+07:00');
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || start <= Date.now()) { setError('Giờ bắt đầu phải ở tương lai; giờ kết thúc phải sau giờ bắt đầu.'); return; }
    if (!form.basePrice.trim() || !Number.isFinite(Number(form.basePrice)) || Number(form.basePrice) < 0) { setError('Giá vé phải là số không âm.'); return; }
    if (roomLoading || !rooms.some(r => String(r.id) === form.hallId) || !movies.some(m => String(m.id) === form.movieId)) { setError('Vui lòng chọn phim và phòng thuộc rạp đã chọn.'); return; }
    savingRef.current = true; setSaving(true);
    try {
      const result = dataOf(await adminApi.createShowtime({ movieId: Number(form.movieId), hallId: Number(form.hallId), startTime: form.startTime, endTime: form.endTime, basePrice: Number(form.basePrice) }));
      if (!result?.id) throw new Error('Chưa nhận được mã suất chiếu. Hãy tải lại danh sách trước khi thử thêm lần nữa.');
      setOpen(false); setNotice('Đã lưu suất chiếu thành công.');
      setRows(old => [...old.filter(r => r.id !== result.id), { ...result, movieTitle: movies.find(m => String(m.id) === form.movieId)?.title, hallName: rooms.find(r => String(r.id) === form.hallId)?.name, cinemaName: cinemas.find(c => String(c.id) === form.cinemaId)?.name }]);
      setRetry(v => v + 1);
    } catch (e) { setError(errorMessage(e)); }
    finally { savingRef.current = false; setSaving(false); }
  }
  const field = 'block w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 mt-1';
  return <div className="space-y-6 text-zinc-100">
    <div className="flex justify-between items-center"><h1 className="text-xl font-bold">QUẢN LÝ LỊCH CHIẾU PHIM</h1><button disabled={loading || saving} className="bg-red-600 rounded-lg px-4 py-2 disabled:opacity-40" onClick={() => { setOpen(true); setError(''); setNotice(''); }}>Thêm Suất Chiếu</button></div>
    <p className="text-sm text-zinc-400">Danh sách suất chiếu sắp tới · Giờ Việt Nam (UTC+7)</p>
    {notice && <p role="status" className="text-emerald-400">{notice}</p>}
    {error && <p role="alert" className="text-red-400">{error} <button type="button" className="underline" disabled={saving} onClick={() => setRetry(v => v + 1)}>Tải lại danh sách</button></p>}
    {open && <form onSubmit={save} className="bg-[#181818] border border-zinc-800 rounded-xl p-6 space-y-4"><h2 className="font-bold">Thêm suất chiếu</h2><fieldset disabled={saving} className="grid md:grid-cols-2 gap-4">
      <label>Phim<select required className={field} value={form.movieId} onChange={e => change('movieId', e.target.value)}><option value="">Chọn phim</option>{movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
      <label>Rạp<select required className={field} value={form.cinemaId} onChange={e => change('cinemaId', e.target.value)}><option value="">Chọn rạp</option>{cinemas.filter(c => !c.status || c.status.toLowerCase() === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Phòng chiếu<select required disabled={!form.cinemaId || roomLoading} className={field} value={form.hallId} onChange={e => change('hallId', e.target.value)}><option value="">{roomLoading ? 'Đang tải phòng…' : 'Chọn phòng'}</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      <label>Giá vé gốc (VNĐ)<input required type="number" min="0" step="0.01" className={field} value={form.basePrice} onChange={e => change('basePrice', e.target.value)} /></label>
      <label>Ngày giờ bắt đầu<input required type="datetime-local" className={field} value={form.startTime} onChange={e => change('startTime', e.target.value)} /></label>
      <label>Ngày giờ kết thúc<input required type="datetime-local" min={form.startTime} className={field} value={form.endTime} onChange={e => change('endTime', e.target.value)} /></label>
    </fieldset>
      {roomError && <p role="alert" className="text-red-400">{roomError} <button type="button" onClick={() => setRoomRetry(v => v + 1)}>Thử tải phòng lại</button></p>}
      {form.cinemaId && !roomLoading && !roomError && !rooms.length && <p>Rạp chưa có phòng khả dụng.</p>}
      <button disabled={saving || roomLoading || !form.hallId} className="bg-red-600 rounded-lg px-5 py-2 disabled:opacity-40">{saving ? 'Đang lưu…' : 'Lưu suất chiếu'}</button><button type="button" disabled={saving} onClick={() => setOpen(false)} className="ml-4">Đóng</button>
    </form>}
    {loading ? <p role="status">Đang tải lịch chiếu…</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Phim', 'Rạp / Phòng', 'Bắt đầu', 'Kết thúc', 'Giá vé'].map(h => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{[...rows].sort((a,b) => a.startTime.localeCompare(b.startTime)).map(row => <tr key={row.id} className="border-t border-zinc-800"><td className="p-3">{row.movieTitle}</td><td>{row.cinemaName} / {row.hallName}</td><td>{formatDateTime(row.startTime)}</td><td>{formatDateTime(row.endTime)}</td><td>{formatCurrency(row.basePrice)}</td></tr>)}</tbody></table>{!rows.length && <p className="p-4 text-zinc-400">Chưa có suất chiếu sắp tới.</p>}</div>}
  </div>;
}

export const ManageCinemasPage = () => (
  <div className="space-y-6 text-zinc-100">
    <h1 className="text-xl font-bold text-white">QUẢN LÝ CỤM RẠP & PHÒNG CHIẾU</h1>
  </div>
);

export const ManageUsersPage = () => (
  <div className="space-y-6 text-zinc-100">
    <h1 className="text-xl font-bold text-white">QUẢN LÝ NGƯỜI DÙNG & NHÂN VIÊN</h1>
  </div>
);

export const ManagePromotionsPage = () => (
  <div className="space-y-6 text-zinc-100">
    <h1 className="text-xl font-bold text-white">QUẢN LÝ CHƯƠNG TRÌNH KHUYẾN MÃI</h1>
  </div>
);

export const ManageBookingsPage = () => (
  <div className="space-y-6 text-zinc-100">
    <h1 className="text-xl font-bold text-white">QUẢN LÝ ĐƠN HÀNG VÀ VÉ CHI TIẾT</h1>
  </div>
);

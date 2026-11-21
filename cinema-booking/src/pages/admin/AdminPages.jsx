import showtimeApi from '../../api/showtimeApi';
import { dataOf, errorMessage } from '../../utils/booking';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/format';
import { useEffect, useRef, useState } from 'react';
import adminApi from '../../api/adminApi';
import { mediaApi } from '../../api/mediaApi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { Film, DollarSign, Users, Ticket, TrendingUp, Calendar, Plus, Pencil, X, Check, Building2, ChevronRight, ArrowLeft, Grid, Eye, Lock, Unlock, Trash2, CreditCard, Receipt, Search, Filter, RefreshCw, Copy, Tag, CheckCircle, XCircle, AlertTriangle, ShoppingBag, Printer, ShieldCheck } from 'lucide-react';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async (selectedRange = range) => {
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      let fromDate = new Date();
      let groupBy = 'day';

      if (selectedRange === '7d') {
        fromDate.setDate(now.getDate() - 7);
        groupBy = 'day';
      } else if (selectedRange === '30d') {
        fromDate.setDate(now.getDate() - 30);
        groupBy = 'day';
      } else if (selectedRange === '3m') {
        fromDate.setMonth(now.getMonth() - 3);
        groupBy = 'month';
      }

      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = now.toISOString().split('T')[0];

      const [statsRes, revRes, moviesRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRevenueStats({ from: fromStr, to: toStr, groupBy }),
        adminApi.getMovieStats({ from: fromStr, to: toStr }),
      ]);

      setStats(dataOf(statsRes) || {});
      setRevenueData(dataOf(revRes) || []);
      setTopMovies((dataOf(moviesRes) || []).slice(0, 5));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(range);
  }, [range]);

  return (
    <div className="space-y-8 text-zinc-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">DASHBOARD QUẢN TRỊ DOANH THU</h1>
          <p className="text-xs text-zinc-400 mt-1">Tổng quan hoạt động và doanh thu hệ thống UTE Cinema</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(range)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-lg text-zinc-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <span className="text-xs bg-red-950 border border-red-800 text-red-300 px-3 py-1.5 rounded-lg font-medium">
            Admin Portal
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#141414] border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400 font-medium">TỔNG DOANH THU</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white">
            {stats ? formatCurrency(stats.totalRevenue || 0) : '...'}
          </h3>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> Tháng này: {stats ? formatCurrency(stats.revenueThisMonth || 0) : '0 ₫'}
          </span>
        </div>

        <div className="bg-[#141414] border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400 font-medium">ĐƠN HÀNG & VÉ HÔM NAY</span>
            <Ticket className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-white">
            {stats ? `${stats.ticketsSoldToday || 0} Vé` : '...'}
          </h3>
          <span className="text-[11px] text-zinc-400 mt-2 block">
            Tổng cộng: {stats ? stats.totalBookings || 0 : 0} đơn đặt chỗ
          </span>
        </div>

        <div className="bg-[#141414] border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400 font-medium">PHIM & SUẤT CHIẾU</span>
            <Film className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-2xl font-black text-white">
            {stats ? `${stats.totalMovies || 0} Phim` : '...'}
          </h3>
          <span className="text-[11px] text-amber-400 mt-2 block">
            {stats ? stats.activeShowtimes || 0 : 0} suất chiếu đang hoạt động
          </span>
        </div>

        <div className="bg-[#141414] border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400 font-medium">TÀI KHOẢN NGƯỜI DÙNG</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-2xl font-black text-white">
            {stats ? stats.totalUsers || 0 : '...'}
          </h3>
          <span className="text-[11px] text-blue-400 mt-2 block">
            {stats ? `${stats.totalCustomers || 0} Khách · ${stats.totalStaff || 0} Nhân viên` : ''}
          </span>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-[#141414] border border-zinc-800 p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-white">BIỂU ĐỒ DOANH THU THEO THỜI GIAN</h2>
            <p className="text-xs text-zinc-400">Doanh thu từ các đơn đặt vé đã thanh toán thành công</p>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                range === '7d' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              7 ngày
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                range === '30d' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              30 ngày
            </button>
            <button
              onClick={() => setRange('3m')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                range === '3m' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              3 tháng
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {revenueData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              {loading ? 'Đang tải dữ liệu doanh thu...' : 'Chưa có dữ liệu doanh thu trong khoảng thời gian này.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="period" stroke="#a1a1aa" fontSize={11} />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val)}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Doanh thu']}
                  labelFormatter={(lbl) => `Thời gian: ${lbl}`}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#e71a0f"
                  strokeWidth={2.5}
                  dot={{ fill: '#e71a0f', r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Movies & Performance Bar Chart */}
      <div className="bg-[#141414] border border-zinc-800 p-6 rounded-xl space-y-4">
        <h2 className="text-base font-bold text-white">TOP 5 PHIM DOANH THU CAO NHẤT</h2>
        {topMovies.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">
            {loading ? 'Đang tải thống kê phim...' : 'Chưa có dữ liệu phim bán vé trong giai đoạn này.'}
          </p>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMovies}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="movieTitle" stroke="#a1a1aa" fontSize={11} />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val)}
                />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'revenue' ? formatCurrency(val) : `${val} vé`,
                    name === 'revenue' ? 'Doanh thu' : 'Số vé bán'
                  ]}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

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
  // Edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ startTime: '', endTime: '', basePrice: '' });
  const [editSaving, setEditSaving] = useState(false), [editError, setEditError] = useState('');
  // Filter state
  const [filterMovie, setFilterMovie] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCinema, setFilterCinema] = useState('');
  const savingRef = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    (async () => {
      const [films, theaters] = await Promise.all([adminApi.getMovies().then(dataOf), adminApi.getCinemas().then(dataOf)]);
      if (!active) return;
      setMovies(films); setCinemas(theaters);
      // Try new getShowtimes endpoint first, fallback to per-movie fetch
      let allRows = [];
      try {
        allRows = dataOf(await adminApi.getShowtimes());
      } catch {
        const schedules = await Promise.all(films.map(movie => showtimeApi.getShowtimesByMovie(movie.id).then(dataOf)));
        allRows = schedules.flat();
      }
      if (active) setRows(allRows);
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

  function openEdit(row) {
    setEditId(row.id);
    setEditError('');
    setEditForm({
      startTime: row.startTime ? row.startTime.slice(0, 16) : '',
      endTime: row.endTime ? row.endTime.slice(0, 16) : '',
      basePrice: String(row.basePrice ?? ''),
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setEditError('');
    if (!editForm.startTime || !editForm.endTime) { setEditError('Vui lòng nhập đầy đủ giờ.'); return; }
    if (Date.parse(editForm.endTime) <= Date.parse(editForm.startTime)) { setEditError('Giờ kết thúc phải sau giờ bắt đầu.'); return; }
    if (!Number.isFinite(Number(editForm.basePrice)) || Number(editForm.basePrice) < 0) { setEditError('Giá vé không hợp lệ.'); return; }
    setEditSaving(true);
    try {
      const updated = dataOf(await adminApi.updateShowtime(editId, { startTime: editForm.startTime, endTime: editForm.endTime, basePrice: Number(editForm.basePrice) }));
      setRows(old => old.map(r => r.id === editId ? { ...r, ...updated, startTime: editForm.startTime, endTime: editForm.endTime, basePrice: Number(editForm.basePrice) } : r));
      setEditId(null);
      setNotice('Đã cập nhật suất chiếu.');
    } catch (err) { setEditError(errorMessage(err)); }
    finally { setEditSaving(false); }
  }

  async function cancelShowtime(row) {
    if (!window.confirm(`Hủy suất chiếu "${row.movieTitle}" lúc ${formatDateTime(row.startTime)}?`)) return;
    setError(''); setNotice('');
    try {
      await adminApi.cancelShowtime(row.id);
      setRows(old => old.map(r => r.id === row.id ? { ...r, status: 'cancelled' } : r));
      setNotice('Đã hủy suất chiếu.');
    } catch (err) { setError(errorMessage(err)); }
  }

  // Status badge
  const statusBadge = (status) => {
    const map = { scheduled: 'bg-emerald-700 text-emerald-100', cancelled: 'bg-red-700 text-red-100', ongoing: 'bg-yellow-600 text-yellow-100', finished: 'bg-zinc-600 text-zinc-300' };
    const label = { scheduled: 'Sắp chiếu', cancelled: 'Đã hủy', ongoing: 'Đang chiếu', finished: 'Đã kết thúc' };
    const key = (status || 'scheduled').toLowerCase();
    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${map[key] ?? map.scheduled}`}>{label[key] ?? status}</span>;
  };

  // Filtered rows
  const filteredRows = [...rows]
    .filter(r => !filterMovie || (r.movieTitle ?? '').toLowerCase().includes(filterMovie.toLowerCase()))
    .filter(r => !filterDate || (r.startTime ?? '').startsWith(filterDate))
    .filter(r => !filterCinema || String(r.cinemaId) === filterCinema || (r.cinemaName ?? '').toLowerCase().includes(cinemas.find(c => String(c.id) === filterCinema)?.name?.toLowerCase() ?? '____'))
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  const field = 'block w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 mt-1';
  const inputSm = 'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500';

  return <div className="space-y-6 text-zinc-100">
    {/* Header */}
    <div className="flex justify-between items-center">
      <h1 className="text-xl font-bold">QUẢN LÝ LỊCH CHIẾU PHIM</h1>
      <button disabled={loading || saving} className="bg-red-600 rounded-lg px-4 py-2 disabled:opacity-40 text-sm font-medium" onClick={() => { setOpen(v => !v); setError(''); setNotice(''); }}>Thêm Suất Chiếu</button>
    </div>
    <p className="text-sm text-zinc-400">Danh sách suất chiếu · Giờ Việt Nam (UTC+7)</p>

    {/* Notices */}
    {notice && <p role="status" className="text-emerald-400">{notice}</p>}
    {error && <p role="alert" className="text-red-400">{error} <button type="button" className="underline" disabled={saving} onClick={() => setRetry(v => v + 1)}>Tải lại danh sách</button></p>}

    {/* Add Form */}
    {open && <form onSubmit={save} className="bg-[#181818] border border-zinc-800 rounded-xl p-6 space-y-4">
      <h2 className="font-bold">Thêm suất chiếu</h2>
      <fieldset disabled={saving} className="grid md:grid-cols-2 gap-4">
        <label>Phim<select required className={field} value={form.movieId} onChange={e => change('movieId', e.target.value)}><option value="">Chọn phim</option>{movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
        <label>Rạp<select required className={field} value={form.cinemaId} onChange={e => change('cinemaId', e.target.value)}><option value="">Chọn rạp</option>{cinemas.filter(c => !c.status || c.status.toLowerCase() === 'active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Phòng chiếu<select required disabled={!form.cinemaId || roomLoading} className={field} value={form.hallId} onChange={e => change('hallId', e.target.value)}><option value="">{roomLoading ? 'Đang tải phòng…' : 'Chọn phòng'}</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
        <label>Giá vé gốc (VNĐ)<input required type="number" min="0" step="0.01" className={field} value={form.basePrice} onChange={e => change('basePrice', e.target.value)} /></label>
        <label>Ngày giờ bắt đầu<input required type="datetime-local" className={field} value={form.startTime} onChange={e => change('startTime', e.target.value)} /></label>
        <label>Ngày giờ kết thúc<input required type="datetime-local" min={form.startTime} className={field} value={form.endTime} onChange={e => change('endTime', e.target.value)} /></label>
      </fieldset>
      {roomError && <p role="alert" className="text-red-400">{roomError} <button type="button" onClick={() => setRoomRetry(v => v + 1)}>Thử tải phòng lại</button></p>}
      {form.cinemaId && !roomLoading && !roomError && !rooms.length && <p>Rạp chưa có phòng khả dụng.</p>}
      <div className="flex gap-3">
        <button disabled={saving || roomLoading || !form.hallId} className="bg-red-600 rounded-lg px-5 py-2 disabled:opacity-40 text-sm font-medium">{saving ? 'Đang lưu…' : 'Lưu suất chiếu'}</button>
        <button type="button" disabled={saving} onClick={() => setOpen(false)} className="text-sm text-zinc-400 hover:text-zinc-200">Đóng</button>
      </div>
    </form>}

    {/* Filter bar */}
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="Lọc theo tên phim…"
        className={`${inputSm} w-48`}
        value={filterMovie}
        onChange={e => setFilterMovie(e.target.value)}
      />
      <input
        type="date"
        className={`${inputSm} w-40`}
        value={filterDate}
        onChange={e => setFilterDate(e.target.value)}
        title="Lọc theo ngày chiếu"
      />
      <select
        className={`${inputSm} w-44`}
        value={filterCinema}
        onChange={e => setFilterCinema(e.target.value)}
      >
        <option value="">Tất cả rạp</option>
        {cinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {(filterMovie || filterDate || filterCinema) && (
        <button className="text-xs text-zinc-400 hover:text-zinc-200 underline" onClick={() => { setFilterMovie(''); setFilterDate(''); setFilterCinema(''); }}>Xóa bộ lọc</button>
      )}
    </div>

    {/* Table */}
    {loading ? <p role="status">Đang tải lịch chiếu…</p> : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#141414] border border-zinc-800">
              {['Phim', 'Rạp / Phòng', 'Bắt đầu', 'Kết thúc', 'Giá vé', 'Trạng thái', 'Hành động'].map(h => (
                <th className="p-3 font-semibold text-zinc-300" key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(row => (
              <tr key={row.id} className="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                {editId === row.id ? (
                  <td colSpan={7} className="p-3">
                    <form onSubmit={saveEdit} className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-4 space-y-3">
                      <div className="text-xs text-zinc-400 mb-1">
                        <span className="font-semibold text-zinc-200">{row.movieTitle}</span> · {row.cinemaName} / {row.hallName}
                        <span className="ml-2 text-zinc-500">(Phim và phòng không thể thay đổi)</span>
                      </div>
                      {editError && <p className="text-red-400 text-xs">{editError}</p>}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="text-xs text-zinc-400">Giờ bắt đầu
                          <input type="datetime-local" required className={`${inputSm} w-full mt-1`} value={editForm.startTime} onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} />
                        </label>
                        <label className="text-xs text-zinc-400">Giờ kết thúc
                          <input type="datetime-local" required min={editForm.startTime} className={`${inputSm} w-full mt-1`} value={editForm.endTime} onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))} />
                        </label>
                        <label className="text-xs text-zinc-400">Giá vé (VNĐ)
                          <input type="number" required min="0" step="0.01" className={`${inputSm} w-full mt-1`} value={editForm.basePrice} onChange={e => setEditForm(f => ({ ...f, basePrice: e.target.value }))} />
                        </label>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button type="submit" disabled={editSaving} className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                          <Check className="w-3.5 h-3.5" />{editSaving ? 'Đang lưu…' : 'Lưu'}
                        </button>
                        <button type="button" disabled={editSaving} onClick={() => { setEditId(null); setEditError(''); }} className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 rounded-lg px-3 py-1.5 text-xs font-medium">
                          <X className="w-3.5 h-3.5" />Hủy bỏ
                        </button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="p-3 font-medium">{row.movieTitle}</td>
                    <td className="p-3 text-zinc-400">{row.cinemaName} / {row.hallName}</td>
                    <td className="p-3">{formatDateTime(row.startTime)}</td>
                    <td className="p-3">{formatDateTime(row.endTime)}</td>
                    <td className="p-3">{formatCurrency(row.basePrice)}</td>
                    <td className="p-3">{statusBadge(row.status)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          title="Sửa suất chiếu"
                          disabled={row.status === 'cancelled' || row.status === 'finished' || row.status === 'ongoing'}
                          onClick={() => openEdit(row)}
                          className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 rounded-md px-2 py-1 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Pencil className="w-3.5 h-3.5" />Sửa
                        </button>
                        <button
                          title="Hủy suất chiếu"
                          disabled={row.status === 'cancelled' || row.status === 'finished' || row.status === 'ongoing'}
                          onClick={() => cancelShowtime(row)}
                          className="flex items-center gap-1 bg-red-700 hover:bg-red-600 rounded-md px-2 py-1 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <X className="w-3.5 h-3.5" />Hủy
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredRows.length && <p className="p-4 text-zinc-400">{rows.length ? 'Không có suất chiếu khớp bộ lọc.' : 'Chưa có suất chiếu nào.'}</p>}
      </div>
    )}
  </div>;
}

const cinemaErr = (e) => e?.response?.data?.message || e?.response?.data?.error?.message || e?.message || 'Lỗi không xác định';
const emptyCinema = () => ({ name: '', address: '', city: '', hotline: '', status: 'active' });
const emptyHall = () => ({ name: '', screenType: '2D', rows: 8, cols: 10 });
const emptyGenerate = () => ({ rows: 8, cols: 10, defaultSeatTypeId: 1 });

const HALL_TYPES = ['2D', '3D', 'IMAX', 'VIP', '4DX'];
const SEAT_STATUS_ACTIVE = 'active';
const SEAT_STATUS_MAINTENANCE = 'maintenance';

function StatusBadge({ status }) {
  const isActive = status?.toLowerCase() === 'active';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-900 text-emerald-300' : 'bg-zinc-700 text-zinc-400'}`}>
      {isActive ? <Check size={10} /> : <X size={10} />}
      {isActive ? 'Hoạt động' : 'Tạm khóa'}
    </span>
  );
}

export function ManageCinemasPage() {
  // --- navigation state ---
  const [view, setView] = useState('cinemas'); // 'cinemas' | 'halls' | 'seats'
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedHall, setSelectedHall] = useState(null);

  // --- cinemas state ---
  const [cinemas, setCinemas] = useState([]);
  const [cinemaLoading, setCinemaLoading] = useState(true);
  const [cinemaError, setCinemaError] = useState('');
  const [cinemaNotice, setCinemaNotice] = useState('');
  const [cinemaForm, setCinemaForm] = useState(null); // null=closed, obj=open
  const [cinemaSaving, setCinemaSaving] = useState(false);

  // --- halls state ---
  const [halls, setHalls] = useState([]);
  const [hallLoading, setHallLoading] = useState(false);
  const [hallError, setHallError] = useState('');
  const [hallNotice, setHallNotice] = useState('');
  const [hallForm, setHallForm] = useState(null);
  const [hallSaving, setHallSaving] = useState(false);

  // --- seats state ---
  const [seats, setSeats] = useState([]);
  const [seatLoading, setSeatLoading] = useState(false);
  const [seatError, setSeatError] = useState('');
  const [seatNotice, setSeatNotice] = useState('');
  const [genForm, setGenForm] = useState(null);
  const [genSaving, setGenSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // ---- fetch cinemas ----
  const fetchCinemas = async () => {
    setCinemaLoading(true); setCinemaError('');
    try {
      const { data } = await adminApi.getCinemas();
      setCinemas(Array.isArray(data) ? data : data?.data ?? []);
    } catch (e) { setCinemaError(cinemaErr(e)); } finally { setCinemaLoading(false); }
  };
  useEffect(() => { fetchCinemas(); }, []);

  // ---- fetch halls when view=halls ----
  const fetchHalls = async (cinemaId) => {
    setHallLoading(true); setHallError('');
    try {
      const { data } = await adminApi.getRoomsByCinema(cinemaId);
      setHalls(Array.isArray(data) ? data : data?.data ?? []);
    } catch (e) { setHallError(cinemaErr(e)); } finally { setHallLoading(false); }
  };
  useEffect(() => { if (view === 'halls' && selectedCinema) fetchHalls(selectedCinema.id); }, [view, selectedCinema]);

  // ---- fetch seats when view=seats ----
  const fetchSeats = async (hallId) => {
    setSeatLoading(true); setSeatError('');
    try {
      const { data } = await adminApi.getSeatsByHall(hallId);
      setSeats(Array.isArray(data) ? data : data?.data ?? []);
    } catch (e) { setSeatError(cinemaErr(e)); } finally { setSeatLoading(false); }
  };
  useEffect(() => { if (view === 'seats' && selectedHall) fetchSeats(selectedHall.id); }, [view, selectedHall]);

  // ======= VIEW: CINEMAS =======
  const saveCinema = async (e) => {
    e.preventDefault(); setCinemaSaving(true); setCinemaError(''); setCinemaNotice('');
    try {
      if (cinemaForm.id) {
        await adminApi.updateCinema(cinemaForm.id, cinemaForm);
        setCinemaNotice('Đã cập nhật rạp thành công.');
      } else {
        await adminApi.createCinema(cinemaForm);
        setCinemaNotice('Đã thêm rạp thành công.');
      }
      setCinemaForm(null);
      await fetchCinemas();
    } catch (e) { setCinemaError(cinemaErr(e)); } finally { setCinemaSaving(false); }
  };

  const toggleCinemaStatus = async (cinema) => {
    const next = cinema.status?.toLowerCase() === 'active' ? 'inactive' : 'active';
    setCinemaError(''); setCinemaNotice('');
    try {
      await adminApi.updateCinemaStatus(cinema.id, next);
      setCinemaNotice(`Rạp "${cinema.name}" đã được ${next === 'active' ? 'mở khóa' : 'khóa'}.`);
      await fetchCinemas();
    } catch (e) { setCinemaError(cinemaErr(e)); }
  };

  const goToHalls = (cinema) => {
    setSelectedCinema(cinema); setHalls([]); setHallForm(null); setHallError(''); setHallNotice('');
    setView('halls');
  };

  // ======= VIEW: HALLS =======
  const saveHall = async (e) => {
    e.preventDefault(); setHallSaving(true); setHallError(''); setHallNotice('');
    try {
      const payload = {
        name: hallForm.name,
        screenType: hallForm.screenType,
        totalSeats: Number(hallForm.rows) * Number(hallForm.cols),
        rows: Number(hallForm.rows),
        cols: Number(hallForm.cols),
      };
      if (hallForm.id) {
        await adminApi.updateHall(hallForm.id, payload);
        setHallNotice('Đã cập nhật phòng chiếu.');
      } else {
        await adminApi.createHall(selectedCinema.id, payload);
        setHallNotice('Đã thêm phòng chiếu.');
      }
      setHallForm(null);
      await fetchHalls(selectedCinema.id);
    } catch (e) { setHallError(cinemaErr(e)); } finally { setHallSaving(false); }
  };

  const deleteHall = async (hall) => {
    if (!window.confirm(`Xóa phòng "${hall.name}"? Hành động không thể hoàn tác.`)) return;
    setHallError(''); setHallNotice('');
    try {
      await adminApi.deleteHall(hall.id);
      setHallNotice(`Đã xóa phòng "${hall.name}".`);
      await fetchHalls(selectedCinema.id);
    } catch (e) { setHallError(cinemaErr(e)); }
  };

  const goToSeats = (hall) => {
    setSelectedHall(hall); setSeats([]); setGenForm(null); setSeatError(''); setSeatNotice('');
    setView('seats');
  };

  // ======= VIEW: SEATS =======
  const toggleSeat = async (seat) => {
    if (togglingId) return;
    const next = seat.status?.toLowerCase() === SEAT_STATUS_ACTIVE ? SEAT_STATUS_MAINTENANCE : SEAT_STATUS_ACTIVE;
    setTogglingId(seat.id); setSeatError(''); setSeatNotice('');
    try {
      await adminApi.updateSeatStatus(seat.id, next);
      setSeats(prev => prev.map(s => s.id === seat.id ? { ...s, status: next } : s));
    } catch (e) { setSeatError(cinemaErr(e)); } finally { setTogglingId(null); }
  };

  const generateSeats = async (e) => {
    e.preventDefault(); setGenSaving(true); setSeatError(''); setSeatNotice('');
    try {
      await adminApi.generateSeats(selectedHall.id, {
        rows: Number(genForm.rows),
        cols: Number(genForm.cols),
        defaultSeatTypeId: Number(genForm.defaultSeatTypeId),
      });
      setSeatNotice('Đã tạo ghế tự động thành công.');
      setGenForm(null);
      await fetchSeats(selectedHall.id);
    } catch (e) { setSeatError(cinemaErr(e)); } finally { setGenSaving(false); }
  };

  // ---- group seats by row ----
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.seatRow ?? seat.rowLabel ?? '?';
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});
  const sortedRows = Object.keys(seatsByRow).sort();

  const inputCls = 'block w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 mt-1 text-sm focus:outline-none focus:border-red-500';
  const btnPrimary = 'bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-lg px-4 py-2 text-sm font-medium transition-colors';
  const btnGhost = 'text-zinc-400 hover:text-white transition-colors text-sm';

  // ===================== RENDER =====================
  if (view === 'cinemas') return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2"><Building2 size={20} className="text-red-500" />QUẢN LÝ CỤM RẠP</h1>
        <button className={btnPrimary} onClick={() => { setCinemaForm(emptyCinema()); setCinemaError(''); setCinemaNotice(''); }}>
          <span className="flex items-center gap-2"><Plus size={15} />Thêm Rạp</span>
        </button>
      </div>
      {cinemaError && <p role="alert" className="text-red-400 text-sm">{cinemaError}</p>}
      {cinemaNotice && <p role="status" className="text-emerald-400 text-sm">{cinemaNotice}</p>}

      {cinemaForm && (
        <form onSubmit={saveCinema} className="bg-[#181818] border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold">{cinemaForm.id ? `Chỉnh sửa: ${cinemaForm.name}` : 'Thêm rạp mới'}</h2>
            <button type="button" onClick={() => setCinemaForm(null)} className={btnGhost}><X size={18} /></button>
          </div>
          <fieldset disabled={cinemaSaving} className="grid md:grid-cols-2 gap-4 disabled:opacity-60">
            <label className="text-sm">Tên rạp *<input required className={inputCls} value={cinemaForm.name} onChange={e => setCinemaForm(f => ({ ...f, name: e.target.value }))} /></label>
            <label className="text-sm">Thành phố<input className={inputCls} value={cinemaForm.city ?? ''} onChange={e => setCinemaForm(f => ({ ...f, city: e.target.value }))} /></label>
            <label className="text-sm md:col-span-2">Địa chỉ *<input required className={inputCls} value={cinemaForm.address} onChange={e => setCinemaForm(f => ({ ...f, address: e.target.value }))} /></label>
            <label className="text-sm">Hotline<input className={inputCls} value={cinemaForm.hotline ?? ''} onChange={e => setCinemaForm(f => ({ ...f, hotline: e.target.value }))} /></label>
            <label className="text-sm">Trạng thái
              <select className={inputCls} value={cinemaForm.status} onChange={e => setCinemaForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm khóa</option>
              </select>
            </label>
          </fieldset>
          <div className="flex gap-3">
            <button type="submit" disabled={cinemaSaving} className={btnPrimary}>{cinemaSaving ? 'Đang lưu…' : 'Lưu'}</button>
            <button type="button" onClick={() => setCinemaForm(null)} className={btnGhost}>Hủy</button>
          </div>
        </form>
      )}

      {cinemaLoading ? <p className="text-zinc-400 text-sm">Đang tải danh sách rạp…</p> : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="p-3">Tên rạp</th>
                <th className="p-3">Địa chỉ</th>
                <th className="p-3">Hotline</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {cinemas.map(c => (
                <tr key={c.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                  <td className="p-3 font-medium">{c.name}<small className="block text-zinc-500">{c.city}</small></td>
                  <td className="p-3 text-zinc-400 max-w-xs truncate">{c.address}</td>
                  <td className="p-3 text-zinc-400">{c.hotline || '—'}</td>
                  <td className="p-3"><StatusBadge status={c.status} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button onClick={() => { setCinemaForm({ ...c }); setCinemaError(''); setCinemaNotice(''); }} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"><Pencil size={13} />Sửa</button>
                      <button onClick={() => goToHalls(c)} className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs"><Eye size={13} />Xem phòng</button>
                      <button onClick={() => toggleCinemaStatus(c)} className={`flex items-center gap-1 text-xs ${c.status?.toLowerCase() === 'active' ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}`}>
                        {c.status?.toLowerCase() === 'active' ? <><Lock size={13} />Khóa</> : <><Unlock size={13} />Mở</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!cinemas.length && <tr><td colSpan="5" className="p-6 text-zinc-500 text-center">Chưa có rạp nào.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (view === 'halls') return (
    <div className="space-y-6 text-zinc-100">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 flex-wrap">
        <button onClick={() => setView('cinemas')} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={15} />Rạp</button>
        <ChevronRight size={14} />
        <span className="text-white font-medium">{selectedCinema?.name}</span>
        <ChevronRight size={14} />
        <span className="text-zinc-300">Phòng chiếu</span>
      </div>
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-xl font-bold">PHÒNG CHIẾU — {selectedCinema?.name}</h1>
        <button className={btnPrimary} onClick={() => { setHallForm(emptyHall()); setHallError(''); setHallNotice(''); }}>
          <span className="flex items-center gap-2"><Plus size={15} />Thêm Phòng</span>
        </button>
      </div>
      {hallError && <p role="alert" className="text-red-400 text-sm">{hallError}</p>}
      {hallNotice && <p role="status" className="text-emerald-400 text-sm">{hallNotice}</p>}

      {hallForm && (
        <form onSubmit={saveHall} className="bg-[#181818] border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold">{hallForm.id ? `Chỉnh sửa: ${hallForm.name}` : 'Thêm phòng chiếu'}</h2>
            <button type="button" onClick={() => setHallForm(null)} className={btnGhost}><X size={18} /></button>
          </div>
          <fieldset disabled={hallSaving} className="grid md:grid-cols-2 gap-4 disabled:opacity-60">
            <label className="text-sm">Tên phòng *<input required className={inputCls} value={hallForm.name} onChange={e => setHallForm(f => ({ ...f, name: e.target.value }))} /></label>
            <label className="text-sm">Loại phòng
              <select className={inputCls} value={hallForm.screenType} onChange={e => setHallForm(f => ({ ...f, screenType: e.target.value }))}>
                {HALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-sm">Số hàng (rows) *
              <input required type="number" min="1" max="30" className={inputCls} value={hallForm.rows} onChange={e => setHallForm(f => ({ ...f, rows: e.target.value }))} />
            </label>
            <label className="text-sm">Số cột (cols) *
              <input required type="number" min="1" max="30" className={inputCls} value={hallForm.cols} onChange={e => setHallForm(f => ({ ...f, cols: e.target.value }))} />
            </label>
            <p className="md:col-span-2 text-xs text-zinc-400">Tổng ghế tự động tính: <strong className="text-white">{(Number(hallForm.rows) || 0) * (Number(hallForm.cols) || 0)}</strong></p>
          </fieldset>
          <div className="flex gap-3">
            <button type="submit" disabled={hallSaving} className={btnPrimary}>{hallSaving ? 'Đang lưu…' : 'Lưu'}</button>
            <button type="button" onClick={() => setHallForm(null)} className={btnGhost}>Hủy</button>
          </div>
        </form>
      )}

      {hallLoading ? <p className="text-zinc-400 text-sm">Đang tải danh sách phòng…</p> : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase">
              <tr>
                <th className="p-3">Tên phòng</th>
                <th className="p-3">Loại</th>
                <th className="p-3">Tổng ghế</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {halls.map(h => (
                <tr key={h.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                  <td className="p-3 font-medium">{h.name}</td>
                  <td className="p-3"><span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">{h.screenType || h.hallType || h.roomType || '2D'}</span></td>
                  <td className="p-3 text-zinc-300">{h.totalSeats ?? '—'}</td>
                  <td className="p-3"><StatusBadge status={h.status} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button onClick={() => { setHallForm({ ...h, rows: h.rows ?? 8, cols: h.cols ?? 10 }); setHallError(''); setHallNotice(''); }} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"><Pencil size={13} />Sửa</button>
                      <button onClick={() => goToSeats(h)} className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs"><Grid size={13} />Xem ghế</button>
                      <button onClick={() => deleteHall(h)} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs"><Trash2 size={13} />Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!halls.length && <tr><td colSpan="5" className="p-6 text-zinc-500 text-center">Phòng chiếu chưa có. Hãy thêm phòng mới.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (view === 'seats') return (
    <div className="space-y-6 text-zinc-100">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 flex-wrap">
        <button onClick={() => setView('cinemas')} className="hover:text-white transition-colors">Rạp</button>
        <ChevronRight size={14} />
        <button onClick={() => setView('halls')} className="hover:text-white transition-colors">{selectedCinema?.name}</button>
        <ChevronRight size={14} />
        <span className="text-white font-medium">{selectedHall?.name}</span>
        <ChevronRight size={14} />
        <span className="text-zinc-300">Sơ đồ ghế</span>
      </div>
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">SƠ ĐỒ GHẾ — {selectedHall?.name}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Click vào ghế để thay đổi trạng thái ACTIVE / MAINTENANCE</p>
        </div>
        <button onClick={() => setView('halls')} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={15} />Quay lại</button>
      </div>
      {seatError && <p role="alert" className="text-red-400 text-sm">{seatError}</p>}
      {seatNotice && <p role="status" className="text-emerald-400 text-sm">{seatNotice}</p>}

      {/* Generate form */}
      {!seatLoading && seats.length === 0 && !genForm && (
        <div className="flex flex-col items-center gap-3 py-10 border border-dashed border-zinc-700 rounded-xl">
          <Grid size={36} className="text-zinc-600" />
          <p className="text-zinc-400">Phòng chưa có ghế nào.</p>
          <button className={btnPrimary} onClick={() => setGenForm(emptyGenerate())}>Tạo ghế tự động</button>
        </div>
      )}
      {genForm && (
        <form onSubmit={generateSeats} className="bg-[#181818] border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold">Tạo ghế tự động</h2>
            <button type="button" onClick={() => setGenForm(null)} className={btnGhost}><X size={18} /></button>
          </div>
          <fieldset disabled={genSaving} className="grid md:grid-cols-3 gap-4 disabled:opacity-60">
            <label className="text-sm">Số hàng *<input required type="number" min="1" max="30" className={inputCls} value={genForm.rows} onChange={e => setGenForm(f => ({ ...f, rows: e.target.value }))} /></label>
            <label className="text-sm">Số cột *<input required type="number" min="1" max="30" className={inputCls} value={genForm.cols} onChange={e => setGenForm(f => ({ ...f, cols: e.target.value }))} /></label>
            <label className="text-sm">ID loại ghế mặc định<input required type="number" min="1" className={inputCls} value={genForm.defaultSeatTypeId} onChange={e => setGenForm(f => ({ ...f, defaultSeatTypeId: e.target.value }))} /></label>
          </fieldset>
          <p className="text-xs text-zinc-400">Sẽ tạo <strong className="text-white">{(Number(genForm.rows) || 0) * (Number(genForm.cols) || 0)}</strong> ghế.</p>
          <div className="flex gap-3">
            <button type="submit" disabled={genSaving} className={btnPrimary}>{genSaving ? 'Đang tạo…' : 'Tạo ghế'}</button>
            <button type="button" onClick={() => setGenForm(null)} className={btnGhost}>Hủy</button>
          </div>
        </form>
      )}

      {/* Show "generate" button even when seats exist */}
      {!seatLoading && seats.length > 0 && (
        <div className="flex justify-end">
          <button className="text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded px-3 py-1" onClick={() => setGenForm(emptyGenerate())}>Tạo lại ghế tự động</button>
        </div>
      )}

      {seatLoading ? <p className="text-zinc-400 text-sm">Đang tải sơ đồ ghế…</p> : seats.length > 0 && (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-600 inline-block" />Active</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-zinc-600 inline-block" />Maintenance</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border border-blue-500 bg-blue-900/40 inline-block" />VIP</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border border-zinc-500 bg-zinc-800 inline-block" />Standard</span>
          </div>
          {/* Screen indicator */}
          <div className="text-center py-2 bg-zinc-800 rounded text-xs text-zinc-400 tracking-widest">── MÀN HÌNH ──</div>
          {/* Seat grid by row */}
          <div className="space-y-2 overflow-x-auto pb-2">
            {sortedRows.map(row => (
              <div key={row} className="flex items-center gap-2">
                <span className="w-6 text-xs text-zinc-500 font-mono shrink-0 text-right">{row}</span>
                <div className="flex gap-1 flex-wrap">
                  {seatsByRow[row].sort((a, b) => (a.seatCol ?? 0) - (b.seatCol ?? 0)).map(seat => {
                    const isActive = seat.status?.toLowerCase() === SEAT_STATUS_ACTIVE;
                    const isVip = seat.seatType?.name?.toLowerCase().includes('vip');
                    const label = (seat.seatRow ?? row) + (seat.seatCol ?? '');
                    return (
                      <button
                        key={seat.id}
                        title={`${label} · ${seat.seatType?.name ?? 'Standard'} · ${seat.status}`}
                        disabled={togglingId === seat.id}
                        onClick={() => toggleSeat(seat)}
                        className={`w-9 h-9 rounded text-[10px] font-mono font-bold border transition-colors disabled:opacity-50
                          ${isActive
                            ? isVip ? 'bg-blue-700 border-blue-500 text-white hover:bg-blue-600' : 'bg-emerald-700 border-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return null;
}

const emptyUserForm = () => ({ fullName: '', email: '', phone: '', password: '', role: 'STAFF' });
const userError = (e) => e.response?.data?.message || e.response?.data?.error?.message || e.message || 'Không thể thực hiện thao tác';

const ROLE_BADGE = {
  ADMIN: 'bg-purple-600 text-purple-100',
  STAFF: 'bg-blue-600 text-blue-100',
  CUSTOMER: 'bg-zinc-600 text-zinc-100',
};

const STATUS_BADGE = {
  ACTIVE: 'bg-emerald-700 text-emerald-100',
  LOCKED: 'bg-red-700 text-red-100',
};

export const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyUserForm());
  const [formError, setFormError] = useState('');

  const loadUsers = () => {
    setLoading(true); setError('');
    adminApi.getUsers()
      .then(({ data }) => setUsers(data))
      .catch((e) => setError(userError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleStatus = async (user) => {
    const next = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const action = next === 'LOCKED' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản "${user.fullName || user.email}"?`)) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await adminApi.updateUserStatus(user.id, next);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: next } : u));
      setNotice(`Đã ${action} tài khoản thành công.`);
    } catch (e) { setError(userError(e)); }
    finally { setSaving(false); }
  };

  const submitForm = async (e) => {
    e.preventDefault(); setFormError('');
    const { fullName, email, phone, password, role } = form;
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setFormError('Vui lòng điền đầy đủ các trường bắt buộc.'); return;
    }
    setSaving(true);
    try {
      await adminApi.createUser({ fullName, email, phone, password, role });
      setNotice('Đã tạo tài khoản nhân viên thành công.');
      setShowForm(false); setForm(emptyUserForm());
      loadUsers();
    } catch (e) { setFormError(userError(e)); }
    finally { setSaving(false); }
  };

  const inputCls = 'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500 w-full mt-1';

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header */}
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-xl font-bold">QUẢN LÝ NGƯỜI DÙNG & NHÂN VIÊN</h1>
        <button
          disabled={saving}
          onClick={() => { setShowForm((v) => !v); setFormError(''); setForm(emptyUserForm()); setNotice(''); setError(''); }}
          className="bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={16} />{showForm ? 'Đóng form' : 'Thêm Nhân Viên'}
        </button>
      </div>

      {/* Notices */}
      {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
      {notice && <p role="status" className="text-emerald-400 text-sm">{notice}</p>}

      {/* Create Staff Form */}
      {showForm && (
        <form onSubmit={submitForm} className="bg-[#141414] border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-base">Tạo tài khoản nhân viên mới</h2>
          <fieldset disabled={saving} className="grid md:grid-cols-2 gap-4 disabled:opacity-60">
            <label className="text-sm">
              Họ tên <span className="text-red-400">*</span>
              <input type="text" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} placeholder="Nguyễn Văn A" />
            </label>
            <label className="text-sm">
              Email <span className="text-red-400">*</span>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="nhanvien@cinema.vn" />
            </label>
            <label className="text-sm">
              Số điện thoại <span className="text-red-400">*</span>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="0901234567" />
            </label>
            <label className="text-sm">
              Mật khẩu <span className="text-red-400">*</span>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="Tối thiểu 6 ký tự" />
            </label>
            <label className="text-sm">
              Vai trò
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
          </fieldset>
          {formError && <p role="alert" className="text-red-400 text-sm">{formError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
              {saving ? 'Đang lưu…' : 'Tạo tài khoản'}
            </button>
            <button type="button" disabled={saving} onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm border border-zinc-700 hover:bg-zinc-800">
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500 flex-1"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
        >
          <option value="">Tất cả vai trò</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="STAFF">STAFF</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p role="status" className="text-zinc-400">Đang tải danh sách người dùng…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#141414] border border-zinc-800">
              <tr>
                {['STT', 'Họ tên', 'Email', 'SĐT', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Hành động'].map((h) => (
                  <th key={h} className="p-3 text-zinc-400 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, idx) => (
                <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="p-3 text-zinc-400">{idx + 1}</td>
                  <td className="p-3 font-medium">{user.fullName || '—'}</td>
                  <td className="p-3 text-zinc-300">{user.email}</td>
                  <td className="p-3 text-zinc-300">{user.phone || '—'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[user.role] || 'bg-zinc-700 text-zinc-100'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[user.status] || 'bg-zinc-700 text-zinc-100'}`}>
                      {user.status === 'ACTIVE' ? 'Hoạt động' : user.status === 'LOCKED' ? 'Đã khóa' : user.status}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-400 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                  <td className="p-3">
                    <button
                      disabled={saving}
                      onClick={() => toggleStatus(user)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                        user.status === 'ACTIVE'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-emerald-700 hover:bg-emerald-600'
                      }`}
                    >
                      {user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="8" className="p-6 text-zinc-400 text-center">
                    {users.length ? 'Không tìm thấy người dùng phù hợp.' : 'Chưa có người dùng.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const promoError = (e) => e?.response?.data?.message || e?.response?.data?.error?.message || e?.message || 'Không thể thực hiện thao tác';
const emptyPromo = () => ({
  code: '', name: '', discountType: 'PERCENTAGE', discountValue: '',
  maxDiscountAmount: '', minOrderAmount: '', maxUsage: '', startDate: '', endDate: '', isActive: true,
});

function promoStatus(p) {
  const now = new Date();
  const end = p.endDate ? new Date(p.endDate) : null;
  if (end && now > end) return 'expired';
  if (p.status === 'active' || p.isActive === true) return 'active';
  return 'inactive';
}

const PROMO_BADGE = {
  active: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800',
  inactive: 'bg-amber-950/80 text-amber-400 border border-amber-800',
  expired: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
};
const PROMO_LABEL = { active: 'Đang hoạt động', inactive: 'Tạm khóa', expired: 'Hết hạn' };

export const ManagePromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyPromo());
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');

  const inputCls = 'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 w-full mt-1';

  const loadPromotions = () => {
    setLoading(true); setError('');
    adminApi.getPromotions()
      .then(({ data }) => setPromotions(Array.isArray(data) ? data : data?.data ?? []))
      .catch((e) => setError(promoError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPromotions(); }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const openCreate = () => {
    setEditId(null); setForm(emptyPromo());
    setFormError(''); setNotice(''); setError('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      code: p.code || '',
      name: p.description || p.name || '',
      discountType: p.discountType === 'amount' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
      discountValue: p.discountValue != null ? String(p.discountValue) : String(p.discountPercent ?? ''),
      maxDiscountAmount: p.maxDiscountAmount != null ? String(p.maxDiscountAmount) : '',
      minOrderAmount: p.minOrderAmount != null ? String(p.minOrderAmount) : '',
      maxUsage: p.usageLimit != null ? String(p.usageLimit) : '',
      startDate: p.startDate ? p.startDate.substring(0, 10) : '',
      endDate: p.endDate ? p.endDate.substring(0, 10) : '',
      isActive: p.status === 'active',
    });
    setFormError(''); setNotice(''); setError('');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyPromo()); setFormError(''); };

  const submitForm = async (e) => {
    e.preventDefault(); setFormError('');
    if (!form.code.trim()) { setFormError('Vui lòng nhập mã code khuyến mãi.'); return; }
    if (!form.discountValue || isNaN(Number(form.discountValue)) || Number(form.discountValue) <= 0) {
      setFormError('Giá trị giảm phải là số dương lớn hơn 0.'); return;
    }
    if (form.discountType === 'PERCENTAGE' && Number(form.discountValue) > 100) {
      setFormError('Phần trăm giảm giá không được vượt quá 100%.'); return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setFormError('Ngày hết hạn phải từ ngày bắt đầu trở đi.'); return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.name.trim(),
      discountType: form.discountType === 'PERCENTAGE' ? 'percent' : 'amount',
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      usageLimit: form.maxUsage ? Number(form.maxUsage) : null,
      startDate: form.startDate ? form.startDate + 'T00:00:00' : null,
      endDate: form.endDate ? form.endDate + 'T23:59:59' : null,
      status: form.isActive ? 'active' : 'inactive',
    };

    setSaving(true);
    try {
      if (editId) {
        await adminApi.updatePromotion(editId, payload);
        setNotice('Đã cập nhật khuyến mãi thành công.');
      } else {
        await adminApi.createPromotion(payload);
        setNotice('Đã thêm khuyến mãi mới thành công.');
      }
      closeForm(); loadPromotions();
    } catch (e) { setFormError(promoError(e)); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (p) => {
    const nextActive = promoStatus(p) !== 'active';
    if (!window.confirm(`Bạn có chắc muốn ${nextActive ? 'kích hoạt' : 'tạm khóa'} mã "${p.code}"?`)) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await adminApi.togglePromotionStatus(p.id, nextActive);
      setNotice(`Đã ${nextActive ? 'kích hoạt' : 'tạm khóa'} mã khuyến mãi "${p.code}".`);
      loadPromotions();
    } catch (e) { setError(promoError(e)); }
    finally { setSaving(false); }
  };

  const deletePromo = async (p) => {
    if (!window.confirm(`Xóa mã khuyến mãi "${p.code}"? Thao tác này không thể hoàn tác.`)) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await adminApi.deletePromotion(p.id);
      setNotice(`Đã xóa khuyến mãi "${p.code}".`);
      loadPromotions();
    } catch (e) { setError(promoError(e)); }
    finally { setSaving(false); }
  };

  const fmtDate = (d) => { if (!d) return '—'; const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('vi-VN'); };
  const fmtVal = (p) => {
    const type = p.discountType;
    const val = p.discountValue ?? p.discountPercent;
    if (type === 'percent' || type === 'PERCENTAGE') {
      const cap = p.maxDiscountAmount ? ` (Tối đa ${formatCurrency(p.maxDiscountAmount)})` : '';
      return `${val}%${cap}`;
    }
    if (val != null) return formatCurrency(val);
    return '—';
  };

  const filteredPromotions = promotions.filter((p) => {
    const st = promoStatus(p);
    if (statusFilter !== 'all' && st !== statusFilter) return false;
    if (searchTerm.trim()) {
      const kw = searchTerm.toLowerCase().trim();
      const codeMatch = (p.code || '').toLowerCase().includes(kw);
      const descMatch = (p.description || p.name || '').toLowerCase().includes(kw);
      return codeMatch || descMatch;
    }
    return true;
  });

  const activeCount = promotions.filter((p) => promoStatus(p) === 'active').length;
  const inactiveCount = promotions.filter((p) => promoStatus(p) === 'inactive').length;
  const expiredCount = promotions.filter((p) => promoStatus(p) === 'expired').length;
  const totalUsed = promotions.reduce((acc, p) => acc + (p.usedCount || 0), 0);

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-white">
            <Tag className="w-5 h-5 text-red-500" />
            QUẢN LÝ CHƯƠNG TRÌNH KHUYẾN MÃI
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Tạo và quản lý mã voucher giảm giá cho khách hàng đặt vé</p>
        </div>
        <button
          disabled={saving}
          onClick={showForm ? closeForm : openCreate}
          className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition shadow"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Đóng form' : 'Thêm khuyến mãi'}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl">
          <span className="text-xs text-zinc-400">Tổng chương trình</span>
          <div className="text-2xl font-bold text-white mt-1">{promotions.length}</div>
        </div>
        <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl">
          <span className="text-xs text-emerald-400 font-medium">Đang hoạt động</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
        </div>
        <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl">
          <span className="text-xs text-amber-400 font-medium">Tạm khóa</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{inactiveCount}</div>
        </div>
        <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl">
          <span className="text-xs text-zinc-400 font-medium">Tổng lượt đã dùng</span>
          <div className="text-2xl font-bold text-zinc-200 mt-1">{totalUsed}</div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-white"><X size={14} /></button>
        </div>
      )}
      {notice && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-emerald-400 hover:text-white"><X size={14} /></button>
        </div>
      )}

      {/* Form Add / Edit */}
      {showForm && (
        <form onSubmit={submitForm} className="bg-[#141414] border border-zinc-800 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Pencil size={16} className="text-red-500" />
              {editId ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
            </h2>
            <button type="button" onClick={closeForm} className="text-zinc-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <fieldset disabled={saving} className="grid md:grid-cols-2 gap-4 disabled:opacity-60">
            {/* Code */}
            <label className="text-sm">
              Mã code <span className="text-red-400">*</span>
              <input
                type="text" required maxLength={50}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                className={inputCls} placeholder="VD: CHAOBANMOI, VIP20"
              />
            </label>

            {/* Name / Description */}
            <label className="text-sm">
              Tên chương trình / Mô tả
              <input
                type="text" maxLength={255}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls} placeholder="VD: Chào bạn mới - Giảm 20k đơn từ 100k"
              />
            </label>

            {/* Discount Type */}
            <label className="text-sm">
              Loại giảm giá <span className="text-red-400">*</span>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className={inputCls}>
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
              </select>
            </label>

            {/* Discount Value */}
            <label className="text-sm">
              Giá trị giảm <span className="text-red-400">*</span>
              <input
                type="number" required min="0" step="any"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                className={inputCls}
                placeholder={form.discountType === 'PERCENTAGE' ? 'VD: 20 (%)' : 'VD: 30000 (VNĐ)'}
              />
            </label>

            {/* Max Discount Amount (chỉ hiển thị khi loại là PERCENTAGE) */}
            {form.discountType === 'PERCENTAGE' && (
              <label className="text-sm">
                Giảm tối đa (VNĐ) <span className="text-zinc-400 text-xs">— để trống = không giới hạn trần</span>
                <input
                  type="number" min="0" step="1000"
                  value={form.maxDiscountAmount}
                  onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                  className={inputCls} placeholder="VD: 50000"
                />
              </label>
            )}

            {/* Min Order Amount */}
            <label className="text-sm">
              Đơn tối thiểu (VNĐ) <span className="text-zinc-400 text-xs">— tuỳ chọn</span>
              <input
                type="number" min="0" step="1000"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                className={inputCls} placeholder="VD: 100000"
              />
            </label>

            {/* Max Usage */}
            <label className="text-sm">
              Số lần dùng tối đa <span className="text-zinc-400 text-xs">— để trống = không giới hạn</span>
              <input
                type="number" min="1" step="1"
                value={form.maxUsage}
                onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
                className={inputCls} placeholder="VD: 100"
              />
            </label>

            {/* Start Date */}
            <label className="text-sm">
              Ngày bắt đầu <span className="text-red-400">*</span>
              <input
                type="date" required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={inputCls}
              />
            </label>

            {/* End Date */}
            <label className="text-sm">
              Ngày hết hạn <span className="text-red-400">*</span>
              <input
                type="date" required
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={inputCls}
              />
            </label>

            {/* isActive */}
            <label className="text-sm flex items-center gap-3 md:col-span-2 mt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-red-500 rounded"
              />
              <span className="text-zinc-200">Kích hoạt mã khuyến mãi ngay sau khi lưu</span>
            </label>
          </fieldset>

          {formError && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-red-300 text-sm">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50 transition"
            >
              {saving ? 'Đang lưu…' : editId ? 'Cập nhật khuyến mãi' : 'Thêm mới khuyến mãi'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={closeForm}
              className="rounded-lg px-4 py-2.5 text-sm border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo mã code hoặc tên chương trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
          >
            <option value="all">Tất cả ({promotions.length})</option>
            <option value="active">Đang hoạt động ({activeCount})</option>
            <option value="inactive">Tạm khóa ({inactiveCount})</option>
            <option value="expired">Hết hạn ({expiredCount})</option>
          </select>
          <button
            onClick={loadPromotions}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-zinc-400 bg-[#141414] rounded-xl border border-zinc-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
          Đang tải danh sách khuyến mãi…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#141414]">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                {['Mã Code', 'Tên chương trình', 'Loại giảm', 'Giá trị', 'Đơn tối thiểu', 'Bắt đầu', 'Hết hạn', 'Lượt dùng', 'Trạng thái', 'Hành động'].map((h) => (
                  <th key={h} className="p-3.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredPromotions.map((p) => {
                const st = promoStatus(p);
                const usedCount = p.usedCount ?? 0;
                const canDelete = usedCount === 0;
                const isExpired = st === 'expired';
                return (
                  <tr key={p.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded text-xs">
                          {p.code}
                        </span>
                        <button
                          onClick={() => copyCode(p.code)}
                          title="Sao chép mã"
                          className="text-zinc-500 hover:text-zinc-300 p-1 rounded"
                        >
                          {copiedCode === p.code ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5 text-zinc-200 max-w-[200px] truncate" title={p.description || p.name}>
                      {p.description || p.name || '—'}
                    </td>
                    <td className="p-3.5 text-zinc-300 whitespace-nowrap">
                      {p.discountType === 'percent' || p.discountType === 'PERCENTAGE' ? (
                        <span className="text-indigo-300 font-medium">Phần trăm (%)</span>
                      ) : (
                        <span className="text-amber-300 font-medium">Cố định (VNĐ)</span>
                      )}
                    </td>
                    <td className="p-3.5 font-semibold text-emerald-400 whitespace-nowrap">{fmtVal(p)}</td>
                    <td className="p-3.5 text-zinc-300 whitespace-nowrap">
                      {p.minOrderAmount && Number(p.minOrderAmount) > 0 ? formatCurrency(p.minOrderAmount) : '—'}
                    </td>
                    <td className="p-3.5 text-zinc-400 whitespace-nowrap text-xs">{fmtDate(p.startDate)}</td>
                    <td className="p-3.5 text-zinc-400 whitespace-nowrap text-xs">{fmtDate(p.endDate)}</td>
                    <td className="p-3.5 text-zinc-300 whitespace-nowrap">
                      <span className="font-medium text-white">{usedCount}</span>
                      <span className="text-zinc-500">{p.usageLimit != null ? ` / ${p.usageLimit}` : ' / ∞'}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PROMO_BADGE[st]}`}>
                        {PROMO_LABEL[st]}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex gap-2">
                        {/* Edit */}
                        <button
                          disabled={saving}
                          onClick={() => openEdit(p)}
                          title="Chỉnh sửa"
                          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition disabled:opacity-50"
                        >
                          <Pencil size={14} />
                        </button>
                        {/* Toggle status */}
                        {!isExpired && (
                          <button
                            disabled={saving}
                            onClick={() => toggleStatus(p)}
                            title={st === 'active' ? 'Tạm khóa mã' : 'Kích hoạt mã'}
                            className={`p-1.5 rounded transition disabled:opacity-50 ${
                              st === 'active'
                                ? 'bg-amber-950/60 hover:bg-amber-800 border border-amber-700/60 text-amber-300'
                                : 'bg-emerald-950/60 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300'
                            }`}
                          >
                            {st === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                          </button>
                        )}
                        {/* Delete */}
                        {canDelete && (
                          <button
                            disabled={saving}
                            onClick={() => deletePromo(p)}
                            title="Xóa khuyến mãi"
                            className="p-1.5 rounded bg-zinc-800 hover:bg-red-700 text-zinc-400 hover:text-white transition disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredPromotions.length && (
                <tr>
                  <td colSpan="10" className="p-8 text-zinc-500 text-center">
                    {promotions.length === 0
                      ? 'Chưa có chương trình khuyến mãi nào. Hãy nhấn "+ Thêm khuyến mãi" để tạo mã mới.'
                      : 'Không tìm thấy chương trình khuyến mãi nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const ManageBookingsPage = () => {
  const [tab, setTab] = useState('bookings'); // 'bookings' | 'payments'

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [bookingNotice, setBookingNotice] = useState('');
  const [bookingPage, setBookingPage] = useState(0);
  const [bookingTotalPages, setBookingTotalPages] = useState(1);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Payments state
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentPage, setPaymentPage] = useState(0);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('all');

  const fetchBookings = async (page = 0, status = bookingStatus, search = bookingSearch) => {
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await adminApi.getBookings({ page, size: 15, status, search });
      const data = dataOf(res);
      setBookings(data?.content || []);
      setBookingTotalPages(data?.totalPages || 1);
      setBookingPage(page);
      if (data?.summary) {
        setBookingSummary(data.summary);
      }
    } catch (err) {
      setBookingError(errorMessage(err));
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchPayments = async (page = 0, method = paymentMethod) => {
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const res = await adminApi.getPayments({ page, size: 15, method });
      const data = dataOf(res);
      setPayments(data?.content || []);
      setPaymentTotalPages(data?.totalPages || 1);
      setPaymentPage(page);
    } catch (err) {
      setPaymentError(errorMessage(err));
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'bookings') {
      fetchBookings(0, bookingStatus, bookingSearch);
    } else {
      fetchPayments(0, paymentMethod);
    }
  }, [tab]);

  const handleBookingSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings(0, bookingStatus, bookingSearch);
  };

  // Xác nhận thanh toán tại quầy
  const handleConfirmPayment = async (b) => {
    const code = b.bookingCode || `#${b.id}`;
    if (!window.confirm(`Xác nhận đơn "${code}" của khách "${b.customerName || 'Khách vãng lai'}" đã thanh toán tại quầy thành công?`)) return;
    setActionLoading(true);
    setBookingError('');
    setBookingNotice('');
    try {
      await adminApi.confirmBookingPayment(b.id);
      setBookingNotice(`Đã xác nhận thanh toán thành công cho đơn ${code}!`);
      if (selectedBooking && selectedBooking.id === b.id) {
        setSelectedBooking((prev) => ({ ...prev, status: 'PAID' }));
      }
      fetchBookings(bookingPage, bookingStatus, bookingSearch);
    } catch (err) {
      setBookingError(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Hủy đơn vé & nhả ghế
  const handleCancelBooking = async (b) => {
    const code = b.bookingCode || `#${b.id}`;
    if (!window.confirm(`Bạn có chắc muốn HỦY đơn đặt vé "${code}"? Tất cả ghế trong đơn sẽ được hoàn trả lại rạp.`)) return;
    setActionLoading(true);
    setBookingError('');
    setBookingNotice('');
    try {
      await adminApi.cancelAdminBooking(b.id, 'Hủy bởi quản trị viên');
      setBookingNotice(`Đã hủy đơn ${code} và mở lại ghế thành công!`);
      if (selectedBooking && selectedBooking.id === b.id) {
        setSelectedBooking((prev) => ({ ...prev, status: 'CANCELLED' }));
      }
      fetchBookings(bookingPage, bookingStatus, bookingSearch);
    } catch (err) {
      setBookingError(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Soát vé trực tiếp
  const handleCheckInTicket = async (ticketId) => {
    setActionLoading(true);
    setBookingError('');
    setBookingNotice('');
    try {
      const res = await adminApi.checkInTicket(ticketId);
      const data = dataOf(res);
      setBookingNotice('Soát vé thành công!');
      // Cập nhật trạng thái vé trong modal
      if (selectedBooking) {
        const updatedTickets = (selectedBooking.tickets || []).map((t) =>
          t.id === ticketId ? { ...t, status: 'checked_in', checkedInAt: data?.checkedInAt || new Date().toISOString() } : t
        );
        setSelectedBooking({ ...selectedBooking, tickets: updatedTickets });
      }
      fetchBookings(bookingPage, bookingStatus, bookingSearch);
    } catch (err) {
      setBookingError(errorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (st) => {
    const s = (st || '').toUpperCase();
    if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">Đã thanh toán</span>;
    }
    if (s === 'PENDING' || s === 'PENDING_PAYMENT') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800">Chờ thanh toán</span>;
    }
    if (s === 'CANCELLED' || s === 'FAILED') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800">Đã hủy</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">{st}</span>;
  };

  const ticketStatusBadge = (st) => {
    const s = (st || '').toLowerCase();
    if (s === 'checked_in' || s === 'used') {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">Đã soát vé</span>;
    }
    if (s === 'cancelled') {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-950/80 text-red-400 border border-red-800">Đã hủy</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800">Hợp lệ</span>;
  };

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Receipt className="w-5 h-5 text-red-500" />
            QUẢN LÝ ĐƠN HÀNG & GIAO DỊCH
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Theo dõi, xác nhận thanh toán tại quầy, hủy vé và quản lý giao dịch</p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === 'bookings' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" /> Đơn Đặt Vé
          </button>
          <button
            onClick={() => setTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === 'payments' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Lịch Sử Thanh Toán
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: BOOKINGS ===================== */}
      {tab === 'bookings' && (
        <div className="space-y-5">
          {/* Summary KPI Cards */}
          {bookingSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl">
                <span className="text-xs text-zinc-400">Tổng số đơn</span>
                <div className="text-2xl font-bold text-white mt-1">{bookingSummary.totalOrders}</div>
              </div>
              <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl">
                <span className="text-xs text-emerald-400 font-medium">Đã thanh toán (PAID)</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{bookingSummary.paidOrders}</div>
                {bookingSummary.totalRevenue != null && (
                  <span className="text-xs text-emerald-300/80 block mt-0.5">
                    {formatCurrency(bookingSummary.totalRevenue)}
                  </span>
                )}
              </div>
              <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl">
                <span className="text-xs text-amber-400 font-medium">Chờ thanh toán</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{bookingSummary.pendingOrders}</div>
              </div>
              <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl">
                <span className="text-xs text-red-400 font-medium">Đã hủy</span>
                <div className="text-2xl font-bold text-red-400 mt-1">{bookingSummary.cancelledOrders}</div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {bookingError && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-sm flex items-center justify-between">
              <span>{bookingError}</span>
              <button onClick={() => setBookingError('')} className="text-red-400 hover:text-white"><X size={14} /></button>
            </div>
          )}
          {bookingNotice && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-300 text-sm flex items-center justify-between">
              <span>{bookingNotice}</span>
              <button onClick={() => setBookingNotice('')} className="text-emerald-400 hover:text-white"><X size={14} /></button>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
            <form onSubmit={handleBookingSearchSubmit} className="flex-1 flex gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, tên khách hàng, email, SĐT..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-sm font-medium rounded-lg text-white transition">
                Tìm kiếm
              </button>
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Trạng thái:</span>
              <select
                value={bookingStatus}
                onChange={(e) => {
                  setBookingStatus(e.target.value);
                  fetchBookings(0, e.target.value, bookingSearch);
                }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PAID">Đã thanh toán (PAID)</option>
                <option value="pending_payment">Chờ thanh toán</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
              <button
                onClick={() => fetchBookings(bookingPage, bookingStatus, bookingSearch)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
                title="Làm mới danh sách"
              >
                <RefreshCw className={`w-4 h-4 ${bookingLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">Mã Đơn</th>
                    <th className="p-3.5 whitespace-nowrap">Khách Hàng</th>
                    <th className="p-3.5 whitespace-nowrap">Phim & Suất Chiếu</th>
                    <th className="p-3.5 text-center whitespace-nowrap">Vé & Combo</th>
                    <th className="p-3.5 whitespace-nowrap">Tổng Tiền</th>
                    <th className="p-3.5 whitespace-nowrap">PTTT</th>
                    <th className="p-3.5 whitespace-nowrap">Trạng Thái</th>
                    <th className="p-3.5 whitespace-nowrap">Ngày Đặt</th>
                    <th className="p-3.5 text-right whitespace-nowrap">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {bookingLoading ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-zinc-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
                        Đang tải danh sách đơn đặt vé...
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-zinc-500">
                        Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const isPending = (b.status || '').toUpperCase() === 'PENDING' || (b.status || '').toUpperCase() === 'PENDING_PAYMENT';
                      const isCancelled = (b.status || '').toUpperCase() === 'CANCELLED';
                      const ticketCount = b.ticketCount || (b.tickets ? b.tickets.length : 0);
                      const comboCount = b.comboCount || (b.combos ? b.combos.length : 0);

                      return (
                        <tr key={b.id} className="hover:bg-zinc-900/40 transition">
                          <td className="p-3.5 font-mono font-bold text-red-400 whitespace-nowrap">
                            {b.bookingCode || `#${b.id}`}
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-white whitespace-nowrap">{b.customerName || 'Khách vãng lai'}</div>
                            <div className="text-xs text-zinc-400 whitespace-nowrap">{b.customerPhone || b.customerEmail || '—'}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-medium text-zinc-200 line-clamp-1">{b.movieTitle || '—'}</div>
                            <div className="text-xs text-zinc-400 whitespace-nowrap">
                              {b.cinemaName ? `${b.cinemaName} · ` : ''}{b.hallName || ''}
                              {b.startTime ? ` (${formatDateTime(b.startTime)})` : ''}
                            </div>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className="font-semibold text-white">{ticketCount} vé</span>
                            {comboCount > 0 && (
                              <span className="text-xs text-amber-400 block">+{comboCount} combo</span>
                            )}
                          </td>
                          <td className="p-3.5 font-semibold text-emerald-400 whitespace-nowrap">
                            {formatCurrency(b.finalAmount || 0)}
                            {b.discountAmount > 0 && (
                              <span className="text-[11px] text-amber-400 font-normal block">
                                Giảm: -{formatCurrency(b.discountAmount)}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300">
                              {b.paymentMethod === 'PAYPAL' ? 'PayPal' : 'Tại quầy'}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">{statusBadge(b.status)}</td>
                          <td className="p-3.5 text-xs text-zinc-400 whitespace-nowrap">{b.createdAt ? formatDateTime(b.createdAt) : ''}</td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Xem chi tiết */}
                              <button
                                onClick={() => setSelectedBooking(b)}
                                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-lg text-zinc-200 inline-flex items-center gap-1 transition"
                                title="Xem chi tiết đơn"
                              >
                                <Eye className="w-3.5 h-3.5" /> Xem
                              </button>

                              {/* Nút xác nhận thanh toán tại quầy nếu đang chờ */}
                              {isPending && (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleConfirmPayment(b)}
                                  className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-800 border border-emerald-700/60 text-xs rounded-lg text-emerald-300 inline-flex items-center gap-1 transition disabled:opacity-50"
                                  title="Xác nhận khách đã thanh toán tại quầy"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Thu tiền
                                </button>
                              )}

                              {/* Nút hủy đơn nếu chưa hủy */}
                              {!isCancelled && (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleCancelBooking(b)}
                                  className="p-1.5 bg-zinc-800 hover:bg-red-800 text-zinc-400 hover:text-white text-xs rounded-lg transition disabled:opacity-50"
                                  title="Hủy đơn vé & nhả ghế"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {bookingTotalPages > 1 && (
              <div className="p-4 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
                <span>
                  Trang {bookingPage + 1} / {bookingTotalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={bookingPage === 0 || bookingLoading}
                    onClick={() => fetchBookings(bookingPage - 1, bookingStatus, bookingSearch)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded text-zinc-200 transition"
                  >
                    Trang trước
                  </button>
                  <button
                    disabled={bookingPage >= bookingTotalPages - 1 || bookingLoading}
                    onClick={() => fetchBookings(bookingPage + 1, bookingStatus, bookingSearch)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded text-zinc-200 transition"
                  >
                    Trang tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: PAYMENTS ===================== */}
      {tab === 'payments' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-[#141414] border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-zinc-400 font-medium">Phương thức:</span>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  fetchPayments(0, e.target.value);
                }}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
              >
                <option value="all">Tất cả phương thức</option>
                <option value="PAYPAL">PayPal</option>
                <option value="PAY_AT_COUNTER">Thanh toán tại quầy</option>
                <option value="VNPAY">VNPay</option>
              </select>
            </div>
            <button
              onClick={() => fetchPayments(paymentPage, paymentMethod)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-lg text-zinc-300 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${paymentLoading ? 'animate-spin' : ''}`} /> Tải lại giao dịch
            </button>
          </div>

          {paymentError && (
            <div className="p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-300 text-sm">
              {paymentError}
            </div>
          )}

          {/* Payments Table */}
          <div className="bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Mã Đơn (Booking ID)</th>
                    <th className="p-3.5">Mã GD (TxnRef)</th>
                    <th className="p-3.5">Số Tiền (VND)</th>
                    <th className="p-3.5">Phương Thức</th>
                    <th className="p-3.5">Mã PayPal / Ngân hàng</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {paymentLoading ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-zinc-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
                        Đang tải danh sách thanh toán...
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-zinc-500">
                        Chưa có lịch sử giao dịch thanh toán nào.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-3.5 text-zinc-400 font-mono">#{p.id}</td>
                        <td className="p-3.5 font-medium text-white">Đơn #{p.bookingId}</td>
                        <td className="p-3.5 font-mono text-xs text-zinc-300">{p.txnRef}</td>
                        <td className="p-3.5 font-semibold text-emerald-400">
                          {formatCurrency(p.amount || 0)}
                          {p.amountUsd && (
                            <span className="block text-[11px] text-zinc-400 font-normal">
                              ${p.amountUsd} USD
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-200">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-zinc-400 font-mono">
                          {p.paypalCaptureId || p.paypalOrderId || p.bankCode || '—'}
                        </td>
                        <td className="p-3.5">{statusBadge(p.status)}</td>
                        <td className="p-3.5 text-right text-xs text-zinc-400">
                          {p.paidAt ? formatDateTime(p.paidAt) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paymentTotalPages > 1 && (
              <div className="p-4 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
                <span>
                  Trang {paymentPage + 1} / {paymentTotalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={paymentPage === 0 || paymentLoading}
                    onClick={() => fetchPayments(paymentPage - 1, paymentMethod)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded text-zinc-200 transition"
                  >
                    Trang trước
                  </button>
                  <button
                    disabled={paymentPage >= paymentTotalPages - 1 || paymentLoading}
                    onClick={() => fetchPayments(paymentPage + 1, paymentMethod)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded text-zinc-200 transition"
                  >
                    Trang tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL CHI TIẾT ĐƠN HÀNG ===================== */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-red-500 font-bold">Chi Tiết Đơn Đặt Vé</span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {selectedBooking.bookingCode || `#${selectedBooking.id}`}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-[#121212] p-4 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 text-xs block">Khách hàng</span>
                <span className="font-semibold text-white">{selectedBooking.customerName || 'Khách vãng lai'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block">Email / SĐT</span>
                <span className="text-zinc-300">{selectedBooking.customerPhone || selectedBooking.customerEmail || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block">Trạng thái</span>
                <div className="mt-1">{statusBadge(selectedBooking.status)}</div>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block">Phim</span>
                <span className="font-semibold text-white">{selectedBooking.movieTitle || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block">Rạp / Phòng</span>
                <span className="text-zinc-300">
                  {selectedBooking.cinemaName ? `${selectedBooking.cinemaName} · ` : ''}{selectedBooking.hallName || '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block">Thời gian chiếu</span>
                <span className="text-zinc-300">
                  {selectedBooking.startTime ? formatDateTime(selectedBooking.startTime) : '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block">Phương thức thanh toán</span>
                <span className="font-semibold text-zinc-200">
                  {selectedBooking.paymentMethod === 'PAYPAL' ? 'PayPal Online' : 'Thanh toán tại quầy'}
                </span>
              </div>
              {selectedBooking.promotionCode && (
                <div>
                  <span className="text-zinc-500 text-xs block">Voucher đã dùng</span>
                  <span className="font-mono font-bold text-amber-300">{selectedBooking.promotionCode}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500 text-xs block">Thời gian đặt</span>
                <span className="text-zinc-400 text-xs">
                  {selectedBooking.createdAt ? formatDateTime(selectedBooking.createdAt) : '—'}
                </span>
              </div>
            </div>

            {/* Tickets List */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-red-500" /> Danh Sách Vé ({selectedBooking.tickets?.length || 0})
              </h3>
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Mã Vé</th>
                      <th className="p-3">Vị Trí Ghế</th>
                      <th className="p-3">Loại Ghế</th>
                      <th className="p-3">Giá Vé</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3 text-right">Soát Vé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {(selectedBooking.tickets || []).map((t) => {
                      const isCheckedIn = (t.status || '').toLowerCase() === 'checked_in' || (t.status || '').toLowerCase() === 'used';
                      const isCancelled = (t.status || '').toLowerCase() === 'cancelled';

                      return (
                        <tr key={t.id} className="hover:bg-zinc-900/50 transition">
                          <td className="p-3 font-mono font-medium text-red-400">{t.ticketCode}</td>
                          <td className="p-3 font-bold text-white">{t.seatLabel || `${t.seatRow}${t.seatCol}`}</td>
                          <td className="p-3 text-zinc-300">{t.seatType || 'Thường'}</td>
                          <td className="p-3 font-medium text-emerald-400">{formatCurrency(t.price || 0)}</td>
                          <td className="p-3">
                            {ticketStatusBadge(t.status)}
                            {t.checkedInAt && (
                              <span className="text-[10px] text-zinc-500 block mt-0.5">
                                {formatDateTime(t.checkedInAt)}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {!isCheckedIn && !isCancelled && (
                              <button
                                disabled={actionLoading}
                                onClick={() => handleCheckInTicket(t.id)}
                                className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 rounded text-[11px] font-semibold transition disabled:opacity-50 inline-flex items-center gap-1"
                              >
                                <Check size={12} /> Soát vé
                              </button>
                            )}
                            {isCheckedIn && (
                              <span className="text-zinc-500 text-xs inline-flex items-center gap-1">
                                <CheckCircle size={13} className="text-emerald-500" /> Đã vào rạp
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Combos List (nếu có) */}
            {selectedBooking.combos && selectedBooking.combos.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-500" /> Combo Bắp Nước ({selectedBooking.combos.length})
                </h3>
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Tên Combo</th>
                        <th className="p-3 text-center">Số Lượng</th>
                        <th className="p-3">Đơn Giá</th>
                        <th className="p-3 text-right">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {selectedBooking.combos.map((c, idx) => (
                        <tr key={c.id || idx} className="hover:bg-zinc-900/50">
                          <td className="p-3 font-medium text-white">{c.comboName}</td>
                          <td className="p-3 text-center font-bold text-amber-400">{c.quantity}</td>
                          <td className="p-3 text-zinc-300">{formatCurrency(c.unitPrice || 0)}</td>
                          <td className="p-3 text-right font-semibold text-emerald-400">
                            {formatCurrency(c.totalPrice || (c.unitPrice * c.quantity) || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Total Summary */}
            <div className="border-t border-zinc-800 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm bg-zinc-900/60 p-4 rounded-xl">
              <div className="space-y-1 text-xs text-zinc-400">
                {selectedBooking.seatAmount != null && (
                  <div>Tiền vé: <span className="text-zinc-200 font-medium">{formatCurrency(selectedBooking.seatAmount)}</span></div>
                )}
                {selectedBooking.comboAmount != null && selectedBooking.comboAmount > 0 && (
                  <div>Tiền bắp nước: <span className="text-zinc-200 font-medium">{formatCurrency(selectedBooking.comboAmount)}</span></div>
                )}
                {selectedBooking.discountAmount != null && selectedBooking.discountAmount > 0 && (
                  <div className="text-amber-400">Giảm giá voucher: -{formatCurrency(selectedBooking.discountAmount)}</div>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-emerald-400">
                  {formatCurrency(selectedBooking.finalAmount || 0)}
                </span>
              </div>
            </div>

            {/* Actions in Modal */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Nếu đơn đang chờ thanh toán -> Nút xác nhận thanh toán */}
              {((selectedBooking.status || '').toUpperCase() === 'PENDING' || (selectedBooking.status || '').toUpperCase() === 'PENDING_PAYMENT') && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleConfirmPayment(selectedBooking)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-sm font-bold rounded-xl text-white transition flex items-center justify-center gap-2 disabled:opacity-50 shadow"
                >
                  <CheckCircle size={16} /> Xác nhận đã thu tiền tại quầy
                </button>
              )}

              {/* Nếu đơn chưa hủy -> Nút hủy đơn */}
              {(selectedBooking.status || '').toUpperCase() !== 'CANCELLED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleCancelBooking(selectedBooking)}
                  className="py-2.5 px-4 bg-red-950/70 hover:bg-red-800 border border-red-700/60 text-sm font-semibold rounded-xl text-red-300 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={16} /> Hủy đơn vé này
                </button>
              )}

              <button
                onClick={() => setSelectedBooking(null)}
                className="py-2.5 px-6 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold rounded-xl text-zinc-300 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

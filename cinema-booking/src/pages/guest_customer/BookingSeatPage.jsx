import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import showtimeApi from '../../api/showtimeApi';
import bookingApi from '../../api/bookingApi';
import useCountdown from '../../hooks/useCountdown';
import { canSelectSeat, dataOf, errorMessage, timedHold, safeUrl } from '../../utils/booking';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Popcorn, Ticket, MapPin, Clock, Calendar, Check, AlertCircle } from 'lucide-react';

const CinemaHall3D = lazy(() => import('../../components/booking/CinemaHall3D'));

const defaultComboImages = {
  popcorn: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=400&q=80',
  drink: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
  combo: 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?auto=format&fit=crop&w=400&q=80',
  tea: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
};

function getComboImage(combo) {
  if (safeUrl(combo.imageUrl)) return safeUrl(combo.imageUrl);
  const name = (combo.name || '').toLowerCase();
  if (name.includes('combo') || name.includes('pack') || name.includes('đôi')) return defaultComboImages.combo;
  if (name.includes('trà') || name.includes('tea')) return defaultComboImages.tea;
  if (name.includes('nước') || name.includes('coca') || name.includes('pepsi')) return defaultComboImages.drink;
  return defaultComboImages.popcorn;
}

export default function BookingSeatPage() {
  const { showtimeId } = useParams();
  return <BookingSession key={showtimeId} showtimeId={showtimeId} />;
}

function BookingSession({ showtimeId }) {
  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const [hold, setHold] = useState(null);
  const [selected, setSelected] = useState([]);
  const [combos, setCombos] = useState([]);
  const [quantities, setQuantities] = useState(() => {
    try {
      const saved = sessionStorage.getItem('selected_combos');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [view, setView] = useState('2D');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(false);
  const operation = useRef(false);
  const alive = useRef(true);
  const { formattedTime, isExpired } = useCountdown(hold?.expiresAt, hold?.clockOffset);

  const refresh = useCallback(async () => {
    if (operation.current) return;
    operation.current = true;
    try {
      const [seats, current, comboList] = await Promise.all([
        showtimeApi.getShowtimeSeats(showtimeId).then(dataOf),
        showtimeApi.getHold(showtimeId).then(dataOf),
        bookingApi.getCombos().then(dataOf).catch(() => []),
      ]);
      if (!alive.current) return;
      setMap(seats);
      setHold(timedHold(current));
      setSelected(current.status === 'ACTIVE' ? current.seatIds : []);
      if (Array.isArray(comboList)) setCombos(comboList);
      setOnline(true);
      setError('');
    } catch (e) {
      if (alive.current) {
        setError(errorMessage(e));
        setOnline(false);
      }
    } finally {
      operation.current = false;
    }
  }, [showtimeId]);

  useEffect(() => {
    alive.current = true;
    Promise.resolve().then(refresh);
    const timer = setInterval(refresh, 5000);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive.current = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  async function save(ids, release = false) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError('');
    try {
      const current = dataOf(
        await (release
          ? showtimeApi.deleteHold(showtimeId)
          : showtimeApi.putHold(showtimeId, ids))
      );
      if (alive.current) {
        setHold(timedHold(current));
        setSelected(current.seatIds || []);
        setOnline(true);
      }
    } catch (e) {
      if (alive.current) {
        setError(errorMessage(e));
        setOnline(false);
      }
    } finally {
      operation.current = false;
      if (alive.current) setBusy(false);
    }
  }

  const expired = hold?.status === 'EXPIRED' || (hold?.status === 'ACTIVE' && isExpired);
  const own = !expired ? selected : [];

  function toggle(seat) {
    if (busy || expired || !online || !canSelectSeat(seat, own)) return;
    const next = own.includes(seat.id)
      ? own.filter((id) => id !== seat.id)
      : [...own, seat.id];
    if (next.length > 8) {
      setError('Tối đa 8 ghế trong một lần đặt.');
      return;
    }
    save(next, next.length === 0);
  }

  const chosen = map?.seats.filter((seat) => own.includes(seat.id)) || [];
  const rows = Object.groupBy
    ? Object.groupBy(map?.seats || [], (seat) => seat.seatRow)
    : (map?.seats || []).reduce((all, seat) => {
        (all[seat.seatRow] ||= []).push(seat);
        return all;
      }, {});
  const show = map?.showtime;

  // Calculate totals
  const totalSeatsPrice = chosen.reduce((sum, s) => sum + Number(s.finalPrice || 0), 0);
  const selectedCombosList = combos
    .filter((c) => (quantities[c.id] || 0) > 0)
    .map((c) => ({
      ...c,
      quantity: quantities[c.id],
      total: Number(c.price || 0) * quantities[c.id],
    }));
  const totalCombosPrice = selectedCombosList.reduce((sum, c) => sum + c.total, 0);
  const grandTotal = totalSeatsPrice + totalCombosPrice;

  const handleContinue = () => {
    try {
      sessionStorage.setItem('selected_combos', JSON.stringify(quantities));
    } catch {}
    navigate(`/checkout?showtimeId=${showtimeId}`);
  };

  return (
    <main className="bg-[#121212] min-h-screen py-8 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* 1. Header Bar */}
        <header className="bg-[#181818] border border-zinc-800 rounded-2xl p-5 flex justify-between items-center flex-wrap gap-4 mb-6 shadow-xl">
          <div>
            <span className="text-[11px] font-black uppercase text-red-500 tracking-wider flex items-center gap-1.5 mb-1">
              <Ticket className="w-3.5 h-3.5" /> BƯỚC 1: CHỌN GHẾ & BẮP NƯỚC
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {show?.movieTitle || 'ĐẶT VÉ XEM PHIM'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-zinc-200 font-semibold">{show?.cinemaName}</span>
              <span>•</span>
              <span>{show?.hallName}</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">{formatDateTime(show?.startTime)}</span>
            </p>
          </div>

          <div className="text-right bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-xl">
            <p className="text-[11px] text-zinc-400 flex items-center justify-end gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-red-500" /> Thời gian giữ ghế
            </p>
            <strong className="text-xl sm:text-2xl font-black text-red-500 tracking-wider">
              {hold?.expiresAt ? formattedTime : 'Chưa giữ ghế'}
            </strong>
          </div>
        </header>

        {error && (
          <div role="alert" className="text-red-400 bg-red-950/30 border border-red-900/50 p-4 rounded-xl mb-6 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={refresh} className="underline text-xs cursor-pointer font-bold">
              Tải lại trạng thái
            </button>
          </div>
        )}

        {expired && (
          <div role="alert" className="bg-red-950/80 border border-red-800 p-4 rounded-xl mb-6 text-sm flex items-center justify-between">
            <span>Phiên giữ ghế đã hết hạn. Vui lòng bấm để chọn lại ghế.</span>
            <button
              disabled={busy || !online}
              onClick={() => save([])}
              className="px-3 py-1 bg-red-600 rounded-lg text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer"
            >
              Bắt đầu phiên mới
            </button>
          </div>
        )}

        {!map ? (
          <div className="py-24 text-center text-zinc-400">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải sơ đồ phòng chiếu…</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Columns: Seat Matrix + Bắp Nước */}
            <div className="lg:col-span-2 space-y-8">
              {/* SECTION 1: SEAT MAP */}
              <section className="bg-[#181818] border border-zinc-800 rounded-2xl p-5 sm:p-6 overflow-hidden shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    {['2D', '3D'].map((mode) => (
                      <button
                        key={mode}
                        aria-pressed={view === mode}
                        onClick={() => setView(mode)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          view === mode
                            ? 'bg-[#e71a0f] text-white shadow-md shadow-red-950/50'
                            : 'bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-700/80'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-zinc-500 hidden sm:inline">
                    Chọn tối đa 8 ghế/lần đặt
                  </span>
                </div>

                {view === '2D' ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-max p-4">
                      {/* Cinema Curved Screen */}
                      <div className="relative mb-14 text-center">
                        <div className="w-3/4 mx-auto h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full shadow-[0_0_20px_rgba(231,26,15,0.6)]" />
                        <span className="inline-block mt-2 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                          MÀN HÌNH CHIẾU
                        </span>
                      </div>

                      {/* Seat Grid */}
                      <div className="space-y-3">
                        {Object.entries(rows)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([row, seats]) => (
                            <div key={row} className="flex gap-2 items-center justify-center">
                              <span className="w-6 text-center text-xs font-bold text-zinc-500">
                                {row}
                              </span>
                              <div
                                className="grid gap-2"
                                style={{
                                  gridTemplateColumns: `repeat(${Math.max(
                                    ...map.seats.map((s) => s.layoutCol ?? s.seatCol)
                                  )}, 2rem)`,
                                }}
                              >
                                {seats.map((seat) => (
                                  <button
                                    key={seat.id}
                                    style={{ gridColumn: seat.layoutCol ?? seat.seatCol }}
                                    title={`${seat.seatNumber} · ${seat.seatType} · ${formatCurrency(
                                      seat.finalPrice
                                    )} · ${seat.status}`}
                                    aria-label={`Ghế ${seat.seatNumber}`}
                                    aria-pressed={own.includes(seat.id)}
                                    disabled={
                                      busy || expired || !online || !canSelectSeat(seat, own)
                                    }
                                    onClick={() => toggle(seat)}
                                    className={`h-8 rounded-lg border text-xs font-bold transition transform active:scale-95 disabled:opacity-30 cursor-pointer ${
                                      own.includes(seat.id)
                                        ? 'bg-[#e71a0f] border-red-500 text-white shadow-md shadow-red-950/60'
                                        : canSelectSeat(seat, own)
                                        ? 'bg-zinc-900 border-amber-600/70 text-zinc-200 hover:border-amber-400'
                                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {seat.seatCol}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Suspense fallback={<p role="status" className="py-20 text-center text-zinc-400">Đang tải không gian 3D…</p>}>
                    <CinemaHall3D
                      seats={map.seats}
                      selectedIds={own}
                      onToggle={toggle}
                      disabled={busy || expired || !online}
                    />
                  </Suspense>
                )}

                {/* Legend */}
                <div className="mt-8 pt-4 border-t border-zinc-800/80 flex flex-wrap justify-center items-center gap-6 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#e71a0f] border border-red-500" />
                    <span>Đang chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-zinc-900 border border-amber-600" />
                    <span>Ghế trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-zinc-800 border border-zinc-700 opacity-60" />
                    <span>Đã bán / Đang giữ</span>
                  </div>
                </div>
              </section>

              {/* SECTION 2: BẮP NƯỚC (CINESTAR CONCESSION MENU) */}
              <section className="bg-[#181818] border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <Popcorn className="w-5 h-5 text-amber-400" /> CHỌN BẮP NƯỚC (COMBO ƯU ĐÃI)
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Thưởng thức bắp rang bơ nóng hổi và nước ngọt mát lạnh, nhận tại quầy Concession trước giờ chiếu
                    </p>
                  </div>
                  <span className="hidden sm:inline-block text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full uppercase">
                    Tiết kiệm đến 20%
                  </span>
                </div>

                {!combos.length ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Chưa có combo bắp nước khả dụng.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {combos.map((combo) => (
                      <div
                        key={combo.id}
                        className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 flex gap-3.5 items-center justify-between transition group"
                      >
                        <img
                          src={getComboImage(combo)}
                          alt={combo.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 border border-zinc-800"
                        />
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-amber-400 transition">
                            {combo.name}
                          </h3>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                            {combo.description}
                          </p>
                          <p className="text-amber-400 font-extrabold text-xs sm:text-sm mt-1.5">
                            {formatCurrency(combo.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/60">
                          <button
                            type="button"
                            disabled={busy || expired || !online || !(quantities[combo.id] > 0)}
                            aria-label={`Giảm ${combo.name}`}
                            onClick={() =>
                              setQuantities((q) => ({
                                ...q,
                                [combo.id]: Math.max(0, (q[combo.id] || 0) - 1),
                              }))
                            }
                            className="w-7 h-7 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-white">
                            {quantities[combo.id] || 0}
                          </span>
                          <button
                            type="button"
                            disabled={busy || expired || !online || quantities[combo.id] >= 99}
                            aria-label={`Thêm ${combo.name}`}
                            onClick={() =>
                              setQuantities((q) => ({
                                ...q,
                                [combo.id]: (q[combo.id] || 0) + 1,
                              }))
                            }
                            className="w-7 h-7 rounded bg-[#e71a0f] hover:bg-[#c41200] disabled:opacity-30 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Aside Order Summary */}
            <aside className="bg-[#181818] border border-zinc-800 rounded-2xl p-6 h-fit sticky top-24 space-y-5 shadow-2xl">
              <h2 className="font-black text-sm uppercase tracking-wider text-white border-b border-zinc-800 pb-3 flex items-center justify-between">
                <span>THÔNG TIN ĐẶT VÉ</span>
                <span className="text-[10px] text-zinc-500 font-normal">Tạm tính</span>
              </h2>

              {/* Show Information */}
              <div className="space-y-1.5 text-xs text-zinc-300">
                <p className="font-bold text-sm text-white line-clamp-1">{show?.movieTitle}</p>
                <p className="text-zinc-400">{show?.cinemaName} • {show?.hallName}</p>
                <p className="text-amber-400 font-medium">{formatDateTime(show?.startTime)}</p>
              </div>

              {/* Selected Seats List */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex justify-between">
                  <span>Ghế ngồi:</span>
                  <span className="text-white">{chosen.length} ghế</span>
                </p>
                {chosen.length > 0 ? (
                  <div className="space-y-1 text-xs">
                    {chosen.map((s) => (
                      <div key={s.id} className="flex justify-between items-center text-zinc-300">
                        <span>Ghế {s.seatNumber} ({s.seatType})</span>
                        <span className="font-semibold">{formatCurrency(s.finalPrice)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Chưa chọn ghế ngồi</p>
                )}
              </div>

              {/* Selected Combos List */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex justify-between">
                  <span>Bắp nước:</span>
                  <span className="text-amber-400">
                    {selectedCombosList.reduce((acc, c) => acc + c.quantity, 0)} món
                  </span>
                </p>
                {selectedCombosList.length > 0 ? (
                  <div className="space-y-1.5 text-xs">
                    {selectedCombosList.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-zinc-300">
                        <span className="truncate pr-2">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-semibold text-amber-400 shrink-0">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Chưa chọn bắp nước</p>
                )}
              </div>

              {/* Grand Total */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-xs text-zinc-400">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-[#e71a0f]">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                <button
                  disabled={!chosen.length || busy || expired || !online}
                  onClick={handleContinue}
                  className="w-full bg-[#e71a0f] hover:bg-[#c41200] text-white rounded-xl py-3.5 font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition transform active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-center"
                >
                  TIẾP TỤC THANH TOÁN
                </button>

                <button
                  disabled={!chosen.length || busy}
                  onClick={() => save([], true)}
                  className="w-full text-zinc-500 hover:text-zinc-300 text-xs mt-3 transition disabled:opacity-40 cursor-pointer"
                >
                  Bỏ chọn tất cả ghế
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

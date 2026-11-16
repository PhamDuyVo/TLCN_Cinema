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
    const interval = setInterval(refresh, 5000);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive.current = false;
      clearInterval(interval);
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
      setError('Mỗi lượt đặt tối đa 8 ghế.');
      return;
    }
    save(next, next.length === 0);
  }

  const handleContinue = () => {
    try {
      sessionStorage.setItem('selected_combos', JSON.stringify(quantities));
    } catch {}
    navigate(`/checkout?showtimeId=${showtimeId}`);
  };

  const show = map?.showtime;

  const rows = (map?.seats || []).reduce((acc, seat) => {
    (acc[seat.seatRow] ||= []).push(seat);
    return acc;
  }, {});

  const chosen = (map?.seats || []).filter((s) => own.includes(s.id));
  const totalSeatAmount = chosen.reduce((acc, s) => acc + (s.finalPrice || 0), 0);

  const selectedCombosList = combos
    .filter((c) => (quantities[c.id] || 0) > 0)
    .map((c) => ({
      ...c,
      quantity: quantities[c.id],
      total: c.price * quantities[c.id],
    }));

  const totalComboAmount = selectedCombosList.reduce((acc, c) => acc + c.total, 0);
  const grandTotal = totalSeatAmount + totalComboAmount;

  return (
    <main className="min-h-screen text-zinc-100 py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Breadcrumbs & Status Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-[#2E2E38]">
          <div>
            <span className="text-[#E50914] text-xs font-black tracking-widest uppercase">
              BƯỚC 1 / 2: CHỌN GHẾ & BẮP NƯỚC
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
              {show?.movieTitle || 'Đang tải thông tin phim…'}
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1">
              {show?.cinemaName} • {show?.hallName} • {formatDateTime(show?.startTime)}
            </p>
          </div>

          {/* Countdown Clock */}
          {own.length > 0 && !expired && (
            <div className="flex items-center gap-2 bg-[#1B1B23] border border-[#E50914] px-4 py-2 rounded-xl shadow-lg shadow-red-900/30">
              <Clock className="w-4 h-4 text-[#E50914] animate-pulse" />
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block -mb-1">Thời gian giữ ghế</span>
                <span className="text-lg font-black text-[#E50914] font-mono tracking-wider">
                  {formattedTime}
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div role="alert" className="bg-red-950/80 border border-red-800 p-4 rounded-xl mb-6 text-sm flex items-center justify-between text-red-200">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /> {error}
            </span>
            <button onClick={refresh} className="underline text-xs cursor-pointer font-bold text-white">
              Tải lại trạng thái
            </button>
          </div>
        )}

        {expired && (
          <div role="alert" className="bg-red-950/80 border border-red-800 p-4 rounded-xl mb-6 text-sm flex items-center justify-between text-red-200">
            <span>Phiên giữ ghế đã hết hạn. Vui lòng bấm để chọn lại ghế.</span>
            <button
              disabled={busy || !online}
              onClick={() => save([])}
              className="px-3 py-1 bg-[#E50914] rounded-lg text-xs font-bold text-white hover:bg-[#C24132] disabled:opacity-40 cursor-pointer"
            >
              Bắt đầu phiên mới
            </button>
          </div>
        )}

        {!map ? (
          <div className="py-24 text-center text-zinc-400">
            <div className="w-8 h-8 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải sơ đồ phòng chiếu…</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Columns: Seat Matrix + Bắp Nước */}
            <div className="lg:col-span-2 space-y-8">
              {/* SECTION 1: SEAT MAP */}
              <section className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-5 sm:p-6 overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    {['2D', '3D'].map((mode) => (
                      <button
                        key={mode}
                        aria-pressed={view === mode}
                        onClick={() => setView(mode)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                          view === mode
                            ? 'bg-[#E50914] text-white shadow-md shadow-red-900/40'
                            : 'bg-[#121218] text-[#A1A1AA] hover:text-white border border-[#2E2E38]'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-[#E50914] font-semibold hidden sm:inline">
                    Chọn tối đa 8 ghế/lần đặt
                  </span>
                </div>

                {view === '2D' ? (
                  <div className="overflow-x-auto">
                    <div className="min-w-max p-4">
                      {/* Cinema Curved Screen */}
                      <div className="relative mb-14 text-center">
                        <div className="w-3/4 mx-auto h-2 bg-gradient-to-r from-transparent via-[#E50914] to-transparent rounded-full shadow-[0_0_25px_rgba(229,9,20,0.6)]" />
                        <span className="inline-block mt-2 text-[10px] uppercase tracking-widest text-[#E50914] font-bold">
                          MÀN HÌNH CHIẾU
                        </span>
                      </div>

                      {/* Seat Grid */}
                      <div className="space-y-3">
                        {Object.entries(rows)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([row, seats]) => (
                            <div key={row} className="flex gap-2 items-center justify-center">
                              <span className="w-6 text-center text-xs font-bold text-zinc-400">
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
                                    className={`h-8 rounded-lg border text-xs font-black transition transform active:scale-95 disabled:opacity-30 cursor-pointer ${
                                      own.includes(seat.id)
                                        ? 'bg-[#E50914] border-[#E50914] text-white shadow-md shadow-red-900/40'
                                        : canSelectSeat(seat, own)
                                        ? 'bg-[#121218] border-[#2E2E38] text-zinc-300 hover:border-[#E50914] hover:text-white'
                                        : 'bg-[#09090D] border-[#1C1C24] text-zinc-600 cursor-not-allowed'
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
                <div className="mt-8 pt-4 border-t border-[#2E2E38] flex flex-wrap justify-center items-center gap-6 text-xs text-[#A1A1AA]">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#E50914] border border-[#E50914]" />
                    <span className="font-semibold text-white">Đang chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#121218] border border-[#2E2E38]" />
                    <span>Ghế trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#09090D] border border-[#1C1C24] opacity-60" />
                    <span className="text-zinc-600">Đã bán / Đang giữ</span>
                  </div>
                </div>
              </section>

              {/* SECTION 2: BẮP NƯỚC (CONCESSION MENU) */}
              <section className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#2E2E38]">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <Popcorn className="w-5 h-5 text-[#E50914]" /> CHỌN BẮP NƯỚC (COMBO ƯU ĐÃI)
                    </h2>
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      Thưởng thức bắp rang bơ nóng hổi và nước ngọt mát lạnh, nhận tại quầy Concession trước giờ chiếu
                    </p>
                  </div>
                  <span className="hidden sm:inline-block text-[11px] font-bold text-[#E50914] bg-[#E50914]/10 border border-[#E50914]/30 px-3 py-1 rounded-full uppercase">
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
                        className="bg-[#121218] border border-[#2E2E38] hover:border-[#E50914]/60 rounded-xl p-3.5 flex gap-3.5 items-center justify-between transition group"
                      >
                        <img
                          src={getComboImage(combo)}
                          alt={combo.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 border border-[#2E2E38]"
                        />
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-[#E50914] transition">
                            {combo.name}
                          </h3>
                          <p className="text-[11px] text-[#A1A1AA] line-clamp-2 mt-0.5 leading-snug">
                            {combo.description}
                          </p>
                          <p className="text-[#E50914] font-extrabold text-xs sm:text-sm mt-1.5">
                            {formatCurrency(combo.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 bg-[#1B1B23] p-1 rounded-lg border border-[#2E2E38]">
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
                            className="w-7 h-7 rounded bg-[#121218] hover:bg-[#252530] border border-[#2E2E38] disabled:opacity-30 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
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
                            className="w-7 h-7 rounded bg-[#881337] hover:bg-[#590D22] disabled:opacity-30 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
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
            <aside className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6 h-fit sticky top-24 space-y-5 shadow-2xl">
              <h2 className="font-black text-sm uppercase tracking-wider text-white border-b border-[#2E2E38] pb-3 flex items-center justify-between">
                <span>THÔNG TIN ĐẶT VÉ</span>
                <span className="text-[10px] text-[#E50914] font-bold">Tạm tính</span>
              </h2>

              {/* Show Information */}
              <div className="space-y-1.5 text-xs text-zinc-300">
                <p className="font-bold text-sm text-white line-clamp-1">{show?.movieTitle}</p>
                <p className="text-[#A1A1AA]">{show?.cinemaName} • {show?.hallName}</p>
                <p className="text-[#E50914] font-semibold">{formatDateTime(show?.startTime)}</p>
              </div>

              {/* Selected Seats List */}
              <div className="pt-3 border-t border-[#2E2E38] space-y-2">
                <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex justify-between">
                  <span>Ghế ngồi:</span>
                  <span className="text-[#E50914]">{chosen.length} ghế</span>
                </p>
                {chosen.length > 0 ? (
                  <div className="space-y-1 text-xs">
                    {chosen.map((s) => (
                      <div key={s.id} className="flex justify-between items-center text-zinc-200">
                        <span>Ghế {s.seatNumber} ({s.seatType})</span>
                        <span className="font-semibold text-white">{formatCurrency(s.finalPrice)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Chưa chọn ghế ngồi</p>
                )}
              </div>

              {/* Selected Combos List */}
              <div className="pt-3 border-t border-[#2E2E38] space-y-2">
                <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex justify-between">
                  <span>Bắp nước:</span>
                  <span className="text-[#E50914]">
                    {selectedCombosList.reduce((acc, c) => acc + c.quantity, 0)} món
                  </span>
                </p>
                {selectedCombosList.length > 0 ? (
                  <div className="space-y-1.5 text-xs">
                    {selectedCombosList.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-zinc-200">
                        <span className="truncate pr-2">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-semibold text-[#E50914] shrink-0">
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
              <div className="pt-4 border-t border-[#2E2E38]">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-xs text-zinc-400">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-[#E50914]">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                <button
                  disabled={!chosen.length || busy || expired || !online}
                  onClick={handleContinue}
                  className="w-full bg-[#E50914] hover:bg-[#C24132] disabled:bg-[#1C1C24] disabled:text-zinc-600 text-white rounded-xl py-3.5 font-black text-xs uppercase tracking-wider shadow-lg shadow-red-900/40 transition transform active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-center"
                >
                  TIẾP TỤC THANH TOÁN
                </button>

                <button
                  disabled={!chosen.length || busy}
                  onClick={() => save([], true)}
                  className="w-full text-zinc-400 hover:text-white text-xs mt-3 transition disabled:opacity-40 cursor-pointer"
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

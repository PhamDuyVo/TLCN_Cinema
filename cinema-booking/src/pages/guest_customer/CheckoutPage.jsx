import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import bookingApi from '../../api/bookingApi';
import paymentApi from '../../api/paymentApi';
import showtimeApi from '../../api/showtimeApi';
import useCountdown from '../../hooks/useCountdown';
import { comboItems, dataOf, errorMessage, timedHold, safeUrl } from '../../utils/booking';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { CreditCard, Store, ShieldCheck } from 'lucide-react';

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const id = Number(params.get('showtimeId'));
  if (!Number.isSafeInteger(id) || id <= 0)
    return (
      <main className="min-h-screen p-10 text-zinc-100">
        <p>Chưa có suất chiếu để thanh toán.</p>
        <Link to="/" className="text-[#E50914] hover:text-rose-300 underline font-bold mt-2 inline-block">
          Chọn phim và ghế
        </Link>
      </main>
    );
  return <CheckoutSession key={id} showtimeId={id} />;
}

function CheckoutSession({ showtimeId }) {
  const navigate = useNavigate();
  const [context, setContext] = useState(null);
  const [combos, setCombos] = useState([]);
  const [quantities, setQuantities] = useState(() => {
    try {
      const saved = sessionStorage.getItem('selected_combos');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [promotionCode, setPromotionCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAYPAL'); // Mặc định PAYPAL
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [error, setError] = useState('');
  const [online, setOnline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retry, setRetry] = useState(0);
  const submittingRef = useRef(false);
  const { formattedTime, isExpired } = useCountdown(
    context?.hold.expiresAt,
    context?.hold.clockOffset
  );

  useEffect(() => {
    let active = true,
      running = false;
    async function refresh() {
      if (running || submittingRef.current) return;
      running = true;
      try {
        const [map, hold, products] = await Promise.all([
          showtimeApi.getShowtimeSeats(showtimeId).then(dataOf),
          showtimeApi.getHold(showtimeId).then(dataOf),
          bookingApi.getCombos().then(dataOf),
        ]);
        if (active) {
          setContext({ ...map, hold: timedHold(hold) });
          setCombos(products);
          setOnline(true);
          setError('');
        }
      } catch (e) {
        if (active) {
          setOnline(false);
          setError(errorMessage(e));
        }
      } finally {
        running = false;
      }
    }
    refresh();
    const timer = setInterval(refresh, 5000);
    const visible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [showtimeId, retry]);

  const seatIds = context?.hold.seatIds || [];
  const validHold = context?.hold.status === 'ACTIVE' && !isExpired && seatIds.length > 0;
  const payloadKey = JSON.stringify({
    showtimeId,
    seatIds,
    combos: comboItems(quantities),
    promotionCode: promotionCode.trim().toUpperCase(),
    paymentMethod,
  });

  useEffect(() => {
    if (!validHold || !online) return;
    let active = true;
    const timer = setTimeout(() => {
      (async () => {
        const request = JSON.parse(payloadKey);
        if (request.promotionCode) {
          const base = dataOf(await bookingApi.quote({ ...request, promotionCode: '' }));
          dataOf(
            await bookingApi.applyPromotion({
              code: request.promotionCode,
              orderAmount: base.totalAmount,
            })
          );
        }
        return dataOf(await bookingApi.quote(request));
      })()
        .then((data) => {
          if (active) {
            setQuote({ key: payloadKey, data });
            setQuoteError('');
          }
        })
        .catch((e) => {
          if (active) {
            setQuote(null);
            setQuoteError(errorMessage(e));
          }
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [payloadKey, validHold, online, retry]);

  const currentQuote = quote?.key === payloadKey ? quote.data : null;
  const estimatedUsd = currentQuote?.finalAmount
    ? (Number(currentQuote.finalAmount) / 25400).toFixed(2)
    : '0.00';

  async function submit() {
    if (submittingRef.current || !validHold || !online || !currentQuote) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...JSON.parse(payloadKey),
        paymentMethod,
      };

      const booking = dataOf(await bookingApi.createBooking(payload));

      if (!booking?.bookingCode) {
        throw new Error(
          'Máy chủ chưa trả mã đặt vé. Vui lòng kiểm tra Vé của tôi trước khi thử lại.'
        );
      }

      try {
        sessionStorage.removeItem('selected_combos');
      } catch {}

      // Nếu thanh toán qua PayPal, chuyển hướng người dùng sang cổng thanh toán PayPal Sandbox
      if (paymentMethod === 'PAYPAL') {
        let approveUrl = booking.paymentUrl;
        if (!approveUrl) {
          try {
            const createOrderFn = bookingApi.createPayPalOrder || paymentApi.createPayPalOrder;
            const payRes = dataOf(await createOrderFn(booking.bookingCode));
            approveUrl = payRes?.approveUrl;
          } catch (payErr) {
            console.error('Lỗi khi gọi createPayPalOrder fallback:', payErr);
          }
        }

        if (approveUrl) {
          window.location.href = approveUrl;
          return;
        }

        throw new Error('Chưa thể lấy liên kết thanh toán PayPal. Vui lòng kiểm tra lại kết nối hoặc tài khoản PayPal.');
      }

      // Thanh toán tại quầy: chuyển ngay sang trang xác nhận thành công
      navigate(
        `/booking-success?bookingCode=${encodeURIComponent(booking.bookingCode)}`,
        { replace: true }
      );
    } catch (e) {
      setError(errorMessage(e));
      setQuote(null);
      setOnline(false);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const show = context?.showtime;

  return (
    <main className="min-h-screen text-[#F8FAFC] py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-black border-b border-[#2E2E38] pb-4 mb-4">
          COMBO, VOUCHER & ĐẶT VÉ
        </h1>
        <p className="text-[#A1A1AA] text-xs mb-6">
          Chọn thêm bắp nước, áp dụng mã giảm giá và xác nhận thanh toán trực tuyến
        </p>

        {error && (
          <p role="alert" className="text-red-400 mb-4 bg-red-950/40 border border-red-800 p-3 rounded-lg text-sm">
            {error}{' '}
            <button onClick={() => setRetry((v) => v + 1)} className="underline ml-2 font-bold text-white cursor-pointer">
              Thử lại
            </button>
          </p>
        )}

        {!context ? (
          <p role="status" className="text-zinc-400 py-12 text-center text-sm">Đang tải đơn đặt vé…</p>
        ) : !validHold ? (
          <div role="alert" className="bg-[#1B1B23] border border-[#2E2E38] p-6 rounded-2xl text-center">
            <p className="text-zinc-300 mb-2">Không còn ghế được giữ trong phiên này.</p>
            <Link className="text-[#E50914] underline font-bold" to={`/booking/${showtimeId}`}>
              Quay lại chọn ghế
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Combo Section */}
              <section className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6 shadow-xl">
                <h2 className="font-black text-[#F8FAFC] mb-4 text-base flex items-center gap-2">
                  <span className="w-2 h-4 bg-[#E50914] rounded-sm inline-block" />
                  COMBO BẮP NƯỚC
                </h2>
                {!combos.length && <p className="text-zinc-400 text-xs">Chưa có combo khả dụng.</p>}
                {combos.map((combo) => (
                  <div
                    key={combo.id}
                    className="bg-[#121218] border border-[#2E2E38] rounded-xl p-4 mb-3 flex justify-between items-center gap-4"
                  >
                    <div>
                      {safeUrl(combo.imageUrl) && (
                        <img
                          src={safeUrl(combo.imageUrl)}
                          alt={combo.name}
                          className="w-20 h-20 object-cover rounded-lg mb-2 border border-[#2E2E38]"
                        />
                      )}
                      <h3 className="font-bold text-sm text-white">{combo.name}</h3>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">{combo.description}</p>
                      <p className="text-[#E50914] font-black text-sm mt-1.5">
                        {formatCurrency(combo.price)}
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-center bg-[#1B1B23] p-1.5 rounded-lg border border-[#2E2E38]">
                      <button
                        disabled={submitting || !(quantities[combo.id] > 0)}
                        aria-label={`Giảm ${combo.name}`}
                        onClick={() =>
                          setQuantities((q) => ({
                            ...q,
                            [combo.id]: Math.max(0, (q[combo.id] || 0) - 1),
                          }))
                        }
                        className="bg-[#121218] hover:bg-[#252530] border border-[#2E2E38] rounded w-7 h-7 flex items-center justify-center font-bold text-white disabled:opacity-30 cursor-pointer"
                      >
                        −
                      </button>
                      <span className="w-5 text-center font-bold text-white text-xs">
                        {quantities[combo.id] || 0}
                      </span>
                      <button
                        disabled={submitting || quantities[combo.id] >= 99}
                        aria-label={`Thêm ${combo.name}`}
                        onClick={() =>
                          setQuantities((q) => ({
                            ...q,
                            [combo.id]: (q[combo.id] || 0) + 1,
                          }))
                        }
                        className="bg-[#881337] hover:bg-[#590D22] rounded w-7 h-7 flex items-center justify-center font-bold text-white disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </section>

              {/* Voucher Section */}
              <section className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6 shadow-xl">
                <label className="font-bold block mb-3 text-sm text-white" htmlFor="promotion">
                  MÃ GIẢM GIÁ / VOUCHER
                </label>
                <input
                  id="promotion"
                  value={promotionCode}
                  disabled={submitting}
                  onChange={(e) => {
                    setPromotionCode(e.target.value);
                    setQuoteError('');
                  }}
                  placeholder="Nhập mã ưu đãi (ví dụ: GIAM30K)"
                  className="bg-[#121218] border border-[#2E2E38] focus:border-[#E50914] rounded-xl p-3 w-full uppercase text-sm text-white outline-none font-bold"
                />
                <p className="text-xs text-[#A1A1AA] mt-2">Mã và tổng tiền được máy chủ kiểm tra tự động.</p>
                {quoteError && (
                  <p role="alert" className="text-red-400 mt-3 text-xs bg-red-950/40 p-2.5 rounded-lg border border-red-800">
                    {quoteError}{' '}
                    <button className="underline ml-2 font-bold text-white cursor-pointer" onClick={() => setRetry((v) => v + 1)}>
                      Thử lại
                    </button>
                  </p>
                )}
              </section>

              {/* Payment Method Selection */}
              <section className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6 shadow-xl">
                <h2 className="font-black text-[#F8FAFC] mb-4 text-base flex items-center gap-2">
                  <span className="w-2 h-4 bg-[#E50914] rounded-sm inline-block" />
                  PHƯƠNG THỨC THANH TOÁN
                </h2>
                <div className="space-y-3">
                  {/* Option 1: PayPal */}
                  <label
                    className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'PAYPAL'
                        ? 'bg-[#121218] border-[#E50914] shadow-md shadow-red-950/30'
                        : 'bg-[#121218]/60 border-[#2E2E38] hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="PAYPAL"
                      checked={paymentMethod === 'PAYPAL'}
                      onChange={() => setPaymentMethod('PAYPAL')}
                      className="mt-1 accent-[#E50914]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-sky-400" />
                        <span className="font-bold text-sm text-white">Thanh toán trực tuyến PayPal (Dev/Sandbox)</span>
                        <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded font-bold">Khuyên dùng</span>
                      </div>
                      <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed">
                        Hỗ trợ tài khoản cá nhân PayPal Sandbox, thẻ thanh toán quốc tế Visa, Mastercard, American Express.
                      </p>
                      {currentQuote && (
                        <p className="text-xs text-amber-400 font-medium mt-2 bg-amber-950/30 border border-amber-900/60 p-2 rounded-lg">
                          Tỷ giá quy đổi ước tính (1 USD ≈ 25.400 VND): <strong className="text-white">${estimatedUsd} USD</strong>
                        </p>
                      )}
                    </div>
                  </label>

                  {/* Option 2: Pay at Counter */}
                  <label
                    className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'PAY_AT_COUNTER'
                        ? 'bg-[#121218] border-[#E50914] shadow-md shadow-red-950/30'
                        : 'bg-[#121218]/60 border-[#2E2E38] hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="PAY_AT_COUNTER"
                      checked={paymentMethod === 'PAY_AT_COUNTER'}
                      onChange={() => setPaymentMethod('PAY_AT_COUNTER')}
                      className="mt-1 accent-[#E50914]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-amber-400" />
                        <span className="font-bold text-sm text-white">Thanh toán tại quầy rạp (Pay at counter)</span>
                      </div>
                      <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed">
                        Đặt giữ chỗ trực tuyến trước và thanh toán tiền mặt hoặc thẻ tại quầy vé rạp UTE Cinema trước giờ chiếu.
                      </p>
                    </div>
                  </label>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#71717A]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Bảo mật giao dịch tiêu chuẩn quốc tế SSL/TLS 256-bit</span>
                </div>
              </section>
            </div>

            {/* Sidebar Summary */}
            <aside className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6 h-fit sticky top-24 shadow-2xl">
              <h2 className="font-black mb-4 text-base text-white border-b border-[#2E2E38] pb-3">
                CHI TIẾT ĐẶT VÉ
              </h2>
              <p className="text-[#E50914] font-bold text-xs mb-4">
                Thời gian giữ ghế: <span className="font-mono text-sm">{formattedTime}</span>
              </p>
              <h3 className="font-black text-white text-base leading-snug">{show.movieTitle}</h3>
              <p className="text-xs text-[#A1A1AA] my-1.5">
                {show.cinemaName} · {show.hallName}
              </p>
              <p className="text-xs text-rose-400 font-medium">{formatDateTime(show.startTime)}</p>
              <p className="my-4 text-xs text-zinc-300">
                Ghế: <strong className="text-white">{context.seats.filter((s) => seatIds.includes(s.id)).map((s) => s.seatNumber).join(', ')}</strong>
              </p>

              {currentQuote ? (
                <div className="border-y border-[#2E2E38] py-4 space-y-2 text-xs">
                  {[
                    ['Tiền vé', currentQuote.seatAmount],
                    ['Combo', currentQuote.comboAmount],
                    ['Giảm giá', currentQuote.discountAmount],
                  ].map(([label, value]) => (
                    <p key={label} className="flex justify-between text-zinc-300">
                      <span>{label}</span>
                      <span className="font-bold text-white">{formatCurrency(value)}</span>
                    </p>
                  ))}
                  <div className="pt-2 border-t border-[#2E2E38]">
                    <p className="text-lg font-black text-[#E50914] flex justify-between">
                      <span>Tổng tiền</span>
                      <span>{formatCurrency(currentQuote.finalAmount)}</span>
                    </p>
                    {paymentMethod === 'PAYPAL' && (
                      <p className="text-right text-xs text-zinc-400 mt-1">
                        ≈ <strong className="text-sky-400 font-bold">${estimatedUsd} USD</strong>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p role="status" className="text-zinc-400 my-4 text-xs">
                  {quoteError ? 'Chưa có báo giá hợp lệ.' : 'Đang xác nhận giá với máy chủ…'}
                </p>
              )}

              <button
                disabled={!currentQuote || submitting || !online || !validHold}
                onClick={submit}
                className="bg-[#E50914] hover:bg-[#C24132] disabled:bg-[#1C1C24] disabled:text-zinc-600 text-white font-black rounded-xl w-full py-3.5 mt-6 shadow-lg shadow-red-900/40 text-xs uppercase tracking-wider transition transform active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                {submitting
                  ? 'ĐANG XỬ LÝ…'
                  : paymentMethod === 'PAYPAL'
                  ? `THANH TOÁN PAYPAL ($${estimatedUsd})`
                  : 'XÁC NHẬN ĐẶT VÉ'}
              </button>
              <Link
                to={`/booking/${showtimeId}`}
                className="block text-center text-xs text-[#A1A1AA] hover:text-white mt-4 transition"
              >
                Quay lại chọn ghế
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TicketCodes from '../../components/booking/TicketCodes';
import bookingApi from '../../api/bookingApi';
import paymentApi from '../../api/paymentApi';
import { dataOf, errorMessage } from '../../utils/booking';
import { formatCurrency, formatDateTime } from '../../utils/format';

export default function BookingSuccessPage() {
  const [params] = useSearchParams();
  const code = params.get('bookingCode');
  const paypalToken = params.get('token'); // PayPal Order ID when returning from approval
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function init() {
      setError('');

      try {
        // 1. Nếu có token PayPal từ redirect, thử capture trước
        if (paypalToken) {
          try {
            const captureFn = bookingApi.capturePayPalOrder || paymentApi.capturePayPalOrder;
            if (captureFn) await captureFn(paypalToken);
          } catch (captureErr) {
            console.warn('Capture order note:', captureErr);
          }
        }

        // 2. Lấy thông tin đơn đặt vé
        if (code) {
          const data = dataOf(await bookingApi.getBookingDetail(code));
          if (active) {
            setBooking(data);
          }
        }
      } catch (e) {
        if (active) {
          setBooking(null);
          setError(errorMessage(e));
        }
      }
    }

    if (code || paypalToken) {
      init();
    }

    return () => {
      active = false;
    };
  }, [code, paypalToken, retry]);

  const current = booking?.bookingCode === code ? booking : null;
  const status = current?.status?.toUpperCase() || '';
  const paid = ['PAID', 'CHECKED_IN'].includes(status);
  const reserved = status === 'PENDING_PAYMENT';
  const cancelled = ['CANCELLED', 'REFUNDED', 'EXPIRED'].includes(status);

  // Thanh toán tiếp qua PayPal nếu đơn chưa hoàn tất
  async function handlePayWithPayPal() {
    if (!current?.bookingCode || paying) return;
    setPaying(true);
    try {
      const createOrderFn = bookingApi.createPayPalOrder || paymentApi.createPayPalOrder;
      const res = dataOf(await createOrderFn(current.bookingCode));
      if (res?.approveUrl) {
        window.location.href = res.approveUrl;
      } else {
        alert('Không thể tạo liên kết thanh toán PayPal. Vui lòng thử lại sau.');
      }
    } catch (e) {
      alert('Lỗi tạo thanh toán PayPal: ' + errorMessage(e));
    } finally {
      setPaying(false);
    }
  }

  // Xử lý Hủy vé / Hoàn tiền
  async function handleCancelBooking() {
    if (!current?.bookingCode || cancelling) return;
    const isPaid = paid && current.paymentMethod === 'PAYPAL';
    const confirmMsg = isPaid
      ? `Bạn có chắc chắn muốn hủy đơn vé ${current.bookingCode}?\nSố tiền sẽ được tự động HOÀN TRẢ về tài khoản PayPal của bạn.`
      : `Bạn có chắc chắn muốn hủy đơn đặt chỗ ${current.bookingCode}?`;

    if (!window.confirm(confirmMsg)) return;

    setCancelling(true);
    try {
      const updated = dataOf(await bookingApi.cancelBooking(current.bookingCode));
      setBooking(updated);
      alert(isPaid ? 'Hủy vé và hoàn tiền qua PayPal thành công!' : 'Đã hủy đơn đặt vé thành công!');
    } catch (e) {
      alert('Không thể hủy vé: ' + errorMessage(e));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <main className="bg-[#09090D] min-h-screen py-12 text-[#F8FAFC]">
      <div className="max-w-xl mx-auto bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-8 shadow-2xl">
        {!code ? (
          <p role="alert">Thiếu mã đặt vé. Vui lòng kiểm tra Vé của tôi.</p>
        ) : error ? (
          <p role="alert" className="text-red-400">
            {error}{' '}
            <button onClick={() => setRetry((v) => v + 1)} className="underline font-bold text-white cursor-pointer">
              Thử lại
            </button>
          </p>
        ) : !current ? (
          <p role="status">Đang xác minh đặt vé…</p>
        ) : (
          <>
            <h1 className="text-2xl font-black text-white">
              {reserved ? 'ĐÃ XÁC NHẬN ĐẶT CHỖ' : paid ? 'ĐÃ THANH TOÁN' : cancelled ? 'ĐƠN ĐẶT VÉ ĐÃ HỦY' : 'TRẠNG THÁI ĐẶT VÉ'}
            </h1>
            {reserved && (
              <p className="text-rose-300 mt-3 font-semibold">
                Chưa thanh toán — vui lòng thanh toán tại quầy rạp.
              </p>
            )}
            {paid && (
              <p className="text-emerald-400 mt-2 font-semibold text-xs">
                Thanh toán thành công qua {current.paymentMethod === 'PAYPAL' ? 'PayPal Sandbox' : current.paymentMethod}. Vé điện tử đã sẵn sàng.
              </p>
            )}
            {cancelled && (
              <p className="text-zinc-400 mt-2 font-semibold text-xs">
                {current.paymentMethod === 'PAYPAL' ? 'Khoản tiền đã được hoàn trả về tài khoản PayPal.' : 'Đơn đặt chỗ đã được giải phóng.'}
              </p>
            )}

            <div className="bg-[#121218] border border-[#2E2E38] rounded-xl p-6 mt-6 space-y-3">
              <p className="font-bold text-[#E50914] text-lg tracking-wider">{current.bookingCode}</p>
              <p className="text-sm text-[#A1A1AA]">
                {current.status} · {current.paymentMethod === 'PAYPAL' ? 'PayPal Sandbox' : 'Tại quầy'}
              </p>
              <h2 className="font-bold text-lg text-white">{current.movieTitle}</h2>
              <p className="text-sm text-zinc-300">{current.cinemaName} · {current.hallName}</p>
              <p className="text-sm text-[#E50914] font-medium">{formatDateTime(current.showtimeStart)}</p>
              <p className="text-sm text-zinc-300">Ghế: {current.seatNumbers?.join(', ')}</p>
              <p className="text-lg font-black text-[#E50914]">
                {reserved ? 'Cần thanh toán' : 'Tổng tiền'}: {formatCurrency(current.finalAmount)}
              </p>
              {reserved && current.expiresAt && (
                <p className="text-sm text-amber-400">Hạn thanh toán: {formatDateTime(current.expiresAt)}</p>
              )}
            </div>

            {/* Nút thanh toán trực tuyến ngay nếu chưa thanh toán */}
            {reserved && (
              <div className="mt-5 p-4 bg-sky-950/30 border border-sky-800/80 rounded-xl text-center">
                <p className="text-xs text-sky-200 mb-3">
                  Bạn có muốn hoàn tất thanh toán online bằng tài khoản PayPal / Thẻ quốc tế?
                </p>
                <button
                  disabled={paying}
                  onClick={handlePayWithPayPal}
                  className="w-full py-3 bg-[#0070BA] hover:bg-[#005ea6] text-white font-black rounded-lg text-xs uppercase tracking-wider transition shadow-lg cursor-pointer disabled:opacity-40"
                >
                  {paying ? 'Đang kết nối PayPal…' : 'THANH TOÁN NGAY QUA PAYPAL (SANDBOX)'}
                </button>
              </div>
            )}

            {paid && <TicketCodes booking={current} />}

            <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
              <button
                onClick={() => setRetry((v) => v + 1)}
                className="text-[#A1A1AA] hover:text-white underline text-sm cursor-pointer"
              >
                Cập nhật trạng thái
              </button>

              {!cancelled && (
                <button
                  disabled={cancelling}
                  onClick={handleCancelBooking}
                  className="text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/60 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40"
                >
                  {cancelling ? 'Đang hủy…' : paid && current.paymentMethod === 'PAYPAL' ? 'Hủy vé & Hoàn tiền PayPal' : 'Hủy đơn đặt vé'}
                </button>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <Link
                to="/my-tickets"
                className="flex-1 text-center bg-[#121218] hover:bg-[#252530] border border-[#2E2E38] rounded-xl px-5 py-3 font-bold text-sm text-[#F8FAFC]"
              >
                VÉ CỦA TÔI
              </Link>
              <Link
                to="/"
                className="flex-1 text-center bg-[#E50914] hover:bg-[#C24132] text-white rounded-xl px-5 py-3 font-bold text-sm shadow-lg shadow-red-900/40"
              >
                VỀ TRANG CHỦ
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

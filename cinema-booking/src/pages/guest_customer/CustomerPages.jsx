import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingApi from '../../api/bookingApi';
import paymentApi from '../../api/paymentApi';
import TicketCodes from '../../components/booking/TicketCodes';
import { dataOf, errorMessage } from '../../utils/booking';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const HomePage = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold text-red-500 mb-4">Phim Đang Chiếu Hot</h1>
    <p className="text-slate-400">Trang chủ hệ thống đặt vé xem phim trực tuyến.</p>
  </div>
);

export const MoviesPage = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-4">Danh Sách Phim</h1>
  </div>
);

export const MovieDetailPage = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-4">Chi Tiết Phim & Lịch Chiếu</h1>
  </div>
);

export const BookingSeatPage = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-4">Sơ Đồ Ghế Realtime</h1>
  </div>
);

export const CheckoutPage = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-4">Thanh Toán Đơn Hàng</h1>
  </div>
);

export const BookingSuccessPage = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 text-center">
    <h1 className="text-3xl font-bold text-green-500 mb-4">Đặt Vé Thành Công!</h1>
  </div>
);

export const ProfilePage = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-4">Thông Tin Cá Nhân</h1>
  </div>
);

export function TicketHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [cancellingCode, setCancellingCode] = useState(null);
  const [payingCode, setPayingCode] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    bookingApi
      .getMyBookings()
      .then(dataOf)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Danh sách vé không hợp lệ.');
        if (active) setBookings(data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  async function handlePayWithPayPal(booking) {
    if (payingCode) return;
    setPayingCode(booking.bookingCode);
    try {
      const createOrderFn = bookingApi.createPayPalOrder || paymentApi.createPayPalOrder;
      const res = dataOf(await createOrderFn(booking.bookingCode));
      if (res?.approveUrl) {
        window.location.href = res.approveUrl;
      } else {
        alert('Không thể tạo liên kết thanh toán PayPal.');
      }
    } catch (e) {
      alert('Lỗi thanh toán PayPal: ' + errorMessage(e));
    } finally {
      setPayingCode(null);
    }
  }

  async function handleCancel(booking) {
    if (cancellingCode) return;
    const isPaid = booking.status === 'PAID';
    const isPayPal = booking.paymentMethod === 'PAYPAL';

    const msg =
      isPaid && isPayPal
        ? `Xác nhận hủy vé đơn ${booking.bookingCode}?\nKhoản tiền đã thanh toán sẽ được HOÀN TRẢ trực tiếp vào tài khoản PayPal của bạn.`
        : `Xác nhận hủy đặt chỗ đơn ${booking.bookingCode}?`;

    if (!window.confirm(msg)) return;

    setCancellingCode(booking.bookingCode);
    setActionError('');
    setActionSuccess('');

    try {
      await bookingApi.cancelBooking(booking.bookingCode);
      setActionSuccess(
        isPaid && isPayPal
          ? `Hủy vé & hoàn tiền PayPal thành công cho đơn ${booking.bookingCode}!`
          : `Hủy đơn ${booking.bookingCode} thành công!`
      );
      setRetry((v) => v + 1);
    } catch (e) {
      setActionError(`Hủy vé thất bại: ${errorMessage(e)}`);
    } finally {
      setCancellingCode(null);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 text-[#F8FAFC]">
      <div className="flex justify-between items-center mb-6 border-b border-[#2E2E38] pb-4">
        <div>
          <h1 className="text-2xl font-black">Vé của tôi</h1>
          <p className="text-xs text-[#A1A1AA] mt-1">Lịch sử đặt vé và trạng thái thanh toán trực tuyến</p>
        </div>
        <button
          className="text-[#E50914] hover:text-rose-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          disabled={loading}
          onClick={() => setRetry((v) => v + 1)}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-300 p-3 rounded-xl text-xs mb-4">
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="bg-red-950/50 border border-red-800 text-red-300 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <p role="status" className="text-zinc-400 py-10 text-center text-sm">Đang tải danh sách vé…</p>
      ) : error ? (
        <p role="alert" className="text-red-400 py-6 text-center text-sm">{error}</p>
      ) : !bookings.length ? (
        <div className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-10 text-center">
          <p className="text-zinc-400 mb-3 text-sm">Bạn chưa có đơn đặt vé nào.</p>
          <Link to="/" className="inline-block bg-[#E50914] text-white px-5 py-2.5 rounded-xl font-bold text-xs">
            Chọn phim & Đặt vé ngay
          </Link>
        </div>
      ) : (
        bookings.map((booking) => {
          const status = booking.status?.toUpperCase() || '';
          const isCancelled = ['CANCELLED', 'REFUNDED', 'EXPIRED'].includes(status);
          const isPaid = status === 'PAID';
          const isPending = status === 'PENDING_PAYMENT';

          return (
            <article key={booking.bookingCode} className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6 mb-5 shadow-xl">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">{booking.movieTitle}</h2>
                  <p className="text-[#A1A1AA] text-xs mt-1">
                    {booking.cinemaName} · {booking.hallName} · {formatDateTime(booking.showtimeStart)}
                  </p>
                  <p className="text-xs text-zinc-300 mt-2">
                    Ghế: <strong className="text-white">{booking.seatNumbers?.join(', ')}</strong>
                  </p>
                  <p className="text-xs mt-1 text-zinc-300">
                    Phương thức: <span className="font-semibold text-white">{booking.paymentMethod === 'PAYPAL' ? 'PayPal Sandbox' : 'Tại quầy'}</span> ·{' '}
                    <strong className="text-[#E50914] font-black text-sm">{formatCurrency(booking.finalAmount)}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      isPaid
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : isPending
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    {isPaid
                      ? booking.paymentMethod === 'PAYPAL'
                        ? 'ĐÃ THANH TOÁN (PAYPAL)'
                        : 'ĐÃ THANH TOÁN'
                      : isPending
                      ? 'CHỜ THANH TOÁN TẠI QUẦY'
                      : status === 'REFUNDED'
                      ? 'ĐÃ HOÀN TIỀN PAYPAL'
                      : 'ĐÃ HỦY'}
                  </span>
                </div>
              </div>

              {/* Chi tiết liên kết, Thanh toán PayPal và nút Hủy vé */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-[#2E2E38]">
                <Link
                  className="text-[#E50914] hover:text-rose-300 underline font-bold text-xs inline-block"
                  to={`/booking-success?bookingCode=${encodeURIComponent(booking.bookingCode)}`}
                >
                  {booking.bookingCode} — Xem chi tiết & mã vé
                </Link>

                <div className="flex items-center gap-2">
                  {isPending && (
                    <button
                      disabled={payingCode === booking.bookingCode}
                      onClick={() => handlePayWithPayPal(booking)}
                      className="bg-[#0070BA] hover:bg-[#005ea6] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40"
                    >
                      {payingCode === booking.bookingCode ? 'Đang kết nối…' : 'Thanh toán PayPal'}
                    </button>
                  )}

                  {!isCancelled && (
                    <button
                      disabled={cancellingCode === booking.bookingCode}
                      onClick={() => handleCancel(booking)}
                      className="text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 border border-red-900/60 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-40"
                    >
                      {cancellingCode === booking.bookingCode
                        ? 'Đang xử lý hủy…'
                        : isPaid && booking.paymentMethod === 'PAYPAL'
                        ? 'Hủy vé & Hoàn tiền PayPal'
                        : 'Hủy đơn đặt vé'}
                    </button>
                  )}
                </div>
              </div>

              {/* Hiển thị mã QR nếu vé hợp lệ */}
              {isPaid && <TicketCodes booking={booking} />}
            </article>
          );
        })
      )}
    </main>
  );
}

export const LoginPage = () => (
  <div className="max-w-md mx-auto px-4 py-16 text-center">
    <h1 className="text-2xl font-bold text-red-500 mb-4">Đăng Nhập</h1>
  </div>
);

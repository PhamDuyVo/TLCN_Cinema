import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingApi from '../../api/bookingApi';
import TicketCodes from '../../components/booking/TicketCodes';
import { dataOf, errorMessage } from '../../utils/booking';
import { formatCurrency, formatDateTime } from '../../utils/format';
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
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    bookingApi.getMyBookings().then(dataOf).then(data => {
      if (!Array.isArray(data)) throw new Error('Danh sách vé không hợp lệ.');
      if (active) setBookings(data);
    }).catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  return <main className="max-w-5xl mx-auto px-4 py-8 text-zinc-100">
    <h1 className="text-2xl font-bold mb-4">Vé của tôi</h1>
    <button className="underline mb-4" disabled={loading} onClick={() => setRetry(v => v + 1)}>Cập nhật danh sách</button>
    {loading ? <p role="status">Đang tải vé…</p> : error ? <p role="alert" className="text-red-400">{error}</p> : !bookings.length ? <p>Bạn chưa có vé đã đặt. <Link to="/" className="underline">Chọn phim</Link></p> : bookings.map(booking => <article key={booking.bookingCode} className="bg-[#181818] border border-zinc-800 rounded-xl p-6 mb-5">
      <h2 className="text-xl font-bold">{booking.movieTitle}</h2>
      <p>{booking.cinemaName} · {booking.hallName} · {formatDateTime(booking.showtimeStart)}</p>
      <p>Ghế: {booking.seatNumbers?.join(', ')}</p><p>{booking.status} · {formatCurrency(booking.finalAmount)}</p>
      <Link className="text-red-400 underline" to={`/booking-success?bookingCode=${encodeURIComponent(booking.bookingCode)}`}>{booking.bookingCode} — Xem chi tiết</Link>
      <TicketCodes booking={booking} />
    </article>)}
  </main>;
}

export const LoginPage = () => (
  <div className="max-w-md mx-auto px-4 py-16 text-center">
    <h1 className="text-2xl font-bold text-red-500 mb-4">Đăng Nhập</h1>
  </div>
);

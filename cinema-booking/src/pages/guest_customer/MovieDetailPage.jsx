import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import movieApi from '../../api/movieApi';
import showtimeApi from '../../api/showtimeApi';
import TrailerModal from '../../components/common/TrailerModal';
import { dataOf, errorMessage, safeUrl, serverTime, vietnamDate } from '../../utils/booking';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  Ticket,
  Play,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Globe,
  MessageSquare,
  User,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [retry, setRetry] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCinema, setSelectedCinema] = useState('');
  const [cinemaList, setCinemaList] = useState([]);
  const [city, setCity] = useState('');
  const [cinemaError, setCinemaError] = useState('');
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    axiosClient
      .get('/cinemas')
      .then(dataOf)
      .then((data) => {
        if (active) {
          setCinemaList(data || []);
          setCinemaError('');
          if (data && data.length > 0 && !selectedCinema) {
            setSelectedCinema(String(data[0].id));
          }
        }
      })
      .catch((e) => {
        if (active) setCinemaError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const [schedule, setSchedule] = useState({ movieId: null, shows: [] });
  const [now, setNow] = useState(Date.now);
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setMovie(null);
    setError('');
    movieApi
      .getMovieById(id)
      .then(dataOf)
      .then((data) => {
        if (active) {
          setMovie(data);
          setError('');
        }
      })
      .catch((e) => {
        if (active) {
          setMovie(null);
          setError(errorMessage(e));
        }
      });
    return () => {
      active = false;
    };
  }, [id, retry]);

  useEffect(() => {
    let active = true,
      running = false;
    setLoading(true);
    setSchedule({ movieId: id, shows: [] });
    setShowError('');
    async function refresh() {
      if (running) return;
      running = true;
      try {
        const data = dataOf(await showtimeApi.getShowtimesByMovie(id));
        if (active) {
          setSchedule({ movieId: id, shows: data || [] });
          setShowError('');
          setNow(Date.now());
        }
      } catch (e) {
        if (active) setShowError(errorMessage(e));
      } finally {
        running = false;
        if (active) setLoading(false);
      }
    }
    refresh();
    const poll = setInterval(refresh, 60000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const visible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [id, retry]);

  const upcoming =
    schedule.movieId === id
      ? schedule.shows.filter(
          (show) =>
            show.status?.toLowerCase() === 'scheduled' && serverTime(show.startTime) > now
        )
      : [];

  const dayOf = (show) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(serverTime(show.startTime)));

  const cities = [...new Set(cinemaList.map((c) => c.city).filter(Boolean))].sort();
  const cinemas = cinemaList.filter((c) => !city || c.city === city);
  const cinema = selectedCinema;
  const selectedVenue = cinemas.find((c) => String(c.id) === cinema);
  const filteredShows = selectedVenue
    ? upcoming.filter((show) => String(show.cinemaId) === cinema)
    : [];
  const days = [...new Set(filteredShows.map(dayOf))].sort();
  const date = days.includes(selectedDate) ? selectedDate : days[0] || '';
  const shows = filteredShows
    .filter((show) => dayOf(show) === date)
    .sort((a, b) => serverTime(a.startTime) - serverTime(b.startTime));
  const groups = Object.values(
    shows.reduce((all, show) => {
      (all[show.cinemaId] ||= { name: show.cinemaName, shows: [] }).shows.push(show);
      return all;
    }, {})
  );

  const getAgeBadgeStyle = (rating) => {
    switch (rating) {
      case 'P':
        return 'bg-emerald-600 text-white';
      case 'K':
        return 'bg-sky-600 text-white';
      case 'T13':
      case 'C13':
        return 'bg-[#e67e22] text-white';
      case 'T16':
      case 'C16':
        return 'bg-[#d35400] text-white';
      case 'T18':
      case 'C18':
        return 'bg-[#e71a0f] text-white';
      default:
        return 'bg-zinc-700 text-white';
    }
  };

  return (
    <main className="bg-[#121212] min-h-screen text-zinc-100 pb-20">
      {/* 1. Backdrop Banner Header (Cinestar Style) */}
      <div className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black">
        {safeUrl(movie?.bannerUrl || movie?.posterUrl) && (
          <img
            src={safeUrl(movie.bannerUrl || movie.posterUrl)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-sm scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-12">
          {/* Breadcrumbs */}
          <nav aria-label="Đường dẫn" className="text-xs text-zinc-400 mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-red-500 transition">Trang Chủ</Link>
            <span>/</span>
            <Link to="/movies" className="hover:text-red-500 transition">Phim</Link>
            <span>/</span>
            <span className="text-zinc-200 font-semibold">{movie?.title || 'Chi tiết phim'}</span>
          </nav>

          {error && (
            <p role="alert" className="text-red-400 mb-4">
              {error}{' '}
              <button onClick={() => setRetry((v) => v + 1)} className="underline">
                Thử lại
              </button>
            </p>
          )}

          {!movie && !error && <p role="status">Đang tải phim…</p>}

          {movie && (
            <section className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
              {/* Left: Movie Poster with Dual Badges */}
              <div className="relative w-56 md:w-72 mx-auto md:mx-0 aspect-[2/3] bg-zinc-900 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
                {safeUrl(movie.posterUrl) && (
                  <img
                    src={safeUrl(movie.posterUrl)}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <span className="bg-black/80 border border-amber-500/80 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded shadow">
                    2D
                  </span>
                  {movie.ageRating && (
                    <span
                      className={`text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded shadow ${getAgeBadgeStyle(
                        movie.ageRating
                      )}`}
                    >
                      {movie.ageRating}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Movie Details Metadata */}
              <div className="flex-1 space-y-4">
                <div>
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> UTE CINEMA PREMIERE
                  </span>
                  <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                    {movie.title}
                  </h1>
                </div>

                {/* Metadata List (Matching Cinestar standard) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                  <p className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Thể loại:</strong> {movie.genres?.join(', ') || 'Hành động, Phiêu lưu'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Thời lượng:</strong> {movie.durationMinutes || 120} phút</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Quốc gia:</strong> Hoa Kỳ / Quốc tế</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Khởi chiếu:</strong> {formatDate(movie.releaseDate)}</span>
                  </p>
                  <p className="flex items-center gap-2 sm:col-span-2">
                    <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Ngôn ngữ:</strong> Phụ đề tiếng Việt (2D / 3D)</span>
                  </p>
                  <p className="flex items-center gap-2 sm:col-span-2">
                    <User className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span><strong>Đạo diễn:</strong> {movie.director || 'Đang cập nhật'}</span>
                  </p>
                  <p className="flex items-center gap-2 sm:col-span-2">
                    <Users className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span><strong>Diễn viên:</strong> {movie.cast || 'Đang cập nhật'}</span>
                  </p>
                </div>

                {/* Action CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#movie-showtimes"
                    className="bg-[#e71a0f] hover:bg-[#c41200] text-white rounded-xl px-7 py-3 font-extrabold text-xs uppercase flex items-center gap-2 shadow-lg shadow-red-950/50 transition transform active:scale-95"
                  >
                    <Ticket className="w-4 h-4" /> ĐẶT VÉ NGAY
                  </a>

                  {movie.trailerUrl && (
                    <button
                      onClick={() => setTrailerOpen(true)}
                      className="bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-white rounded-xl px-6 py-3 font-bold text-xs uppercase flex items-center gap-2 transition cursor-pointer backdrop-blur-sm"
                    >
                      <Play className="w-4 h-4 text-red-500 fill-red-500" /> Xem Trailer Trực Tiếp
                    </button>
                  )}
                </div>

                {/* Synopsis */}
                <div className="pt-2">
                  <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    NỘI DUNG PHIM
                  </h2>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-3xl whitespace-pre-line">
                    {movie.description || 'Chưa có thông tin nội dung chi tiết.'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* 2. Showtimes Section */}
      <div className="max-w-6xl mx-auto px-4">
        <section id="movie-showtimes" className="pt-12 scroll-mt-20">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <p className="text-red-500 text-xs font-black tracking-widest uppercase">
              ĐẶT VÉ TRỰC TUYẾN
            </p>
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-2">LỊCH CHIẾU THEO RẠP</h2>
          <p className="text-zinc-400 text-xs mb-6">
            Chọn cụm rạp, ngày chiếu và khung giờ phù hợp để tiến hành chọn ghế
          </p>

          {/* Cinema selector container */}
          <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-5 mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" /> CHỌN CỤM RẠP
              </h3>
              <label className="text-xs text-zinc-400 flex items-center gap-2">
                Khu vực:
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setSelectedCinema('');
                    setSelectedDate('');
                  }}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white cursor-pointer"
                >
                  <option value="">Tất cả khu vực</option>
                  {cities.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>

            {cinemaError && (
              <p role="alert" className="text-red-400 text-xs mb-3">
                {cinemaError}{' '}
                <button onClick={() => setRetry((v) => v + 1)} className="underline">
                  Thử lại
                </button>
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              {cinemas.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={cinema === String(c.id)}
                  onClick={() => {
                    setSelectedCinema(String(c.id));
                    setSelectedDate('');
                  }}
                  className={`text-left rounded-xl p-4 border transition cursor-pointer ${
                    cinema === String(c.id)
                      ? 'border-red-500 bg-red-950/30'
                      : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/60'
                  }`}
                >
                  <span className="block font-bold text-sm text-white">{c.name}</span>
                  <span className="block text-zinc-400 text-xs mt-1">
                    {c.address || 'Chưa cập nhật địa chỉ'}
                  </span>
                  <span className="block text-[11px] text-zinc-500 mt-1">{c.city}</span>
                </button>
              ))}
            </div>
            {!cinemas.length && !cinemaError && (
              <p className="text-zinc-500 text-xs py-4 text-center">Chưa có rạp trong khu vực này.</p>
            )}
          </div>

          {/* Date Selector Slider */}
          {days.length > 0 && (
            <div className="mb-6">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-500" /> CHỌN NGÀY XEM
              </span>
              <div className="flex gap-2.5 overflow-x-auto pb-2" aria-label="Ngày có suất chiếu">
                {days.map((day) => (
                  <button
                    key={day}
                    aria-pressed={date === day}
                    onClick={() => setSelectedDate(day)}
                    className={`shrink-0 min-w-24 rounded-xl border px-4 py-3 text-center transition cursor-pointer ${
                      date === day
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/50'
                        : 'bg-[#181818] border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-[11px] mb-1">
                      {day === vietnamDate()
                        ? 'Hôm nay'
                        : new Intl.DateTimeFormat('vi-VN', {
                            weekday: 'short',
                            timeZone: 'Asia/Ho_Chi_Minh',
                          }).format(new Date(day + 'T12:00:00+07:00'))}
                    </span>
                    <span className="text-base font-black">
                      {day.slice(8)}/{day.slice(5, 7)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Showtime Slots Grid */}
          {loading ? (
            <p className="mt-6 text-xs text-zinc-400" role="status">
              Đang tải lịch chiếu…
            </p>
          ) : showError ? (
            <p role="alert" className="text-red-400 text-xs mt-6">
              {showError}{' '}
              <button onClick={() => setRetry((v) => v + 1)}>Thử lại</button>
            </p>
          ) : !groups.length ? (
            <div className="text-center border border-dashed border-zinc-800 rounded-2xl py-12 px-6 mt-4 bg-[#181818]">
              <h3 className="font-bold text-sm text-zinc-300 mb-1">
                {selectedVenue
                  ? 'Rạp chưa có suất chiếu sắp tới cho phim này trong ngày đã chọn'
                  : 'Vui lòng chọn rạp để xem lịch chiếu'}
              </h3>
              <p className="text-xs text-zinc-500">
                Lịch chiếu sẽ hiển thị ngay khi rạp cập nhật suất chiếu mới.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.name}
                className="bg-[#181818] rounded-2xl border border-zinc-800 p-6 mt-4"
              >
                <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" /> {group.name}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {group.shows.map((show) => {
                    const past =
                      serverTime(show.startTime) <= Date.now() ||
                      ['CANCELLED', 'COMPLETED'].includes(show.status?.toUpperCase());

                    const timeStr = new Intl.DateTimeFormat('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(serverTime(show.startTime)));

                    const content = (
                      <>
                        <span className="text-base font-black text-white">{timeStr}</span>
                        <span className="text-[10px] text-zinc-400">
                          {show.hallName} • {show.screenType || '2D'}
                        </span>
                        <span className="text-xs text-amber-400 font-bold">
                          {formatCurrency(show.basePrice)}
                        </span>
                      </>
                    );

                    return past ? (
                      <div
                        key={show.id}
                        className="p-3 border border-zinc-800 rounded-xl flex flex-col opacity-40 min-w-24 text-center"
                      >
                        {content}
                        <span className="text-[10px] text-zinc-500">Đã qua</span>
                      </div>
                    ) : (
                      <Link
                        key={show.id}
                        to={`/booking/${show.id}`}
                        className="p-3 bg-zinc-900 border border-zinc-700 hover:border-red-500 hover:bg-zinc-800 rounded-xl flex flex-col gap-1 min-w-24 text-center transition transform active:scale-95 shadow"
                      >
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* On-Web Trailer Modal (Plays directly on the web, NO redirect to YouTube) */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailerUrl={movie?.trailerUrl}
        movieTitle={movie?.title}
      />
    </main>
  );
}

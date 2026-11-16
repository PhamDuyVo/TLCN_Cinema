import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import movieApi from '../../api/movieApi';
import showtimeApi from '../../api/showtimeApi';
import { dataOf, errorMessage, serverTime, safeUrl, vietnamDate } from '../../utils/booking';
import { formatCurrency } from '../../utils/format';
import { Calendar, Film, MapPin, Clock } from 'lucide-react';

export default function ShowtimesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'cinema' ? 'cinema' : 'movie';
  const [viewMode, setViewMode] = useState(initialMode); // 'movie' | 'cinema'

  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(vietnamDate());
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [groupedShowtimes, setGroupedShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Generate next 7 days for the date selector bar
  const generateNext7Days = () => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
      list.push(iso);
    }
    return list;
  };

  const dates7 = generateNext7Days();

  // 2. Fetch initial master data
  useEffect(() => {
    let active = true;
    Promise.all([
      movieApi.getAllMovies('now_showing').then(dataOf),
      axiosClient.get('/cinemas').then(dataOf),
    ])
      .then(([movieList, cinemaList]) => {
        if (!active) return;
        setMovies(movieList || []);
        setCinemas(cinemaList || []);
        if (cinemaList && cinemaList.length > 0) {
          setSelectedCinemaId(String(cinemaList[0].id));
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });

    return () => {
      active = false;
    };
  }, []);

  // 3. Fetch grouped showtimes for selected date
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    showtimeApi
      .getGroupedShowtimes({ date: selectedDate })
      .then(dataOf)
      .then((data) => {
        if (!active) return;
        setGroupedShowtimes(data || []);
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
  }, [selectedDate]);

  // Cities list
  const cities = [...new Set(cinemas.map((c) => c.city).filter(Boolean))].sort();

  // Filter cinemas by city
  const filteredCinemas = cinemas.filter((c) => !selectedCity || c.city === selectedCity);

  return (
    <main className="min-h-screen text-[#F8FAFC] pb-20">
      {/* 1. Page Header */}
      <div className="bg-gradient-to-b from-[#121218] to-transparent border-b border-[#2E2E38] py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[#E50914] font-extrabold text-xs tracking-widest uppercase flex items-center gap-1.5 mb-1">
                <Calendar className="w-4 h-4 text-[#E50914]" /> HỆ THỐNG CỤM RẠP UTE CINEMA
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white">LỊCH CHIẾU PHIM</h1>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Cập nhật suất chiếu liên tục, chọn phim và ghế ngồi trực tuyến
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-[#121218] p-1 rounded-xl border border-[#2E2E38] w-fit">
              <button
                onClick={() => setViewMode('movie')}
                className={`px-5 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'movie'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" /> THEO PHIM
              </button>
              <button
                onClick={() => setViewMode('cinema')}
                className={`px-5 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cinema'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> THEO CỤM RẠP
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {/* 2. Horizontal 7-Day Date Picker */}
        <div className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-4 mb-8 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#E50914]" /> CHỌN NGÀY CHIẾU
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#A1A1AA]">Khu vực:</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-[#121218] border border-[#2E2E38] rounded-lg px-3 py-1.5 text-xs text-[#F8FAFC] font-bold focus:outline-none focus:border-[#E50914] cursor-pointer"
              >
                <option value="" className="bg-[#1B1B23]">Tất cả khu vực</option>
                {cities.map((city) => (
                  <option key={city} value={city} className="bg-[#1B1B23]">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {dates7.map((day) => {
              const isToday = day === vietnamDate();
              const dObj = new Date(day + 'T12:00:00+07:00');
              const weekday = isToday
                ? 'Hôm nay'
                : new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(dObj);
              const isSelected = selectedDate === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`shrink-0 min-w-[100px] py-3 px-4 rounded-xl border text-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#E50914] border-[#E50914] text-white font-black shadow-lg shadow-red-900/40 scale-105'
                      : 'bg-[#121218] border-[#2E2E38] text-[#A1A1AA] hover:border-[#881337] hover:text-white'
                  }`}
                >
                  <span className="block text-[11px] font-medium">{weekday}</span>
                  <span className="block text-lg font-black mt-0.5">
                    {day.slice(8)}/{day.slice(5, 7)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SHOWTIMES CONTENT */}
        {loading ? (
          <div className="py-24 text-center text-[#A1A1AA]">
            <div className="w-8 h-8 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải lịch chiếu từ các cụm rạp…</p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="text-center py-16 text-red-400 bg-red-950/20 rounded-xl border border-red-900/40"
          >
            <p>{error}</p>
          </div>
        ) : viewMode === 'movie' ? (
          /* ================= MODE 1: THEO PHIM ================= */
          <div className="space-y-6">
            {movies.map((movie) => {
              const movieVenues = groupedShowtimes
                .map((cinemaGroup) => {
                  const foundMovie = (cinemaGroup.movies || []).find((m) => m.movieId === movie.id);
                  return foundMovie
                    ? {
                        cinemaId: cinemaGroup.cinemaId,
                        cinemaName: cinemaGroup.cinemaName,
                        slots: foundMovie.showtimes || foundMovie.slots || [],
                      }
                    : null;
                })
                .filter(Boolean);

              return (
                <div
                  key={movie.id}
                  className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6 transition hover:border-[#E50914]/50 shadow-xl"
                >
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Poster & Info */}
                    <div className="flex gap-4 w-full md:w-80 shrink-0">
                      <div className="w-24 h-36 bg-[#121218] rounded-xl overflow-hidden shrink-0 border border-[#2E2E38] shadow">
                        {safeUrl(movie.posterUrl) ? (
                          <img
                            src={safeUrl(movie.posterUrl)}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                            Poster
                          </div>
                        )}
                      </div>
                      <div>
                        {movie.ageRating && (
                          <span className="bg-[#E50914] text-white font-black text-[10px] px-2 py-0.5 rounded shadow">
                            {movie.ageRating}
                          </span>
                        )}
                        <h3 className="font-black text-lg text-white mt-1.5 leading-snug">
                          {movie.title}
                        </h3>
                        <p className="text-xs text-[#A1A1AA] mt-1">
                          {movie.durationMinutes} phút · {movie.genres?.join(', ') || 'Chiếu rạp'}
                        </p>
                        <Link
                          to={`/movies/${movie.id}`}
                          className="text-xs text-[#E50914] hover:text-rose-300 font-bold mt-3 inline-block"
                        >
                          Chi tiết phim →
                        </Link>
                      </div>
                    </div>

                    {/* Showtimes by Cinema */}
                    <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-[#2E2E38] pt-4 md:pt-0 md:pl-6">
                      {movieVenues.length === 0 ? (
                        <p className="text-xs text-[#71717A] py-6 italic">
                          Chưa có suất chiếu nào vào ngày này. Vui lòng chọn ngày khác.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {movieVenues.map((venue) => (
                            <div
                              key={venue.cinemaId}
                              className="bg-[#121218] p-4 rounded-xl border border-[#2E2E38]"
                            >
                              <h4 className="font-bold text-sm text-[#F8FAFC] flex items-center gap-1.5 mb-3">
                                <MapPin className="w-3.5 h-3.5 text-[#E50914]" /> {venue.cinemaName}
                              </h4>
                              <div className="flex flex-wrap gap-2.5">
                                {venue.slots.map((slot) => {
                                  const timeStr = new Intl.DateTimeFormat('vi-VN', {
                                    timeZone: 'Asia/Ho_Chi_Minh',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }).format(new Date(serverTime(slot.startTime)));

                                  return (
                                    <Link
                                      key={slot.showtimeId}
                                      to={`/booking/${slot.showtimeId}`}
                                      className="group bg-[#1B1B23] hover:bg-[#E50914] border border-[#2E2E38] hover:border-[#E50914] rounded-xl p-2.5 min-w-[90px] text-center transition transform active:scale-95 shadow"
                                    >
                                      <span className="block font-black text-sm text-white group-hover:text-white">
                                        {timeStr}
                                      </span>
                                      <span className="block text-[10px] text-[#A1A1AA] group-hover:text-white/80 mt-0.5">
                                        {slot.hallName || '2D'}
                                      </span>
                                      <span className="block text-[10px] text-rose-300 group-hover:text-white font-bold mt-0.5">
                                        {formatCurrency(slot.basePrice)}
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= MODE 2: THEO CỤM RẠP ================= */
          <div className="space-y-8">
            {/* Cinema Pills */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {filteredCinemas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCinemaId(String(c.id))}
                  className={`px-5 py-3 rounded-xl border font-bold text-sm shrink-0 transition cursor-pointer ${
                    selectedCinemaId === String(c.id)
                      ? 'bg-[#E50914] border-[#E50914] text-white font-black shadow-lg shadow-red-900/30'
                      : 'bg-[#1B1B23] border-[#2E2E38] text-[#A1A1AA] hover:border-[#881337] hover:text-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Shows at selected cinema */}
            {(() => {
              const currentVenue = groupedShowtimes.find(
                (g) => String(g.cinemaId) === selectedCinemaId
              );
              if (!currentVenue || !currentVenue.movies || currentVenue.movies.length === 0) {
                return (
                  <div className="text-center py-20 bg-[#1B1B23]/60 border border-dashed border-[#2E2E38] rounded-2xl">
                    <p className="text-sm text-[#A1A1AA]">
                      Rạp này chưa có suất chiếu sắp tới trong ngày đã chọn.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {currentVenue.movies.map((m) => (
                    <div
                      key={m.movieId}
                      className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6"
                    >
                      <div className="flex flex-col sm:flex-row gap-5 items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-black text-white">
                            {m.title || m.movieTitle}
                          </h3>
                          <div className="flex flex-wrap gap-3 mt-4">
                            {(m.showtimes || m.slots || []).map((slot) => {
                              const timeStr = new Intl.DateTimeFormat('vi-VN', {
                                timeZone: 'Asia/Ho_Chi_Minh',
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(new Date(serverTime(slot.startTime)));

                              return (
                                <Link
                                  key={slot.showtimeId}
                                  to={`/booking/${slot.showtimeId}`}
                                  className="group bg-[#121218] hover:bg-[#E50914] border border-[#2E2E38] hover:border-[#E50914] rounded-xl p-3 min-w-[100px] text-center transition transform active:scale-95 shadow"
                                >
                                  <span className="block font-black text-base text-white group-hover:text-white">
                                    {timeStr}
                                  </span>
                                  <span className="block text-xs text-[#A1A1AA] group-hover:text-white/80 mt-1">
                                    {slot.hallName || '2D Phụ đề'}
                                  </span>
                                  <span className="block text-xs text-rose-300 group-hover:text-white font-bold mt-1">
                                    {formatCurrency(slot.basePrice)}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}

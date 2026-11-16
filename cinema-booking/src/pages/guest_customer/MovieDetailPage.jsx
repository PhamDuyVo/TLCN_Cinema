import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import movieApi from '../../api/movieApi';
import showtimeApi from '../../api/showtimeApi';
import TrailerModal from '../../components/common/TrailerModal';
import { dataOf, errorMessage, safeUrl, serverTime, vietnamDate } from '../../utils/booking';
import { formatCurrency } from '../../utils/format';
import {
  Play,
  Clock,
  Tag,
  Globe,
  MessageSquare,
  User,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export default function MovieDetailPage() {
  const { id } = useParams();
  const [retry, setRetry] = useState(0);

  // 7-day rolling schedule generator
  const dates7 = useMemo(() => {
    const list = [];
    const todayStr = vietnamDate();
    const base = new Date(todayStr + 'T12:00:00+07:00');
    const weekdayNames = [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayMonth = `${dd}/${mm}`;
      const weekday = weekdayNames[d.getDay()];

      list.push({
        dateStr,
        dayMonth,
        weekday,
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => vietnamDate());
  const [selectedCity, setSelectedCity] = useState('');
  const [cinemaList, setCinemaList] = useState([]);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [openCinemas, setOpenCinemas] = useState({});

  // 1. Fetch Cinema Locations
  useEffect(() => {
    let active = true;
    axiosClient
      .get('/cinemas')
      .then(dataOf)
      .then((data) => {
        if (active && Array.isArray(data)) {
          setCinemaList(data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [retry]);

  // 2. Fetch Movie Information
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');
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

  // 3. Fetch Showtimes & Auto-poll
  const [schedule, setSchedule] = useState({ movieId: null, shows: [] });
  const [now, setNow] = useState(Date.now);
  const [showError, setShowError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let running = false;
    setLoading(true);
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
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [id, retry]);

  // Helper date parsing (Asia/Ho_Chi_Minh)
  const dayOf = (show) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(serverTime(show.startTime)));
  };

  const formatShowTime = (startTime) => {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(serverTime(startTime)));
  };

  const formatReleaseDate = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const weekdays = [
        'Chủ Nhật',
        'Thứ Hai',
        'Thứ Ba',
        'Thứ Tư',
        'Thứ Năm',
        'Thứ Sáu',
        'Thứ Bảy',
      ];
      const wd = weekdays[d.getDay()];
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${wd}, ${dd}/${mm}/${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  // Age rating badge & warning banner text mapping
  const ageInfo = useMemo(() => {
    const rating = movie?.ageRating?.toUpperCase();
    switch (rating) {
      case 'P':
        return {
          tag: 'P',
          badgeClass: 'bg-emerald-600 text-white',
          bannerText: 'P: Phim được phép phổ biến rộng rãi đến người xem ở mọi độ tuổi',
        };
      case 'K':
        return {
          tag: 'K',
          badgeClass: 'bg-sky-600 text-white',
          bannerText: 'K: Phim dành cho người xem dưới 13 tuổi với điều kiện xem cùng cha, mẹ hoặc người giám hộ',
        };
      case 'T13':
      case 'C13':
        return {
          tag: 'T13',
          badgeClass: 'bg-[#e67e22] text-white',
          bannerText: 'T13: Phim dành cho khán giả từ đủ 13 tuổi trở lên (13+)',
        };
      case 'T16':
      case 'C16':
        return {
          tag: 'T16',
          badgeClass: 'bg-[#d35400] text-white',
          bannerText: 'T16: Phim dành cho khán giả từ đủ 16 tuổi trở lên (16+)',
        };
      case 'T18':
      case 'C18':
        return {
          tag: 'T18',
          badgeClass: 'bg-[#e71a0f] text-white',
          bannerText: 'T18: Phim dành cho khán giả từ đủ 18 tuổi trở lên (18+)',
        };
      default:
        return {
          tag: rating || '',
          badgeClass: 'bg-zinc-700 text-white',
          bannerText: rating
            ? `${rating}: Phim áp dụng theo phân loại độ tuổi ${rating}`
            : 'Phim dành cho khán giả đúng độ tuổi quy định',
        };
    }
  }, [movie?.ageRating]);

  // Cities extracted from cinemas list & shows
  const cities = useMemo(() => {
    const set = new Set();
    cinemaList.forEach((c) => {
      if (c.city) set.add(c.city.trim());
    });
    schedule.shows.forEach((s) => {
      if (s.cinemaCity) set.add(s.cinemaCity.trim());
    });
    return Array.from(set).sort();
  }, [cinemaList, schedule.shows]);

  // Upcoming shows for this movie
  const upcomingShows = useMemo(() => {
    if (String(schedule.movieId) !== String(id)) return [];
    return (schedule.shows || []).filter((show) => {
      const isValid = !show.status || show.status.toLowerCase() === 'scheduled';
      const isFuture = serverTime(show.startTime) > now;
      return isValid && isFuture;
    });
  }, [schedule, id, now]);

  // Group shows by cinema for the selected date
  const groupedCinemas = useMemo(() => {
    const showsOnDate = upcomingShows.filter((s) => dayOf(s) === selectedDate);
    const cinemaMap = new Map();

    showsOnDate.forEach((show) => {
      const cinemaCity = show.cinemaCity || '';
      if (selectedCity && cinemaCity.toLowerCase() !== selectedCity.toLowerCase()) {
        return;
      }

      const cId = show.cinemaId;
      if (!cinemaMap.has(cId)) {
        cinemaMap.set(cId, {
          id: cId,
          name: show.cinemaName || `Cụm Rạp #${cId}`,
          address: show.cinemaAddress || 'Chưa cập nhật địa chỉ',
          city: cinemaCity,
          formats: new Map(),
        });
      }

      const cObj = cinemaMap.get(cId);
      const formatKey = show.screenType || 'Standard';
      if (!cObj.formats.has(formatKey)) {
        cObj.formats.set(formatKey, []);
      }
      cObj.formats.get(formatKey).push(show);
    });

    return Array.from(cinemaMap.values()).map((c) => {
      const formatGroups = Array.from(c.formats.entries()).map(([format, shows]) => ({
        format,
        shows: shows.sort((a, b) => serverTime(a.startTime) - serverTime(b.startTime)),
      }));
      return {
        ...c,
        formatGroups,
      };
    });
  }, [upcomingShows, selectedDate, selectedCity]);

  // Toggle cinema accordion
  const toggleCinema = (cinemaId) => {
    setOpenCinemas((prev) => ({
      ...prev,
      [cinemaId]: prev[cinemaId] === false ? true : false,
    }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#140e2b] via-[#100a24] to-[#0c081c] text-zinc-100 pb-24">
      {/* 1. Backdrop ambient overlay */}
      <div className="relative border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950/90 via-[#190f33]/80 to-black/90">
        {safeUrl(movie?.bannerUrl || movie?.posterUrl) && (
          <img
            src={safeUrl(movie.bannerUrl || movie.posterUrl)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-15 filter blur-md scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#140e2b] via-[#140e2b]/80 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-10">
          {/* Breadcrumbs */}
          <nav aria-label="Đường dẫn" className="text-xs text-zinc-400 mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-amber-400 transition">Trang Chủ</Link>
            <span>/</span>
            <Link to="/movies" className="hover:text-amber-400 transition">Phim</Link>
            <span>/</span>
            <span className="text-zinc-200 font-semibold">{movie?.title || 'Chi tiết phim'}</span>
          </nav>

          {error && (
            <p role="alert" className="text-red-400 mb-4 text-sm">
              {error}{' '}
              <button onClick={() => setRetry((v) => v + 1)} className="underline ml-2">
                Thử lại
              </button>
            </p>
          )}

          {!movie && !error && (
            <div className="py-20 text-center text-zinc-400 text-sm">Đang tải thông tin phim…</div>
          )}

          {movie && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Column: Movie Poster with Badges + Centered Trailer Button */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="relative w-64 md:w-full aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-700/60">
                  {safeUrl(movie.posterUrl) && (
                    <img
                      src={safeUrl(movie.posterUrl)}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Dual Badges on Poster (Cinestar Style) */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="bg-black/90 border border-amber-400 text-amber-400 font-extrabold text-[11px] px-2 py-0.5 rounded shadow">
                      2D
                    </span>
                    {ageInfo.tag && (
                      <span
                        className={`text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded shadow ${ageInfo.badgeClass}`}
                      >
                        {ageInfo.tag}
                      </span>
                    )}
                  </div>
                </div>

                {/* Centered Xem Trailer Button under poster (Cinestar Style) */}
                {movie.trailerUrl && (
                  <button
                    type="button"
                    onClick={() => setTrailerOpen(true)}
                    className="mt-4 flex items-center gap-2.5 px-6 py-2 rounded-full border border-zinc-600/80 bg-zinc-900/60 hover:bg-zinc-800 text-white font-semibold text-sm transition transform active:scale-95 shadow-md cursor-pointer group"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#e71a0f] flex items-center justify-center shadow group-hover:scale-105 transition">
                      <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                    </span>
                    <span>Xem Trailer</span>
                  </button>
                )}
              </div>

              {/* Right Column: Title, Quick Meta, Warning Banner, Mô Tả, Nội Dung */}
              <div className="md:col-span-8 flex flex-col">
                {/* Title */}
                <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-wide uppercase mb-3 leading-tight">
                  {movie.title} {ageInfo.tag ? `(${ageInfo.tag})` : ''}
                </h1>

                {/* Quick Meta List */}
                <div className="space-y-2 text-sm text-zinc-200 mb-2">
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {movie.genres?.length ? movie.genres.join(', ') : 'Hành động, Phiêu lưu'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{movie.durationMinutes || 120}'</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{movie.country || 'Việt Nam'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{movie.language || 'VN'}</span>
                  </div>
                </div>

                {/* Highlighted Yellow Age Warning Banner (Cinestar Style) */}
                <div className="bg-[#fbc02d] text-zinc-950 font-bold px-4 py-2.5 rounded-lg flex items-center gap-2.5 text-xs sm:text-sm my-3 shadow-sm">
                  <User className="w-4 h-4 text-zinc-950 shrink-0 stroke-[2.5]" />
                  <span>{ageInfo.bannerText}</span>
                </div>

                {/* MÔ TẢ */}
                <div className="mt-2 mb-3">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                    MÔ TẢ
                  </h2>
                  <div className="space-y-1 text-xs sm:text-sm text-zinc-300">
                    <p>
                      <span className="text-zinc-400">Đạo diễn: </span>
                      <span className="font-medium text-white">{movie.director || 'Chưa cập nhật'}</span>
                    </p>
                    <p>
                      <span className="text-zinc-400">Diễn viên: </span>
                      <span className="font-medium text-white">{movie.cast || 'Chưa cập nhật'}</span>
                    </p>
                    <p>
                      <span className="text-zinc-400">Khởi chiếu: </span>
                      <span className="font-medium text-white">{formatReleaseDate(movie.releaseDate)}</span>
                    </p>
                  </div>
                </div>

                {/* NỘI DUNG PHIM */}
                <div className="mt-2">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                    NỘI DUNG PHIM
                  </h2>
                  <p
                    className={`text-zinc-300 text-xs sm:text-sm leading-relaxed ${
                      !descExpanded ? 'line-clamp-4' : ''
                    }`}
                  >
                    {movie.description || 'Nội dung phim đang được cập nhật.'}
                  </p>
                  {movie.description && movie.description.length > 200 && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="text-amber-400 hover:text-amber-300 text-xs font-semibold mt-1 underline cursor-pointer"
                    >
                      {descExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Bottom Section: LỊCH CHIẾU THEO CHIỀU DỌC (Cinestar Style) */}
      <div className="max-w-5xl mx-auto px-4 mt-10">
        {/* Centered LỊCH CHIẾU Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">
            LỊCH CHIẾU
          </h2>
        </div>

        {/* Centered Horizontal 7-Day Date Selector */}
        <div
          className="flex justify-center items-center gap-3 overflow-x-auto pb-4 max-w-full px-2"
          aria-label="Lịch chiếu theo ngày"
        >
          {dates7.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`flex flex-col items-center justify-center min-w-[90px] md:min-w-[105px] py-2.5 px-3 rounded-lg border transition cursor-pointer text-center ${
                  isSelected
                    ? 'bg-[#fbc02d] border-[#fbc02d] text-zinc-950 font-black shadow-lg shadow-amber-500/20 scale-105'
                    : 'bg-[#20153b]/80 border-amber-400/50 hover:border-amber-400 text-white hover:bg-[#281b49]'
                }`}
              >
                <span className="text-base md:text-lg font-black tracking-tight">{d.dayMonth}</span>
                <span className="text-[11px] font-semibold tracking-wide uppercase mt-0.5">
                  {d.weekday}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row: DANH SÁCH RẠP on left, City filter on right */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-8 mb-4">
          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
            DANH SÁCH RẠP
          </h3>

          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="appearance-none bg-[#20153b] border border-amber-400/60 hover:border-amber-400 text-amber-400 font-bold text-xs uppercase pl-3 pr-8 py-2 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
            >
              <option value="">📍 TẤT CẢ KHU VỰC</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  📍 {c.toUpperCase()}
                </option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400 text-xs">
              ⌄
            </span>
          </div>
        </div>

        {/* Vertical List of Cinema Cards (CHIỀU DỌC) */}
        {loading ? (
          <div className="text-center py-12 text-zinc-400 text-sm">
            Đang tải lịch chiếu…
          </div>
        ) : showError ? (
          <div className="text-center py-8 text-red-400 text-sm">
            {showError}{' '}
            <button onClick={() => setRetry((v) => v + 1)} className="underline ml-2">
              Thử lại
            </button>
          </div>
        ) : !groupedCinemas.length ? (
          <div className="text-center py-12 px-6 bg-[#20153b]/40 border border-dashed border-[#3b2865] rounded-xl text-zinc-400 my-4">
            <p className="text-base font-semibold text-zinc-300">
              Chưa có suất chiếu trong ngày đã chọn{selectedCity ? ` tại khu vực ${selectedCity}` : ''}.
            </p>
            <p className="text-xs text-zinc-500 mt-1.5">
              Vui lòng chọn ngày khác hoặc thay đổi khu vực tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedCinemas.map((cinema) => {
              const isExpanded = openCinemas[cinema.id] !== false; // default true
              return (
                <div
                  key={cinema.id}
                  className="bg-[#20153b] border border-[#3b2865] rounded-xl overflow-hidden shadow-lg transition duration-200"
                >
                  {/* Cinema Card Header */}
                  <div
                    onClick={() => toggleCinema(cinema.id)}
                    className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-[#281b49] transition select-none"
                  >
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-white hover:text-amber-400 transition">
                        {cinema.name} {cinema.city ? `(${cinema.city})` : ''}
                      </h4>
                      <p className="text-zinc-300 text-xs md:text-sm mt-1 leading-relaxed">
                        {cinema.address}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-zinc-300 p-1"
                      aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Formats and Showtime Slots */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-[#2e1d52]/60">
                      {cinema.formatGroups.map((group) => (
                        <div key={group.format} className="mt-3">
                          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide block mb-2">
                            {group.format || 'Standard'}
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            {group.shows.map((show) => {
                              const timeStr = formatShowTime(show.startTime);
                              return (
                                <Link
                                  key={show.id}
                                  to={`/booking/${show.id}`}
                                  className="px-4 py-2 rounded-lg border border-zinc-600/80 bg-zinc-900/80 hover:bg-[#fbc02d] hover:text-zinc-950 hover:border-[#fbc02d] text-zinc-100 font-bold text-sm tracking-wide transition shadow-sm cursor-pointer min-w-[70px] text-center"
                                >
                                  <span>{timeStr}</span>
                                  {show.basePrice && (
                                    <span className="block text-[10px] opacity-75 font-normal">
                                      {formatCurrency(show.basePrice)}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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

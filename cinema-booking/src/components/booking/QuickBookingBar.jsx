import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import movieApi from '../../api/movieApi';
import showtimeApi from '../../api/showtimeApi';
import { dataOf, serverTime, vietnamDate } from '../../utils/booking';
import { Film, MapPin, Calendar, Clock, Ticket, ChevronRight, ChevronDown } from 'lucide-react';

export const QuickBookingBar = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedCinema, setSelectedCinema] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShowtime, setSelectedShowtime] = useState('');

  // 1. Fetch movies & cinemas on mount
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
        if (movieList && movieList.length > 0) {
          setSelectedMovie(String(movieList[0].id));
        }
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, []);

  // 2. When selectedMovie changes, fetch showtimes for that movie
  useEffect(() => {
    if (!selectedMovie) {
      setShowtimes([]);
      setSelectedCinema('');
      setSelectedDate('');
      setSelectedShowtime('');
      return;
    }
    let active = true;
    showtimeApi
      .getShowtimesByMovie(selectedMovie)
      .then(dataOf)
      .then((data) => {
        if (!active) return;
        const upcoming = (data || []).filter(
          (s) => s.status?.toLowerCase() === 'scheduled' && serverTime(s.startTime) > Date.now()
        );
        setShowtimes(upcoming);
        const venueIds = [...new Set(upcoming.map((s) => String(s.cinemaId)))];
        if (venueIds.length > 0 && (!selectedCinema || !venueIds.includes(selectedCinema))) {
          setSelectedCinema(venueIds[0]);
        }
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [selectedMovie]);

  // 3. Filter available dates for selected movie & cinema
  const dayOf = (show) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(serverTime(show.startTime)));
  };

  const filteredShowsByCinema = showtimes.filter(
    (s) => !selectedCinema || String(s.cinemaId) === String(selectedCinema)
  );

  const availableDates = [...new Set(filteredShowsByCinema.map(dayOf))].sort();

  useEffect(() => {
    if (availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
      setSelectedDate(availableDates[0]);
    } else if (availableDates.length === 0) {
      setSelectedDate('');
      setSelectedShowtime('');
    }
  }, [selectedCinema, showtimes]);

  // 4. Filter showtimes for selected date
  const availableShowtimes = filteredShowsByCinema
    .filter((s) => dayOf(s) === selectedDate)
    .sort((a, b) => serverTime(a.startTime) - serverTime(b.startTime));

  useEffect(() => {
    if (availableShowtimes.length > 0) {
      setSelectedShowtime(String(availableShowtimes[0].id));
    } else {
      setSelectedShowtime('');
    }
  }, [selectedDate, selectedCinema]);

  const handleBooking = () => {
    if (selectedShowtime) {
      navigate(`/booking/${selectedShowtime}`);
    }
  };

  const formatShowtimeLabel = (s) => {
    const timeStr = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(serverTime(s.startTime)));
    const formatName = s.screenType || s.hallName || '2D';
    return `${timeStr} (${formatName})`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4">
      <div className="bg-[#181818]/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <Ticket className="w-4 h-4 text-red-500" />
            <span className="text-white font-extrabold uppercase tracking-wider">Đặt Vé Nhanh</span>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Chọn phim & suất chiếu để vào sơ đồ ghế
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Step 1: Select Movie */}
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Film className="w-3 h-3 text-red-500" /> 1. Chọn Phim
            </label>
            <div className="relative">
              <select
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="w-full appearance-none bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2.5 pr-8 text-xs font-semibold text-white focus:outline-none focus:border-red-500 transition cursor-pointer truncate"
              >
                <option value="" disabled>-- Chọn phim --</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.ageRating || 'P'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Step 2: Select Cinema */}
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" /> 2. Chọn Rạp
            </label>
            <div className="relative">
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                disabled={!selectedMovie}
                className="w-full appearance-none bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2.5 pr-8 text-xs font-semibold text-white focus:outline-none focus:border-red-500 transition cursor-pointer disabled:opacity-40 truncate"
              >
                <option value="" disabled>-- Chọn cụm rạp --</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Step 3: Select Date */}
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-red-500" /> 3. Chọn Ngày
            </label>
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!availableDates.length}
                className="w-full appearance-none bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2.5 pr-8 text-xs font-semibold text-white focus:outline-none focus:border-red-500 transition cursor-pointer disabled:opacity-40 truncate"
              >
                {availableDates.length === 0 ? (
                  <option value="" disabled>Chưa có lịch</option>
                ) : (
                  availableDates.map((day) => {
                    const label = day === vietnamDate() ? 'Hôm nay' : day;
                    return (
                      <option key={day} value={day}>
                        {label} ({day.slice(8)}/{day.slice(5, 7)})
                      </option>
                    );
                  })
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Step 4: Select Showtime */}
          <div className="relative">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500" /> 4. Suất Chiếu
            </label>
            <div className="relative">
              <select
                value={selectedShowtime}
                onChange={(e) => setSelectedShowtime(e.target.value)}
                disabled={!availableShowtimes.length}
                className="w-full appearance-none bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2.5 pr-8 text-xs font-semibold text-white focus:outline-none focus:border-red-500 transition cursor-pointer disabled:opacity-40 truncate"
              >
                {availableShowtimes.length === 0 ? (
                  <option value="" disabled>Hết suất chiếu</option>
                ) : (
                  availableShowtimes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatShowtimeLabel(s)}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Step 5: CTA Button */}
          <div className="sm:col-span-2 lg:col-span-1 pt-2 sm:pt-4 lg:pt-3">
            <button
              onClick={handleBooking}
              disabled={!selectedShowtime}
              className="w-full bg-[#e71a0f] hover:bg-[#c41200] disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/40 transition active:scale-95 cursor-pointer"
            >
              <span>MUA VÉ NGAY</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickBookingBar;

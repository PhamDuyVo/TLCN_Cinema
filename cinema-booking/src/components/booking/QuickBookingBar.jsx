import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import movieApi from '../../api/movieApi';
import showtimeApi from '../../api/showtimeApi';
import { dataOf, serverTime, vietnamDate } from '../../utils/booking';
import { ChevronDown } from 'lucide-react';

export const QuickBookingBar = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  const [selectedCinema, setSelectedCinema] = useState('');
  const [selectedMovie, setSelectedMovie] = useState('');
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
        if (cinemaList && cinemaList.length > 0) {
          setSelectedCinema(String(cinemaList[0].id));
        }
        if (movieList && movieList.length > 0) {
          setSelectedMovie(String(movieList[0].id));
        }
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch showtimes when movie changes
  useEffect(() => {
    if (!selectedMovie) {
      setShowtimes([]);
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
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [selectedMovie]);

  // 3. Filter available dates for selected cinema & movie
  const dayOf = (show) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(serverTime(show.startTime)));
  };

  const filteredShows = showtimes.filter(
    (s) => !selectedCinema || String(s.cinemaId) === String(selectedCinema)
  );

  const availableDates = [...new Set(filteredShows.map(dayOf))].sort();

  useEffect(() => {
    if (availableDates.length > 0 && (!selectedDate || !availableDates.includes(selectedDate))) {
      setSelectedDate(availableDates[0]);
    } else if (availableDates.length === 0) {
      setSelectedDate('');
      setSelectedShowtime('');
    }
  }, [selectedCinema, showtimes]);

  // 4. Filter showtimes for selected date
  const availableShowtimes = filteredShows
    .filter((s) => dayOf(s) === selectedDate)
    .sort((a, b) => serverTime(a.startTime) - serverTime(b.startTime));

  useEffect(() => {
    if (availableShowtimes.length > 0) {
      setSelectedShowtime(String(availableShowtimes[0].id));
    } else {
      setSelectedShowtime('');
    }
  }, [selectedDate, selectedCinema, showtimes]);

  const handleBooking = () => {
    if (selectedShowtime) {
      navigate(`/booking/${selectedShowtime}`);
    } else if (selectedMovie) {
      navigate(`/movies/${selectedMovie}`);
    } else {
      navigate('/showtimes');
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
    <div className="w-full max-w-7xl mx-auto px-4 -mt-8 relative z-20">
      {/* Red Cinema Ambient Quick Booking Bar (Nền đen · Card xám · Đỏ nổi bật · Chữ trắng) */}
      <div className="bg-[#1B1B23] rounded-2xl shadow-2xl p-4 sm:p-5 border border-[#2E2E38] shadow-black/80">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left Title: ĐẶT VÉ NHANH */}
          <div className="shrink-0 flex items-center pr-2 gap-2.5">
            <span className="w-2.5 h-6 bg-[#E50914] rounded-sm inline-block" />
            <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-wider uppercase font-['Bebas_Neue',sans-serif]">
              ĐẶT VÉ NHANH
            </h2>
          </div>

          {/* 4 Selectors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full">
            {/* 1. Chọn Rạp */}
            <div className="relative">
              <select
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                className="w-full appearance-none bg-[#121218] border border-[#2E2E38] hover:border-[#E50914] rounded-xl px-3.5 py-2.5 pr-8 text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] cursor-pointer truncate shadow-sm transition"
              >
                <option value="" disabled className="bg-[#1B1B23] text-[#A1A1AA]">
                  1. Chọn Rạp
                </option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#1B1B23] text-white">
                    1. {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 2. Chọn Phim */}
            <div className="relative">
              <select
                value={selectedMovie}
                onChange={(e) => setSelectedMovie(e.target.value)}
                className="w-full appearance-none bg-[#121218] border border-[#2E2E38] hover:border-[#E50914] rounded-xl px-3.5 py-2.5 pr-8 text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] cursor-pointer truncate shadow-sm transition"
              >
                <option value="" disabled className="bg-[#1B1B23] text-[#A1A1AA]">
                  2. Chọn Phim
                </option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#1B1B23] text-white">
                    2. {m.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 3. Chọn Ngày */}
            <div className="relative">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!availableDates.length}
                className="w-full appearance-none bg-[#121218] border border-[#2E2E38] hover:border-[#E50914] rounded-xl px-3.5 py-2.5 pr-8 text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] cursor-pointer truncate shadow-sm transition disabled:bg-[#09090D] disabled:text-[#71717A] disabled:border-[#202028]"
              >
                {availableDates.length === 0 ? (
                  <option value="" disabled className="bg-[#1B1B23] text-[#71717A]">
                    3. Chưa có lịch
                  </option>
                ) : (
                  availableDates.map((day) => {
                    const label = day === vietnamDate() ? 'Hôm nay' : day;
                    return (
                      <option key={day} value={day} className="bg-[#1B1B23] text-white">
                        3. {label} ({day.slice(8)}/{day.slice(5, 7)})
                      </option>
                    );
                  })
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 4. Chọn Suất */}
            <div className="relative">
              <select
                value={selectedShowtime}
                onChange={(e) => setSelectedShowtime(e.target.value)}
                disabled={!availableShowtimes.length}
                className="w-full appearance-none bg-[#121218] border border-[#2E2E38] hover:border-[#E50914] rounded-xl px-3.5 py-2.5 pr-8 text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] cursor-pointer truncate shadow-sm transition disabled:bg-[#09090D] disabled:text-[#71717A] disabled:border-[#202028]"
              >
                {availableShowtimes.length === 0 ? (
                  <option value="" disabled className="bg-[#1B1B23] text-[#71717A]">
                    4. Hết suất chiếu
                  </option>
                ) : (
                  availableShowtimes.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#1B1B23] text-white">
                      4. {formatShowtimeLabel(s)}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Button: ĐẶT NGAY (Cinema Red Accent) */}
          <div className="shrink-0 w-full sm:w-auto">
            <button
              onClick={handleBooking}
              className="w-full sm:w-auto bg-[#E50914] hover:bg-[#C24132] text-white font-black text-xs uppercase px-7 py-3 rounded-xl shadow-lg shadow-red-900/40 transition transform active:scale-95 cursor-pointer text-center tracking-wider"
            >
              ĐẶT NGAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickBookingBar;

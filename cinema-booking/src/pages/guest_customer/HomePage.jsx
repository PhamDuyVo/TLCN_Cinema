import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MovieCard from '../../components/movie/MovieCard';
import QuickBookingBar from '../../components/booking/QuickBookingBar';
import TrailerModal from '../../components/common/TrailerModal';
import movieApi from '../../api/movieApi';
import { dataOf, errorMessage, safeUrl } from '../../utils/booking';
import {
  Ticket,
  Play,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [trailerModal, setTrailerModal] = useState({ open: false, url: '', title: '' });

  // 1. Fetch both now_showing and coming_soon movies simultaneously
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      movieApi.getAllMovies('now_showing').then(dataOf),
      movieApi.getAllMovies('coming_soon').then(dataOf),
    ])
      .then(([nowShowing, comingSoon]) => {
        if (active) {
          setNowShowingMovies(nowShowing || []);
          setComingSoonMovies(comingSoon || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(errorMessage(err));
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Featured banner slides
  const bannerMovies =
    nowShowingMovies.length > 0
      ? nowShowingMovies.slice(0, 4)
      : comingSoonMovies.slice(0, 4);
  const featured = bannerMovies[currentSlide] || bannerMovies[0] || {
    id: 1,
    title: 'AVATAR: DÒNG CHẢY CỦA NƯỚC',
    description:
      'Hành trình trở lại hành tinh Pandora rực rỡ với định dạng chiếu IMAX 3D siêu chân thực tại hệ thống rạp UTE Cinema.',
    bannerUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
  };

  // Auto rotate banner every 7s
  useEffect(() => {
    if (bannerMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerMovies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [bannerMovies.length]);

  const handleWatchTrailer = (url, title) => {
    setTrailerModal({ open: true, url, title });
  };

  return (
    <div className="w-full pb-20 text-slate-100">
      {/* 1. Hero Banner Slider Carousel */}
      <div className="relative w-full h-[400px] md:h-[480px] bg-[#09090D] overflow-hidden border-b border-[#2E2E38] group">
        <img
          src={
            safeUrl(featured.bannerUrl || featured.posterUrl) ||
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop'
          }
          alt={featured.title}
          className="w-full h-full object-cover opacity-50 transition-all duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090D] via-[#09090D]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090D]/95 via-[#09090D]/50 to-transparent" />

        {/* Carousel Content */}
        <div className="absolute bottom-16 left-0 right-0 max-w-7xl mx-auto px-4 flex justify-between items-end">
          <div className="max-w-2xl">
            <span className="bg-[#E50914] text-white text-[11px] font-black px-3.5 py-1 rounded uppercase tracking-widest inline-flex items-center gap-1.5 shadow-md shadow-red-900/40">
              <Sparkles className="w-3 h-3 text-white" /> SIÊU PHẨM CHIẾU RẠP 2026
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white mt-3 tracking-wide drop-shadow-lg line-clamp-2 uppercase">
              {featured.title}
            </h1>
            <p className="text-zinc-300 text-xs md:text-sm mt-3 line-clamp-2 max-w-xl leading-relaxed">
              {featured.description ||
                'Trải nghiệm điện ảnh đỉnh cao chuẩn quốc tế với hệ thống âm thanh vòm Dolby Atmos và góc nhìn thực tế 3D POV tại UTE Cinema.'}
            </p>

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() => navigate(`/movies/${featured.id}`)}
                className="bg-[#E50914] hover:bg-[#C24132] text-white px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-900/40 transition active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4 text-white" /> ĐẶT VÉ NGAY
              </button>

              {featured.trailerUrl && (
                <button
                  onClick={() => handleWatchTrailer(featured.trailerUrl, featured.title)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer backdrop-blur-sm"
                >
                  <Play className="w-4 h-4 text-[#E50914] fill-[#E50914]" /> Xem Trailer
                </button>
              )}
            </div>
          </div>

          {/* Slide Indicator Dots */}
          {bannerMovies.length > 1 && (
            <div className="hidden sm:flex items-center gap-2 pb-2">
              {bannerMovies.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? 'w-8 bg-[#E50914]' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Carousel Next/Prev Controls */}
        {bannerMovies.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev === 0 ? bannerMovies.length - 1 : prev - 1))
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % bannerMovies.length)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* 2. Thanh Đặt Vé Nhanh Khối Surface Card Chuẩn Cinema Dark */}
      <QuickBookingBar />

      {/* 3. Section Phim: PHIM ĐANG CHIẾU & PHIM SẮP CHIẾU (Hiển thị dọc, lăn chuột xem liền mạch) */}
      <div className="max-w-7xl mx-auto px-4 mt-14 relative">
        {/* Soft Burgundy/Red Glow Background behind Now Showing */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-[#881337]/15 blur-3xl pointer-events-none rounded-full" />

        {/* ================= SECTION 1: PHIM ĐANG CHIẾU ================= */}
        <div className="relative text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] tracking-widest uppercase font-['Bebas_Neue',sans-serif]">
            PHIM ĐANG CHIẾU
          </h2>
          <div className="w-20 h-1 bg-[#E50914] mx-auto mt-2 rounded-full" />
        </div>

        {/* Now Showing Movie Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#A1A1AA]">
            <Loader2 className="w-8 h-8 animate-spin text-[#E50914] mb-2" />
            <p className="text-xs">Đang tải dữ liệu phim từ hệ thống...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 bg-red-950/20 border border-red-900/40 rounded-xl">
            {error}
          </div>
        ) : nowShowingMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {nowShowingMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onWatchTrailer={handleWatchTrailer}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#A1A1AA] bg-[#1B1B23] rounded-xl border border-[#2E2E38]">
            Hiện chưa có phim đang chiếu trong hệ thống.
          </div>
        )}

        {/* ================= SECTION 2: PHIM SẮP CHIẾU ================= */}
        <div className="relative mt-20">
          {/* Soft Deep Burgundy Glow Background behind Coming Soon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-[#590D22]/20 blur-3xl pointer-events-none rounded-full" />

          <div className="relative text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] tracking-widest uppercase font-['Bebas_Neue',sans-serif]">
              PHIM SẮP CHIẾU
            </h2>
            <div className="w-20 h-1 bg-[#E50914] mx-auto mt-2 rounded-full" />
          </div>

          {!loading && (
            comingSoonMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {comingSoonMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onWatchTrailer={handleWatchTrailer}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#A1A1AA] bg-[#1B1B23] rounded-xl border border-[#2E2E38]">
                Hiện chưa có phim sắp chiếu trong hệ thống.
              </div>
            )
          )}
        </div>

        {/* 4. Thành Viên & Ưu Đãi Đặc Biệt */}
        <div className="mt-16 bg-[#1B1B23] rounded-2xl p-6 sm:p-8 border border-[#2E2E38] shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg sm:text-xl font-black text-[#F8FAFC] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E50914]" /> THÀNH VIÊN & ƯU ĐÃI ĐẶC BIỆT
            </h3>
            <Link
              to="/promotions"
              className="text-xs text-[#A1A1AA] flex items-center gap-1 hover:text-[#E50914] transition"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="bg-gradient-to-r from-[#590D22]/60 to-[#121218] p-5 rounded-xl border border-[#881337]/40 hover:border-[#E50914] transition duration-300 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-[#E50914] uppercase tracking-wider">
                  Thứ 4 Vui Vẻ
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                  Đồng Giá 50k Vé Xem Phim
                </h4>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Áp dụng cho tất cả thành viên khi đặt vé online vào ngày Thứ 4 hàng tuần trên toàn hệ thống rạp.
                </p>
              </div>
              <Link
                to="/promotions"
                className="mt-4 text-xs font-bold text-[#E50914] hover:text-rose-300 transition flex items-center gap-1"
              >
                Chi tiết ưu đãi <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-r from-[#4A1525]/60 to-[#121218] p-5 rounded-xl border border-[#881337]/40 hover:border-[#E50914] transition duration-300 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-rose-400 uppercase tracking-wider">
                  Combo Bắp Nước
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                  Giảm 20% Combo Couple
                </h4>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Thêm Combo Bắp Nước Caramel giòn rụm khi thanh toán vé trực tuyến để nhận mức giá ưu đãi đặc biệt.
                </p>
              </div>
              <Link
                to="/promotions"
                className="mt-4 text-xs font-bold text-[#E50914] hover:text-rose-300 transition flex items-center gap-1"
              >
                Chi tiết ưu đãi <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-r from-[#2A1020]/60 to-[#121218] p-5 rounded-xl border border-[#881337]/40 hover:border-[#E50914] transition duration-300 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-rose-300 uppercase tracking-wider">
                  UTE STUDENT - U22
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                  Đồng Giá 45k Học Sinh Sinh Viên
                </h4>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Ưu đãi giá vé dành riêng cho học sinh, sinh viên và giảng viên trên toàn hệ thống rạp chiếu.
                </p>
              </div>
              <Link
                to="/promotions"
                className="mt-4 text-xs font-bold text-[#E50914] hover:text-rose-300 transition flex items-center gap-1"
              >
                Chi tiết ưu đãi <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* On-Web Trailer Modal */}
      <TrailerModal
        isOpen={trailerModal.open}
        onClose={() => setTrailerModal({ open: false, url: '', title: '' })}
        trailerUrl={trailerModal.url}
        movieTitle={trailerModal.title}
      />
    </div>
  );
}

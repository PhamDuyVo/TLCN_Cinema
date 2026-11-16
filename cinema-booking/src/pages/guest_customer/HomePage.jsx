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
  X,
  Volume2,
  Award,
  Popcorn,
  Eye,
  Loader2,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('now_showing');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [trailerModal, setTrailerModal] = useState({ open: false, url: '', title: '' });

  // 1. Fetch movies according to active tab
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    movieApi
      .getAllMovies(activeTab)
      .then(dataOf)
      .then((data) => {
        if (active) {
          setMovies(data || []);
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
  }, [activeTab]);

  // Featured banner slides (Use movies if available, otherwise default to blockbusters)
  const bannerMovies = movies.length > 0 ? movies.slice(0, 4) : [];
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
    <div className="w-full bg-[#121212] pb-16 text-zinc-100">
      {/* 1. Hero Banner Slider Carousel */}
      <div className="relative w-full h-[460px] md:h-[500px] bg-gradient-to-r from-zinc-950 via-zinc-900 to-black overflow-hidden border-b border-zinc-800 group">
        <img
          src={
            safeUrl(featured.bannerUrl || featured.posterUrl) ||
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop'
          }
          alt={featured.title}
          className="w-full h-full object-cover opacity-40 transition-all duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/90 via-[#121212]/40 to-transparent" />

        {/* Carousel Content */}
        <div className="absolute bottom-12 left-0 right-0 max-w-7xl mx-auto px-4 flex justify-between items-end">
          <div className="max-w-2xl">
            <span className="bg-[#e71a0f] text-white text-[11px] font-extrabold px-3 py-1 rounded uppercase tracking-widest inline-flex items-center gap-1.5 shadow-md shadow-red-950/50">
              <Sparkles className="w-3 h-3" /> SUPER BLOCKBUSTER 2026
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white mt-3 tracking-wide drop-shadow-lg line-clamp-2">
              {featured.title}
            </h1>
            <p className="text-zinc-300 text-xs md:text-sm mt-3 line-clamp-2 max-w-xl leading-relaxed">
              {featured.description ||
                'Trải nghiệm điện ảnh đỉnh cao chuẩn quốc tế với hệ thống âm thanh vòm Dolby Atmos và góc nhìn thực tế 3D POV tại UTE Cinema.'}
            </p>

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() => navigate(`/movies/${featured.id}`)}
                className="bg-[#e71a0f] hover:bg-[#c41200] text-white px-6 py-3 rounded-md font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-900/40 transition active:scale-95 cursor-pointer"
              >
                <Ticket className="w-4 h-4" /> MUA VÉ NGAY
              </button>

              {featured.trailerUrl && (
                <button
                  onClick={() => handleWatchTrailer(featured.trailerUrl, featured.title)}
                  className="bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-600 px-5 py-3 rounded-md font-semibold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer backdrop-blur-sm"
                >
                  <Play className="w-4 h-4 text-red-500 fill-red-500" /> Xem Trailer
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
                    currentSlide === idx ? 'w-8 bg-[#e71a0f]' : 'w-2 bg-zinc-600 hover:bg-zinc-400'
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
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center border border-zinc-700/50 opacity-0 group-hover:opacity-100 transition cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % bannerMovies.length)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center border border-zinc-700/50 opacity-0 group-hover:opacity-100 transition cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* 2. Thanh Đặt Vé Nhanh Chuẩn Cinestar (Quick Booking Bar) */}
      <QuickBookingBar />

      {/* 3. Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* UTE Cinema Retro Title Divider (Preserving Original Template) */}
        <div className="cgv-title-section">
          <h2 className="inline-block bg-[#121212] px-6 text-2xl font-black text-white tracking-widest uppercase">
            --- MOVIE SELECTION ---
          </h2>
        </div>

        {/* Tab Toggle: Phim Đang Chiếu vs Phim Sắp Chiếu */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('now_showing')}
            className={`px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm transition duration-300 cursor-pointer ${
              activeTab === 'now_showing'
                ? 'bg-[#e71a0f] text-white shadow-lg shadow-red-900/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            PHIM ĐANG CHIẾU
          </button>
          <button
            onClick={() => setActiveTab('coming_soon')}
            className={`px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm transition duration-300 cursor-pointer ${
              activeTab === 'coming_soon'
                ? 'bg-[#e71a0f] text-white shadow-lg shadow-red-900/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            PHIM SẮP CHIẾU
          </button>
        </div>

        {/* Movie Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-xs">Đang tải dữ liệu phim từ CSDL MySQL...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 bg-red-950/20 border border-red-900/40 rounded-xl">
            {error}
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onWatchTrailer={handleWatchTrailer}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800">
            Chưa có phim nào thuộc danh mục này trong CSDL.
          </div>
        )}

        {/* 4. Thành Viên & Ưu Đãi Đặc Biệt (Preserving Original 3 Cards + Cinestar Style) */}
        <div className="mt-16 bg-[#181818] rounded-2xl p-6 sm:p-8 border border-zinc-800 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> THÀNH VIÊN & ƯU ĐÃI ĐẶC BIỆT
            </h3>
            <Link
              to="/promotions"
              className="text-xs text-zinc-400 flex items-center gap-1 hover:text-white transition"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="bg-gradient-to-r from-red-950/60 to-zinc-900 p-5 rounded-xl border border-red-900/50 hover:border-red-500 transition duration-300 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-red-400 uppercase tracking-wider">
                  Thứ 4 Vui Vẻ
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                  Đồng Giá 50k Vé Xem Phim
                </h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Áp dụng cho tất cả thành viên UTE Cinema khi đặt vé online vào ngày Thứ 4 hàng tuần trên toàn hệ thống.
                </p>
              </div>
              <Link
                to="/promotions"
                className="mt-4 text-xs font-bold text-red-400 hover:text-red-300 transition flex items-center gap-1"
              >
                Chi tiết ưu đãi <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-r from-amber-950/60 to-zinc-900 p-5 rounded-xl border border-amber-900/50 hover:border-amber-500 transition duration-300 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                  Combo Bắp Nước
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                  Giảm 20% Combo Couple
                </h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Thêm Combo Bắp Nước Caramel giòn rụm khi thanh toán vé trực tuyến để nhận mức giá ưu đãi đặc biệt.
                </p>
              </div>
              <Link
                to="/promotions"
                className="mt-4 text-xs font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
              >
                Chi tiết ưu đãi <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-r from-blue-950/60 to-zinc-900 p-5 rounded-xl border border-blue-900/50 hover:border-blue-500 transition duration-300 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider">
                  C'STUDENT - U22
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                  Đồng Giá 45k Học Sinh Sinh Viên
                </h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Chương trình tri ân các bạn học sinh, sinh viên và khách hàng dưới 22 tuổi từ Thứ 2 đến Thứ 6.
                </p>
              </div>
              <Link
                to="/promotions"
                className="mt-4 text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
              >
                Chi tiết ưu đãi <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 5. Dải Trải Nghiệm Chuẩn Cinestar (Dịch Vụ & Công Nghệ) */}
        <div className="mt-14 pt-8 border-t border-zinc-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/70">
              <Volume2 className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <h5 className="font-bold text-white text-xs uppercase">Dolby Atmos 360°</h5>
              <p className="text-[11px] text-zinc-400 mt-1">Âm thanh vòm vòm đa chiều</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/70">
              <Eye className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <h5 className="font-bold text-white text-xs uppercase">Góc Nhìn 3D POV</h5>
              <p className="text-[11px] text-zinc-400 mt-1">Mô phỏng ghế thực tế</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/70">
              <Award className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <h5 className="font-bold text-white text-xs uppercase">Màn Chiếu Laser</h5>
              <p className="text-[11px] text-zinc-400 mt-1">Độ sắc nét 4K chân thực</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/70">
              <Popcorn className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <h5 className="font-bold text-white text-xs uppercase">Bắp Nóng Giòn</h5>
              <p className="text-[11px] text-zinc-400 mt-1">Caramel & Phô mai béo ngậy</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. On-Web Trailer Modal (Plays directly on the web, NO redirect to YouTube) */}
      <TrailerModal
        isOpen={trailerModal.open}
        onClose={() => setTrailerModal({ open: false, url: '', title: '' })}
        trailerUrl={trailerModal.url}
        movieTitle={trailerModal.title}
      />
    </div>
  );
}

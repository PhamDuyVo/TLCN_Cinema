import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from '../../components/movie/MovieCard';
import TrailerModal from '../../components/common/TrailerModal';
import movieApi from '../../api/movieApi';
import { dataOf, errorMessage } from '../../utils/booking';
import { Film, Search, X, Loader2, Filter } from 'lucide-react';

export default function MoviesPage() {
  const [activeTab, setActiveTab] = useState('now_showing');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAge, setSelectedAge] = useState('ALL');
  const [trailerModal, setTrailerModal] = useState({ open: false, url: '', title: '' });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    const fetcher =
      activeTab === 'all'
        ? Promise.all([
            movieApi.getAllMovies('now_showing').then(dataOf),
            movieApi.getAllMovies('coming_soon').then(dataOf),
          ]).then(([a, b]) => {
            const map = new Map();
            [...(a || []), ...(b || [])].forEach((m) => map.set(m.id, m));
            return Array.from(map.values());
          })
        : movieApi.getAllMovies(activeTab).then(dataOf);

    fetcher
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

  const handleWatchTrailer = (url, title) => {
    setTrailerModal({ open: true, url, title });
  };

  // Filter movies by search query & age rating
  const filteredMovies = movies.filter((m) => {
    const matchesSearch =
      !searchQuery.trim() ||
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.director?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cast?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAge =
      selectedAge === 'ALL' ||
      (m.ageRating && m.ageRating.toUpperCase() === selectedAge.toUpperCase());

    return matchesSearch && matchesAge;
  });

  return (
    <div className="min-h-screen text-zinc-100 pb-20">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#09090D] via-[#121218] to-[#09090D] border-b border-[#2E2E38] py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <nav className="text-xs text-[#A1A1AA] mb-2 flex items-center gap-2">
              <Link to="/" className="hover:text-[#E50914] transition">Trang Chủ</Link>
              <span>/</span>
              <span className="text-white font-semibold">Danh Mục Phim</span>
            </nav>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Film className="w-8 h-8 text-[#E50914]" /> PHIM ĐIỆN ẢNH CHIẾU RẠP
            </h1>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Khám phá toàn bộ danh mục phim đang chiếu và sắp chiếu tại UTE Cinema
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#E50914] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm phim, đạo diễn, diễn viên..."
              className="w-full bg-[#1B1B23] border border-[#2E2E38] focus:border-[#E50914] rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-[#A1A1AA] outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2E2E38] pb-5">
          {/* Main Status Tabs */}
          <div className="flex items-center gap-2 bg-[#121218] p-1 rounded-xl border border-[#2E2E38]">
            {[
              { id: 'now_showing', label: 'PHIM ĐANG CHIẾU' },
              { id: 'coming_soon', label: 'PHIM SẮP CHIẾU' },
              { id: 'all', label: 'TẤT CẢ PHIM' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Age Rating Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#E50914] font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-[#E50914]" /> Phân loại:
            </span>
            {['ALL', 'P', 'K', 'T13', 'T16', 'T18'].map((age) => (
              <button
                key={age}
                onClick={() => setSelectedAge(age)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                  selectedAge === age
                    ? 'bg-[#E50914] text-white shadow-sm'
                    : 'bg-[#1B1B23] text-[#A1A1AA] hover:text-white border border-[#2E2E38]'
                }`}
              >
                {age === 'ALL' ? 'Tất cả' : age}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Movie Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#A1A1AA]">
              <Loader2 className="w-8 h-8 animate-spin text-[#E50914] mb-2" />
              <p className="text-xs">Đang tải danh sách phim...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400 bg-red-950/20 border border-red-900/40 rounded-xl">
              <p>{error}</p>
            </div>
          ) : filteredMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onWatchTrailer={handleWatchTrailer}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#1B1B23]/50 border border-dashed border-[#2E2E38] rounded-2xl">
              <Film className="w-10 h-10 text-rose-400 mx-auto mb-2" />
              <h3 className="font-bold text-white text-sm">Không tìm thấy phim phù hợp</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc độ tuổi
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. On-Web Trailer Modal */}
      <TrailerModal
        isOpen={trailerModal.open}
        onClose={() => setTrailerModal({ open: false, url: '', title: '' })}
        trailerUrl={trailerModal.url}
        movieTitle={trailerModal.title}
      />
    </div>
  );
}

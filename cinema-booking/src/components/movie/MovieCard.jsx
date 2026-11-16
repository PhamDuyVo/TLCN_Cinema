import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/format';
import { safeUrl } from '../../utils/booking';
import { Play, Ticket, Clock, Tag, Globe, MessageSquare, Calendar } from 'lucide-react';

export default function MovieCard({ movie, onWatchTrailer }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  // Age rating badge colors (National Cinema Standard)
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
        return 'bg-[#E50914] text-white';
      default:
        return 'bg-zinc-700 text-white';
    }
  };

  const posterSrc = !imageError && safeUrl(movie?.posterUrl)
    ? safeUrl(movie.posterUrl)
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop';

  const goToDetail = () => {
    navigate(`/movies/${movie.id}`);
  };

  return (
    <div className="group bg-[#1B1B23] rounded-2xl overflow-hidden border border-[#2E2E38] hover:border-[#E50914]/60 shadow-xl hover:shadow-[0_10px_25px_rgba(229,9,20,0.25)] transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
      {/* 1. Poster Container */}
      <div
        onClick={goToDetail}
        className="relative aspect-[2/3] w-full bg-[#121218] overflow-hidden cursor-pointer"
        title={`Xem chi tiết phim ${movie.title}`}
      >
        <img
          src={posterSrc}
          alt={movie.title}
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Top-Left Dual Badges: [2D] [T18] */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="bg-black/85 border border-[#E50914] text-[#E50914] text-[10px] font-black px-2 py-0.5 rounded shadow">
            2D
          </span>
          {movie.ageRating && (
            <span
              className={`text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded shadow ${getAgeBadgeStyle(
                movie.ageRating
              )}`}
            >
              {movie.ageRating}
            </span>
          )}
        </div>

        {/* Hover Red Cinema Ambient Overlay */}
        <div className="absolute inset-0 bg-[#09090D]/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-center text-xs space-y-2 pointer-events-none">
          <h4 className="font-extrabold text-sm text-[#F8FAFC] group-hover:text-[#E50914] line-clamp-2 leading-tight transition-colors">
            {movie.title} {movie.ageRating && `(${movie.ageRating})`}
          </h4>

          <div className="space-y-1.5 text-zinc-300 text-[11px] pt-1">
            <p className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
              <span className="line-clamp-1">
                {movie.genres?.length ? movie.genres.join(', ') : 'Chưa cập nhật'}
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
              <span>{movie.durationMinutes || 120}'</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
              <span>{movie.country || 'Quốc tế'}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
              <span>{movie.language || 'Phụ đề tiếng Việt'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Movie Info Below Poster */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <Link
            to={`/movies/${movie.id}`}
            className="block font-bold text-sm text-[#F8FAFC] group-hover:text-[#E50914] transition-colors line-clamp-1 leading-snug"
            title={movie.title}
          >
            {movie.title} {movie.ageRating && `(${movie.ageRating})`}
          </Link>

          <div className="flex items-center gap-2.5 text-[11px] text-[#A1A1AA] mt-1.5">
            {movie.durationMinutes != null && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#E50914]" /> {movie.durationMinutes}'
              </span>
            )}
            {movie.releaseDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#C24132]" /> {formatDate(movie.releaseDate)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Action Buttons: Trailer & Đặt Vé */}
        <div className="mt-3.5 pt-3 border-t border-[#2E2E38] flex items-center gap-2">
          {/* Button 1: Trailer */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onWatchTrailer) {
                onWatchTrailer(movie.trailerUrl, movie.title);
              }
            }}
            className="flex-1 py-2 px-2 rounded-xl bg-[#121218] hover:bg-[#252530] text-[#F8FAFC] border border-[#2E2E38] text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
          >
            <Play className="w-3 h-3 text-[#E50914] fill-[#E50914]" /> Trailer
          </button>

          {/* Button 2: Đặt Vé (Cinema Red) */}
          <Link
            to={`/movies/${movie.id}`}
            className="flex-1 py-2 px-2 rounded-xl bg-[#E50914] hover:bg-[#C24132] text-white text-xs font-black flex items-center justify-center gap-1 shadow-md shadow-red-900/30 transition active:scale-95 text-center"
          >
            <Ticket className="w-3.5 h-3.5 text-white" /> Đặt Vé
          </Link>
        </div>
      </div>
    </div>
  );
}

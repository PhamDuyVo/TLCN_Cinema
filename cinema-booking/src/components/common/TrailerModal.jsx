import { useEffect } from 'react';
import { X, Film, Play } from 'lucide-react';

export default function TrailerModal({ isOpen, onClose, trailerUrl, movieTitle }) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract YouTube ID
  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0` : null;
  };

  const embedUrl = getYoutubeEmbed(trailerUrl);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 fill-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white line-clamp-1">
                Trailer: {movieTitle || 'Official Trailer'}
              </h3>
              <span className="text-[10px] text-zinc-400">UTE Cinema Trailer Player</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {embedUrl ? (
            <iframe
              className="w-full h-full"
              src={embedUrl}
              title={`Trailer ${movieTitle}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : trailerUrl && (trailerUrl.endsWith('.mp4') || trailerUrl.endsWith('.webm')) ? (
            <video
              src={trailerUrl}
              controls
              autoPlay
              className="w-full h-full"
            />
          ) : (
            /* Mock Player if URL is unavailable or invalid */
            <div className="text-center p-8 text-zinc-400 space-y-3">
              <Film className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
              <p className="text-sm font-semibold text-white">Đang phát trailer: {movieTitle}</p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Trình phát video xem trước trực tiếp trên UTE Cinema. Suất chiếu đang mở bán tại các cụm rạp.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


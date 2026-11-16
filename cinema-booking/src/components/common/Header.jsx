import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';
import { dataOf } from '../../utils/booking';
import {
  Ticket,
  User,
  LogOut,
  Film,
  Sparkles,
  MapPin,
  Calendar,
  Tag,
  Menu,
  X,
  Phone,
  Popcorn,
  ChevronDown,
} from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState('');

  useEffect(() => {
    let active = true;
    axiosClient
      .get('/cinemas')
      .then(dataOf)
      .then((data) => {
        if (active && Array.isArray(data)) {
          setCinemas(data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const navLinks = [
    { name: 'TRANG CHỦ', path: '/' },
    { name: 'LỊCH CHIẾU', path: '/showtimes', icon: Calendar },
    { name: 'PHIM', path: '/movies', icon: Film },
    { name: 'CỤM RẠP & GIÁ VÉ', path: '/cinemas', icon: MapPin },
    { name: 'ƯU ĐÃI', path: '/promotions', icon: Tag, highlight: true },
  ];

  return (
    <header className="w-full bg-[#121212] border-b border-[#282828] sticky top-0 z-50 shadow-xl">
      {/* 1. Utility Top Bar (Cinestar Standard) */}
      <div className="bg-[#0a0a0a] border-b border-[#1f1f1f] text-xs text-zinc-400 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left: Hotline & System */}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-zinc-300">
              <Phone className="w-3.5 h-3.5 text-red-500" /> CSKH: <strong className="text-white">1900 2321</strong>
            </span>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <Link
              to="/cinemas"
              className="hidden sm:flex items-center gap-1 hover:text-red-400 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-red-500" /> Hệ thống Rạp toàn quốc
            </Link>
          </div>

          {/* Right: User status or Shortcuts */}
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-amber-400 font-semibold hover:underline">
                [Trang Quản Trị Admin]
              </Link>
            )}
            {user?.role === 'staff' && (
              <Link to="/staff/pos" className="text-blue-400 font-semibold hover:underline">
                [Phân Hệ Nhân Viên POS]
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/my-tickets"
                  className="hover:text-red-400 transition flex items-center gap-1 font-semibold text-amber-300"
                >
                  <Ticket className="w-3.5 h-3.5" /> Vé Của Tôi
                </Link>
                <span className="text-zinc-700">|</span>
                <Link
                  to="/profile"
                  className="font-medium text-zinc-200 hover:text-white flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-red-500" /> {user.full_name || user.email}
                </Link>
                <button
                  onClick={logout}
                  className="hover:text-red-400 flex items-center gap-1 text-zinc-400 transition ml-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Thoát
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login?mode=login"
                  className="hover:text-white transition font-medium text-zinc-300"
                >
                  Đăng Nhập
                </Link>
                <span className="text-zinc-600">/</span>
                <Link
                  to="/login?mode=register"
                  className="hover:text-amber-300 transition font-medium text-amber-400"
                >
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo UTE Cinema Style */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-[#e71a0f] text-white px-2.5 py-1.5 rounded-lg font-black text-xl tracking-tighter shadow-md group-hover:bg-[#c41200] transition">
              UTE
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-wider text-white">CINEMA</span>
              <span className="text-[9px] text-zinc-400 tracking-widest uppercase -mt-1 font-semibold">
                CULTURES & MOVIES
              </span>
            </div>
          </Link>

          {/* Cinestar Cinema Quick Location Selector */}
          {cinemas.length > 0 && (
            <div className="hidden xl:flex items-center relative">
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <select
                  value={selectedCinema}
                  onChange={(e) => {
                    setSelectedCinema(e.target.value);
                    navigate('/showtimes');
                  }}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-2"
                >
                  <option value="" className="bg-zinc-900 text-zinc-300">
                    -- Chọn Rạp --
                  </option>
                  {cinemas.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Center Menu Links */}
        <nav className="hidden lg:flex items-center gap-6 font-bold text-xs sm:text-sm">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 py-1 transition-colors ${
                  isActive
                    ? 'text-red-500 border-b-2 border-red-500 font-extrabold'
                    : link.highlight
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-zinc-200 hover:text-red-500'
                }`}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-red-500'
                        : link.highlight
                        ? 'text-amber-400'
                        : 'text-zinc-400'
                    }`}
                  />
                )}
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Action CTAs (Cinestar standard) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/showtimes')}
            className="bg-[#e71a0f] hover:bg-[#c41200] text-white px-5 py-2.5 rounded-lg font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-red-950/50 transition transform active:scale-95 cursor-pointer"
          >
            <Ticket className="w-4 h-4" />
            <span>MUA VÉ NGAY</span>
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#161616] border-b border-zinc-800 px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm ${
                    isActive
                      ? 'bg-red-600/20 text-red-500'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-400">
            <span>Hotline: 1900 2321</span>
            <Link to="/cinemas" className="text-red-400">
              Hệ thống rạp &rarr;
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

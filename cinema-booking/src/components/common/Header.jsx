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
  MapPin,
  Calendar,
  Tag,
  Menu,
  X,
  Phone,
  Popcorn,
  Search,
} from 'lucide-react';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState('');
  const [searchHeader, setSearchHeader] = useState('');

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchHeader.trim()) {
      navigate(`/movies?q=${encodeURIComponent(searchHeader.trim())}`);
    } else {
      navigate('/movies');
    }
  };

  const navLinks = [
    { name: 'Chọn Rạp', path: '/cinemas', icon: MapPin },
    { name: 'Lịch Chiếu', path: '/showtimes', icon: Calendar },
    { name: 'Phim', path: '/movies', icon: Film },
    { name: 'Khuyến Mãi', path: '/promotions', icon: Tag, highlight: true },
  ];

  return (
    <header className="w-full sticky top-0 z-50 shadow-2xl">
      {/* 1. Clean Utility Bar */}
      <div className="bg-[#09090D] border-b border-white/5 text-xs text-[#A1A1AA] py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#F8FAFC]">
              <Phone className="w-3.5 h-3.5 text-[#E50914]" /> CSKH: <strong className="text-white">1900 2321</strong>
            </span>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <Link
              to="/cinemas"
              className="hidden sm:flex items-center gap-1 hover:text-[#E50914] transition"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E50914]" /> Hệ thống Rạp toàn quốc
            </Link>
          </div>
          <div className="flex items-center gap-4 text-[#A1A1AA]">
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-[#E50914] font-bold hover:underline">
                [Admin]
              </Link>
            )}
            {user?.role === 'staff' && (
              <Link to="/staff/pos" className="text-rose-300 font-bold hover:underline">
                [POS]
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar (Red Cinema Dark Ambient) */}
      <div className="bg-[#09090D]/90 backdrop-blur-md border-b border-white/10 text-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo UTE CINEMA */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="bg-[#E50914] text-white px-2.5 py-1 rounded-lg font-black text-xl tracking-tight shadow-md group-hover:scale-105 transition transform shadow-red-900/40">
              UTE
            </div>
            <span className="font-black text-2xl tracking-wider text-white">
              CINEMA
            </span>
          </Link>

          {/* Quick Action Buttons: [ĐẶT VÉ NGAY] [ĐẶT BẮP NƯỚC] */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {/* Cinema Red: Đặt Vé Ngay */}
            <button
              onClick={() => navigate('/showtimes')}
              className="bg-[#E50914] hover:bg-[#C24132] text-white font-black px-4 py-2 rounded-lg text-xs uppercase flex items-center gap-1.5 shadow-md shadow-red-900/40 transition transform active:scale-95 cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5 text-white" />
              <span>ĐẶT VÉ NGAY</span>
            </button>

            {/* Wine Red: Đặt Bắp Nước */}
            <button
              onClick={() => navigate('/booking/1')}
              className="bg-[#881337] hover:bg-[#590D22] text-white font-bold px-4 py-2 rounded-lg text-xs uppercase flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition transform active:scale-95 cursor-pointer border border-[#881337]/50"
            >
              <Popcorn className="w-3.5 h-3.5 text-rose-200" />
              <span>ĐẶT BẮP NƯỚC</span>
            </button>
          </div>

          {/* Dark Surface Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xs relative hidden lg:block"
          >
            <input
              type="text"
              value={searchHeader}
              onChange={(e) => setSearchHeader(e.target.value)}
              placeholder="Tìm phim, rạp..."
              className="w-full bg-[#1B1B23] text-[#F8FAFC] placeholder-[#A1A1AA] rounded-full pl-4 pr-9 py-1.5 text-xs outline-none shadow-inner border border-[#2E2E38] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#E50914]"
              aria-label="Tìm kiếm"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Right: User Login / Profile status */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 text-xs">
                <Link
                  to="/my-tickets"
                  className="hover:text-red-300 transition flex items-center gap-1 font-bold text-[#E50914]"
                >
                  <Ticket className="w-3.5 h-3.5" /> Vé Của Tôi
                </Link>
                <span className="text-zinc-700">|</span>
                <Link
                  to="/profile"
                  className="font-medium text-[#F8FAFC] hover:text-white flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-[#E50914]" /> {user.full_name || user.email}
                </Link>
                <button
                  onClick={logout}
                  className="hover:text-red-400 flex items-center gap-1 text-[#A1A1AA] transition ml-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Thoát
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <Link
                  to="/login?mode=login"
                  className="hover:text-[#E50914] transition font-medium text-[#F8FAFC] flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-[#A1A1AA]" /> Đăng nhập
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#1B1B23] border border-[#2E2E38] text-[#A1A1AA] hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 3. Sub-header Navigation Row */}
        <div className="bg-[#09090D]/95 border-t border-white/5 px-4 py-2 hidden lg:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-semibold text-[#A1A1AA]">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 transition ${
                      isActive
                        ? 'text-[#E50914] font-bold'
                        : link.highlight
                        ? 'text-rose-400 hover:text-white'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 opacity-80" />}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Fast Cinema Switcher */}
            {cinemas.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-[#A1A1AA]">
                <MapPin className="w-3 h-3 text-[#E50914]" />
                <select
                  value={selectedCinema}
                  onChange={(e) => {
                    setSelectedCinema(e.target.value);
                    navigate('/showtimes');
                  }}
                  className="bg-transparent text-[#F8FAFC] hover:text-white focus:outline-none cursor-pointer pr-1 font-medium"
                >
                  <option value="" className="bg-[#1B1B23] text-[#A1A1AA]">
                    Chọn rạp gần bạn
                  </option>
                  {cinemas.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1B1B23] text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#09090D] border-b border-white/10 px-4 py-4 space-y-3">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/showtimes');
              }}
              className="flex-1 bg-[#E50914] text-white font-black py-2 rounded-lg text-xs uppercase"
            >
              ĐẶT VÉ NGAY
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/booking/1');
              }}
              className="flex-1 bg-[#881337] text-white font-bold py-2 rounded-lg text-xs uppercase"
            >
              ĐẶT BẮP NƯỚC
            </button>
          </div>

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
                      ? 'bg-[#E50914]/20 text-[#E50914]'
                      : 'text-[#A1A1AA] hover:bg-[#1B1B23] hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

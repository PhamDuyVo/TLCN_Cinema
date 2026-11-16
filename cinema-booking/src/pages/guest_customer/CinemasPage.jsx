import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { dataOf } from '../../utils/booking';
import { MapPin, Phone, Award, Ticket, CheckCircle2 } from 'lucide-react';

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState([]);

  useEffect(() => {
    axiosClient
      .get('/cinemas')
      .then(dataOf)
      .then((list) => {
        setCinemas(list || []);
      })
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen text-[#F8FAFC] pb-20">
      {/* 1. Hero Header */}
      <div className="bg-gradient-to-b from-[#121218] to-transparent border-b border-[#2E2E38] py-10">
        <div className="max-w-7xl mx-auto px-4 text-center max-w-3xl">
          <span className="text-[#E50914] font-extrabold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 mb-2">
            <MapPin className="w-4 h-4 text-[#E50914]" /> HỆ THỐNG CỤM RẠP UTE CINEMA
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white">HỆ THỐNG CỤM RẠP & BẢNG GIÁ VÉ</h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-2">
            Không gian rạp chiếu chuẩn quốc tế, âm thanh vòm Dolby Atmos và mức giá vé ưu đãi nhất dành cho sinh viên và gia đình.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10 space-y-16">
        {/* 2. CỤM RẠP SECTION */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wide">DANH SÁCH CỤM RẠP</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cinemas.map((c) => (
              <div
                key={c.id}
                className="bg-[#1B1B23] border border-[#2E2E38] rounded-2xl p-6 hover:border-[#E50914]/80 transition flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black text-white">{c.name}</h3>
                    <span className="bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40 text-[10px] font-extrabold px-2.5 py-1 rounded">
                      RẠP TIÊU CHUẨN
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] flex items-center gap-1.5 mt-3 leading-relaxed">
                    <MapPin className="w-4 h-4 text-[#E50914] shrink-0" /> {c.address}
                  </p>
                  <p className="text-xs text-zinc-300 flex items-center gap-1.5 mt-2">
                    <Phone className="w-4 h-4 text-[#E50914] shrink-0" /> Hotline: {c.hotline || '1900 2321'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4 text-[11px] text-[#A1A1AA]">
                    <span className="bg-[#121218] border border-[#2E2E38] px-2.5 py-1 rounded">4 Phòng chiếu</span>
                    <span className="bg-[#121218] border border-[#2E2E38] px-2.5 py-1 rounded">IMAX Laser</span>
                    <span className="bg-[#121218] border border-[#2E2E38] px-2.5 py-1 rounded">Dolby Atmos</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#2E2E38] flex items-center justify-between">
                  <Link
                    to={`/showtimes?mode=cinema`}
                    className="bg-[#E50914] hover:bg-[#C24132] text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition shadow-md shadow-red-900/30 cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-white" /> Xem lịch rạp này
                  </Link>
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đang hoạt động
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. BẢNG GIÁ VÉ CHUẨN */}
        <section className="bg-[#1B1B23] border border-[#2E2E38] rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[#E50914] font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
              <Ticket className="w-4 h-4 text-[#E50914]" /> BẢNG GIÁ VÉ TIÊU CHUẨN
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">BẢNG GIÁ VÉ HỆ THỐNG UTE CINEMA</h2>
            <p className="text-xs text-[#A1A1AA] mt-1">Áp dụng cho định dạng phim 2D tại tất cả các cụm rạp</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#121218] border-b border-[#2E2E38] text-[#E50914]">
                  <th className="p-3.5 font-black">LOẠI VÉ / ĐỐI TƯỢNG</th>
                  <th className="p-3.5 font-black text-center text-[#F8FAFC]">THỨ 2, 3, 5</th>
                  <th className="p-3.5 font-black text-center text-[#E50914]">THỨ 4 VUI VẺ</th>
                  <th className="p-3.5 font-black text-center text-[#F8FAFC]">THỨ 6, 7, CN & LỄ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E38]">
                <tr>
                  <td className="p-3.5 font-semibold text-white">Người Lớn (Standard)</td>
                  <td className="p-3.5 text-center text-zinc-300">80.000 đ</td>
                  <td className="p-3.5 text-center font-black text-[#E50914]">50.000 đ</td>
                  <td className="p-3.5 text-center text-zinc-300">95.000 đ</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-white">Học Sinh - Sinh Viên (UTE Student)</td>
                  <td className="p-3.5 text-center text-zinc-300">55.000 đ</td>
                  <td className="p-3.5 text-center font-black text-[#E50914]">45.000 đ</td>
                  <td className="p-3.5 text-center text-zinc-300">65.000 đ</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-white">Trẻ Em / Người Cao Tuổi</td>
                  <td className="p-3.5 text-center text-zinc-300">55.000 đ</td>
                  <td className="p-3.5 text-center font-black text-[#E50914]">45.000 đ</td>
                  <td className="p-3.5 text-center text-zinc-300">60.000 đ</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-white">Phụ thu Ghế VIP</td>
                  <td className="p-3.5 text-center text-zinc-300">+10.000 đ</td>
                  <td className="p-3.5 text-center text-[#E50914]">+5.000 đ</td>
                  <td className="p-3.5 text-center text-zinc-300">+15.000 đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

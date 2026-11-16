import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { dataOf } from '../../utils/booking';
import { MapPin, Phone, Clock, Award, ShieldCheck, Ticket, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState(null);

  useEffect(() => {
    axiosClient.get('/cinemas')
      .then(dataOf)
      .then(list => {
        setCinemas(list || []);
        if (list && list.length > 0) setSelectedCinema(list[0]);
      })
      .catch(console.error);
  }, []);

  return (
    <main className="bg-[#121212] min-h-screen text-zinc-100 pb-20">
      {/* 1. Hero Header */}
      <div className="bg-gradient-to-b from-[#181818] to-[#121212] border-b border-zinc-800 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center max-w-3xl">
          <span className="text-red-500 font-extrabold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 mb-2">
            <MapPin className="w-4 h-4" /> UTE CINEMA EXPERIENCE
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white">HỆ THỐNG CỤM RẠP & BẢNG GIÁ VÉ</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            Không gian rạp chiếu chuẩn quốc tế, âm thanh vòm Dolby Atmos và mức giá vé ưu đãi nhất dành cho sinh viên và gia đình.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10 space-y-16">
        {/* 2. CỤM RẠP SECTION */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-red-500" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wide">DANH SÁCH CỤM RẠP</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cinemas.map((c) => (
              <div
                key={c.id}
                className="bg-[#181818] border border-zinc-800 rounded-2xl p-6 hover:border-red-500/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black text-white">{c.name}</h3>
                    <span className="bg-red-600/20 text-red-400 border border-red-800/50 text-[10px] font-extrabold px-2.5 py-1 rounded">
                      RẠP TIÊU CHUẨN
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-3">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" /> {c.address}
                  </p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-2">
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" /> Hotline: {c.hotline || '1900 2321'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4 text-[11px] text-zinc-300">
                    <span className="bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded">4 Phòng chiếu</span>
                    <span className="bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded">IMAX Laser</span>
                    <span className="bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded">Dolby Atmos</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <Link
                    to={`/showtimes?mode=cinema`}
                    className="bg-[#e71a0f] hover:bg-[#c41200] text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Ticket className="w-3.5 h-3.5" /> Xem lịch rạp này
                  </Link>
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đang hoạt động
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. BẢNG GIÁ VÉ CHUẨN CINESTAR */}
        <section className="bg-[#181818] border border-zinc-800 rounded-3xl p-6 sm:p-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-red-500 font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-1 mb-1">
              <Ticket className="w-4 h-4" /> BẢNG GIÁ VÉ TIÊU CHUẨN
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">BẢNG GIÁ VÉ RẠP UTE CINEMA</h2>
            <p className="text-xs text-zinc-400 mt-1">Áp dụng cho định dạng phim 2D tại tất cả các cụm rạp</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-700 text-zinc-300">
                  <th className="p-3.5 font-bold">LOẠI VÉ / ĐỐI TƯỢNG</th>
                  <th className="p-3.5 font-bold text-center">THỨ 2 - THỨ 5</th>
                  <th className="p-3.5 font-bold text-center">THỨ 6 - CHỦ NHẬT & LỄ</th>
                  <th className="p-3.5 font-bold text-center text-amber-400">THỨ 4 VUI VẺ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <tr className="hover:bg-zinc-900/50 transition">
                  <td className="p-3.5 font-semibold text-white">
                    Học sinh, Sinh viên, U22 <span className="text-red-400 font-normal block text-xs">(Xuất trình thẻ HSSV/CCCD)</span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-emerald-400">50.000 ₫</td>
                  <td className="p-3.5 text-center font-bold text-zinc-200">65.000 ₫</td>
                  <td className="p-3.5 text-center font-bold text-amber-400 bg-amber-950/20">50.000 ₫</td>
                </tr>
                <tr className="hover:bg-zinc-900/50 transition">
                  <td className="p-3.5 font-semibold text-white">
                    Người lớn (Khách tiêu chuẩn)
                  </td>
                  <td className="p-3.5 text-center font-bold text-zinc-200">65.000 ₫</td>
                  <td className="p-3.5 text-center font-bold text-zinc-200">85.000 ₫</td>
                  <td className="p-3.5 text-center font-bold text-amber-400 bg-amber-950/20">50.000 ₫</td>
                </tr>
                <tr className="hover:bg-zinc-900/50 transition">
                  <td className="p-3.5 font-semibold text-white">
                    Trẻ em (Dưới 1.3m) & Người cao tuổi (&gt;55 tuổi)
                  </td>
                  <td className="p-3.5 text-center font-bold text-emerald-400">50.000 ₫</td>
                  <td className="p-3.5 text-center font-bold text-emerald-400">55.000 ₫</td>
                  <td className="p-3.5 text-center font-bold text-amber-400 bg-amber-950/20">50.000 ₫</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Phụ thu loại ghế */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-zinc-800 text-xs">
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-amber-400 font-bold block mb-1">Ghế VIP</span>
              <p className="text-zinc-400">Phụ thu <strong className="text-white">+20.000 ₫</strong> / ghế</p>
              <span className="text-[10px] text-zinc-500 block mt-1">Hàng C, D giữa trung tâm rạp</span>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-pink-400 font-bold block mb-1">Ghế Đôi (Sweetbox)</span>
              <p className="text-zinc-400">Phụ thu <strong className="text-white">+50.000 ₫</strong> / cặp</p>
              <span className="text-[10px] text-zinc-500 block mt-1">Dãy ghế cuối riêng tư</span>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
              <span className="text-blue-400 font-bold block mb-1">Định dạng IMAX 3D</span>
              <p className="text-zinc-400">Phụ thu <strong className="text-white">+30.000 ₫</strong> / vé</p>
              <span className="text-[10px] text-zinc-500 block mt-1">Bao gồm kính 3D tiêu chuẩn</span>
            </div>
          </div>
        </section>

        {/* 4. QUY ĐỊNH PHÂN LOẠI ĐỘ TUỔI (BỘ VĂN HÓA THỂ THAO & DU LỊCH) */}
        <section className="bg-[#181818] border border-zinc-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-wide">
              QUY ĐỊNH PHÂN LOẠI ĐỘ TUỔI XEM PHIM
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-zinc-900 p-4 rounded-xl border border-emerald-900/60">
              <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded inline-block">P</span>
              <h4 className="font-bold text-white text-sm mt-2">Phổ Biến Mọi Lứa Tuổi</h4>
              <p className="text-xs text-zinc-400 mt-1">Phim dành cho mọi đối tượng khán giả.</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-blue-900/60">
              <span className="bg-blue-600 text-white font-black text-xs px-2.5 py-1 rounded inline-block">K</span>
              <h4 className="font-bold text-white text-sm mt-2">Dưới 13 Tuổi Kèm Phụ Huynh</h4>
              <p className="text-xs text-zinc-400 mt-1">Khán giả dưới 13 tuổi có cha mẹ đi cùng.</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-amber-900/60">
              <span className="bg-amber-600 text-white font-black text-xs px-2.5 py-1 rounded inline-block">T13</span>
              <h4 className="font-bold text-white text-sm mt-2">Từ 13 Tuổi Trở Lên</h4>
              <p className="text-xs text-zinc-400 mt-1">Cấm khán giả dưới 13 tuổi.</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-orange-900/60">
              <span className="bg-orange-600 text-white font-black text-xs px-2.5 py-1 rounded inline-block">T16</span>
              <h4 className="font-bold text-white text-sm mt-2">Từ 16 Tuổi Trở Lên</h4>
              <p className="text-xs text-zinc-400 mt-1">Cấm khán giả dưới 16 tuổi.</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl border border-red-900/60">
              <span className="bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded inline-block">T18</span>
              <h4 className="font-bold text-white text-sm mt-2">Từ 18 Tuổi Trở Lên</h4>
              <p className="text-xs text-zinc-400 mt-1">Cấm khán giả dưới 18 tuổi.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


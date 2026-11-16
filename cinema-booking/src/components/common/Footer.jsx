import { Phone, Mail, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-[#09090D] border-t border-[#2E2E38] text-[#A1A1AA] text-xs mt-auto">
      {/* 1. Cinema Screen Format Badges Bar */}
      <div className="bg-[#121218] border-b border-[#2E2E38] py-3.5">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center items-center gap-6 sm:gap-8 font-black text-xs sm:text-sm tracking-wider text-[#A1A1AA]">
          <span className="hover:text-[#E50914] cursor-pointer transition">IMAX 3D</span>
          <span className="text-[#590D22]">•</span>
          <span className="hover:text-[#E50914] cursor-pointer transition">DOLBY ATMOS</span>
          <span className="text-[#590D22]">•</span>
          <span className="hover:text-[#E50914] cursor-pointer transition">STARIUM</span>
          <span className="text-[#590D22]">•</span>
          <span className="hover:text-[#E50914] cursor-pointer transition">GOLD CLASS</span>
          <span className="text-[#590D22]">•</span>
          <span className="hover:text-[#E50914] cursor-pointer transition">LASER 2D</span>
          <span className="text-[#590D22]">•</span>
          <span className="hover:text-[#E50914] cursor-pointer transition">SWEETBOX</span>
        </div>
      </div>

      {/* 2. Footer Info Columns */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-extrabold text-sm text-[#F8FAFC] uppercase mb-3 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#E50914] rounded-sm inline-block" />
            Giới thiệu UTE Cinema
          </h4>
          <ul className="space-y-2 text-[#A1A1AA]">
            <li><a href="#" className="hover:text-[#E50914] transition">Về Chúng Tôi</a></li>
            <li><a href="#" className="hover:text-[#E50914] transition">Hệ Thống Rạp Chiếu</a></li>
            <li><a href="#" className="hover:text-[#E50914] transition">Tuyển Dụng Nhân Viên</a></li>
            <li><a href="#" className="hover:text-[#E50914] transition">Liên Hệ Hợp Tác</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-extrabold text-sm text-[#F8FAFC] uppercase mb-3 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#E50914] rounded-sm inline-block" />
            Quy Định & Điều Khoản
          </h4>
          <ul className="space-y-2 text-[#A1A1AA]">
            <li><a href="#" className="hover:text-[#E50914] transition">Điều Khoản Chung</a></li>
            <li><a href="#" className="hover:text-[#E50914] transition">Điều Khoản Giao Dịch</a></li>
            <li><a href="#" className="hover:text-[#E50914] transition">Chính Sách Thanh Toán</a></li>
            <li><a href="#" className="hover:text-[#E50914] transition">Chính Sách Bảo Mật</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-extrabold text-sm text-[#F8FAFC] uppercase mb-3 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#E50914] rounded-sm inline-block" />
            Hỗ Trợ Khách Hàng
          </h4>
          <div className="space-y-2 text-[#A1A1AA]">
            <p className="flex items-center gap-2 text-white font-semibold">
              <Phone className="w-4 h-4 text-[#E50914]" /> Hotline: 1900 2321
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#E50914]" /> cskh@utecinema.vn
            </p>
            <p className="text-[#71717A] text-[11px] mt-2">Giờ làm việc: 8:00 - 22:00 (Tất cả các ngày trong tuần)</p>
          </div>
        </div>

        <div>
          <h4 className="font-extrabold text-sm text-[#F8FAFC] uppercase mb-3 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-[#E50914] rounded-sm inline-block" />
            Bảo Mật & Chứng Nhận
          </h4>
          <div className="flex items-center gap-2 text-[#A1A1AA] mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Thanh toán an toàn 100% qua MoMo, VNPay & Thẻ</span>
          </div>
          <p className="text-[#71717A] text-[11px] leading-relaxed">
            Hệ thống bán vé trực tuyến mã hóa SSL/TLS & Vé điện tử QR code đồng bộ chống trùng vé.
          </p>
        </div>
      </div>

      {/* 3. Bottom Copyright Bar */}
      <div className="bg-[#050508] border-t border-[#1B1B23] py-4 text-center text-[#71717A] text-[11px]">
        <p>© 2026 UTE Cinema System. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

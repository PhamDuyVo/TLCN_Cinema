import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Copy, Check, Ticket, Sparkles, Gift, Clock, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PromotionsPage() {
  const [filter, setFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const vouchers = [
    {
      code: 'CHAOBANMOI',
      title: 'Chào Bạn Mới - Giảm 20.000đ',
      discount: 'Giảm 20.000 VNĐ',
      minSpend: 'Đơn từ 80.000đ',
      expiry: 'Hạn dùng: 31/12/2026',
      badge: 'HOT NHẤT',
      badgeColor: 'bg-red-600',
      description: 'Dành riêng cho khách hàng lần đầu đặt vé tại UTE Cinema. Áp dụng cho mọi suất chiếu 2D và 3D.',
      category: 'voucher',
    },
    {
      code: 'VIP20',
      title: 'Ưu Đãi Thành Viên - Giảm 20%',
      discount: 'Giảm 20% (Tối đa 50k)',
      minSpend: 'Đơn từ 100.000đ',
      expiry: 'Hạn dùng: 31/12/2026',
      badge: 'THÀNH VIÊN',
      badgeColor: 'bg-amber-600',
      description: 'Giảm 20% tổng đơn hàng vé và bắp nước khi đặt vé trực tuyến. Áp dụng các ngày trong tuần.',
      category: 'voucher',
    },
    {
      code: 'GIAM30K',
      title: 'Siêu Hội Xem Phim - Giảm 30.000đ',
      discount: 'Giảm 30.000 VNĐ',
      minSpend: 'Đơn từ 150.000đ',
      expiry: 'Hạn dùng: 31/12/2026',
      badge: 'TIẾT KIỆM',
      badgeColor: 'bg-purple-600',
      description: 'Mã ưu đãi đặc biệt cho nhóm bạn và gia đình khi đặt từ 2 vé trở lên kèm combo bắp nước.',
      category: 'voucher',
    },
  ];

  const programs = [
    {
      id: 'c-student',
      title: "C'STUDENT - Đồng Giá 45.000đ Học Sinh Sinh Viên",
      subtitle: 'Áp dụng cho Học sinh - Sinh viên & Giới trẻ dưới 22 tuổi',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
      category: 'ticket',
      tag: 'HSSV & U22',
      details: [
        'Đồng giá vé 2D chỉ 45.000 VNĐ từ Thứ 2 đến Thứ 6.',
        'Xuất trình thẻ Học sinh / Sinh viên hoặc CCCD dưới 22 tuổi khi nhận vé tại quầy.',
        'Mỗi thẻ được áp dụng 01 vé/ngày.',
        'Không áp dụng cho ngày Lễ, Tết hoặc các suất chiếu sớm đặc biệt.',
      ],
    },
    {
      id: 'c-wednesday',
      title: "C'WEDNESDAY - Thứ 4 Vui Vẻ Đồng Giá 50.000đ",
      subtitle: 'Ngày vàng xem phim - Đồng giá cho tất cả mọi người',
      image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
      category: 'ticket',
      tag: 'THỨ 4 HÀNG TUẦN',
      details: [
        'Vé 2D chỉ 50.000 VNĐ cho tất cả các suất chiếu vào ngày Thứ Tư hàng tuần.',
        'Áp dụng cho cả khách hàng thành viên và khách vãng lai.',
        'Áp dụng cho mọi cụm rạp trong hệ thống UTE Cinema toàn quốc.',
        'Không áp dụng vào các ngày Thứ 4 trùng với Lễ, Tết.',
      ],
    },
    {
      id: 'combo-popcorn',
      title: 'Combo Bắp Nước Siêu Tiết Kiệm - Giảm Đến 25%',
      subtitle: 'Bắp rang bơ nóng hổi thơm ngon cùng nước ngọt mát lạnh',
      image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=800&q=80',
      category: 'combo',
      tag: 'COMBO F&B',
      details: [
        'Giảm trực tiếp 20% - 25% khi mua kèm combo bắp nước trong bước đặt vé trực tuyến.',
        'Combo Đôi: 1 Bắp Rang Bơ khổng lồ (vị Caramel / Phô mai) + 2 Pepsi lạnh 32oz chỉ 99.000đ.',
        'Được làm mới và nhận ngay tại quầy Concession trước giờ chiếu.',
      ],
    },
    {
      id: 'member-club',
      title: 'C’MEMBER CLUB - Tích Điểm Đổi Vé Miễn Phí',
      subtitle: 'Quyền lợi độc quyền cho thành viên UTE Cinema',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      category: 'member',
      tag: 'THÀNH VIÊN',
      details: [
        'Tích lũy 5% đến 10% giá trị mọi đơn hàng vé và bắp nước vào tài khoản thành viên.',
        'Tặng ngay 01 vé xem phim 2D miễn phí và 01 combo bắp nước nhân dịp sinh nhật.',
        'Nhận thông báo và được quyền ưu tiên đặt vé các bom tấn Hollywood trước 48h.',
      ],
    },
  ];

  const filteredPrograms = filter === 'all'
    ? programs
    : programs.filter((p) => p.category === filter);

  return (
    <div className="bg-[#121212] min-h-screen text-zinc-100 pb-20">
      {/* 1. Header Hero Banner */}
      <div className="relative bg-gradient-to-r from-red-950 via-zinc-900 to-black border-b border-zinc-800 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> UTE Cinema Promotion Center
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide uppercase">
            Ưu Đãi & Khuyến Mãi <span className="text-red-500">Đặc Quyền</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base">
            Khám phá những chương trình ưu đãi vé xem phim cực hot, voucher giảm giá trực tiếp và combo bắp nước hấp dẫn chỉ có tại UTE Cinema!
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10 space-y-12">
        {/* 2. Voucher Codes Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-black tracking-wide uppercase text-white">Mã Giảm Giá Trực Tuyến</h2>
            </div>
            <span className="text-xs text-zinc-500">Nhập mã tại bước thanh toán để được giảm</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {vouchers.map((v) => (
              <div
                key={v.code}
                className="relative bg-gradient-to-b from-[#1c1c1c] to-[#141414] border border-zinc-800 hover:border-red-500/50 rounded-2xl p-6 transition-all shadow-xl group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full text-white ${v.badgeColor}`}>
                      {v.badge}
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {v.expiry}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white mb-1 group-hover:text-red-400 transition">
                    {v.title}
                  </h3>
                  <p className="text-2xl font-black text-amber-400 mb-2">{v.discount}</p>
                  <p className="text-xs text-zinc-400 mb-4">{v.description}</p>
                  <div className="text-[11px] text-zinc-500 mb-4 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Điều kiện: {v.minSpend}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center gap-2 bg-[#0d0d0d] p-2 rounded-xl border border-dashed border-zinc-700">
                    <div className="flex-1 font-mono font-black text-red-400 text-center tracking-widest text-sm">
                      {v.code}
                    </div>
                    <button
                      onClick={() => copyToClipboard(v.code)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode === v.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" /> Đã sao chép!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Sao chép
                        </>
                      )}
                    </button>
                  </div>
                  <Link
                    to="/showtimes"
                    className="mt-3 block text-center text-xs font-bold text-zinc-400 hover:text-white transition"
                  >
                    Dùng mã ngay tại lịch chiếu &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Filter Categories Tabs */}
        <section className="pt-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Ticket className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-black tracking-wide uppercase text-white">Chương Trình Khuyến Mãi</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'all', label: 'Tất Cả' },
                { id: 'ticket', label: 'Giá Vé Ưu Đãi' },
                { id: 'combo', label: 'Bắp Nước' },
                { id: 'member', label: 'Thành Viên' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
                    filter === t.id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Program Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredPrograms.map((item) => (
              <div
                key={item.id}
                className="bg-[#181818] border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition flex flex-col justify-between"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white text-[11px] font-black uppercase px-3 py-1 rounded-full">
                    {item.tag}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-400 mb-4">{item.subtitle}</p>
                    <ul className="space-y-1.5 text-xs text-zinc-400 mb-6">
                      {item.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Áp dụng trên toàn hệ thống</span>
                    <Link
                      to="/showtimes"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5"
                    >
                      Đặt Vé Ngay <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Bottom Support Notice */}
        <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-6 text-center text-xs text-zinc-400">
          <p className="font-semibold text-zinc-300 mb-1">Cần hỗ trợ về mã giảm giá hoặc chương trình ưu đãi?</p>
          <p>
            Vui lòng liên hệ Tổng đài CSKH: <strong className="text-red-500">1900 2321</strong> (8:00 - 22:00) hoặc gửi email đến{' '}
            <strong className="text-red-500">cskh@utecinema.vn</strong> để được hướng dẫn chi tiết.
          </p>
        </div>
      </div>
    </div>
  );
}


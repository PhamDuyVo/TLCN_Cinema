import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Copy, Check, Ticket, Sparkles, Gift, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

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
      code: 'UTECINEMA20',
      title: 'Chào Bạn Mới - Giảm 20.000đ',
      discount: 'Giảm 20.000 VNĐ',
      minSpend: 'Đơn từ 80.000đ',
      expiry: 'Hạn dùng: 31/12/2026',
      badge: 'HOT NHẤT',
      badgeColor: 'bg-[#E50914] text-white',
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
      badgeColor: 'bg-[#881337] text-white',
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
      badgeColor: 'bg-[#C24132] text-white',
      description: 'Mã ưu đãi đặc biệt cho nhóm bạn và gia đình khi đặt từ 2 vé trở lên kèm combo bắp nước.',
      category: 'voucher',
    },
  ];

  const programs = [
    {
      id: 'c-student',
      title: "UTE STUDENT - Đồng Giá 45.000đ Học Sinh Sinh Viên",
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
      title: "UTE WEDNESDAY - Thứ 4 Vui Vẻ Đồng Giá 50.000đ",
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
      title: 'UTE MEMBER CLUB - Tích Điểm Đổi Vé Miễn Phí',
      subtitle: 'Quyền lợi độc quyền cho thành viên UTE Cinema',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      category: 'member',
      tag: 'THÀNH VIÊN',
      details: [
        'Tích lũy 5% - 10% điểm thưởng trên mọi giao dịch mua vé và combo bắp nước.',
        'Tặng vé xem phim miễn phí vào tháng sinh nhật thành viên.',
        'Ưu tiên đặt vé sớm cho các siêu bom tấn chiếu rạp.',
      ],
    },
  ];

  const filteredPrograms = filter === 'all' ? programs : programs.filter((p) => p.category === filter);

  return (
    <main className="min-h-screen text-[#F8FAFC] pb-20">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-b from-[#121218] to-transparent border-b border-[#2E2E38] py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-3">
          <span className="text-[#E50914] text-xs font-black tracking-widest uppercase inline-flex items-center gap-1.5 bg-[#E50914]/10 px-3.5 py-1 rounded-full border border-[#E50914]/30">
            <Sparkles className="w-4 h-4 text-[#E50914]" /> ƯU ĐÃI ĐẶC BIỆT
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide uppercase">
            Ưu Đãi & Khuyến Mãi <span className="text-[#E50914]">Đặc Quyền</span>
          </h1>
          <p className="text-[#A1A1AA] max-w-2xl mx-auto text-sm md:text-base">
            Khám phá những chương trình ưu đãi vé xem phim cực hot, voucher giảm giá trực tiếp và combo bắp nước hấp dẫn tại UTE Cinema!
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10 space-y-12">
        {/* 2. Voucher Codes Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-[#E50914]" />
              <h2 className="text-2xl font-black tracking-wide uppercase text-white">Mã Giảm Giá Trực Tuyến</h2>
            </div>
            <span className="text-xs text-[#A1A1AA]">Nhập mã tại bước thanh toán để được giảm</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {vouchers.map((v) => (
              <div
                key={v.code}
                className="relative bg-[#1B1B23] border border-[#2E2E38] hover:border-[#E50914]/80 rounded-2xl p-6 transition-all shadow-2xl group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${v.badgeColor}`}>
                      {v.badge}
                    </span>
                    <span className="text-xs text-[#A1A1AA] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#E50914]" /> {v.expiry}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white mb-1 group-hover:text-[#E50914] transition">
                    {v.title}
                  </h3>
                  <p className="text-2xl font-black text-[#E50914] mb-2">{v.discount}</p>
                  <p className="text-xs text-zinc-300 mb-4">{v.description}</p>
                  <div className="text-[11px] text-[#A1A1AA] mb-4 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Điều kiện: {v.minSpend}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2E2E38]">
                  <div className="flex items-center gap-2 bg-[#121218] p-2 rounded-xl border border-dashed border-[#2E2E38]">
                    <div className="flex-1 font-mono font-black text-[#E50914] text-center tracking-widest text-sm">
                      {v.code}
                    </div>
                    <button
                      onClick={() => copyToClipboard(v.code)}
                      className="px-3.5 py-1.5 bg-[#E50914] hover:bg-[#C24132] text-white text-xs font-black rounded-lg transition flex items-center gap-1 cursor-pointer shadow"
                    >
                      {copiedCode === v.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" /> Đã chép!
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
                    className="mt-3 block text-center text-xs font-bold text-rose-300 hover:text-white transition"
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
            <h2 className="text-2xl font-black tracking-wide uppercase text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#E50914]" /> Chương Trình Khuyến Mãi
            </h2>

            <div className="flex items-center gap-2 bg-[#121218] p-1 rounded-xl border border-[#2E2E38]">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'ticket', label: 'Ưu đãi Vé' },
                { id: 'combo', label: 'Bắp Nước' },
                { id: 'member', label: 'Thành viên' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    filter === tab.id
                      ? 'bg-[#E50914] text-white shadow-md'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {filteredPrograms.map((p) => (
              <div
                key={p.id}
                className="bg-[#1B1B23] border border-[#2E2E38] hover:border-[#E50914]/70 rounded-2xl overflow-hidden shadow-2xl transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-[#881337] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow">
                      {p.tag}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-black text-white leading-snug">{p.title}</h3>
                    <p className="text-xs text-[#E50914] mt-1 font-semibold">{p.subtitle}</p>

                    <div className="mt-4 space-y-2 border-t border-[#2E2E38] pt-4">
                      {p.details.map((d, idx) => (
                        <p key={idx} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                          <span className="text-[#E50914] font-bold">•</span>
                          <span>{d}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    to="/showtimes"
                    className="w-full bg-[#E50914] hover:bg-[#C24132] text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-red-900/30 cursor-pointer"
                  >
                    <span>ĐẶT VÉ VÀ HƯỞNG ƯU ĐÃI</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

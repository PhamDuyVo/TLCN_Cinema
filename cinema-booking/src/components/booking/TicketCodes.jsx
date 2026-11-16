import { QRCodeSVG } from 'qrcode.react';
export default function TicketCodes({ booking }) {
  if (!['PAID', 'CHECKED_IN'].includes(booking.status?.toUpperCase())) return <p className="text-amber-400 mt-4">QR vào rạp chỉ khả dụng sau khi thanh toán được xác nhận.</p>;
  return <div className="flex flex-wrap gap-4 mt-4">{(booking.tickets || []).map(ticket => <div key={ticket.id || ticket.ticketCode} className="bg-white text-black rounded-lg p-4 text-center">
    <p className="font-bold mb-2">Ghế {ticket.seatNumber}</p>
    {ticket.qrPayload && ticket.status?.toUpperCase() === 'PAID' ? <QRCodeSVG value={ticket.qrPayload} size={160} marginSize={4} title={`QR vé ghế ${ticket.seatNumber}`} /> : <p>{ticket.status?.toUpperCase() === 'CHECKED_IN' ? 'Vé đã sử dụng' : 'QR chưa khả dụng'}</p>}
    <p className="text-xs mt-2 break-all">{ticket.ticketCode}</p>
  </div>)}</div>;
}

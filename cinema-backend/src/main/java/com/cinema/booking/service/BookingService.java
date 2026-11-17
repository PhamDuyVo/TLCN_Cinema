package com.cinema.booking.service;

import com.cinema.booking.dto.BookingDtos.*;
import com.cinema.booking.dto.PaymentDtos.PayPalOrderResponse;
import com.cinema.booking.dto.SeatStatusEvent;
import com.cinema.booking.entity.*;
import com.cinema.booking.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FoodComboRepository foodComboRepository;
    private final PromotionRepository promotionRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final TicketRepository ticketRepository;
    private final HoldService holds;
    private final PayPalService payPalService;
    private final ApplicationEventPublisher eventPublisher;

    private record Priced(Showtime show, List<Seat> seats, List<BookingCombo> combos, Promotion promo, QuoteDto quote) {}

    private Priced price(Long user, CreateBookingRequest r) {
        HoldService.requireUser(user);
        Showtime show = holds.lock(r.getShowtimeId());
        holds.bookable(show);
        List<Seat> seats = holds.validateSeats(show, r.getSeatIds(), false);
        LocalDateTime deadline = holds.verify(show.getId(), user, r.getSeatIds());

        BigDecimal seatAmount = seats.stream()
                .map(s -> show.getBasePrice().add(s.getSeatType().getSurcharge()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal comboAmount = BigDecimal.ZERO;
        List<BookingCombo> combos = new ArrayList<>();
        Set<Long> seen = new HashSet<>();

        if (r.getCombos() != null) {
            for (ComboItemRequest item : r.getCombos()) {
                if (item == null || item.getComboId() == null || item.getQuantity() == null
                        || item.getQuantity() < 1 || item.getQuantity() > 99 || !seen.add(item.getComboId())) {
                    throw new IllegalArgumentException("Invalid or duplicate combo quantity (1-99 required)");
                }
                FoodCombo combo = foodComboRepository.findById(item.getComboId())
                        .orElseThrow(() -> new IllegalArgumentException("Combo not found"));
                if (!"active".equalsIgnoreCase(combo.getStatus()) || !Boolean.TRUE.equals(foodComboRepository.isAvailable(combo.getId()))) {
                    throw new IllegalArgumentException("Combo unavailable");
                }
                comboAmount = comboAmount.add(combo.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                combos.add(BookingCombo.builder().combo(combo).quantity(item.getQuantity()).unitPrice(combo.getPrice()).build());
            }
        }

        BigDecimal total = seatAmount.add(comboAmount);
        BigDecimal discount = BigDecimal.ZERO;
        Promotion promo = null;

        if (r.getPromotionCode() != null && !r.getPromotionCode().isBlank()) {
            promo = promotionRepository.lockByCode(r.getPromotionCode().trim().toUpperCase(Locale.ROOT))
                    .orElseThrow(() -> new IllegalArgumentException("Voucher not found"));
            discount = PromotionService.calculate(promo, total, LocalDateTime.now());
        }

        String method = r.getPaymentMethod() != null ? r.getPaymentMethod().trim().toUpperCase(Locale.ROOT) : "PAY_AT_COUNTER";
        return new Priced(show, seats, combos, promo, new QuoteDto(seatAmount, comboAmount, total, discount, total.subtract(discount), deadline, method));
    }

    public QuoteDto quote(Long user, CreateBookingRequest r) {
        return price(user, r).quote();
    }

    public BookingDetailDto createBooking(Long user, CreateBookingRequest r) {
        String method = r.getPaymentMethod() != null ? r.getPaymentMethod().trim().toUpperCase(Locale.ROOT) : "PAY_AT_COUNTER";
        if (!"PAY_AT_COUNTER".equals(method) && !"PAYPAL".equals(method)) {
            throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ: " + r.getPaymentMethod());
        }

        Priced p = price(user, r);
        QuoteDto q = p.quote();

        LocalDateTime expiresAt = "PAYPAL".equals(method)
                ? LocalDateTime.now().plusMinutes(15)
                : p.show().getStartTime();

        Booking b = Booking.builder()
                .bookingCode("BK" + UUID.randomUUID().toString().replace("-", "").substring(0, 18))
                .userId(user)
                .showtime(p.show())
                .promotion(p.promo())
                .customerName(r.getCustomerName())
                .customerEmail(r.getCustomerEmail())
                .customerPhone(r.getCustomerPhone())
                .seatAmount(q.seatAmount())
                .comboAmount(q.comboAmount())
                .discountAmount(q.discountAmount())
                .finalAmount(q.finalAmount())
                .paymentMethod(method)
                .status("pending_payment")
                .expiresAt(expiresAt)
                .build();

        for (Seat seat : p.seats()) {
            b.getTickets().add(Ticket.builder()
                    .booking(b)
                    .seat(seat)
                    .showtimeId(p.show().getId())
                    .ticketCode(UUID.randomUUID().toString())
                    .price(p.show().getBasePrice().add(seat.getSeatType().getSurcharge()))
                    .status("valid")
                    .build());
        }

        for (BookingCombo combo : p.combos()) {
            combo.setBooking(b);
            b.getCombos().add(combo);
        }

        // Recheck the deadline after pricing/locking the voucher
        holds.verify(p.show().getId(), user, r.getSeatIds());

        if (p.promo() != null) {
            p.promo().setUsedCount(p.promo().getUsedCount() + 1);
            promotionRepository.save(p.promo());
        }

        bookingRepository.saveAndFlush(b);
        holds.consume(p.show().getId(), user);

        String paymentUrl = null;
        if ("PAYPAL".equals(method)) {
            try {
                PayPalOrderResponse orderRes = payPalService.createOrder(user, b.getBookingCode());
                paymentUrl = orderRes.getApproveUrl();
            } catch (Exception e) {
                log.error("Lỗi khi tạo PayPal Order cho đơn {}: {}", b.getBookingCode(), e.getMessage());
                // Không throw lỗi làm roll-back booking, người dùng vẫn có thể thử thanh toán lại
            }
        }

        return mapToDetailDto(b, paymentUrl);
    }

    /**
     * Hủy đơn đặt vé của người dùng (kèm hoàn tiền qua PayPal nếu đơn đã thanh toán).
     */
    public BookingDetailDto cancelBooking(Long user, String code) {
        HoldService.requireUser(user);

        Booking booking = bookingRepository.findByBookingCode(code)
                .filter(b -> user.equals(b.getUserId()))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt vé: " + code));

        String status = booking.getStatus().toUpperCase(Locale.ROOT);
        if ("CANCELLED".equals(status) || "EXPIRED".equals(status) || "REFUNDED".equals(status)) {
            throw new IllegalArgumentException("Đơn đặt vé này đã bị hủy hoặc hết hạn trước đó");
        }

        // Kiểm tra xem đã có vé nào soát vào rạp (checked in / used) chưa
        boolean hasUsedTickets = booking.getTickets().stream()
                .anyMatch(t -> "used".equalsIgnoreCase(t.getStatus()));
        if (hasUsedTickets) {
            throw new IllegalArgumentException("Vé trong đơn này đã được soát vào rạp, không thể hủy");
        }

        // Kiểm tra thời gian: Chỉ được hủy trước giờ chiếu ít nhất 60 phút
        if (booking.getShowtime() != null) {
            LocalDateTime startTime = booking.getShowtime().getStartTime();
            if (LocalDateTime.now().isAfter(startTime.minusMinutes(60))) {
                throw new IllegalArgumentException("Chỉ có thể hủy vé trước giờ chiếu ít nhất 60 phút");
            }
        }

        // Nếu đã thanh toán bằng PayPal -> Gọi hoàn tiền qua PayPal API
        if ("PAID".equalsIgnoreCase(status) && "PAYPAL".equalsIgnoreCase(booking.getPaymentMethod())) {
            log.info("Cancelling PAID PayPal booking {}. Initiating refund...", booking.getBookingCode());
            payPalService.refundOrder(booking, "Khách hàng yêu cầu hủy vé: " + booking.getBookingCode());
            // Trạng thái đã được cập nhật bên trong refundOrder
            Booking updated = bookingRepository.findById(booking.getId()).orElse(booking);
            return mapToDetailDto(updated, null);
        }

        // Nếu là đơn chưa thanh toán (pending_payment) hoặc thanh toán tại quầy
        booking.setStatus("CANCELLED");

        // Hủy trạng thái các vé
        List<Long> seatIds = new ArrayList<>();
        if (booking.getTickets() != null) {
            for (Ticket ticket : booking.getTickets()) {
                ticket.setStatus("cancelled");
                ticketRepository.save(ticket);
                if (ticket.getSeat() != null) {
                    seatIds.add(ticket.getSeat().getId());
                }
            }
        }

        // Nhả ghế về available
        if (booking.getShowtime() != null && !seatIds.isEmpty()) {
            Long showtimeId = booking.getShowtime().getId();
            List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeId(showtimeId);
            for (ShowtimeSeat ss : seats) {
                if (seatIds.contains(ss.getSeatId())) {
                    ss.setStatus("available");
                    ss.setHeldByUserId(null);
                    ss.setHoldExpiresAt(null);
                    showtimeSeatRepository.save(ss);
                }
            }

            // Phát WebSocket broadcast trả ghế trống
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new SeatStatusEvent(showtimeId, seatIds, "AVAILABLE", null, null));
            }
        }

        // Hoàn trả lượt sử dụng voucher nếu có
        if (booking.getPromotion() != null) {
            Promotion promo = booking.getPromotion();
            promo.setUsedCount(Math.max(0, promo.getUsedCount() - 1));
            promotionRepository.save(promo);
        }

        bookingRepository.save(booking);
        log.info("Cancelled booking successfully: {}", booking.getBookingCode());

        return mapToDetailDto(booking, null);
    }

    public BookingDetailDto getBookingDetail(Long user, String code) {
        HoldService.requireUser(user);
        Booking b = bookingRepository.findByBookingCode(code)
                .filter(x -> user.equals(x.getUserId()))
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        return mapToDetailDto(b, null);
    }

    public List<BookingDetailDto> getMyBookings(Long user) {
        HoldService.requireUser(user);
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user).stream()
                .map(b -> mapToDetailDto(b, null))
                .toList();
    }

    private BookingDetailDto mapToDetailDto(Booking b, String paymentUrl) {
        Showtime s = b.getShowtime();
        List<String> seatNumbers = b.getTickets().stream()
                .map(t -> t.getSeat() != null ? t.getSeat().getSeatNumber() : "")
                .collect(Collectors.toList());

        List<TicketDto> ticketDtos = b.getTickets().stream().map(t -> TicketDto.builder()
                .id(t.getId())
                .ticketCode("paid".equalsIgnoreCase(b.getStatus()) ? t.getTicketCode() : null)
                .seatNumber(t.getSeat() != null ? t.getSeat().getSeatNumber() : "")
                .price(t.getPrice())
                .qrPayload("paid".equalsIgnoreCase(b.getStatus()) ? t.getTicketCode() : null)
                .status("paid".equalsIgnoreCase(b.getStatus())
                        ? ("used".equalsIgnoreCase(t.getStatus()) ? "CHECKED_IN" : "PAID")
                        : ("cancelled".equalsIgnoreCase(t.getStatus()) ? "CANCELLED" : "PENDING_PAYMENT"))
                .build()).collect(Collectors.toList());

        String cinemaName = "";
        String hallName = "";
        if (s.getHall() != null) {
            hallName = s.getHall().getName();
            if (s.getHall().getCinemaId() != null) {
                cinemaName = "UTE Cinema";
            }
        }

        return BookingDetailDto.builder()
                .id(b.getId())
                .bookingCode(b.getBookingCode())
                .movieTitle(s.getMovie() != null ? s.getMovie().getTitle() : "")
                .moviePoster(s.getMovie() != null ? s.getMovie().getPosterUrl() : "")
                .cinemaName(cinemaName)
                .hallName(hallName)
                .showtimeStart(s.getStartTime())
                .seatNumbers(seatNumbers)
                .totalAmount(b.getTotalAmount())
                .discountAmount(b.getDiscountAmount())
                .finalAmount(b.getFinalAmount())
                .paymentMethod(b.getPaymentMethod())
                .status(b.getStatus().toUpperCase(Locale.ROOT))
                .paymentUrl(paymentUrl)
                .expiresAt(b.getExpiresAt())
                .tickets(ticketDtos)
                .createdAt(b.getCreatedAt())
                .build();
    }
}

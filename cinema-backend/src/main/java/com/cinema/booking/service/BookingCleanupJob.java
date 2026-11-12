package com.cinema.booking.service;

import com.cinema.booking.dto.SeatStatusEvent;
import com.cinema.booking.entity.Booking;
import com.cinema.booking.entity.Promotion;
import com.cinema.booking.entity.ShowtimeSeat;
import com.cinema.booking.entity.Ticket;
import com.cinema.booking.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingCleanupJob {

    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final HoldSessionRepository holdSessionRepository;
    private final BookingRepository bookingRepository;
    private final PromotionRepository promotionRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Chạy định kỳ mỗi 60 giây để quét các phiên giữ ghế quá hạn và đơn hàng chưa thanh toán quá 5 phút.
     */
    @Scheduled(fixedDelayString = "${app.booking.cleanup-interval-ms:60000}")
    @Transactional
    public void runCleanup() {
        LocalDateTime now = LocalDateTime.now();
        cleanupExpiredHolds(now);
        cleanupExpiredBookings(now);
    }

    /**
     * Quét và giải phóng các ghế giữ tạm (HOLDING) quá hạn (TTL 300s).
     */
    public void cleanupExpiredHolds(LocalDateTime now) {
        try {
            List<ShowtimeSeat> expiredSeats = showtimeSeatRepository.findByStatusAndHoldExpiresAtBefore("held", now);
            if (expiredSeats.isEmpty()) {
                return;
            }

            Map<Long, List<Long>> showtimeToSeatIds = new HashMap<>();
            for (ShowtimeSeat seat : expiredSeats) {
                seat.setStatus("available");
                seat.setHeldByUserId(null);
                seat.setHoldExpiresAt(null);
                showtimeSeatRepository.save(seat);
                showtimeToSeatIds.computeIfAbsent(seat.getShowtimeId(), k -> new ArrayList<>()).add(seat.getSeatId());
            }

            holdSessionRepository.deleteByExpiresAtBefore(now);

            // Broadcast trạng thái AVAILABLE qua WebSocket cho từng suất chiếu
            for (Map.Entry<Long, List<Long>> entry : showtimeToSeatIds.entrySet()) {
                if (eventPublisher != null) {
                    eventPublisher.publishEvent(new SeatStatusEvent(entry.getKey(), entry.getValue(), "AVAILABLE", null, null));
                }
            }
            log.info("Đã giải phóng {} ghế giữ tạm hết hạn", expiredSeats.size());
        } catch (Exception e) {
            log.error("Lỗi khi quét ghế giữ tạm hết hạn: {}", e.getMessage(), e);
        }
    }

    /**
     * Quét và hủy các đơn hàng chưa thanh toán quá hạn (expiresAt < now), hoàn trả lượt voucher và ghế.
     */
    public void cleanupExpiredBookings(LocalDateTime now) {
        try {
            List<Booking> expiredBookings = bookingRepository.findByStatusInAndExpiresAtBefore(
                    List.of("pending_payment", "PENDING"), now);

            if (expiredBookings.isEmpty()) {
                return;
            }

            for (Booking booking : expiredBookings) {
                booking.setStatus("EXPIRED");

                // Hủy trạng thái các vé trong đơn
                if (booking.getTickets() != null) {
                    for (Ticket ticket : booking.getTickets()) {
                        ticket.setStatus("cancelled");
                    }
                }

                // Hoàn trả lượt sử dụng voucher nếu có
                if (booking.getPromotion() != null) {
                    Promotion promo = booking.getPromotion();
                    promo.setUsedCount(Math.max(0, promo.getUsedCount() - 1));
                    promotionRepository.save(promo);
                }

                // Thu hồi và nhả ghế cho suất chiếu
                if (booking.getShowtime() != null && booking.getTickets() != null) {
                    Long showtimeId = booking.getShowtime().getId();
                    List<Long> seatIds = booking.getTickets().stream()
                            .filter(t -> t.getSeat() != null)
                            .map(t -> t.getSeat().getId())
                            .collect(Collectors.toList());

                    if (!seatIds.isEmpty()) {
                        List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeId(showtimeId);
                        for (ShowtimeSeat ss : seats) {
                            if (seatIds.contains(ss.getSeatId()) && !"booked".equalsIgnoreCase(ss.getStatus())) {
                                ss.setStatus("available");
                                ss.setHeldByUserId(null);
                                ss.setHoldExpiresAt(null);
                                showtimeSeatRepository.save(ss);
                            }
                        }
                        if (eventPublisher != null) {
                            eventPublisher.publishEvent(new SeatStatusEvent(showtimeId, seatIds, "AVAILABLE", null, null));
                        }
                    }
                }

                bookingRepository.save(booking);
                log.info("Đã hủy đơn hàng hết hạn: {}", booking.getBookingCode());
            }
        } catch (Exception e) {
            log.error("Lỗi khi quét đơn hàng hết hạn: {}", e.getMessage(), e);
        }
    }
}

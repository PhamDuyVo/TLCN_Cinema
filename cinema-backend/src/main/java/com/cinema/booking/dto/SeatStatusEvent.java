package com.cinema.booking.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Event phát ra khi có sự thay đổi trạng thái ghế trong giao dịch (giữ ghế, hủy giữ, hoàn tất đặt vé).
 */
public record SeatStatusEvent(
        Long showtimeId,
        List<Long> seatIds,
        String status, // "AVAILABLE", "HOLDING", "BOOKED"
        Long heldByUserId,
        LocalDateTime expiresAt
) {}

package com.cinema.booking.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatStatusMessage {
    private Long showtimeId;
    private List<Long> seatIds;
    /**
     * Trạng thái ghế: "AVAILABLE", "HOLDING", "BOOKED"
     */
    private String status;
    private Long heldByUserId;
    private LocalDateTime expiresAt;
    private LocalDateTime timestamp;
}

package com.cinema.booking.service;

import com.cinema.booking.dto.SeatStatusEvent;
import com.cinema.booking.dto.SeatStatusMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class SeatStatusEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleSeatStatusChanged(SeatStatusEvent event) {
        if (event == null || event.seatIds() == null || event.seatIds().isEmpty()) {
            return;
        }

        try {
            SeatStatusMessage message = SeatStatusMessage.builder()
                    .showtimeId(event.showtimeId())
                    .seatIds(event.seatIds())
                    .status(event.status())
                    .heldByUserId(event.heldByUserId())
                    .expiresAt(event.expiresAt())
                    .timestamp(LocalDateTime.now())
                    .build();

            // 1. Broadcast tới topic chung theo đặc tả yêu cầu: /topic/seat-status
            messagingTemplate.convertAndSend("/topic/seat-status", message);

            // 2. Broadcast tới topic theo từng suất chiếu để tối ưu băng thông: /topic/seat-status/{showtimeId}
            messagingTemplate.convertAndSend("/topic/seat-status/" + event.showtimeId(), message);

            log.info("WebSocket broadcast seat status {} for showtime {} seats {}",
                    event.status(), event.showtimeId(), event.seatIds());
        } catch (Exception e) {
            log.error("Lỗi khi gửi WebSocket broadcast trạng thái ghế: {}", e.getMessage(), e);
        }
    }
}

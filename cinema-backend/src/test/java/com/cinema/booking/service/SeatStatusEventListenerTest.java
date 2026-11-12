package com.cinema.booking.service;

import com.cinema.booking.dto.SeatStatusEvent;
import com.cinema.booking.dto.SeatStatusMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class SeatStatusEventListenerTest {

    private final SimpMessagingTemplate messagingTemplate = mock(SimpMessagingTemplate.class);
    private final SeatStatusEventListener listener = new SeatStatusEventListener(messagingTemplate);

    @Test
    void broadcastsToBothGlobalAndShowtimeTopics() {
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);
        SeatStatusEvent event = new SeatStatusEvent(101L, List.of(1L, 2L), "HOLDING", 99L, expiresAt);

        listener.handleSeatStatusChanged(event);

        ArgumentCaptor<SeatStatusMessage> captor = ArgumentCaptor.forClass(SeatStatusMessage.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/seat-status"), captor.capture());
        verify(messagingTemplate).convertAndSend(eq("/topic/seat-status/101"), captor.capture());

        SeatStatusMessage msg = captor.getValue();
        assertEquals(101L, msg.getShowtimeId());
        assertEquals(List.of(1L, 2L), msg.getSeatIds());
        assertEquals("HOLDING", msg.getStatus());
        assertEquals(99L, msg.getHeldByUserId());
        assertEquals(expiresAt, msg.getExpiresAt());
        assertNotNull(msg.getTimestamp());
    }

    @Test
    void ignoresEmptyOrNullEventGracefully() {
        listener.handleSeatStatusChanged(null);
        listener.handleSeatStatusChanged(new SeatStatusEvent(101L, List.of(), "AVAILABLE", null, null));
        listener.handleSeatStatusChanged(new SeatStatusEvent(101L, null, "AVAILABLE", null, null));

        verifyNoInteractions(messagingTemplate);
    }
}

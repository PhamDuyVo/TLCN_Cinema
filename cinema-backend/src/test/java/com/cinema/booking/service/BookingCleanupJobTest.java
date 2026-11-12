package com.cinema.booking.service;

import com.cinema.booking.dto.SeatStatusEvent;
import com.cinema.booking.entity.Booking;
import com.cinema.booking.entity.Promotion;
import com.cinema.booking.entity.ShowtimeSeat;
import com.cinema.booking.entity.Ticket;
import com.cinema.booking.repository.BookingRepository;
import com.cinema.booking.repository.HoldSessionRepository;
import com.cinema.booking.repository.PromotionRepository;
import com.cinema.booking.repository.ShowtimeSeatRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class BookingCleanupJobTest {

    private final ShowtimeSeatRepository showtimeSeatRepo = mock(ShowtimeSeatRepository.class);
    private final HoldSessionRepository holdSessionRepo = mock(HoldSessionRepository.class);
    private final BookingRepository bookingRepo = mock(BookingRepository.class);
    private final PromotionRepository promoRepo = mock(PromotionRepository.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);

    private final BookingCleanupJob job = new BookingCleanupJob(
            showtimeSeatRepo, holdSessionRepo, bookingRepo, promoRepo, eventPublisher);

    @Test
    void releasesExpiredHoldsAndBroadcastsAvailable() {
        LocalDateTime now = LocalDateTime.now();
        ShowtimeSeat seat1 = ShowtimeSeat.builder().showtimeId(10L).seatId(1L).status("held").heldByUserId(99L).build();
        ShowtimeSeat seat2 = ShowtimeSeat.builder().showtimeId(10L).seatId(2L).status("held").heldByUserId(99L).build();

        when(showtimeSeatRepo.findByStatusAndHoldExpiresAtBefore(eq("held"), any())).thenReturn(List.of(seat1, seat2));

        job.cleanupExpiredHolds(now);

        assertEquals("available", seat1.getStatus());
        assertNull(seat1.getHeldByUserId());
        assertNull(seat1.getHoldExpiresAt());
        verify(showtimeSeatRepo, times(2)).save(any(ShowtimeSeat.class));
        verify(holdSessionRepo).deleteByExpiresAtBefore(now);

        ArgumentCaptor<SeatStatusEvent> captor = ArgumentCaptor.forClass(SeatStatusEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        SeatStatusEvent event = captor.getValue();
        assertEquals(10L, event.showtimeId());
        assertEquals("AVAILABLE", event.status());
        assertEquals(List.of(1L, 2L), event.seatIds());
    }

    @Test
    void cancelsExpiredPendingBookingsAndRestoresVoucher() {
        LocalDateTime now = LocalDateTime.now();
        Promotion promo = Promotion.builder().code("KM10").usedCount(2).build();
        Booking booking = Booking.builder()
                .bookingCode("BK12345")
                .status("pending_payment")
                .promotion(promo)
                .tickets(new ArrayList<>(List.of(Ticket.builder().status("valid").build())))
                .build();

        when(bookingRepo.findByStatusInAndExpiresAtBefore(any(), any())).thenReturn(List.of(booking));

        job.cleanupExpiredBookings(now);

        assertEquals("EXPIRED", booking.getStatus());
        assertEquals("cancelled", booking.getTickets().get(0).getStatus());
        assertEquals(1, promo.getUsedCount());
        verify(promoRepo).save(promo);
        verify(bookingRepo).save(booking);
    }
}

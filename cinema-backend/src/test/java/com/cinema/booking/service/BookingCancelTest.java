package com.cinema.booking.service;

import com.cinema.booking.dto.BookingDtos.BookingDetailDto;
import com.cinema.booking.entity.*;
import com.cinema.booking.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookingCancelTest {

    private final BookingRepository bookingRepo = mock(BookingRepository.class);
    private final FoodComboRepository comboRepo = mock(FoodComboRepository.class);
    private final PromotionRepository promoRepo = mock(PromotionRepository.class);
    private final ShowtimeSeatRepository seatRepo = mock(ShowtimeSeatRepository.class);
    private final TicketRepository ticketRepo = mock(TicketRepository.class);
    private final HoldService holds = mock(HoldService.class);
    private final PayPalService payPalService = mock(PayPalService.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(
                bookingRepo, comboRepo, promoRepo, seatRepo, ticketRepo,
                holds, payPalService, eventPublisher
        );
    }

    @Test
    void cancelPendingBookingReleasesSeatsAndCancelsTickets() {
        Long userId = 1L;
        String bookingCode = "BK123456";

        Showtime showtime = Showtime.builder()
                .id(10L)
                .startTime(LocalDateTime.now().plusHours(3))
                .build();

        Seat seat = Seat.builder().id(100L).seatNumber("A1").build();
        Ticket ticket = Ticket.builder().id(50L).seat(seat).status("valid").build();

        Booking booking = Booking.builder()
                .id(1L)
                .bookingCode(bookingCode)
                .userId(userId)
                .status("PENDING_PAYMENT")
                .paymentMethod("PAY_AT_COUNTER")
                .showtime(showtime)
                .tickets(new ArrayList<>(List.of(ticket)))
                .finalAmount(BigDecimal.valueOf(100000))
                .build();

        when(bookingRepo.findByBookingCode(bookingCode)).thenReturn(Optional.of(booking));
        when(seatRepo.findByShowtimeId(10L)).thenReturn(List.of(
                ShowtimeSeat.builder().seatId(100L).status("held").build()
        ));

        BookingDetailDto result = bookingService.cancelBooking(userId, bookingCode);

        assertNotNull(result);
        assertEquals("CANCELLED", result.getStatus());
        assertEquals("cancelled", ticket.getStatus());
        verify(bookingRepo).save(booking);
        verify(eventPublisher).publishEvent(any());
        verifyNoInteractions(payPalService); // Pending counter booking does not call PayPal refund
    }

    @Test
    void cancelPaidPayPalBookingCallsPayPalRefund() {
        Long userId = 1L;
        String bookingCode = "BK999999";

        Showtime showtime = Showtime.builder()
                .id(10L)
                .startTime(LocalDateTime.now().plusHours(5))
                .build();

        Booking booking = Booking.builder()
                .id(2L)
                .bookingCode(bookingCode)
                .userId(userId)
                .status("PAID")
                .paymentMethod("PAYPAL")
                .showtime(showtime)
                .tickets(new ArrayList<>())
                .finalAmount(BigDecimal.valueOf(200000))
                .build();

        when(bookingRepo.findByBookingCode(bookingCode)).thenReturn(Optional.of(booking));
        when(bookingRepo.findById(2L)).thenReturn(Optional.of(booking));

        BookingDetailDto result = bookingService.cancelBooking(userId, bookingCode);

        assertNotNull(result);
        verify(payPalService).refundOrder(eq(booking), anyString());
    }

    @Test
    void cancelFailsWhenTooCloseToShowtime() {
        Long userId = 1L;
        String bookingCode = "BK_TOO_LATE";

        // Chỉ còn 30 phút nữa là chiếu (< 60 phút)
        Showtime showtime = Showtime.builder()
                .id(10L)
                .startTime(LocalDateTime.now().plusMinutes(30))
                .build();

        Booking booking = Booking.builder()
                .id(3L)
                .bookingCode(bookingCode)
                .userId(userId)
                .status("PAID")
                .paymentMethod("PAYPAL")
                .showtime(showtime)
                .tickets(new ArrayList<>())
                .build();

        when(bookingRepo.findByBookingCode(bookingCode)).thenReturn(Optional.of(booking));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bookingService.cancelBooking(userId, bookingCode)
        );

        assertTrue(ex.getMessage().contains("ít nhất 60 phút"));
    }
}

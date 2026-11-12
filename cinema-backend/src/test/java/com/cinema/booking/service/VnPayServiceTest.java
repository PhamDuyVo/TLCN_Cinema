package com.cinema.booking.service;

import com.cinema.booking.dto.PaymentDtos.CreatePaymentUrlResponse;
import com.cinema.booking.dto.SeatStatusEvent;
import com.cinema.booking.entity.Booking;
import com.cinema.booking.entity.Seat;
import com.cinema.booking.entity.Showtime;
import com.cinema.booking.entity.ShowtimeSeat;
import com.cinema.booking.entity.Ticket;
import com.cinema.booking.repository.BookingRepository;
import com.cinema.booking.repository.PaymentRepository;
import com.cinema.booking.repository.ShowtimeSeatRepository;
import com.cinema.booking.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class VnPayServiceTest {

    private final BookingRepository bookingRepo = mock(BookingRepository.class);
    private final PaymentRepository paymentRepo = mock(PaymentRepository.class);
    private final TicketRepository ticketRepo = mock(TicketRepository.class);
    private final ShowtimeSeatRepository seatRepo = mock(ShowtimeSeatRepository.class);
    private final EmailService emailService = mock(EmailService.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);

    private VnPayService service;

    private static final String TEST_HASH_SECRET = "TESTSECRETKEY1234567890ABCDEF123456";
    private static final String TEST_TMN_CODE = "TESTTMN";

    @BeforeEach
    void setUp() {
        service = new VnPayService(bookingRepo, paymentRepo, ticketRepo, seatRepo, emailService, eventPublisher);
        ReflectionTestUtils.setField(service, "tmnCode", TEST_TMN_CODE);
        ReflectionTestUtils.setField(service, "hashSecret", TEST_HASH_SECRET);
        ReflectionTestUtils.setField(service, "vnpayUrl", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        ReflectionTestUtils.setField(service, "returnUrl", "http://localhost:5173/booking-success");
    }

    @Test
    void generatesValidVnPayUrlWithHmacSha512() {
        Booking booking = Booking.builder()
                .id(1L)
                .bookingCode("BK12345678")
                .userId(5L)
                .finalAmount(new BigDecimal("120000"))
                .status("pending_payment")
                .build();

        when(bookingRepo.findByBookingCode("BK12345678")).thenReturn(Optional.of(booking));
        when(paymentRepo.findByTxnRef(any())).thenReturn(Optional.empty());

        CreatePaymentUrlResponse res = service.createPaymentUrl(5L, "BK12345678", "127.0.0.1");

        assertNotNull(res.getPaymentUrl());
        assertTrue(res.getPaymentUrl().contains("vnp_SecureHash="));
        assertTrue(res.getPaymentUrl().contains("vnp_Amount=12000000"));
        assertEquals("BK12345678", res.getBookingCode());
        verify(paymentRepo).save(any());
    }

    @Test
    void rejectsPaidOrExpiredBookingWhenCreatingPaymentUrl() {
        Booking paid = Booking.builder().bookingCode("BK_PAID").userId(1L).status("PAID").finalAmount(BigDecimal.TEN).build();
        when(bookingRepo.findByBookingCode("BK_PAID")).thenReturn(Optional.of(paid));
        assertThrows(IllegalArgumentException.class, () -> service.createPaymentUrl(1L, "BK_PAID", "127.0.0.1"));

        Booking expired = Booking.builder().bookingCode("BK_EXP").userId(1L).status("EXPIRED").finalAmount(BigDecimal.TEN).build();
        when(bookingRepo.findByBookingCode("BK_EXP")).thenReturn(Optional.of(expired));
        assertThrows(IllegalArgumentException.class, () -> service.createPaymentUrl(1L, "BK_EXP", "127.0.0.1"));
    }

    @Test
    void ipnRejectsInvalidSignature() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "BK123_1");
        params.put("vnp_Amount", "10000000");
        params.put("vnp_SecureHash", "invalidhash");

        Map<String, String> res = service.processIpn(params);
        assertEquals("97", res.get("RspCode"));
        assertEquals("Invalid Checksum", res.get("Message"));
    }

    @Test
    void ipnProcessesSuccessfulPaymentAndBroadcastsBookedEvent() {
        String txnRef = "BK999_123456";
        long amount = 150000;

        Showtime showtime = Showtime.builder().id(20L).startTime(LocalDateTime.now().plusDays(1)).build();
        Seat seat1 = Seat.builder().id(101L).seatNumber("A1").build();
        Ticket ticket1 = Ticket.builder().id(501L).seat(seat1).ticketCode("TK1").status("pending").build();

        Booking booking = Booking.builder()
                .id(999L)
                .bookingCode("BK999")
                .finalAmount(BigDecimal.valueOf(amount))
                .status("pending_payment")
                .customerEmail("customer@example.com")
                .showtime(showtime)
                .tickets(List.of(ticket1))
                .build();

        ShowtimeSeat ss1 = ShowtimeSeat.builder().showtimeId(20L).seatId(101L).status("held").build();

        when(paymentRepo.findByTxnRef(txnRef)).thenReturn(Optional.empty());
        when(bookingRepo.findByBookingCode("BK999")).thenReturn(Optional.of(booking));
        when(ticketRepo.findByBookingId(999L)).thenReturn(List.of(ticket1));
        when(seatRepo.findByShowtimeId(20L)).thenReturn(List.of(ss1));

        // Tạo chữ ký hợp lệ
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Amount", String.valueOf(amount * 100));
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_BankCode", "NCB");

        String hashData = "vnp_Amount=" + amount * 100 + "&vnp_BankCode=NCB&vnp_ResponseCode=00&vnp_TxnRef=" + txnRef;
        String validHash = VnPayService.hmacSHA512(TEST_HASH_SECRET, hashData);
        params.put("vnp_SecureHash", validHash);

        Map<String, String> res = service.processIpn(params);

        assertEquals("00", res.get("RspCode"));
        assertEquals("Confirm Success", res.get("Message"));
        assertEquals("PAID", booking.getStatus());
        assertEquals("valid", ticket1.getStatus());
        assertEquals("booked", ss1.getStatus());

        // Kiểm tra gửi email và broadcast WebSocket
        verify(emailService).sendTicketEmail(eq("customer@example.com"), eq("BK999"), any(), any(), any(), any());
        ArgumentCaptor<SeatStatusEvent> eventCaptor = ArgumentCaptor.forClass(SeatStatusEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        SeatStatusEvent event = eventCaptor.getValue();
        assertEquals(20L, event.showtimeId());
        assertEquals(List.of(101L), event.seatIds());
        assertEquals("BOOKED", event.status());
    }
}

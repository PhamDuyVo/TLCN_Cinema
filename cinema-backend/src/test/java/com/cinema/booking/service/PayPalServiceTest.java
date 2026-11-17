package com.cinema.booking.service;

import com.cinema.booking.dto.PaymentDtos.*;
import com.cinema.booking.entity.*;
import com.cinema.booking.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PayPalServiceTest {

    private final BookingRepository bookingRepo = mock(BookingRepository.class);
    private final PaymentRepository paymentRepo = mock(PaymentRepository.class);
    private final TicketRepository ticketRepo = mock(TicketRepository.class);
    private final ShowtimeSeatRepository seatRepo = mock(ShowtimeSeatRepository.class);
    private final PromotionRepository promoRepo = mock(PromotionRepository.class);
    private final EmailService emailService = mock(EmailService.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate mockRestTemplate = mock(RestTemplate.class);

    private PayPalService service;

    private static final String TEST_CLIENT_ID = "TEST_PAYPAL_CLIENT_ID";
    private static final String TEST_CLIENT_SECRET = "TEST_PAYPAL_CLIENT_SECRET";

    @BeforeEach
    void setUp() {
        service = new PayPalService(bookingRepo, paymentRepo, ticketRepo, seatRepo, promoRepo, emailService, eventPublisher, objectMapper);
        ReflectionTestUtils.setField(service, "clientId", TEST_CLIENT_ID);
        ReflectionTestUtils.setField(service, "clientSecret", TEST_CLIENT_SECRET);
        ReflectionTestUtils.setField(service, "baseUrl", "https://api-m.sandbox.paypal.com");
        ReflectionTestUtils.setField(service, "exchangeRate", BigDecimal.valueOf(25000));
        ReflectionTestUtils.setField(service, "returnUrl", "http://localhost:5173/booking-success");
        ReflectionTestUtils.setField(service, "cancelUrl", "http://localhost:5173/checkout");
        ReflectionTestUtils.setField(service, "restTemplate", mockRestTemplate);

        // Giả lập token cache để không phải gọi OAuth endpoint cho mọi test
        ReflectionTestUtils.setField(service, "cachedAccessToken", "MOCK_ACCESS_TOKEN_123");
        ReflectionTestUtils.setField(service, "tokenExpiryEpochMs", System.currentTimeMillis() + 3600000);
    }

    @Test
    void createOrderSuccess() {
        Booking booking = Booking.builder()
                .id(1L)
                .bookingCode("BK12345678")
                .userId(5L)
                .finalAmount(new BigDecimal("250000")) // 250,000 VND / 25,000 = 10.00 USD
                .status("PENDING_PAYMENT")
                .build();

        when(bookingRepo.findByBookingCode("BK12345678")).thenReturn(Optional.of(booking));
        when(paymentRepo.findByPaypalOrderId(any())).thenReturn(Optional.empty());
        when(paymentRepo.findByBookingId(1L)).thenReturn(Optional.empty());

        String paypalResponseJson = """
                {
                    "id": "ORDER-987654321",
                    "status": "CREATED",
                    "links": [
                        { "href": "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-987654321", "rel": "approve" }
                    ]
                }
                """;

        when(mockRestTemplate.postForEntity(eq("https://api-m.sandbox.paypal.com/v2/checkout/orders"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(paypalResponseJson, HttpStatus.CREATED));

        PayPalOrderResponse res = service.createOrder(5L, "BK12345678");

        assertNotNull(res);
        assertEquals("ORDER-987654321", res.getOrderId());
        assertEquals("https://www.sandbox.paypal.com/checkoutnow?token=ORDER-987654321", res.getApproveUrl());
        assertEquals("BK12345678", res.getBookingCode());
        assertEquals(new BigDecimal("10.00"), res.getAmountUsd());

        verify(paymentRepo).save(any(Payment.class));
        verify(bookingRepo).save(booking);
        assertEquals("PAYPAL", booking.getPaymentMethod());
    }

    @Test
    void captureOrderSuccess() {
        String orderId = "ORDER-987654321";
        String captureId = "CAPTURE-11223344";

        Booking booking = Booking.builder()
                .id(1L)
                .bookingCode("BK12345678")
                .userId(5L)
                .status("PENDING_PAYMENT")
                .finalAmount(new BigDecimal("250000"))
                .customerEmail("test@example.com")
                .build();

        Payment payment = Payment.builder()
                .id(10L)
                .bookingId(1L)
                .paypalOrderId(orderId)
                .amount(new BigDecimal("250000"))
                .amountUsd(new BigDecimal("10.00"))
                .status("PENDING")
                .build();

        when(paymentRepo.findByPaypalOrderId(orderId)).thenReturn(Optional.of(payment));
        when(bookingRepo.findById(1L)).thenReturn(Optional.of(booking));
        when(ticketRepo.findByBookingId(1L)).thenReturn(Collections.emptyList());

        String paypalCaptureJson = """
                {
                    "id": "ORDER-987654321",
                    "status": "COMPLETED",
                    "purchase_units": [
                        {
                            "reference_id": "BK12345678",
                            "payments": {
                                "captures": [
                                    { "id": "CAPTURE-11223344", "status": "COMPLETED" }
                                ]
                            }
                        }
                    ]
                }
                """;

        when(mockRestTemplate.postForEntity(eq("https://api-m.sandbox.paypal.com/v2/checkout/orders/" + orderId + "/capture"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(paypalCaptureJson, HttpStatus.OK));

        PayPalCaptureResponse res = service.captureOrder(orderId);

        assertNotNull(res);
        assertEquals("PAID", res.getStatus());
        assertEquals(captureId, res.getCaptureId());
        assertEquals("BK12345678", res.getBookingCode());

        assertEquals("SUCCESS", payment.getStatus());
        assertEquals(captureId, payment.getPaypalCaptureId());
        assertEquals("PAID", booking.getStatus());

        verify(paymentRepo).save(payment);
        verify(bookingRepo).save(booking);
    }

    @Test
    void refundOrderSuccess() {
        Booking booking = Booking.builder()
                .id(1L)
                .bookingCode("BK12345678")
                .status("PAID")
                .finalAmount(new BigDecimal("250000"))
                .build();

        Payment payment = Payment.builder()
                .id(10L)
                .bookingId(1L)
                .paypalCaptureId("CAPTURE-11223344")
                .amountUsd(new BigDecimal("10.00"))
                .status("SUCCESS")
                .build();

        when(paymentRepo.findByBookingId(1L)).thenReturn(Optional.of(payment));
        when(ticketRepo.findByBookingId(1L)).thenReturn(Collections.emptyList());

        String paypalRefundJson = """
                {
                    "id": "REFUND-998877",
                    "status": "COMPLETED"
                }
                """;

        when(mockRestTemplate.postForEntity(eq("https://api-m.sandbox.paypal.com/v2/payments/captures/CAPTURE-11223344/refund"), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(paypalRefundJson, HttpStatus.CREATED));

        RefundPaymentResponse res = service.refundOrder(booking, "Khach yeu cau huy ve");

        assertNotNull(res);
        assertEquals("REFUNDED", res.getStatus());
        assertEquals("REFUND-998877", res.getRefundId());

        assertEquals("REFUNDED", payment.getStatus());
        assertEquals("CANCELLED", booking.getStatus());

        verify(paymentRepo).save(payment);
        verify(bookingRepo).save(booking);
    }
}

package com.cinema.booking.service;

import com.cinema.booking.dto.PaymentDtos.*;
import com.cinema.booking.dto.SeatStatusEvent;
import com.cinema.booking.entity.*;
import com.cinema.booking.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayPalService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final TicketRepository ticketRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final PromotionRepository promotionRepository;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    @Value("${app.paypal.client-id:}")
    private String clientId;

    @Value("${app.paypal.client-secret:}")
    private String clientSecret;

    @Value("${app.paypal.base-url:https://api-m.sandbox.paypal.com}")
    private String baseUrl;

    @Value("${app.paypal.exchange-rate:25400}")
    private BigDecimal exchangeRate;

    @Value("${app.paypal.return-url:http://localhost:5173/booking-success}")
    private String returnUrl;

    @Value("${app.paypal.cancel-url:http://localhost:5173/checkout}")
    private String cancelUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Cache in-memory OAuth Token
    private String cachedAccessToken;
    private long tokenExpiryEpochMs = 0;

    /**
     * Lấy OAuth 2.0 Access Token từ PayPal API.
     */
    public synchronized String getAccessToken() {
        long now = System.currentTimeMillis();
        if (cachedAccessToken != null && now < (tokenExpiryEpochMs - 60000)) {
            return cachedAccessToken;
        }

        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình PayPal Client ID hoặc Secret Key trong biến môi trường!");
        }

        String authUrl = baseUrl.replaceAll("/+$", "") + "/v1/oauth2/token";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(clientId.trim(), clientSecret.trim(), StandardCharsets.UTF_8);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        try {
            log.info("Requesting new PayPal OAuth token from: {}", authUrl);
            ResponseEntity<String> response = restTemplate.postForEntity(authUrl, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("Lỗi khi xác thực PayPal OAuth: HTTP " + response.getStatusCode());
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            this.cachedAccessToken = root.path("access_token").asText();
            int expiresIn = root.path("expires_in").asInt(32400);
            this.tokenExpiryEpochMs = now + (expiresIn * 1000L);
            log.info("Obtained PayPal OAuth token successfully, expires in {} seconds", expiresIn);
            return cachedAccessToken;
        } catch (Exception e) {
            log.error("Lỗi khi lấy access token từ PayPal: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể xác thực với cổng PayPal: " + e.getMessage(), e);
        }
    }

    /**
     * Khởi tạo PayPal Order cho đơn đặt vé.
     */
    @Transactional
    public PayPalOrderResponse createOrder(Long userId, String bookingCode) {
        if (bookingCode == null || bookingCode.isBlank()) {
            throw new IllegalArgumentException("Mã đặt vé không được để trống");
        }

        Booking booking = bookingRepository.findByBookingCode(bookingCode.trim())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt vé: " + bookingCode));

        if (userId != null && !userId.equals(booking.getUserId())) {
            throw new IllegalArgumentException("Đơn đặt vé không thuộc về tài khoản này");
        }

        if ("PAID".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Đơn đặt vé này đã được thanh toán");
        }

        if ("EXPIRED".equalsIgnoreCase(booking.getStatus()) || "CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Đơn đặt vé đã hết hạn hoặc bị hủy");
        }

        // Quy đổi VND sang USD
        BigDecimal rate = (exchangeRate != null && exchangeRate.compareTo(BigDecimal.ZERO) > 0)
                ? exchangeRate : BigDecimal.valueOf(25400);
        BigDecimal amountUsd = booking.getFinalAmount().divide(rate, 2, RoundingMode.HALF_UP);
        if (amountUsd.compareTo(new BigDecimal("0.01")) < 0) {
            amountUsd = new BigDecimal("0.01");
        }

        String orderUrl = baseUrl.replaceAll("/+$", "") + "/v2/checkout/orders";
        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> amountMap = Map.of(
                "currency_code", "USD",
                "value", amountUsd.toPlainString()
        );

        Map<String, Object> purchaseUnit = Map.of(
                "reference_id", booking.getBookingCode(),
                "description", "Thanh toán vé xem phim UTE Cinema - Đơn " + booking.getBookingCode(),
                "amount", amountMap
        );

        Map<String, Object> appContext = Map.of(
                "brand_name", "UTE Cinema",
                "landing_page", "BILLING",
                "user_action", "PAY_NOW",
                "return_url", returnUrl + (returnUrl.contains("?") ? "&" : "?") + "bookingCode=" + booking.getBookingCode(),
                "cancel_url", cancelUrl + (cancelUrl.contains("?") ? "&" : "?") + "bookingCode=" + booking.getBookingCode() + "&canceled=true"
        );

        Map<String, Object> payload = Map.of(
                "intent", "CAPTURE",
                "purchase_units", List.of(purchaseUnit),
                "application_context", appContext
        );

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            log.info("Sending Create Order to PayPal for booking {}: amountUsd={}", booking.getBookingCode(), amountUsd);
            ResponseEntity<String> response = restTemplate.postForEntity(orderUrl, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalStateException("Lỗi khi tạo PayPal Order: " + response.getStatusCode());
            }

            JsonNode resJson = objectMapper.readTree(response.getBody());
            String orderId = resJson.path("id").asText();
            String approveUrl = "";

            JsonNode links = resJson.path("links");
            if (links.isArray()) {
                for (JsonNode link : links) {
                    if ("approve".equalsIgnoreCase(link.path("rel").asText())) {
                        approveUrl = link.path("href").asText();
                        break;
                    }
                }
            }

            // Lưu / Cập nhật bản ghi Payment
            Payment payment = paymentRepository.findByPaypalOrderId(orderId)
                    .or(() -> paymentRepository.findByBookingId(booking.getId()))
                    .orElseGet(() -> Payment.builder()
                            .bookingId(booking.getId())
                            .build());

            payment.setTxnRef(orderId);
            payment.setPaypalOrderId(orderId);
            payment.setAmount(booking.getFinalAmount());
            payment.setAmountUsd(amountUsd);
            payment.setExchangeRate(rate);
            payment.setPaymentMethod("PAYPAL");
            payment.setStatus("PENDING");
            paymentRepository.save(payment);

            booking.setPaymentMethod("PAYPAL");
            bookingRepository.save(booking);

            log.info("Created PayPal Order successfully: orderId={}, approveUrl={}", orderId, approveUrl);

            return PayPalOrderResponse.builder()
                    .orderId(orderId)
                    .approveUrl(approveUrl)
                    .bookingCode(booking.getBookingCode())
                    .amountVnd(booking.getFinalAmount())
                    .amountUsd(amountUsd)
                    .exchangeRate(rate)
                    .build();

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("PayPal API Error [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Lỗi từ cổng thanh toán PayPal: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Lỗi khi tạo đơn hàng PayPal", e);
            throw new RuntimeException("Không thể tạo liên kết thanh toán PayPal: " + e.getMessage(), e);
        }
    }

    /**
     * Xác nhận thanh toán (Capture) PayPal Order sau khi khách hàng đã duyệt trên PayPal.
     */
    @Transactional
    public PayPalCaptureResponse captureOrder(String orderId) {
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("Mã đơn PayPal (orderId) không được để trống");
        }

        String captureUrl = baseUrl.replaceAll("/+$", "") + "/v2/checkout/orders/" + orderId.trim() + "/capture";
        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Collections.emptyMap(), headers);

        try {
            log.info("Capturing PayPal Order: {}", orderId);
            ResponseEntity<String> response = restTemplate.postForEntity(captureUrl, entity, String.class);

            JsonNode resJson = objectMapper.readTree(response.getBody());
            String status = resJson.path("status").asText();

            // Tìm Payment và Booking tương ứng
            Payment payment = paymentRepository.findByPaypalOrderId(orderId)
                    .or(() -> paymentRepository.findByTxnRef(orderId))
                    .orElse(null);

            Booking booking = null;
            if (payment != null) {
                booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
            }

            if (booking == null) {
                // Thử tìm booking từ reference_id trong purchase_units
                JsonNode purchaseUnits = resJson.path("purchase_units");
                if (purchaseUnits.isArray() && !purchaseUnits.isEmpty()) {
                    String refId = purchaseUnits.get(0).path("reference_id").asText();
                    if (refId != null && !refId.isBlank()) {
                        booking = bookingRepository.findByBookingCode(refId).orElse(null);
                    }
                }
            }

            if (booking == null) {
                throw new IllegalStateException("Không tìm thấy đơn đặt vé tương ứng với PayPal Order: " + orderId);
            }

            if ("COMPLETED".equalsIgnoreCase(status)) {
                // Trích xuất captureId từ response
                String captureId = "";
                JsonNode purchaseUnits = resJson.path("purchase_units");
                if (purchaseUnits.isArray() && !purchaseUnits.isEmpty()) {
                    JsonNode captures = purchaseUnits.get(0).path("payments").path("captures");
                    if (captures.isArray() && !captures.isEmpty()) {
                        captureId = captures.get(0).path("id").asText();
                    }
                }

                // Xác nhận thanh toán thành công
                confirmPaidBooking(booking, payment, orderId, captureId);

                return PayPalCaptureResponse.builder()
                        .orderId(orderId)
                        .captureId(captureId)
                        .bookingCode(booking.getBookingCode())
                        .status("PAID")
                        .amountUsd(payment != null ? payment.getAmountUsd() : null)
                        .message("Thanh toán PayPal thành công!")
                        .build();
            } else {
                if (payment != null) {
                    payment.setStatus("FAILED");
                    paymentRepository.save(payment);
                }
                log.warn("PayPal capture returned non-completed status: {}", status);
                return PayPalCaptureResponse.builder()
                        .orderId(orderId)
                        .bookingCode(booking.getBookingCode())
                        .status("FAILED")
                        .message("Thanh toán PayPal chưa hoàn tất. Trạng thái: " + status)
                        .build();
            }

        } catch (HttpClientErrorException.UnprocessableEntity e) {
            // Trường hợp ORDER_ALREADY_CAPTURED (idempotency)
            if (e.getResponseBodyAsString().contains("ORDER_ALREADY_CAPTURED")) {
                log.info("PayPal order {} was already captured, checking existing status", orderId);
                Payment payment = paymentRepository.findByPaypalOrderId(orderId).orElse(null);
                if (payment != null) {
                    Booking booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
                    if (booking != null && "PAID".equalsIgnoreCase(booking.getStatus())) {
                        return PayPalCaptureResponse.builder()
                                .orderId(orderId)
                                .captureId(payment.getPaypalCaptureId())
                                .bookingCode(booking.getBookingCode())
                                .status("PAID")
                                .amountUsd(payment.getAmountUsd())
                                .message("Đơn hàng đã được thanh toán thành công trước đó.")
                                .build();
                    }
                }
            }
            log.error("PayPal Capture UnprocessableEntity: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Lỗi từ PayPal: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Lỗi khi capture đơn hàng PayPal: {}", e.getMessage(), e);
            throw new RuntimeException("Xác nhận thanh toán PayPal thất bại: " + e.getMessage(), e);
        }
    }

    /**
     * Hoàn tiền giao dịch PayPal khi hủy vé xem phim.
     */
    @Transactional
    public RefundPaymentResponse refundOrder(Booking booking, String note) {
        if (booking == null) {
            throw new IllegalArgumentException("Đơn đặt vé không hợp lệ");
        }

        Payment payment = paymentRepository.findByBookingId(booking.getId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy thông tin thanh toán của đơn: " + booking.getBookingCode()));

        String captureId = payment.getPaypalCaptureId();
        if (captureId == null || captureId.isBlank()) {
            throw new IllegalStateException("Giao dịch chưa có PayPal Capture ID, không thể hoàn tiền trực tiếp");
        }

        if ("REFUNDED".equalsIgnoreCase(payment.getStatus())) {
            return RefundPaymentResponse.builder()
                    .bookingCode(booking.getBookingCode())
                    .refundId(payment.getPaypalRefundId())
                    .status("REFUNDED")
                    .amountUsd(payment.getAmountUsd())
                    .message("Giao dịch đã được hoàn tiền trước đó.")
                    .build();
        }

        String refundUrl = baseUrl.replaceAll("/+$", "") + "/v2/payments/captures/" + captureId.trim() + "/refund";
        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> payload = new HashMap<>();
        if (payment.getAmountUsd() != null) {
            payload.put("amount", Map.of(
                    "currency_code", "USD",
                    "value", payment.getAmountUsd().toPlainString()
            ));
        }
        payload.put("note_to_payer", note != null ? note : ("Hoan tien huy ve xem phim: " + booking.getBookingCode()));

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            log.info("Sending Refund request to PayPal for captureId {}: payload={}", captureId, payload);
            ResponseEntity<String> response = restTemplate.postForEntity(refundUrl, entity, String.class);

            JsonNode resJson = objectMapper.readTree(response.getBody());
            String refundStatus = resJson.path("status").asText();
            String refundId = resJson.path("id").asText();

            if ("COMPLETED".equalsIgnoreCase(refundStatus) || "PENDING".equalsIgnoreCase(refundStatus)) {
                // 1. Cập nhật Payment sang REFUNDED
                payment.setStatus("REFUNDED");
                payment.setPaypalRefundId(refundId);
                payment.setRefundedAt(LocalDateTime.now());
                paymentRepository.save(payment);

                // 2. Cập nhật Booking sang CANCELLED
                booking.setStatus("CANCELLED");
                bookingRepository.save(booking);

                // 3. Hủy vé
                List<Ticket> tickets = ticketRepository.findByBookingId(booking.getId());
                List<Long> seatIds = new ArrayList<>();
                for (Ticket ticket : tickets) {
                    ticket.setStatus("cancelled");
                    ticketRepository.save(ticket);
                    if (ticket.getSeat() != null) {
                        seatIds.add(ticket.getSeat().getId());
                    }
                }

                // 4. Giải phóng ghế trong showtime_seats
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

                    // 5. Phát WebSocket event trả ghế trống cho toàn hệ thống
                    if (eventPublisher != null) {
                        eventPublisher.publishEvent(new SeatStatusEvent(showtimeId, seatIds, "AVAILABLE", null, null));
                    }
                }

                // 6. Hoàn lại lượt sử dụng voucher nếu có
                if (booking.getPromotion() != null) {
                    Promotion promo = booking.getPromotion();
                    promo.setUsedCount(Math.max(0, promo.getUsedCount() - 1));
                    promotionRepository.save(promo);
                }

                log.info("Refund successful for booking {}: refundId={}", booking.getBookingCode(), refundId);

                return RefundPaymentResponse.builder()
                        .bookingCode(booking.getBookingCode())
                        .refundId(refundId)
                        .status("REFUNDED")
                        .amountUsd(payment.getAmountUsd())
                        .message("Hoàn tiền và hủy vé thành công qua PayPal!")
                        .build();

            } else {
                throw new IllegalStateException("PayPal Refund trả về trạng thái không thành công: " + refundStatus);
            }

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("PayPal Refund Error [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Lỗi từ cổng hoàn tiền PayPal: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Lỗi khi hoàn tiền PayPal", e);
            throw new RuntimeException("Không thể hoàn tiền qua PayPal: " + e.getMessage(), e);
        }
    }

    /**
     * Xác nhận đơn đặt vé đã thanh toán thành công, kích hoạt vé, gán QR, chuyển trạng thái ghế sang booked và gửi email.
     */
    private void confirmPaidBooking(Booking booking, Payment payment, String orderId, String captureId) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Cập nhật Payment
        if (payment == null) {
            payment = Payment.builder()
                    .bookingId(booking.getId())
                    .txnRef(orderId)
                    .paypalOrderId(orderId)
                    .amount(booking.getFinalAmount())
                    .paymentMethod("PAYPAL")
                    .build();
        }
        payment.setStatus("SUCCESS");
        payment.setPaypalCaptureId(captureId);
        payment.setPaidAt(now);
        paymentRepository.save(payment);

        // 2. Cập nhật Booking
        booking.setStatus("PAID");
        bookingRepository.save(booking);

        // 3. Cập nhật vé sang valid và cấp mã QR
        List<Ticket> tickets = ticketRepository.findByBookingId(booking.getId());
        List<String> seatNumbers = new ArrayList<>();
        List<Long> seatIds = new ArrayList<>();

        for (Ticket ticket : tickets) {
            ticket.setStatus("valid");
            if (ticket.getTicketCode() == null || ticket.getTicketCode().isBlank()) {
                ticket.setTicketCode(UUID.randomUUID().toString());
            }
            ticket.setQrPayload(ticket.getTicketCode());
            ticketRepository.save(ticket);

            if (ticket.getSeat() != null) {
                seatNumbers.add(ticket.getSeat().getSeatNumber());
                seatIds.add(ticket.getSeat().getId());
            }
        }

        // 4. Cập nhật bảng showtime_seats sang booked
        if (booking.getShowtime() != null && !seatIds.isEmpty()) {
            Long showtimeId = booking.getShowtime().getId();
            List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeId(showtimeId);
            for (ShowtimeSeat ss : seats) {
                if (seatIds.contains(ss.getSeatId())) {
                    ss.setStatus("booked");
                    ss.setHeldByUserId(null);
                    ss.setHoldExpiresAt(null);
                    showtimeSeatRepository.save(ss);
                }
            }

            // 5. Phát WebSocket broadcast tới các máy khác: ghế đã BOOKED
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new SeatStatusEvent(showtimeId, seatIds, "BOOKED", booking.getUserId(), null));
            }
        }

        // 6. Gửi vé điện tử qua Email
        try {
            String email = booking.getCustomerEmail();
            if (email != null && !email.isBlank()) {
                String movieTitle = booking.getShowtime() != null && booking.getShowtime().getMovie() != null
                        ? booking.getShowtime().getMovie().getTitle() : "Phim chiếu rạp";
                String showtimeInfo = booking.getShowtime() != null
                        ? booking.getShowtime().getStartTime().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")) : "";
                String seatsStr = String.join(", ", seatNumbers);

                emailService.sendTicketEmail(
                        email,
                        booking.getBookingCode(),
                        movieTitle,
                        showtimeInfo,
                        seatsStr,
                        booking.getFinalAmount().toPlainString()
                );
            }
        } catch (Exception e) {
            log.error("Không thể gửi email vé điện tử cho đơn {}: {}", booking.getBookingCode(), e.getMessage());
        }
    }
}

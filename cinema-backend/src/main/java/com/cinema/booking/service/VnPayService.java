package com.cinema.booking.service;

import com.cinema.booking.dto.PaymentDtos.CreatePaymentUrlResponse;
import com.cinema.booking.dto.PaymentDtos.PaymentReturnDto;
import com.cinema.booking.dto.SeatStatusEvent;
import com.cinema.booking.entity.Booking;
import com.cinema.booking.entity.Payment;
import com.cinema.booking.entity.ShowtimeSeat;
import com.cinema.booking.entity.Ticket;
import com.cinema.booking.repository.BookingRepository;
import com.cinema.booking.repository.PaymentRepository;
import com.cinema.booking.repository.ShowtimeSeatRepository;
import com.cinema.booking.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VnPayService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final TicketRepository ticketRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final EmailService emailService;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.vnpay.tmn-code:}")
    private String tmnCode;

    @Value("${app.vnpay.hash-secret:}")
    private String hashSecret;

    @Value("${app.vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpayUrl;

    @Value("${app.vnpay.return-url:http://localhost:5173/booking-success}")
    private String returnUrl;

    private static final DateTimeFormatter VNP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Tạo URL thanh toán VNPay Sandbox với chữ ký HMAC-SHA512 cho một mã đặt vé.
     */
    @Transactional
    public CreatePaymentUrlResponse createPaymentUrl(Long userId, String bookingCode, String clientIp) {
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

        // Sinh mã giao dịch độc nhất cho VNPay (txnRef)
        String txnRef = booking.getBookingCode() + "_" + System.currentTimeMillis();
        long amount = booking.getFinalAmount().multiply(BigDecimal.valueOf(100)).longValue();

        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        LocalDateTime expireTime = now.plusMinutes(15);

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", tmnCode != null ? tmnCode.trim() : "");
        vnpParams.put("vnp_Amount", String.valueOf(amount));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", "Thanh toan ve xem phim: " + booking.getBookingCode());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", returnUrl);
        vnpParams.put("vnp_IpAddr", (clientIp != null && !clientIp.isBlank()) ? clientIp : "127.0.0.1");
        vnpParams.put("vnp_CreateDate", now.format(VNP_DATE_FORMAT));
        vnpParams.put("vnp_ExpireDate", expireTime.format(VNP_DATE_FORMAT));

        // Sắp xếp các tham số theo thứ tự a-z
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (Iterator<String> itr = fieldNames.iterator(); itr.hasNext(); ) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                try {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()))
                            .append('=')
                            .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                } catch (Exception e) {
                    log.error("Encoding error", e);
                }
            }
        }

        String queryUrl = query.toString();
        String secureHash = hmacSHA512(hashSecret, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + secureHash;
        String fullPaymentUrl = vnpayUrl + "?" + queryUrl;

        // Lưu / cập nhật bản ghi thanh toán vào bảng payments
        Payment payment = paymentRepository.findByTxnRef(txnRef).orElseGet(() ->
                Payment.builder()
                        .bookingId(booking.getId())
                        .txnRef(txnRef)
                        .amount(booking.getFinalAmount())
                        .paymentMethod("VNPAY")
                        .status("PENDING")
                        .build()
        );
        payment.setAmount(booking.getFinalAmount());
        payment.setStatus("PENDING");
        paymentRepository.save(payment);

        booking.setPaymentMethod("VNPAY");
        bookingRepository.save(booking);

        log.info("Generated VNPay payment URL for booking {}: txnRef={}", booking.getBookingCode(), txnRef);

        return CreatePaymentUrlResponse.builder()
                .paymentUrl(fullPaymentUrl)
                .txnRef(txnRef)
                .bookingCode(booking.getBookingCode())
                .amount(booking.getFinalAmount())
                .build();
    }

    /**
     * Xác thực chữ ký dữ liệu trả về từ VNPay.
     */
    public boolean validateSignature(Map<String, String> fields) {
        String secureHash = fields.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank() || hashSecret == null || hashSecret.isBlank()) {
            return false;
        }

        Map<String, String> paramsToSign = new HashMap<>(fields);
        paramsToSign.remove("vnp_SecureHash");
        paramsToSign.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(paramsToSign.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        for (Iterator<String> itr = fieldNames.iterator(); itr.hasNext(); ) {
            String fieldName = itr.next();
            String fieldValue = paramsToSign.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                try {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                } catch (Exception e) {
                    log.error("Encoding error", e);
                }
            }
        }

        String calculatedHash = hmacSHA512(hashSecret, hashData.toString());
        return calculatedHash.equalsIgnoreCase(secureHash);
    }

    /**
     * Xử lý Webhook IPN từ VNPay (Server-to-Server).
     * Trả về định dạng chuẩn của VNPay: {"RspCode": "00", "Message": "Confirm Success"}.
     */
    @Transactional
    public Map<String, String> processIpn(Map<String, String> params) {
        Map<String, String> response = new HashMap<>();

        // 1. Kiểm tra chữ ký bảo mật
        if (!validateSignature(params)) {
            log.warn("VNPay IPN: Chữ ký không hợp lệ");
            response.put("RspCode", "97");
            response.put("Message", "Invalid Checksum");
            return response;
        }

        String txnRef = params.get("vnp_TxnRef");
        String vnpResponseCode = params.get("vnp_ResponseCode");
        String vnpAmountStr = params.get("vnp_Amount");
        String bankCode = params.get("vnp_BankCode");

        // Tìm payment và booking tương ứng
        Payment payment = paymentRepository.findByTxnRef(txnRef).orElse(null);
        Booking booking = null;

        if (payment != null) {
            booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
        } else if (txnRef != null) {
            // Trường hợp txnRef có dạng BK..._timestamp hoặc trực tiếp là bookingCode
            String bookingCode = txnRef.contains("_") ? txnRef.substring(0, txnRef.indexOf('_')) : txnRef;
            booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
        }

        if (booking == null) {
            log.warn("VNPay IPN: Không tìm thấy đơn hàng cho txnRef={}", txnRef);
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return response;
        }

        // 2. Kiểm tra số tiền
        long vnpAmount = vnpAmountStr != null ? Long.parseLong(vnpAmountStr) / 100 : 0;
        if (booking.getFinalAmount().longValue() != vnpAmount) {
            log.warn("VNPay IPN: Sai số tiền cho booking {}: expected={}, received={}",
                    booking.getBookingCode(), booking.getFinalAmount(), vnpAmount);
            response.put("RspCode", "04");
            response.put("Message", "Invalid Amount");
            return response;
        }

        // 3. Kiểm tra tính idempotent (đơn đã được xác nhận thanh toán trước đó)
        if ("PAID".equalsIgnoreCase(booking.getStatus())) {
            log.info("VNPay IPN: Đơn hàng {} đã được thanh toán trước đó", booking.getBookingCode());
            response.put("RspCode", "02");
            response.put("Message", "Order already confirmed");
            return response;
        }

        // 4. Cập nhật kết quả thanh toán
        if ("00".equals(vnpResponseCode)) {
            // Thanh toán thành công!
            confirmPaidBooking(booking, payment, txnRef, bankCode, vnpResponseCode);
            log.info("VNPay IPN: Thanh toán thành công cho đơn {}", booking.getBookingCode());
            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
        } else {
            // Thanh toán thất bại
            if (payment != null) {
                payment.setStatus("FAILED");
                payment.setVnpResponseCode(vnpResponseCode);
                paymentRepository.save(payment);
            }
            log.warn("VNPay IPN: Giao dịch không thành công cho đơn {}: responseCode={}",
                    booking.getBookingCode(), vnpResponseCode);
            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
        }

        return response;
    }

    /**
     * Xử lý khi người dùng hoàn tất thanh toán và được redirect về trang return-url.
     */
    @Transactional
    public PaymentReturnDto handleReturn(Map<String, String> params) {
        if (!validateSignature(params)) {
            return PaymentReturnDto.builder()
                    .status("INVALID_SIGNATURE")
                    .message("Chữ ký giao dịch không hợp lệ.")
                    .build();
        }

        String txnRef = params.get("vnp_TxnRef");
        String vnpResponseCode = params.get("vnp_ResponseCode");
        String bookingCode = txnRef != null && txnRef.contains("_") ? txnRef.substring(0, txnRef.indexOf('_')) : txnRef;

        Booking booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
        if (booking == null) {
            return PaymentReturnDto.builder()
                    .txnRef(txnRef)
                    .status("FAILED")
                    .message("Không tìm thấy đơn hàng.")
                    .build();
        }

        if ("00".equals(vnpResponseCode)) {
            if (!"PAID".equalsIgnoreCase(booking.getStatus())) {
                Payment payment = paymentRepository.findByTxnRef(txnRef).orElse(null);
                confirmPaidBooking(booking, payment, txnRef, params.get("vnp_BankCode"), vnpResponseCode);
            }
            return PaymentReturnDto.builder()
                    .bookingCode(booking.getBookingCode())
                    .txnRef(txnRef)
                    .status("PAID")
                    .amount(booking.getFinalAmount())
                    .message("Thanh toán thành công!")
                    .build();
        } else {
            return PaymentReturnDto.builder()
                    .bookingCode(booking.getBookingCode())
                    .txnRef(txnRef)
                    .status("FAILED")
                    .amount(booking.getFinalAmount())
                    .message("Giao dịch thanh toán không thành công. Mã lỗi: " + vnpResponseCode)
                    .build();
        }
    }

    /**
     * Cập nhật trạng thái đơn sang PAID, vé sang valid, ghế sang booked, phát WebSocket và gửi email vé kèm QR.
     */
    private void confirmPaidBooking(Booking booking, Payment payment, String txnRef, String bankCode, String responseCode) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Cập nhật Payment
        if (payment == null) {
            payment = Payment.builder()
                    .bookingId(booking.getId())
                    .txnRef(txnRef != null ? txnRef : booking.getBookingCode())
                    .amount(booking.getFinalAmount())
                    .paymentMethod("VNPAY")
                    .build();
        }
        payment.setStatus("SUCCESS");
        payment.setPaidAt(now);
        payment.setBankCode(bankCode);
        payment.setVnpResponseCode(responseCode);
        paymentRepository.save(payment);

        // 2. Cập nhật Booking
        booking.setStatus("PAID");
        bookingRepository.save(booking);

        // 3. Cập nhật vé (Ticket) sang valid và cấp mã QR
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

        // 4. Cập nhật bảng showtime_seats sang "booked"
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

            // 5. Phát WebSocket broadcast tới các máy khác: ghế đã sang BOOKED!
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new SeatStatusEvent(showtimeId, seatIds, "BOOKED", booking.getUserId(), null));
            }
        }

        // 6. Tự động gửi vé điện tử kèm thông tin vào email của khách hàng
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

    /**
     * Tính toán mã băm HMAC-SHA512 theo chuẩn VNPay.
     */
    public static String hmacSHA512(String key, String data) {
        try {
            if (key == null || data == null) return "";
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(secretKey);
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Lỗi tính HMAC SHA512", e);
            throw new RuntimeException("Lỗi tính toán chữ ký bảo mật", e);
        }
    }
}

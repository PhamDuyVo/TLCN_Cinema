package com.cinema.booking.controller;

import com.cinema.booking.dto.ApiResponse;
import com.cinema.booking.dto.PaymentDtos.CreatePaymentRequest;
import com.cinema.booking.dto.PaymentDtos.CreatePaymentUrlResponse;
import com.cinema.booking.dto.PaymentDtos.PaymentReturnDto;
import com.cinema.booking.security.UserPrincipal;
import com.cinema.booking.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final VnPayService vnPayService;

    @Value("${app.vnpay.return-url:http://localhost:5173/booking-success}")
    private String frontendReturnUrl;

    /**
     * Tạo URL thanh toán VNPay Sandbox cho đơn đặt vé.
     */
    @PostMapping("/vnpay/create-url")
    public ResponseEntity<ApiResponse<CreatePaymentUrlResponse>> createPaymentUrl(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody(required = false) CreatePaymentRequest request,
            @RequestParam(required = false) String bookingCode,
            HttpServletRequest servletRequest) {

        String code = request != null && request.getBookingCode() != null ? request.getBookingCode() : bookingCode;
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng cung cấp mã đặt vé"));
        }

        String clientIp = getClientIp(servletRequest);
        Long userId = user != null ? user.getId() : null;

        CreatePaymentUrlResponse response = vnPayService.createPaymentUrl(userId, code, clientIp);
        return ResponseEntity.ok(ApiResponse.success("Tạo link thanh toán VNPay thành công!", response));
    }

    /**
     * Webhook IPN (Server-to-Server) được VNPay gọi để cập nhật trạng thái đơn hàng.
     */
    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> allParams) {
        log.info("Received VNPay IPN request: {}", allParams);
        Map<String, String> result = vnPayService.processIpn(allParams);
        return ResponseEntity.ok(result);
    }

    /**
     * URL chuyển hướng người dùng sau khi thanh toán trên VNPay.
     * Tự động redirect về giao diện Frontend (BookingSuccessPage) kèm mã đơn và trạng thái.
     */
    @GetMapping("/vnpay-return")
    public Object vnpayReturn(@RequestParam Map<String, String> allParams,
                              @RequestHeader(value = "Accept", required = false) String acceptHeader) {
        log.info("Received VNPay Return request: {}", allParams);
        PaymentReturnDto result = vnPayService.handleReturn(allParams);

        // Nếu client yêu cầu JSON rõ ràng
        if (acceptHeader != null && acceptHeader.contains("application/json")) {
            return ResponseEntity.ok(ApiResponse.success(result));
        }

        // Mặc định chuyển hướng trình duyệt của người dùng về trang kết quả Frontend
        String redirectTarget = frontendReturnUrl;
        try {
            String bookingParam = result.getBookingCode() != null ? URLEncoder.encode(result.getBookingCode(), StandardCharsets.UTF_8) : "";
            String statusParam = result.getStatus() != null ? URLEncoder.encode(result.getStatus(), StandardCharsets.UTF_8) : "";
            redirectTarget += (redirectTarget.contains("?") ? "&" : "?") + "bookingCode=" + bookingParam + "&paymentStatus=" + statusParam;
        } catch (Exception e) {
            log.error("Lỗi tạo URL chuyển hướng", e);
        }

        return new RedirectView(redirectTarget);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}

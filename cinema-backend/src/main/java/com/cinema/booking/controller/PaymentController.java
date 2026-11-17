package com.cinema.booking.controller;

import com.cinema.booking.dto.ApiResponse;
import com.cinema.booking.dto.PaymentDtos.CapturePaymentRequest;
import com.cinema.booking.dto.PaymentDtos.CreatePaymentRequest;
import com.cinema.booking.dto.PaymentDtos.PayPalCaptureResponse;
import com.cinema.booking.dto.PaymentDtos.PayPalOrderResponse;
import com.cinema.booking.security.UserPrincipal;
import com.cinema.booking.service.PayPalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PayPalService payPalService;

    @Value("${app.paypal.return-url:http://localhost:5173/booking-success}")
    private String frontendReturnUrl;

    @Value("${app.paypal.cancel-url:http://localhost:5173/checkout}")
    private String frontendCancelUrl;

    /**
     * Khởi tạo PayPal Order cho mã đặt vé (Tạo link / thông tin thanh toán).
     */
    @PostMapping("/paypal/create-order")
    public ResponseEntity<ApiResponse<PayPalOrderResponse>> createOrder(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody(required = false) CreatePaymentRequest request,
            @RequestParam(required = false) String bookingCode) {

        String code = request != null && request.getBookingCode() != null ? request.getBookingCode() : bookingCode;
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng cung cấp mã đặt vé"));
        }

        Long userId = user != null ? user.getId() : null;
        PayPalOrderResponse response = payPalService.createOrder(userId, code);
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo thanh toán PayPal thành công!", response));
    }

    /**
     * Xác nhận hoàn tất thanh toán (Capture) sau khi người dùng phê duyệt trên PayPal.
     */
    @PostMapping("/paypal/capture-order")
    public ResponseEntity<ApiResponse<PayPalCaptureResponse>> captureOrder(
            @RequestBody CapturePaymentRequest request,
            @RequestParam(required = false) String orderId) {

        String targetOrderId = request != null && request.getOrderId() != null ? request.getOrderId() : orderId;
        if (targetOrderId == null || targetOrderId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Thiếu mã đơn PayPal (orderId)"));
        }

        PayPalCaptureResponse response = payPalService.captureOrder(targetOrderId);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận thanh toán PayPal thành công!", response));
    }

    /**
     * URL chuyển hướng người dùng sau khi thanh toán trên PayPal (Fallback Browser Redirect).
     */
    @GetMapping("/paypal-return")
    public RedirectView paypalReturn(@RequestParam(value = "token", required = false) String orderId,
                                     @RequestParam(value = "bookingCode", required = false) String bookingCode) {
        log.info("PayPal Return callback: token/orderId={}, bookingCode={}", orderId, bookingCode);

        String redirectTarget = frontendReturnUrl;
        try {
            if (orderId != null && !orderId.isBlank()) {
                PayPalCaptureResponse captured = payPalService.captureOrder(orderId);
                String code = captured.getBookingCode() != null ? captured.getBookingCode() : (bookingCode != null ? bookingCode : "");
                redirectTarget += (redirectTarget.contains("?") ? "&" : "?")
                        + "bookingCode=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                        + "&paymentStatus=PAID";
            }
        } catch (Exception e) {
            log.error("Lỗi khi tự động capture từ paypal-return", e);
            redirectTarget += (redirectTarget.contains("?") ? "&" : "?")
                    + (bookingCode != null ? "bookingCode=" + URLEncoder.encode(bookingCode, StandardCharsets.UTF_8) + "&" : "")
                    + "paymentStatus=FAILED";
        }

        return new RedirectView(redirectTarget);
    }

    /**
     * URL chuyển hướng người dùng khi hủy thao tác trên PayPal.
     */
    @GetMapping("/paypal-cancel")
    public RedirectView paypalCancel(@RequestParam(value = "bookingCode", required = false) String bookingCode) {
        log.info("PayPal payment cancelled by user for booking: {}", bookingCode);
        String target = frontendCancelUrl;
        if (bookingCode != null) {
            target += (target.contains("?") ? "&" : "?") + "bookingCode=" + URLEncoder.encode(bookingCode, StandardCharsets.UTF_8) + "&canceled=true";
        }
        return new RedirectView(target);
    }
}

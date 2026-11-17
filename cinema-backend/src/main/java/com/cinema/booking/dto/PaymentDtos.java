package com.cinema.booking.dto;

import lombok.*;

import java.math.BigDecimal;

public class PaymentDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePaymentUrlResponse {
        private String paymentUrl;
        private String txnRef;
        private String bookingCode;
        private BigDecimal amount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentReturnDto {
        private String bookingCode;
        private String txnRef;
        private String status; // "PAID", "FAILED", "INVALID_SIGNATURE", "REFUNDED"
        private String message;
        private BigDecimal amount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePaymentRequest {
        private String bookingCode;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PayPalOrderResponse {
        private String orderId;
        private String approveUrl;
        private String bookingCode;
        private BigDecimal amountVnd;
        private BigDecimal amountUsd;
        private BigDecimal exchangeRate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CapturePaymentRequest {
        private String orderId;
        private String bookingCode;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PayPalCaptureResponse {
        private String orderId;
        private String captureId;
        private String bookingCode;
        private String status; // PAID / FAILED
        private BigDecimal amountUsd;
        private String message;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RefundPaymentResponse {
        private String bookingCode;
        private String refundId;
        private String status; // REFUNDED / FAILED
        private BigDecimal amountUsd;
        private String message;
    }
}

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
        private String status; // "PAID", "FAILED", "INVALID_SIGNATURE"
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
}

package com.cinema.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "txn_ref", nullable = false, unique = true, length = 100)
    private String txnRef;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount; // Số tiền VND

    @Column(name = "amount_usd", precision = 10, scale = 2)
    private BigDecimal amountUsd; // Số tiền USD khi thanh toán qua PayPal

    @Column(name = "exchange_rate", precision = 10, scale = 2)
    private BigDecimal exchangeRate; // Tỷ giá quy đổi (VND/USD)

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod; // PAYPAL, PAY_AT_COUNTER

    @Column(name = "paypal_order_id", length = 100)
    private String paypalOrderId;

    @Column(name = "paypal_capture_id", length = 100)
    private String paypalCaptureId;

    @Column(name = "paypal_refund_id", length = 100)
    private String paypalRefundId;

    @Column(name = "bank_code", length = 30)
    private String bankCode;

    @Column(name = "vnp_response_code", length = 10)
    private String vnpResponseCode;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, SUCCESS, FAILED, REFUNDED

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

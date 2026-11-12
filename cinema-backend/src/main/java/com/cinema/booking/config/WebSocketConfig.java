package com.cinema.booking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Topic broadcast cho client đăng ký theo dõi trạng thái ghế
        config.enableSimpleBroker("/topic");
        // Prefix cho các thông điệp gửi từ client đến server (nếu có)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint STOMP hỗ trợ SockJS fallback
        registry.addEndpoint("/ws/booking")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Endpoint WebSocket trực tiếp cho các client không dùng SockJS
        registry.addEndpoint("/ws/booking")
                .setAllowedOriginPatterns("*");
    }
}

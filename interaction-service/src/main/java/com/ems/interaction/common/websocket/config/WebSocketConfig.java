package com.ems.interaction.common.websocket.config;



import com.ems.interaction.common.websocket.security.StompAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthInterceptor stompAuthInterceptor;


    // 1. WebSocket 연결 주소 : WebSocket 연결 URL 등록
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        // addEndpoint : 클라이언트에서 웹 소켓 연결을 위해 "ws-stomp"라는 엔드포인트로 연결을 시도
        // setAllowedOrigins : http://localhost:5173에서의 WebSocket 연결을 허용합니다.
        registry.addEndpoint("/ws/interactions")
                .setAllowedOrigins("http://localhost:5173");
    }

    // 2. STOMP 메시지 경로 설정 : STOMP 메시지 목적지 구분
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {

        // 서버 → 클라이언트
        // 클라이언트가 구독하는 엔드포인트 설정
        // 서버의 송신·수신 Heartbeat 간격을 10초로 설정
        registry.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[]{10000, 10000})
                .setTaskScheduler(webSocketHeartbeatScheduler());

        // 클라이언트 → 서버
        // 클라이언트가 메시지를 보낼 때 사용하는 prefix 설정
        registry.setApplicationDestinationPrefixes("/app");
    }

    // 3. 클라이언트 메시지 인터셉터 등록 : STOMP 메시지 인터셉터 등록
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthInterceptor);
    }

    //Heartbeat 활성화 관련
    @Bean
    public TaskScheduler webSocketHeartbeatScheduler() {

        ThreadPoolTaskScheduler scheduler =
                new ThreadPoolTaskScheduler();

        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");

        return scheduler;
    }
}

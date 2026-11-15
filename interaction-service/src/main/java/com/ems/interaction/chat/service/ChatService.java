package com.ems.interaction.chat.service;

import com.ems.interaction.chat.domain.ChatMessage;
import com.ems.interaction.chat.dto.ChatMessageResponse;
import com.ems.interaction.chat.dto.ChatSendRequest;
import com.ems.interaction.chat.repository.ChatMessageRepository;

import com.ems.interaction.common.event.EventAuthorizationClient;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    // 채팅 메시지 DB 접근
    private final ChatMessageRepository chatMessageRepository;

    // 기존 Event Service 세션 권한 조회
    private final EventAuthorizationClient eventClient;

    // WebSocket 메시지 전송
    private final SimpMessagingTemplate messagingTemplate;

    // DB 생성 시각을 조회하기 위한 EntityManager
    @PersistenceContext
    private EntityManager entityManager;

    /**
     * 해당 사용자가 세션 채팅방에 접근할 수 있는지 확인한다.
     */
    private void validateChatAccess(Long sessionId, Long memberId) {
        // 세션 소유자 또는 참가 승인 사용자만 허용
        if (!eventClient.allowedSession(sessionId, memberId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 세션의 채팅 참여 권한이 없습니다.");
        }
    }

    /**
     * 해당 세션의 최근 채팅 메시지 50개를 조회한다.
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long sessionId, Long memberId) {
        // 세션 접근 권한 검사
        validateChatAccess(sessionId, memberId);

        // 최근 메시지 50개 조회
        List<ChatMessage> messages = new ArrayList<>(chatMessageRepository.findTop50BySessionIdOrderByCreatedAtDescIdDesc(sessionId));

        // 최신순 -> 오래된 순서로 변환
        Collections.reverse(messages);

        return messages.stream().map(ChatMessageResponse::from).toList();
    }

    /**
     * 채팅 메시지 저장 후 실시간으로 방송한다.
     */
    @Transactional
    public void sendMessage(Long sessionId, Long memberId, ChatSendRequest request) {
        // 세션 접근 권한 검사
        validateChatAccess(sessionId, memberId);

        // 입력 메시지 검증
        String content = request.getContent() == null ? "" : request.getContent().trim();

        // 빈 메시지 방지
        if (content.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "빈 메시지는 전송할 수 없습니다.");
        }

        // 메시지 길이 제한
        if (content.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메시지는 1000자 이하로 입력해 주세요.");
        }

        // 채팅 메시지 Entity 생성
        ChatMessage message = new ChatMessage(sessionId, memberId, content);

        // DB에 메시지 저장
        chatMessageRepository.saveAndFlush(message);

        // DB DEFAULT NOW()로 생성된 created_at 조회
        entityManager.refresh(message);

        // Entity -> DTO 변환
        ChatMessageResponse response = ChatMessageResponse.from(message);

        // 트랜잭션이 정상 커밋된 뒤 WebSocket 메시지 방송
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                messagingTemplate.convertAndSend("/topic/sessions/" + sessionId + "/chat", response);
            }
        });
    }
}

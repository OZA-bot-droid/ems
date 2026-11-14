package com.ems.interaction.chat.repository;

import com.ems.interaction.chat.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // 해당 세션의 최신 채팅 메시지 50개 조회
    List<ChatMessage> findTop50BySessionIdOrderByCreatedAtDescIdDesc(Long sessionId);
}

package com.ems.member.member.repository;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByClientIdAndToken(UUID clientId, String token);

    void deleteBySessionId(UUID sessionId);

    void deleteByMemberAndClientId(Member member, UUID clientId);
}

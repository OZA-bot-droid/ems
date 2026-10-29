package com.ems.member.member.repository;

import com.ems.member.member.domain.Member;
import com.ems.member.member.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByClientIdAndToken(String clientId, String token);

    void deleteBySessionId(String sessionId);

    void deleteByMemberAndClientId(Member member, String clientId);
}

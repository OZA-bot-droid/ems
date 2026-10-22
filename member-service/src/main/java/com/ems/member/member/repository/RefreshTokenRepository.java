package com.ems.member.member.repository;

import com.ems.member.member.domain.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {

    Optional<RefreshTokenEntity> findByToken(String token);

    void deleteByToken(String token);

    void deleteAllByMemberId(Long memberId);
}

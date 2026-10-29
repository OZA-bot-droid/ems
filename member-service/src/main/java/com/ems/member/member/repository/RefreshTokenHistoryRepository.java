package com.ems.member.member.repository;

import com.ems.member.member.domain.RefreshTokenHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenHistoryRepository extends JpaRepository<RefreshTokenHistory, Long> {

    Optional<RefreshTokenHistory> findByTokenHash(String tokenHash);
}

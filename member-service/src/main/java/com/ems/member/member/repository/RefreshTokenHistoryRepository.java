package com.ems.member.member.repository;

import com.ems.member.member.domain.RefreshTokenHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenHistoryRepository extends JpaRepository<RefreshTokenHistory, Long> {

    Optional<RefreshTokenHistory> findByTokenHash(String tokenHash);

    // deleteBy 메서드는 대상 엔티티를 조회한 뒤 개별 삭제하는 방식으로 동작
    // 따라서 History 데이터가 매우 많아지면 앞서 제안한 JPQL 벌크 DELETE보다 비효율적일 수 있음
    // @Modifying
    // @Query("DELETE FROM RefreshTokenHistory hWHERE h.revokedAt < :cutoff")
    // int deleteExpiredHistory(@Param("cutoff") Instant cutoff);
    void deleteByRevokedAtBefore(Instant cutoff);
}

package com.ems.event.registration.repository;

import com.ems.event.registration.entity.Registration;
import com.ems.event.registration.entity.RegistrationStatus;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** 참가 신청 데이터를 조회하고 저장하는 Spring Data 저장소입니다. */
@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    /** 행사 ID만 먼저 읽어 잠금 순서를 행사 → 신청으로 유지합니다. */
    @Query("select r.eventId from Registration r where r.id = :registrationId")
    Optional<Long> findEventIdById(@Param("registrationId") Long registrationId);

    /** 행사 잠금을 얻은 뒤 최신 신청 상태를 잠금 조회합니다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Registration r where r.id = :registrationId")
    Optional<Registration> findByIdForUpdate(@Param("registrationId") Long registrationId);

    /** 특정 사용자가 특정 행사에 이미 신청했는지 확인합니다. */
    Optional<Registration> findByUserIdAndEventId(String userId, Long eventId);

    /** 사용자의 신청 내역을 최근 신청 순으로 페이지 단위 조회합니다. */
    Page<Registration> findAllByUserIdOrderByRequestedAtDesc(String userId, Pageable pageable);

    /** 행사와 상태가 일치하는 신청 건수를 셉니다. */
    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);
}

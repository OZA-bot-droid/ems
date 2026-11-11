package com.ems.member.member.repository;

import com.ems.member.member.domain.EmailVerification;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM EmailVerification e WHERE e.email = :email")
    Optional<EmailVerification> findByEmailForUpdate(@Param("email") String email);
}

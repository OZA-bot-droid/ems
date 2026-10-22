package com.ems.event.registration.repository;

import com.ems.event.registration.entity.Registration;
import com.ems.event.registration.entity.RegistrationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    Optional<Registration> findByUserIdAndEventId(String userId, Long eventId);
    Page<Registration> findAllByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);
}

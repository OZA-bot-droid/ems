package com.ems.event.registration.repository;

import com.ems.event.registration.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistrationRepository
        extends JpaRepository<Registration, Long> {
}

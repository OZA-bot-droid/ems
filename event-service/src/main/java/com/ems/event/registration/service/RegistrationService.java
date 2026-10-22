package com.ems.event.registration.service;

import com.ems.event.registration.entity.Registration;
import com.ems.event.registration.entity.RegistrationStatus;
import com.ems.event.registration.repository.RegistrationRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;

    public RegistrationService(RegistrationRepository registrationRepository) {
        this.registrationRepository = registrationRepository;
    }

    @Transactional
    public Registration apply(String userId, Long eventId) {
        registrationRepository.findByUserIdAndEventId(userId, eventId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "이미 이 행사에 신청한 이력이 있습니다.");
                });
        try {
            return registrationRepository.saveAndFlush(new Registration(userId, eventId));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "이미 이 행사에 신청한 이력이 있습니다.", exception);
        }
    }

    @Transactional(readOnly = true)
    public Page<Registration> findMine(String userId, Pageable pageable) {
        return registrationRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional
    public Registration approve(Long registrationId) {
        Registration registration = findRegistration(registrationId);
        transition(registration::approve);
        return registration;
    }

    @Transactional
    public Registration reject(Long registrationId) {
        Registration registration = findRegistration(registrationId);
        transition(registration::reject);
        return registration;
    }

    @Transactional
    public Registration cancel(Long registrationId, String requesterId, boolean admin) {
        Registration registration = findRegistration(registrationId);
        if (!admin && !registration.getUserId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 신청만 취소할 수 있습니다.");
        }
        transition(registration::cancel);
        return registration;
    }

    @Transactional(readOnly = true)
    public EventRegistrationSummary summarize(Long eventId) {
        return new EventRegistrationSummary(
                eventId,
                registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.PENDING),
                registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.APPROVED),
                registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.REJECTED),
                registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.CANCELLED)
        );
    }

    private Registration findRegistration(Long registrationId) {
        return registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "신청 정보를 찾을 수 없습니다."));
    }

    private void transition(Runnable action) {
        try {
            action.run();
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage(), exception);
        }
    }

    public record EventRegistrationSummary(
            Long eventId, long pending, long approved, long rejected, long cancelled) { }
}

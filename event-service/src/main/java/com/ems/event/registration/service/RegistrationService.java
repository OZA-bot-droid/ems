package com.ems.event.registration.service;

import com.ems.event.event.Event;
import com.ems.event.event.EventRepository;
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
import java.util.Objects;

/** 참가 신청의 중복 검사, 상태 변경, 본인 권한 검사를 처리합니다. */
@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;

    public RegistrationService(RegistrationRepository registrationRepository, EventRepository eventRepository) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
    }

    /** 중복 신청을 확인한 뒤 새 신청을 PENDING 상태로 저장합니다. */
    @Transactional
    public Registration apply(Long userId, Long eventId) {
        registrationRepository.findByUserIdAndEventId(userId, eventId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "이미 이 행사에 신청한 이력이 있습니다.");
                });
        try {
            return registrationRepository.saveAndFlush(new Registration(userId, eventId));
        } catch (DataIntegrityViolationException exception) {
            // 동시에 들어온 중복 요청은 DB 제약 위반으로도 차단합니다.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "이미 이 행사에 신청한 이력이 있습니다.", exception);
        }
    }

    /** 로그인한 사용자의 신청 내역만 최근 신청 순으로 조회합니다. */
    @Transactional(readOnly = true)
    public Page<Registration> findMine(Long userId, Pageable pageable) {
        return registrationRepository.findAllByUserIdOrderByRequestedAtDesc(userId, pageable);
    }

    /** 행사별 잠금으로 승인 요청을 직렬화하고 정원 안에서만 승인합니다. */
    @Transactional
    public Registration approve(Long registrationId, Long approverId) {
        Long eventId = registrationRepository.findEventIdById(registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "신청 정보를 찾을 수 없습니다."));
        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "행사 정보를 찾을 수 없습니다."));
        requireEventOwner(event, approverId);
        Registration registration = registrationRepository.findByIdForUpdate(registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "신청 정보를 찾을 수 없습니다."));
        if (registration.getStatus() == RegistrationStatus.PENDING
                && registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.APPROVED)
                        >= event.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "행사 정원이 가득 차 승인할 수 없습니다.");
        }
        transition(registration::approve);
        return registration;
    }

    /** 신청을 찾아 승인 대기 상태인지 확인한 뒤 거절합니다. */
    @Transactional
    public Registration reject(Long registrationId, Long reviewerId) {
        Registration registration = findRegistration(registrationId);
        Event event = eventRepository.findById(registration.getEventId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "행사 정보를 찾을 수 없습니다."));
        requireEventOwner(event, reviewerId);
        transition(registration::reject);
        return registration;
    }

    /** 관리자는 취소할 수 있고, 일반 사용자는 본인 신청만 취소할 수 있습니다. */
    @Transactional
    public Registration cancel(Long registrationId, Long requesterId, boolean admin) {
        Registration registration = findRegistration(registrationId);
        if (!admin && !registration.getUserId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인의 신청만 취소할 수 있습니다.");
        }
        transition(registration::cancel);
        return registration;
    }

    /** 관리자가 행사별 신청 상태 건수를 확인할 때 사용합니다. */
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

    /** 특정 회원의 해당 행사 참가 승인 여부를 반환합니다. */
    @Transactional(readOnly = true)
    public boolean isApproved(Long eventId, Long memberId) {
        return registrationRepository.existsByEventIdAndUserIdAndStatus(
                eventId, memberId, RegistrationStatus.APPROVED);
    }

    /** ID에 해당하는 신청이 없으면 404 오류를 반환합니다. */
    private Registration findRegistration(Long registrationId) {
        return registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "신청 정보를 찾을 수 없습니다."));
    }

    /** 승인·거절은 해당 행사의 주최자만 할 수 있습니다. */
    private void requireEventOwner(Event event, Long requesterId) {
        if (!Objects.equals(event.getCreatedBy(), requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "행사 소유자만 신청을 승인하거나 거절할 수 있습니다.");
        }
    }

    /** 엔티티의 잘못된 상태 전이를 HTTP 409 오류로 바꿉니다. */
    private void transition(Runnable action) {
        try {
            action.run();
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage(), exception);
        }
    }

    /** 행사별 신청 상태 건수 응답입니다. */
    public record EventRegistrationSummary(
            Long eventId, long pending, long approved, long rejected, long cancelled) { }
}

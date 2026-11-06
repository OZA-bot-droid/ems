package com.ems.event.registration.service;

import com.ems.event.common.exception.BusinessException;
import com.ems.event.event.entity.Event;
import com.ems.event.event.entity.EventStatus;
import com.ems.event.event.repository.EventRepository;
import com.ems.event.registration.entity.Registration;
import com.ems.event.registration.entity.RegistrationStatus;
import com.ems.event.registration.repository.RegistrationRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사 정보를 찾을 수 없습니다."));
        if (event.getStatus() != EventStatus.OPEN || !event.getEndsAt().isAfter(Instant.now())) {
            throw new BusinessException(HttpStatus.CONFLICT, "EVENT_NOT_OPEN", "현재 참가 신청할 수 없는 행사입니다.");
        }
        registrationRepository.findByUserIdAndEventId(userId, eventId)
                .ifPresent(existing -> {
                    throw new BusinessException(HttpStatus.CONFLICT, "ALREADY_REGISTERED", "이미 이 행사에 신청한 이력이 있습니다.");
                });
        try {
            return registrationRepository.saveAndFlush(new Registration(userId, eventId));
        } catch (DataIntegrityViolationException exception) {
            // 동시에 들어온 중복 요청은 DB 제약 위반으로도 차단합니다.
            throw new BusinessException(HttpStatus.CONFLICT, "ALREADY_REGISTERED", "이미 이 행사에 신청한 이력이 있습니다.");
        }
    }

    /** 로그인한 사용자의 신청 내역만 최근 신청 순으로 조회합니다. */
    @Transactional(readOnly = true)
    public Page<Registration> findMine(Long userId, Pageable pageable) {
        return registrationRepository.findAllByUserIdOrderByRequestedAtDesc(userId, pageable);
    }

    /** 관리자가 주최한 행사의 신청을 상태와 페이지 조건으로 조회합니다. */
    @Transactional(readOnly = true)
    public Page<AdminRegistration> findForOwner(Long ownerId, RegistrationStatus status, Pageable pageable) {
        List<Event> ownedEvents = eventRepository.findAllByCreatedBy(ownerId);
        if (ownedEvents.isEmpty()) {
            return Page.empty(pageable);
        }

        Map<Long, String> eventTitles = ownedEvents.stream()
                .collect(Collectors.toMap(Event::getId, Event::getTitle));
        List<Long> eventIds = ownedEvents.stream().map(Event::getId).toList();

        return registrationRepository.findAllByEventIdInAndStatusOrderByRequestedAtDesc(
                        eventIds, status, pageable)
                .map(registration -> new AdminRegistration(
                        registration.getId(),
                        registration.getEventId(),
                        eventTitles.get(registration.getEventId()),
                        registration.getUserId(),
                        registration.getStatus(),
                        registration.getRequestedAt(),
                        registration.getUpdatedAt(),
                        registration.getDecidedAt(),
                        registration.getRejectionReason()));
    }

    /** 행사별 잠금으로 승인 요청을 직렬화하고 정원 안에서만 승인합니다. */
    @Transactional
    public Registration approve(Long registrationId, Long approverId) {
        Long eventId = registrationRepository.findEventIdById(registrationId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "REGISTRATION_NOT_FOUND", "신청 정보를 찾을 수 없습니다."));
        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사 정보를 찾을 수 없습니다."));
        requireEventOwner(event, approverId);
        if (event.isClosed()) {
            throw new BusinessException(HttpStatus.CONFLICT, "EVENT_NOT_OPEN", "마감된 행사 신청은 승인할 수 없습니다.");
        }
        Registration registration = registrationRepository.findByIdForUpdate(registrationId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "REGISTRATION_NOT_FOUND", "신청 정보를 찾을 수 없습니다."));
        if (registration.getStatus() == RegistrationStatus.PENDING
                && registrationRepository.countByEventIdAndStatus(eventId, RegistrationStatus.APPROVED)
                        >= event.getCapacity()) {
            throw new BusinessException(HttpStatus.CONFLICT, "CAPACITY_EXCEEDED", "행사 정원이 가득 차 승인할 수 없습니다.");
        }
        transition(registration::approve);
        return registration;
    }

    /** 신청을 찾아 승인 대기 상태인지 확인한 뒤 거절합니다. */
    @Transactional
    public Registration reject(Long registrationId, Long reviewerId, String reason) {
        Registration registration = findRegistration(registrationId);
        Event event = eventRepository.findById(registration.getEventId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사 정보를 찾을 수 없습니다."));
        requireEventOwner(event, reviewerId);
        transition(() -> registration.reject(reason));
        return registration;
    }

    /** 신청자 본인 또는 해당 행사의 주최자만 취소할 수 있습니다. */
    @Transactional
    public Registration cancel(Long registrationId, Long requesterId, boolean admin) {
        Registration registration = findRegistration(registrationId);
        if (!Objects.equals(registration.getUserId(), requesterId)) {
            if (!admin) {
                throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "본인의 신청만 취소할 수 있습니다.");
            }
            Event event = eventRepository.findById(registration.getEventId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사 정보를 찾을 수 없습니다."));
            requireEventOwner(event, requesterId);
        }
        transition(registration::cancel);
        return registration;
    }

    /** 해당 행사 주최자만 신청 통계를 조회합니다. */
    @Transactional(readOnly = true)
    public EventRegistrationSummary summarize(Long eventId, Long requesterId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사 정보를 찾을 수 없습니다."));
        requireEventOwner(event, requesterId);
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
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "REGISTRATION_NOT_FOUND", "신청 정보를 찾을 수 없습니다."));
    }

    /** 승인·거절은 해당 행사의 주최자만 할 수 있습니다. */
    private void requireEventOwner(Event event, Long requesterId) {
        if (!Objects.equals(event.getCreatedBy(), requesterId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "EVENT_OWNER_REQUIRED",
                    "행사 소유자만 신청을 관리할 수 있습니다.");
        }
    }

    /** 엔티티의 잘못된 상태 전이를 HTTP 409 오류로 바꿉니다. */
    private void transition(Runnable action) {
        try {
            action.run();
        } catch (IllegalStateException exception) {
            throw new BusinessException(HttpStatus.CONFLICT, "INVALID_STATUS_CHANGE", "현재 신청 상태에서는 요청을 처리할 수 없습니다.");
        }
    }

    /** 관리자가 확인할 신청 목록 행입니다. */
    public record AdminRegistration(
            Long id, Long eventId, String eventTitle, Long userId, RegistrationStatus status,
            Instant requestedAt, Instant updatedAt, Instant decidedAt, String rejectionReason) { }

    /** 행사별 신청 상태 건수 응답입니다. */
    public record EventRegistrationSummary(
            Long eventId, long pending, long approved, long rejected, long cancelled) { }
}

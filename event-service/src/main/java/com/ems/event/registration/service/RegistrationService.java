
package com.ems.event.registration.service;

import com.ems.event.registration.entity.Registration;
import com.ems.event.registration.repository.RegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;

    public RegistrationService(RegistrationRepository registrationRepository) {
        this.registrationRepository = registrationRepository;
    }

    // 신청 승인
    @Transactional
    public void approve(Long registrationId) {
        Registration registration = findRegistration(registrationId);
        registration.approve();
    }

    // 신청 거절
    @Transactional
    public void reject(Long registrationId) {
        Registration registration = findRegistration(registrationId);
        registration.reject();
    }

    // 신청 취소
    @Transactional
    public void cancel(Long registrationId) {
        Registration registration = findRegistration(registrationId);
        registration.cancel();
    }

    private Registration findRegistration(Long registrationId) {
        return registrationRepository.findById(registrationId)
                .orElseThrow(() ->
                        new IllegalArgumentException("신청 정보를 찾을 수 없습니다."));
    }
}

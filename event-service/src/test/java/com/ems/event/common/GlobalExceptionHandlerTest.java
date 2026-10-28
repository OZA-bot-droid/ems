package com.ems.event.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

/** 오류 응답이 팀 공통 규격(7칸)에 맞게 만들어지는지 검사한다 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    /** Gateway가 /api를 떼고 넘겨준 요청을 흉내 냄 */
    private static MockHttpServletRequest request(String method, String uri) {
        return new MockHttpServletRequest(method, uri);
    }

    @Test
    @DisplayName("BusinessException → 7칸 모두 채워지고, status는 실제 HTTP 상태와 같고, path에는 /api가 붙는다")
    void businessExceptionHasAllFields() {
        ResponseEntity<ErrorResponse> response = handler.handleBusiness(
                new BusinessException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "행사를 찾을 수 없습니다: 999"),
                request("GET", "/events/999"));

        ErrorResponse body = response.getBody();
        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(body.success()).isFalse();
        assertThat(body.code()).isEqualTo("EVENT_NOT_FOUND");
        assertThat(body.message()).isEqualTo("행사를 찾을 수 없습니다: 999");
        assertThat(body.status()).isEqualTo(404);
        assertThat(body.timestamp()).isNotNull();
        assertThat(body.path()).isEqualTo("/api/events/999");
        assertThat(body.traceId()).isNull();
    }

    @Test
    @DisplayName("이미 /api로 시작하는 주소는 /api를 또 붙이지 않는다")
    void pathAlreadyHasApiPrefix() {
        assertThat(GlobalExceptionHandler.externalPath(request("GET", "/api/events/1"))).isEqualTo("/api/events/1");
    }

    @Test
    @DisplayName("쿼리(?page=1)는 path에 들어가지 않는다")
    void pathExcludesQuery() {
        MockHttpServletRequest req = request("GET", "/events");
        req.setQueryString("page=1&email=a@b.com");
        assertThat(GlobalExceptionHandler.externalPath(req)).isEqualTo("/api/events");
    }

    @Test
    @DisplayName("ResponseStatusException(409) → DUPLICATE_RESOURCE, 메시지에 '409 CONFLICT'가 섞이지 않는다")
    void responseStatusExceptionIsCleaned() {
        ResponseEntity<ErrorResponse> response = handler.handleResponseStatus(
                new ResponseStatusException(HttpStatus.CONFLICT, "이미 이 행사에 신청한 이력이 있습니다."),
                request("POST", "/events/1/registrations"));

        ErrorResponse body = response.getBody();
        assertThat(body.status()).isEqualTo(409);
        assertThat(body.code()).isEqualTo("DUPLICATE_RESOURCE");
        assertThat(body.message()).isEqualTo("이미 이 행사에 신청한 이력이 있습니다.");
        assertThat(body.path()).isEqualTo("/api/events/1/registrations");
    }

    @Test
    @DisplayName("ResponseStatusException(403/404)도 상태별 기본 code로 바뀐다")
    void responseStatusExceptionDefaultCodes() {
        assertThat(handler.handleResponseStatus(new ResponseStatusException(HttpStatus.FORBIDDEN, "x"),
                request("PATCH", "/events/registrations/1/approve")).getBody().code()).isEqualTo("FORBIDDEN");
        assertThat(handler.handleResponseStatus(new ResponseStatusException(HttpStatus.NOT_FOUND, "x"),
                request("PATCH", "/events/registrations/1/approve")).getBody().code()).isEqualTo("RESOURCE_NOT_FOUND");
    }

    @Test
    @DisplayName("예상 못 한 오류 → 500 INTERNAL_SERVER_ERROR, 내부 메시지는 노출하지 않는다")
    void unknownErrorHidesDetails() {
        ResponseEntity<ErrorResponse> response = handler.handleUnknown(
                new IllegalStateException("SELECT * FROM secret_table 실패"), request("GET", "/events"));

        ErrorResponse body = response.getBody();
        assertThat(body.status()).isEqualTo(500);
        assertThat(body.code()).isEqualTo("INTERNAL_SERVER_ERROR");
        assertThat(body.message()).isEqualTo("서버 오류가 발생했습니다.");
        assertThat(body.message()).doesNotContain("SELECT");
    }
}

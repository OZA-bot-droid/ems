package com.ems.event.common.web;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 외부에서 보이는 /api/... 주소를 만든다 (성공·오류 응답의 path 공통).
 * Gateway가 "/api"를 떼고(StripPrefix=1) 넘겨주므로 서비스는 "/events/7"만 안다 → "/api/events/7"
 * - 이미 /api로 시작하면 다시 붙이지 않는다 (/api/api/... 방지, docs/api-response-standard.md 2.6)
 * - getRequestURI()는 쿼리(?page=1)를 포함하지 않으므로 개인정보가 섞이지 않는다
 */
public final class ApiPath {

    private ApiPath() {
    }

    public static String external(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/api/") ? uri : "/api" + uri;
    }
}

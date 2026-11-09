package com.ems.interaction.common.response;

import jakarta.servlet.http.HttpServletRequest;

public final class ApiPathUtils {

    private ApiPathUtils() {
    }

    public static String externalPath(HttpServletRequest request) {

        String uri = request.getRequestURI();

        if (uri.equals("/api") || uri.startsWith("/api/")) {
            return uri;
        }

        return "/api" + (uri.startsWith("/") ? uri : "/" + uri);
    }
}
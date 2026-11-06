package com.ems.interaction.common.event;

import com.ems.interaction.common.exception.ApiException;
import com.ems.interaction.common.exception.ErrorCode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Authoritative Event-Service lookups. A failed lookup never grants permission. */
@Component
public class EventAuthorizationClient {
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
    private final ObjectMapper mapper;
    private final String root;
    private final String credential;

    public EventAuthorizationClient(ObjectMapper mapper,
        @Value("${event.service-url}") String eventUrl,
        @Value("${ems.internal-token}") String credential) {
        if (credential == null || credential.length() < 32) {
            throw new IllegalStateException("EMS_INTERNAL_TOKEN must have at least 32 characters");
        }
        this.mapper = mapper;
        this.root = eventUrl.replaceAll("/+$", "") + "/internal/events";
        this.credential = credential;
    }

    private <T> T read(String path, Class<T> type) {
        return readBody(path, body -> mapper.readValue(body, type));
    }

    private <T> T readBody(String path, Reader<T> reader) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(root + path))
                .timeout(Duration.ofSeconds(3))
                .header("X-Internal-Service-Token", credential)
                .GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 404) throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND);
            if (response.statusCode() != 200) throw new ApiException(ErrorCode.SERVICE_UNAVAILABLE);
            return reader.parse(response.body());
        } catch (ApiException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(ErrorCode.SERVICE_UNAVAILABLE);
        } catch (IOException | IllegalArgumentException e) {
            throw new ApiException(ErrorCode.SERVICE_UNAVAILABLE);
        }
    }

    private interface Reader<T> { T parse(String body) throws IOException; }
    public EventAccess eventAccess(Long eventId, Long memberId) {
        return read("/" + eventId + "/authorization/" + memberId, EventAccess.class);
    }
    public SessionInfo session(Long eventId, Long sessionId) {
        return read("/" + eventId + "/sessions/" + sessionId, SessionInfo.class);
    }
    public SessionAccess sessionAccess(Long sessionId, Long memberId) {
        return read("/sessions/" + sessionId + "/authorization/" + memberId, SessionAccess.class);
    }
    public List<Long> accessibleSessions(Long memberId) {
        return readBody("/sessions/accessible/" + memberId, body ->
            mapper.readValue(body, new TypeReference<List<Long>>() {}));
    }
    public boolean owner(Long eventId, Long memberId) { return eventAccess(eventId, memberId).owner(); }
    public boolean approved(Long eventId, Long memberId) { return eventAccess(eventId, memberId).approved(); }
    public boolean allowedSession(Long sessionId, Long memberId) {
        SessionAccess access = sessionAccess(sessionId, memberId);
        return access.owner() || access.approved();
    }
    public record EventAccess(Long eventId, boolean owner, boolean approved, String status) {}
    public record SessionInfo(Long sessionId, Long eventId, Instant startsAt, Instant endsAt) {}
    public record SessionAccess(Long sessionId, Long eventId, boolean owner, boolean approved) {}
}

package inc.visor.trustanchor.authentication.service;

import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;

@Service
public class MfaSessionService {

    private static class MfaSession {
        final Long userId;
        final Instant expiry;

        MfaSession(Long userId, long ttlSeconds) {
            this.userId = userId;
            this.expiry = Instant.now().plusSeconds(ttlSeconds);
        }
    }

    private final ConcurrentHashMap<String, MfaSession> sessionCache = new ConcurrentHashMap<>();
    private static final long TTL_SECONDS = 180;

    public String createMfaSession(Long userId) {
        String mfaToken = UUID.randomUUID().toString();
        sessionCache.put(mfaToken, new MfaSession(userId, TTL_SECONDS));
        return mfaToken;
    }

    public Long getUserIdFromSession(String mfaToken) {
        MfaSession session = sessionCache.get(mfaToken);
        if (session == null) return null;

        if (Instant.now().isAfter(session.expiry)) {
            sessionCache.remove(mfaToken);
            return null;
        }
        return session.userId;
    }

    public void invalidateSession(String mfaToken) {
        sessionCache.remove(mfaToken);
    }
}
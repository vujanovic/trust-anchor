package inc.visor.trustanchor.authentication.service;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import org.springframework.stereotype.Service;

@Service
public class GAService {

    private final GoogleAuthenticator gAuth;

    public GAService() {
        this.gAuth = new GoogleAuthenticator();
    }

    public boolean isValid(String secret, String code) {
        if (secret == null || code == null || code.trim().isEmpty()) {
            return false;
        }
        try {
            int parsedCode = Integer.parseInt(code.trim());
            return gAuth.authorize(secret, parsedCode);
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
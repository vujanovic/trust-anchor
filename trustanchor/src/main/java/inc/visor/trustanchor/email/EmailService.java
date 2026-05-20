package inc.visor.trustanchor.email;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String from;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void send(String to, String subject, String body) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(mimeMessage);

        } catch (Exception e) {
            throw new RuntimeException("Error sending email", e);
        }
    }

    public void sendVerificationEmail(String to, String name, String token) {
        String verificationLink = String.format("%s/verify-identity?token=%s", frontendUrl, token);

        String subject = "Enrollment: Action Required";
        String body = String.format(
                "<html>" +
                        "<body>" +
                        "<h2>Welcome to Trust Anchor, %s</h2>" +
                        "<p>Your identity has been provisioned. To complete your enrollment, please authorize via the link below:</p>" +
                        "<div style='margin: 20px 0;'>" +
                        "  <a href='%s' style='background: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold;'>" +
                        "    AUTHORIZE IDENTITY" +
                        "  </a>" +
                        "</div>" +
                        "<p>Alternatively, copy and paste this link: <br/> %s </p>" +
                        "</body>" +
                        "</html>",
                name, verificationLink, verificationLink
        );

        send(to, subject, body);
    }

    public void sendActivationEmail(String to, String name, String token) {
        String activationLink = String.format("%s/activate-account?token=%s", frontendUrl, token);

        String subject = "Trust Anchor: Identity Verification Required";
        String body = String.format(
                "<html>" +
                        "<body style='font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;'>" +
                        "  <h2 style='color: #0891b2;'>Verify Your Identity, %s</h2>" +
                        "  <p>Your Trust Anchor profile has been registered</p>" +
                        "  <p>This single-use link is time-sensitive and will expire shortly.</p>" +
                        "  <div style='margin: 25px 0;'>" +
                        "    <a href='%s' style='background: #0f172a; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;'> " +
                        "      START ACTIVATION" +
                        "    </a>" +
                        "  </div>" +
                        "  <p style='font-size: 12px; color: #64748b;'>Alternatively, copy and paste this secure URL into your browser:<br/>" +
                        "  <span style='color: #0891b2;'>%s</span></p>" +
                        "</body>" +
                        "</html>",
                name, activationLink, activationLink
        );

        send(to, subject, body);
    }
}

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
}

package inc.visor.trustanchor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrustanchorApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrustanchorApplication.class, args);
	}

}

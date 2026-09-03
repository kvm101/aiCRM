package vasyl.karpliak.aiCRM.iam.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.iam.domain.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByLoginAndPassword(String login, String password);

  Optional<User> findByEmail(String email);
}

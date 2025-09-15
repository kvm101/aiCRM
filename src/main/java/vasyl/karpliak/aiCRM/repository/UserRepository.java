package vasyl.karpliak.aiCRM.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vasyl.karpliak.aiCRM.domain.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
}

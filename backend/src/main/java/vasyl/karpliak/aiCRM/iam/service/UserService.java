package vasyl.karpliak.aiCRM.iam.service;

import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import vasyl.karpliak.aiCRM.iam.domain.User;
import vasyl.karpliak.aiCRM.iam.dto.RegistrationDTO;
import vasyl.karpliak.aiCRM.iam.repository.UserRepository;

@Service
@Transactional
public class UserService {

  private final UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User createUser(User user) {
    return userRepository.save(user);
  }

  public User createUser(RegistrationDTO reg) {
    User user = new User();

    user.setName(reg.getName());
    user.setLogin(reg.getLogin());
    user.setPassword(reg.getPassword());
    user.setCompany(reg.getCompany());
    user.setEmail(reg.getEmail());
    user.setPhone(reg.getPhone());
    user.setRole(reg.getRole());
    return userRepository.save(user);
  }

  public Optional<User> getUserById(Long id) {
    return userRepository.findById(id);
  }

  public List<User> getAllUsers() {
    return userRepository.findAll();
  }

  public User updateUser(User user, User newUser) {
    user.setName(newUser.getName());
    user.setLogin(newUser.getLogin());
    user.setPassword(newUser.getPassword());
    user.setCompany(newUser.getCompany());
    user.setEmail(newUser.getEmail());
    user.setPhone(newUser.getPhone());
    user.setRole(newUser.getRole());
    user.setLastEnter(newUser.getLastEnter());

    return userRepository.save(user);
  }

  public void deleteUser(Long id) {
    userRepository.deleteById(id);
  }

  public Optional<User> getUserByLoginAndPassword(String login, String password) {
    return userRepository.findByLoginAndPassword(login, password);
  }
}
